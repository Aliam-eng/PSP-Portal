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
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-xl font-semibold">Payment status</h1>
        {!tx ? (
          <p className="mt-4 rounded-md border bg-white p-4 text-sm text-slate-500">Transaction not found.</p>
        ) : (
          <ReturnStatus
            txId={tx.id}
            reference={tx.reference}
            amount={tx.amount}
            currency={tx.currency}
            mt5Login={tx.mt5Login}
            initialStatus={tx.status}
          />
        )}
      </main>
    </>
  );
}
