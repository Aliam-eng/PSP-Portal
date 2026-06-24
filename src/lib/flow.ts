import { prisma } from "./db";
import { getPayment } from "./rival";
import { mt5Deposit } from "./mt5";
import type { Transaction } from "@prisma/client";

// Reconcile one transaction with Rival, then credit MT5 if newly PAID.
// Idempotent: safe to call repeatedly (on customer return + background sweep).
export async function reconcileTransaction(txId: string): Promise<Transaction | null> {
  const tx = await prisma.transaction.findUnique({ where: { id: txId } });
  if (!tx) return null;

  // Terminal states — nothing to do.
  if (tx.status === "CREDITED" || tx.status === "FAILED") return tx;
  if (!tx.rivalPaymentId) return tx; // no link yet

  // 1) Pull latest status from Rival.
  let rival;
  try {
    rival = await getPayment(tx.rivalPaymentId);
  } catch (e: any) {
    return prisma.transaction.update({
      where: { id: tx.id },
      data: { errorMessage: `status check failed: ${e?.message || e}` },
    });
  }

  if (rival.status === "FAILED" || rival.status === "EXPIRED") {
    return prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: "FAILED",
        providerPayload: JSON.stringify(rival),
        errorMessage: `payment ${rival.status.toLowerCase()}`,
      },
    });
  }

  if (rival.status !== "PAID") {
    // Still PENDING — record payload, keep waiting.
    return prisma.transaction.update({
      where: { id: tx.id },
      data: { providerPayload: JSON.stringify(rival) },
    });
  }

  // 2) PAID. Mark PAID (if not already) then attempt MT5 credit.
  if (tx.status !== "PAID" && tx.status !== "CREDIT_FAILED") {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "PAID", providerPayload: JSON.stringify(rival) },
    });
  }

  // 3) Credit MT5 (idempotent — only when we don't yet have a deal id).
  if (!tx.mt5DealId) {
    const result = await mt5Deposit({
      login: tx.mt5Login,
      amount: tx.amount,
      currency: tx.currency,
      group: null, // public deposits use the gateway's default MT5 group
      comment: `Deposit ${tx.reference}`,
      reference: tx.reference,
    });

    if (result.ok) {
      return prisma.transaction.update({
        where: { id: tx.id },
        data: { status: "CREDITED", mt5DealId: result.dealId, mt5Message: result.message ?? null, errorMessage: null },
        include: { account: true },
      });
    }
    return prisma.transaction.update({
      where: { id: tx.id },
      data: { status: "CREDIT_FAILED", mt5Message: result.message, errorMessage: result.message },
    });
  }

  return prisma.transaction.findUnique({ where: { id: tx.id } });
}

// Sweep all non-terminal transactions (used by the poller endpoint).
export async function sweepPending(limit = 50) {
  const pend = await prisma.transaction.findMany({
    where: { status: { in: ["LINK_GENERATED", "PAID", "CREDIT_FAILED"] } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });
  const results: Record<string, string> = {};
  for (const p of pend) {
    const r = await reconcileTransaction(p.id);
    if (r) results[p.id] = r.status;
  }
  return results;
}
