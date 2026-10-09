"use client";

import { useRef, useState } from "react";
import { computeFee, round2 } from "@/lib/fees";

export function DepositForm({ minDeposit = 0 }: { minDeposit?: number }) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [mt5Login, setMt5Login] = useState("");
  const [amount, setAmount] = useState("");
  const currency = "USD"; // Whish is USD-only per Rival docs
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false); // guards against double-submit

  // Live minimum-deposit validation.
  const numeric = parseFloat(amount);
  const belowMin = minDeposit > 0 && amount !== "" && (Number.isNaN(numeric) || numeric < minDeposit);
  const minLabel = `Minimum deposit is ${minDeposit.toFixed(2)} ${currency}`;

  // Fee (0 for now) and total the client pays. See src/lib/fees.ts.
  const validAmount = !Number.isNaN(numeric) && numeric > 0 && !belowMin;
  const fee = validAmount ? computeFee(numeric) : 0;
  const total = validAmount ? round2(numeric + fee) : 0;

  // Step 1 → review. Validate before showing the confirmation.
  function proceed(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!mt5Login) {
      setError("Enter your MT5 account number");
      return;
    }
    if (Number.isNaN(numeric) || numeric <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (belowMin) {
      setError(minLabel);
      return;
    }
    setStep("confirm");
  }

  // Step 2 → create the payment and hand off to Whish Pay.
  // A ref guard ensures one submit even on rapid double-clicks (no stray links).
  async function confirmPay() {
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mt5Login, amount, currency, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.collectUrl) {
        submitting.current = false;
        setLoading(false);
        setError(data.error || "Could not create payment link");
        return;
      }
      // Success — navigating away to Whish; keep the guard locked.
      window.location.href = data.collectUrl;
    } catch {
      submitting.current = false;
      setLoading(false);
      setError("Network error — please try again");
    }
  }

  // ---------------- Step 2: confirmation receipt ----------------
  if (step === "confirm") {
    return (
      <div className="card animate-fade-up p-6 sm:p-7">
        <h2 className="mb-5 font-semibold text-ink">Review your deposit</h2>

        <div className="rounded-xl border border-dashed border-line-strong bg-surface p-5">
          <div className="space-y-3">
            <LedgerRow label="MT5 account">
              <span className="font-mono text-lg font-semibold tracking-wide text-ink">{mt5Login}</span>
            </LedgerRow>
            <LedgerRow label="Amount">
              <span className="tabular-nums text-ink">
                {numeric.toFixed(2)} {currency}
              </span>
            </LedgerRow>
            <LedgerRow label="Fee">
              <span className="tabular-nums text-ink">
                {fee.toFixed(2)} {currency}
              </span>
            </LedgerRow>
            <div className="border-t border-line pt-3">
              <LedgerRow label={<span className="font-semibold text-ink">Total to pay</span>}>
                <span className="text-lg font-bold tabular-nums text-brand-400">
                  {total.toFixed(2)} {currency}
                </span>
              </LedgerRow>
            </div>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-sm font-medium text-brand-400">
          <CheckIcon />
          <span>
            Funds go to account <strong className="text-ink">{mt5Login}</strong>. Make sure it&apos;s correct.
          </span>
        </p>

        {error && (
          <p className="mt-3 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setError(null);
            }}
            disabled={loading}
            className="btn-ghost"
          >
            Edit
          </button>
          <button type="button" onClick={confirmPay} disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <>
                <Spinner /> Creating secure link…
              </>
            ) : (
              "Confirm & pay"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Step 1: details form ----------------
  return (
    <form onSubmit={proceed} className="card space-y-4 p-5 sm:p-6">
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
          <span className="field-hint">
            Minimum {minDeposit.toFixed(2)} {currency}
          </span>
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

      {error && (
        <p className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button type="submit" disabled={belowMin} className="btn-primary w-full">
        Continue
      </button>
    </form>
  );
}

function LedgerRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="-translate-y-0.5 flex-1 border-b border-dotted border-line-strong" />
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
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
