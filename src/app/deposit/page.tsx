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
      <main className="mx-auto max-w-md px-5 py-6 sm:py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Make a deposit</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Fund your MT5 account securely via <span className="font-semibold text-danger">Whish Pay</span>. You&apos;ll
            receive a code from Whish to confirm, and funds are credited automatically once confirmed.
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-sm font-medium leading-relaxed text-brand-400">
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
            Make sure to fill in your account number correctly before proceeding.
          </p>
        </div>

        <div className="mt-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <DepositForm minDeposit={minDeposit} />
        </div>
      </main>
    </>
  );
}
