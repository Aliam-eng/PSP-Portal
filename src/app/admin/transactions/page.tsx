import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/ui";
import { TransactionsTable } from "./TransactionsTable";

export const dynamic = "force-dynamic";

export default async function AdminTransactions() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TECHNICAL") redirect("/deposit");

  const txns = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
    take: 200,
  });

  const rows = txns.map((t) => ({
    id: t.id,
    reference: t.reference,
    client: t.user?.email ?? t.clientEmail ?? "guest",
    mt5Login: t.mt5Login,
    amount: t.amount,
    currency: t.currency,
    status: t.status,
    rivalPaymentId: t.rivalPaymentId,
    mt5DealId: t.mt5DealId,
    errorMessage: t.errorMessage,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <>
      <TopBar user={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Transactions</h1>
        </div>
        <TransactionsTable rows={rows} />
      </main>
    </>
  );
}
