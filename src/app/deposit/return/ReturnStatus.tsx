"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";

const TERMINAL = ["CREDITED", "FAILED"];

export function ReturnStatus(props: {
  txId: string;
  reference: string;
  amount: number;
  currency: string;
  mt5Login: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(props.initialStatus);
  const [deal, setDeal] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  const sync = useCallback(async () => {
    const res = await fetch(`/api/deposits/${props.txId}/sync`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (data.status) setStatus(data.status);
    if (data.mt5DealId) setDeal(data.mt5DealId);
    if (data.errorMessage) setErr(data.errorMessage);
    if (data.status && TERMINAL.includes(data.status)) setPolling(false);
  }, [props.txId]);

  useEffect(() => {
    sync();
    if (!polling) return;
    const t = setInterval(sync, 4000);
    return () => clearInterval(t);
  }, [sync, polling]);

  const success = status === "CREDITED";
  const failed = status === "FAILED";

  return (
    <div className="mt-4 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Reference</p>
          <p className="font-mono text-sm">{props.reference}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Amount</dt>
          <dd className="font-medium">
            {props.amount.toFixed(2)} {props.currency}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">MT5 account</dt>
          <dd className="font-medium">{props.mt5Login}</dd>
        </div>
        {deal && (
          <div>
            <dt className="text-slate-500">MT5 deal</dt>
            <dd className="font-mono">{deal}</dd>
          </div>
        )}
      </dl>

      {success && (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ Payment successful and credited to your MT5 account.
        </p>
      )}
      {status === "CREDIT_FAILED" && (
        <p className="rounded-md bg-orange-50 p-3 text-sm text-orange-800">
          Payment received, but crediting MT5 failed. Our team has been notified. {err}
        </p>
      )}
      {failed && (
        <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">Payment was not completed. {err}</p>
      )}
      {polling && !success && !failed && (
        <p className="text-sm text-slate-500">Waiting for payment confirmation… (auto-refreshing)</p>
      )}

      <p className="text-xs text-slate-400">
        Save your reference <span className="font-mono">{props.reference}</span> to check this
        payment later.
      </p>
      <div className="flex gap-3 pt-2 text-sm">
        <Link href="/deposit" className="text-brand hover:underline">
          New deposit
        </Link>
      </div>
    </div>
  );
}
