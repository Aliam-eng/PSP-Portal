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
      <main className="mx-auto max-w-xl px-5 py-12 sm:py-16">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Check a payment</h1>
          <p className="mt-2 text-sm text-ink-muted">Enter the reference shown when you paid.</p>
        </div>

        <div className="mt-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <LookupForm initial={ref ?? ""} />
        </div>

        {ref && !tx && (
          <div className="card mt-6 p-5 text-sm text-ink-muted animate-fade-up">
            No payment found for <span className="font-mono text-ink">{ref}</span>.
          </div>
        )}

        {tx && (
          <div className="card mt-6 overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between border-b border-line/70 px-6 py-4">
              <span className="font-mono text-sm text-ink">{tx.reference}</span>
              <StatusBadge status={tx.status} />
            </div>
            <dl className="grid grid-cols-2 gap-px bg-line/60">
              <div className="bg-surface/70 px-6 py-4">
                <dt className="text-xs text-ink-dim">Amount</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink">
                  {tx.amount.toFixed(2)} {tx.currency}
                </dd>
              </div>
              <div className="bg-surface/70 px-6 py-4">
                <dt className="text-xs text-ink-dim">MT5 account</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium text-ink">{tx.mt5Login}</dd>
              </div>
            </dl>
            <div className="px-6 py-4">
              <a href={`/deposit/return?tx=${tx.id}`} className="text-sm font-medium text-brand-400 hover:underline">
                Open live status →
              </a>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
