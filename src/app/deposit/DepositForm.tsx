"use client";

import { useState } from "react";

const CURRENCIES = ["USD"]; // Whish is USD-only per Rival docs

export function DepositForm() {
  const [mt5Login, setMt5Login] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
    // Hand off to Whish Pay; the redirect returns to /deposit/return.
    window.location.href = data.collectUrl;
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">MT5 account number</label>
        <input
          inputMode="numeric"
          required
          value={mt5Login}
          onChange={(e) => setMt5Login(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 5000123"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <p className="mt-0.5 text-xs text-slate-400">The funds will be credited to this MT5 login.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Amount</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25.00"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Email <span className="font-normal text-slate-400">(optional — for your receipt/reference)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Creating link…" : "Continue to Whish Pay"}
      </button>
    </form>
  );
}
