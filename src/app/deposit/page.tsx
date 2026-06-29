import { PublicHeader } from "@/components/PublicHeader";
import { prisma } from "@/lib/db";
import { DepositForm } from "./DepositForm";

export const dynamic = "force-dynamic";

// Public deposit page — no login required.
export default async function DepositPage() {
  const cfg = await prisma.providerConfig.findUnique({ where: { id: "rival" }, select: { minDeposit: true } });
  const minDeposit = cfg?.minDeposit ?? 0;
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-5 py-12 sm:py-16">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised/40 px-3 py-1 text-xs font-medium text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-neon" />
            Instant MT5 funding
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Make a deposit
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
            Enter your MT5 account and amount. You&apos;ll pay securely via Whish Pay, and funds are
            credited to your trading account automatically once confirmed.
          </p>
        </div>

        <div className="mt-8 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <DepositForm minDeposit={minDeposit} />
        </div>

        <ol className="mt-8 grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "120ms" }}>
          {[
            { n: "1", t: "Enter details" },
            { n: "2", t: "Pay on Whish" },
            { n: "3", t: "Auto-credited" },
          ].map((s) => (
            <li key={s.n} className="rounded-xl border border-line bg-surface/50 px-3 py-3 text-center">
              <div className="mx-auto grid h-6 w-6 place-items-center rounded-full border border-brand/30 bg-brand/10 text-xs font-semibold text-brand-400">
                {s.n}
              </div>
              <p className="mt-2 text-xs text-ink-muted">{s.t}</p>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
