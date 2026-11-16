"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdByEmail: string | null;
  createdAt: string;
};

export function ApiKeysClient({ initialKeys, endpoint }: { initialKeys: KeyRow[]; endpoint: string }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create the key");
        return;
      }
      setNewKey(data.key);
      setName("");
      router.refresh();
      setKeys((prev) => [
        {
          id: data.id,
          name: data.name,
          prefix: data.prefix,
          lastUsedAt: null,
          revokedAt: null,
          createdByEmail: null,
          createdAt: data.createdAt,
        },
        ...prev,
      ]);
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string, label: string) {
    if (!confirm(`Revoke "${label}"? Any system using this key will stop working immediately.`)) return;
    const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Create */}
      <section className="card p-5 sm:p-6">
        <h2 className="mb-1 font-semibold text-ink">Create a key</h2>
        <p className="mb-4 text-sm text-ink-muted">Give it a name so you remember what it's for.</p>
        <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. FXBO integration"
            maxLength={80}
            className="field-input flex-1"
          />
          <button type="submit" disabled={creating || !name.trim()} className="btn-primary">
            {creating ? "Creating…" : "Create key"}
          </button>
        </form>
        {error && (
          <p className="mt-3 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        {newKey && (
          <div className="mt-4 rounded-xl border border-brand/30 bg-brand/5 p-4">
            <p className="text-sm font-medium text-brand-400">Copy this key now — it won't be shown again.</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink">
                {newKey}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(newKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="btn-ghost shrink-0"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* List */}
      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-semibold text-ink">Your keys</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-ink-dim">No keys yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {keys.map((k) => {
              const revoked = !!k.revokedAt;
              return (
                <div key={k.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-ink">{k.name}</span>
                      {revoked ? (
                        <span className="rounded-md border border-danger/25 bg-danger/10 px-1.5 py-0.5 text-xs text-danger">
                          Revoked
                        </span>
                      ) : (
                        <span className="rounded-md border border-brand/25 bg-brand/10 px-1.5 py-0.5 text-xs text-brand-400">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-dim">
                      <code className="font-mono">{k.prefix}…</code>
                      <span>created {fmt(k.createdAt)}</span>
                      <span>last used {k.lastUsedAt ? fmt(k.lastUsedAt) : "never"}</span>
                    </div>
                  </div>
                  {!revoked && (
                    <button type="button" onClick={() => revoke(k.id, k.name)} className="btn-ghost shrink-0 text-danger">
                      Revoke
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How to use */}
      <section className="card p-5 sm:p-6">
        <h2 className="mb-3 font-semibold text-ink">How to use it</h2>
        <p className="mb-2 text-sm text-ink-muted">
          Send the key as a Bearer token. All times are UTC. Filter by <code className="font-mono">from</code>,{" "}
          <code className="font-mono">to</code> (created date) and <code className="font-mono">status</code>.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs text-ink-muted">
{`curl -H "Authorization: Bearer psp_live_…" \\
  "${endpoint}?status=completed&from=2026-11-01&to=2026-11-30&limit=50"`}
        </pre>
        <p className="mt-3 text-xs text-ink-dim">
          Statuses: <code className="font-mono">pending</code>, <code className="font-mono">processing</code>,{" "}
          <code className="font-mono">completed</code> (paid &amp; credited), <code className="font-mono">credit_failed</code>,{" "}
          <code className="font-mono">failed</code>. Page with <code className="font-mono">next_cursor</code>.
        </p>
      </section>
    </div>
  );
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
