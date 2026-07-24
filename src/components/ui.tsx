import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

// --- Brand mark ----------------------------------------------------------
export function Logo({ href = "/deposit" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-givtrade.png" alt="GivTrade" className="h-7 w-auto select-none" />
    </Link>
  );
}

// --- Status badge --------------------------------------------------------
const STATUS: Record<string, { label: string; dot: string; cls: string }> = {
  PENDING: { label: "Pending", dot: "bg-ink-muted", cls: "text-ink-muted border-line bg-surface-raised/50" },
  LINK_GENERATED: { label: "Awaiting payment", dot: "bg-gold", cls: "text-gold border-gold/25 bg-gold/10" },
  PAID: { label: "Paid · crediting", dot: "bg-sky-400", cls: "text-sky-300 border-sky-400/25 bg-sky-400/10" },
  CREDITED: { label: "Completed", dot: "bg-brand-neon", cls: "text-brand-400 border-brand/30 bg-brand/10" },
  CREDIT_FAILED: { label: "Paid · MT5 failed", dot: "bg-orange-400", cls: "text-orange-300 border-orange-400/25 bg-orange-400/10" },
  FAILED: { label: "Failed", dot: "bg-danger", cls: "text-danger border-danger/25 bg-danger/10" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === "PENDING" || status === "FAILED" ? "" : "animate-pulse-soft"}`} />
      {s.label}
    </span>
  );
}

// --- Admin top bar -------------------------------------------------------
export function TopBar({ user }: { user: { email: string; role: string } }) {
  const links = [
    { href: "/admin/transactions", label: "Transactions" },
    { href: "/admin/reconciliation", label: "Reconciliation" },
    { href: "/admin/settings", label: "Settings" },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3.5">
        <div className="flex items-center gap-6">
          <Logo href="/admin/transactions" />
          <nav className="flex items-center gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-ink-muted transition hover:bg-surface-overlay hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-ink-dim sm:inline">{user.email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
