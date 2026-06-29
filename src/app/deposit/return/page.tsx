import { prisma } from "@/lib/db";
import { PublicHeader } from "@/components/PublicHeader";
import { ReturnStatus } from "./ReturnStatus";

// Public status page. Reached via our redirect (?tx=) or Rival's (?ref=).
export default async function ReturnPage({ searchParams }: { searchParams: { tx?: string; ref?: string } }) {
  const tx = searchParams.tx
    ? await prisma.transaction.findUnique({ where: { id: searchParams.tx } })
    : searchParams.ref
    ? await prisma.transaction.findFirst({ where: { rivalPaymentId: searchParams.ref } })
    : null;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-5 py-12 sm:py-16">
        <h1 className="animate-fade-up text-2xl font-semibold tracking-tight text-ink">Payment status</h1>
        {!tx ? (
          <div className="card mt-6 p-6 text-sm text-ink-muted animate-fade-up">Transaction not found.</div>
        ) : (
          <div className="mt-6 animate-fade-up">
            <ReturnStatus
              txId={tx.id}
              reference={tx.reference}
              amount={tx.amount}
              currency={tx.currency}
              mt5Login={tx.mt5Login}
              initialStatus={tx.status}
            />
          </div>
        )}
      </main>
    </>
  );
}
