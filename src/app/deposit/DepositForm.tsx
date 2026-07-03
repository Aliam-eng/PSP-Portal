"use client";

import { useState } from "react";
import { computeFee, round2 } from "@/lib/fees";

export function DepositForm({ minDeposit = 0 }: { minDeposit?: number }) {
  const [mt5Login, setMt5Login] = useState("");
  const [amount, setAmount] = useState("");
  const currency = "USD"; // Whish is USD-only per Rival docs
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Live minimum-deposit validation.
  const numeric = parseFloat(amount);
  const belowMin = minDeposit > 0 && amount !== "" && (Number.isNaN(numeric) || numeric < minDeposit);
  const minLabel = `Minimum deposit is ${minDeposit.toFixed(2)} ${currency}`;

  // Fee (0 for now) and total the client pays. See src/lib/fees.ts.
  const validAmount = !Number.isNaN(numeric) && numeric > 0 && !belowMin;
  const fee = validAmount ? computeFee(numeric) : 0;
  const total = validAmount ? round2(numeric + fee) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (belowMin) {
      setError(minLabel);
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch("/api/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mt5Login, amount, currency, email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.collectUrl) {
      setLoading(false);
      setError(data.error || "Could not create payment link");
      return;
    }
    window.location.href = data.collectUrl;
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
      <div>
        <label className="field-label">MT5 account number</label>
        <input
          inputMode="numeric"
          required
          value={mt5Login}
          onChange={(e) => setMt5Login(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 5000123"
          className="field-input font-mono tracking-wide"
        />
      </div>

      <div>
        <label className="field-label">Amount</label>
        <div className="relative">
          <input
            type="number"
            min={minDeposit > 0 ? minDeposit : 0.01}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={minDeposit > 0 ? minDeposit.toFixed(2) : "25.00"}
            aria-invalid={belowMin}
            className={`field-input pr-14 font-mono ${belowMin ? "border-danger/60 focus:border-danger/60" : ""}`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-ink-dim">
            {currency}
          </span>
        </div>
        {belowMin ? (
          <span className="mt-1.5 block text-xs text-danger">{minLabel}</span>
        ) : minDeposit > 0 ? (
          <span className="field-hint">Minimum {minDeposit.toFixed(2)} {currency}</span>
        ) : null}
      </div>

      <div>
        <label className="field-label">
          Email <span className="font-normal text-ink-dim">· optional, for your receipt</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="field-input"
        />
      </div>

      {/* Fee breakdown */}
      <div className="space-y-1.5 rounded-xl border border-line bg-surface-raised/40 px-4 py-2.5 text-sm">
        <div className="flex items-center justify-between text-ink-muted">
          <span>Fee</span>
          <span className="font-mono text-ink">{fee.toFixed(2)} {currency}</span>
        </div>
        <div className="flex items-center justify-between border-t border-line/70 pt-2 font-medium">
          <span className="text-ink">Total to pay</span>
          <span className="font-mono text-brand-400">{total.toFixed(2)} {currency}</span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading || belowMin} className="btn-primary w-full">
        {loading ? (
          <>
            <Spinner /> Creating secure link…
          </>
        ) : (
          "Continue to Whish Pay"
        )}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z" />
    </svg>
  );
}
