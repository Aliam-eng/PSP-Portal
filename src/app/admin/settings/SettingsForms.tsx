"use client";

import { useState } from "react";

type RivalCfg = {
  baseUrl: string;
  createPaymentPath: string;
  statusPath: string;
  healthPath: string;
  enabled: boolean;
  hasKey: boolean;
};
type Mt5Cfg = {
  gatewayUrl: string;
  defaultGroup: string;
  mt5Server: string;
  mt5Login: string;
  enabled: boolean;
  hasKey: boolean;
  hasPassword: boolean;
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls = "mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-brand";

export function SettingsForms({ rival, mt5 }: { rival: RivalCfg; mt5: Mt5Cfg }) {
  return (
    <div className="space-y-8">
      <RivalForm cfg={rival} />
      <Mt5Form cfg={mt5} />
    </div>
  );
}

function RivalForm({ cfg }: { cfg: RivalCfg }) {
  const [form, setForm] = useState({ ...cfg, apiKey: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [test, setTest] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/config/rival", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: form.apiKey || undefined,
        baseUrl: form.baseUrl || undefined,
        createPaymentPath: form.createPaymentPath || undefined,
        statusPath: form.statusPath || undefined,
        healthPath: form.healthPath || undefined,
        enabled: form.enabled,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setMsg(res.ok ? "Saved." : data.error || "Save failed");
    if (res.ok) setForm((f) => ({ ...f, apiKey: "", hasKey: data.hasKey }));
  }

  async function runTest() {
    setTest("Testing…");
    const res = await fetch("/api/config/rival/test", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setTest(data.ok ? `Reachable (${data.detail})` : `Unreachable: ${data.detail || data.error}`);
  }

  return (
    <form onSubmit={save} className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Rival / Whish Pay</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="API key (Bearer)" hint={cfg.hasKey ? "A key is saved. Leave blank to keep it." : "tsk_<prefix>_<secret>"}>
          <input
            type="password"
            placeholder={cfg.hasKey ? "•••••••• (unchanged)" : "tsk_..."}
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Base URL" hint="Include /v1">
          <input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Create payment path">
          <input
            value={form.createPaymentPath}
            onChange={(e) => setForm({ ...form, createPaymentPath: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Status path" hint="Use {id} placeholder">
          <input
            value={form.statusPath}
            onChange={(e) => setForm({ ...form, statusPath: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Health path">
          <input
            value={form.healthPath}
            onChange={(e) => setForm({ ...form, healthPath: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={runTest} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">
          Test connection
        </button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
        {test && <span className="text-sm text-slate-600">{test}</span>}
      </div>
    </form>
  );
}

function Mt5Form({ cfg }: { cfg: Mt5Cfg }) {
  const [form, setForm] = useState({ ...cfg, gatewayKey: "", mt5Password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [test, setTest] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/config/mt5", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gatewayKey: form.gatewayKey || undefined,
        gatewayUrl: form.gatewayUrl || undefined,
        defaultGroup: form.defaultGroup || undefined,
        mt5Server: form.mt5Server || undefined,
        mt5Login: form.mt5Login || undefined,
        mt5Password: form.mt5Password || undefined,
        enabled: form.enabled,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setMsg(res.ok ? "Saved." : data.error || "Save failed");
    if (res.ok)
      setForm((f) => ({ ...f, gatewayKey: "", mt5Password: "", hasKey: data.hasKey, hasPassword: data.hasPassword }));
  }

  async function runTest() {
    setTest("Testing…");
    const res = await fetch("/api/config/mt5/test", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setTest(data.ok ? `Connected (${data.detail})` : `Failed: ${data.detail || data.error}`);
  }

  return (
    <form onSubmit={save} className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">MT5 Manager gateway</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Gateway URL" hint="Python service wrapping MT5 Manager API">
          <input value={form.gatewayUrl} onChange={(e) => setForm({ ...form, gatewayUrl: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Gateway key" hint={cfg.hasKey ? "A key is saved. Leave blank to keep it." : "shared secret (x-api-key)"}>
          <input
            type="password"
            placeholder={cfg.hasKey ? "•••••••• (unchanged)" : ""}
            value={form.gatewayKey}
            onChange={(e) => setForm({ ...form, gatewayKey: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="MT5 server" hint="address:port, e.g. mt5.broker.com:443">
          <input
            value={form.mt5Server}
            onChange={(e) => setForm({ ...form, mt5Server: e.target.value })}
            placeholder="mt5.broker.com:443"
            className={inputCls}
          />
        </Field>
        <Field label="Manager login">
          <input
            value={form.mt5Login}
            onChange={(e) => setForm({ ...form, mt5Login: e.target.value })}
            placeholder="1001"
            className={inputCls}
          />
        </Field>
        <Field label="Manager password" hint={cfg.hasPassword ? "A password is saved. Leave blank to keep it." : "MT5 manager password"}>
          <input
            type="password"
            placeholder={cfg.hasPassword ? "•••••••• (unchanged)" : ""}
            value={form.mt5Password}
            onChange={(e) => setForm({ ...form, mt5Password: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Default MT5 group">
          <input value={form.defaultGroup} onChange={(e) => setForm({ ...form, defaultGroup: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={runTest} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">
          Test connection
        </button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
        {test && <span className="text-sm text-slate-600">{test}</span>}
      </div>
    </form>
  );
}
