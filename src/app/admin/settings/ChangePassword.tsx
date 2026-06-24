"use client";

import { useState } from "react";

const inputCls = "mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand";

export function ChangePassword({ email }: { email: string }) {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirm) {
      setMsg({ ok: false, text: "New passwords do not match" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Password updated." });
      setCurrent("");
      setNew("");
      setConfirm("");
    } else {
      setMsg({ ok: false, text: data.error || "Could not update password" });
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold">Account</h2>
        <p className="text-sm text-slate-500">Signed in as {email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700">Current password</span>
          <input type="password" required value={currentPassword} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700">New password</span>
          <input type="password" required value={newPassword} onChange={(e) => setNew(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700">Confirm new</span>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Change password"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
