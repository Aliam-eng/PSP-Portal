"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui";

type Row = {
  id: string;
  reference: string;
  client: string;
  mt5Login: string;
  amount: number;
  currency: string;
  status: string;
  rivalPaymentId: string | null;
  mt5DealId: string | null;
  errorMessage: string | null;
  createdAt: string;
};

const FILTERS = ["ALL", "LINK_GENERATED", "PAID", "CREDITED", "CREDIT_FAILED", "FAILED"];

export function TransactionsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = filter === "ALL" ? rows : rows.filter((r) => r.status === filter);

  async function syncOne(id: string) {
    setBusy(id);
    await fetch(`/api/deposits/${id}/sync`, { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  async function sweepAll() {
    setBusy("sweep");
    await fetch("/api/sweep", { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs ${
              filter === f ? "bg-brand text-white" : "bg-white text-slate-600 border"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={sweepAll}
          disabled={busy === "sweep"}
          className="ml-auto rounded-md border bg-white px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
        >
          {busy === "sweep" ? "Syncing…" : "Sync all pending"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[840px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">MT5</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Rival ID</th>
              <th className="px-3 py-2">MT5 deal</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  No transactions.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-3 py-2 font-mono text-xs">{r.reference}</td>
                <td className="px-3 py-2">{r.client}</td>
                <td className="px-3 py-2">{r.mt5Login}</td>
                <td className="px-3 py-2">
                  {r.amount.toFixed(2)} {r.currency}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                  {r.errorMessage && <div className="mt-1 text-xs text-rose-500">{r.errorMessage}</div>}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.rivalPaymentId || "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-500">{r.mt5DealId || "—"}</td>
                <td className="px-3 py-2 text-slate-500">{r.createdAt.slice(0, 16).replace("T", " ")}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => syncOne(r.id)}
                    disabled={busy === r.id}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                  >
                    {busy === r.id ? "…" : "Sync"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
