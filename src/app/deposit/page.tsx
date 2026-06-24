import { PublicHeader } from "@/components/PublicHeader";
import { DepositForm } from "./DepositForm";

// Public deposit page — no login required.
export default function DepositPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-xl font-semibold">Make a deposit</h1>
        <p className="mb-6 text-sm text-slate-500">
          Enter your MT5 account number and the amount. You'll be sent to Whish Pay to complete
          payment; funds are credited to your MT5 account automatically once paid.
        </p>
        <DepositForm />
      </main>
    </>
  );
}
