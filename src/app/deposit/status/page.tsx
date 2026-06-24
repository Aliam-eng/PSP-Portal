import { prisma } from "@/lib/db";
import { PublicHeader } from "@/components/PublicHeader";
import { StatusBadge } from "@/components/ui";
import { LookupForm } from "./LookupForm";

export const dynamic = "force-dynamic";

// Public "check my payment" page — look up a deposit by its reference.
export default async function StatusPage({ searchParams }: { searchParams: { ref?: string } }) {
  const ref = searchParams.ref?.trim();
  const tx = ref ? await prisma.transaction.findUnique({ where: { reference: ref } }) : null;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-xl font-semibold">Check a payment</h1>
        <p className="mb-6 text-sm text-slate-500">Enter the reference shown when you paid.</p>

        <LookupForm initial={ref ?? ""} />

        {ref && !tx && (
          <p className="mt-6 rounded-md border bg-white p-4 text-sm text-slate-500">
            No payment found for <span className="font-mono">{ref}</span>.
          </p>
        )}

        {tx && (
          <div className="mt-6 space-y-3 rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{tx.reference}</span>
              <StatusBadge status={tx.status} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Amount</dt>
                <dd className="font-medium">
                  {tx.amount.toFixed(2)} {tx.currency}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">MT5 account</dt>
                <dd className="font-medium">{tx.mt5Login}</dd>
              </div>
              {tx.mt5DealId && (
                <div>
                  <dt className="text-slate-500">MT5 deal</dt>
                  <dd className="font-mono">{tx.mt5DealId}</dd>
                </div>
              )}
            </dl>
            <a href={`/deposit/return?tx=${tx.id}`} className="inline-block text-sm text-brand hover:underline">
              Open live status →
            </a>
          </div>
        )}
      </main>
    </>
  );
}
