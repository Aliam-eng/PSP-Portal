import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TopBar } from "@/components/ui";
import { ScanClient } from "./ScanClient";

export const dynamic = "force-dynamic";

export default async function ReconciliationPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TECHNICAL") redirect("/deposit");

  return (
    <>
      <TopBar user={session} />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Reconciliation</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Find deposits that were credited to MT5 more than once. Read-only — nothing is changed in MT5.
          </p>
        </div>
        <div className="mt-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <ScanClient />
        </div>
      </main>
    </>
  );
}
