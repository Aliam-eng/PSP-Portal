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

  const sum = (pred: (s: string) => boolean) =>
    rows.filter((r) => pred(r.status)).reduce((a, r) => a + r.amount, 0);
  const stats = [
    { label: "Total deposits", value: String(rows.length), tone: "ink" as const },
    { label: "Credited", value: rows.filter((r) => r.status === "CREDITED").length.toString(), tone: "brand" as const },
    { label: "Awaiting", value: rows.filter((r) => ["LINK_GENERATED", "PAID"].includes(r.status)).length.toString(), tone: "gold" as const },
    { label: "Credited volume", value: `$${sum((s) => s === "CREDITED").toFixed(2)}`, tone: "ink" as const },
  ];

  return (
    <>
      <TopBar user={session} />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Transactions</h1>
          <p className="mt-1 text-sm text-ink-muted">Monitor and reconcile every deposit.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-up sm:grid-cols-4" style={{ animationDelay: "60ms" }}>
          {stats.map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-ink-dim">{s.label}</p>
              <p
                className={`mt-1 text-2xl font-semibold tracking-tight ${
                  s.tone === "brand" ? "text-brand-400" : s.tone === "gold" ? "text-gold" : "text-ink"
                }`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <TransactionsTable rows={rows} />
        </div>
      </main>
    </>
  );
}
