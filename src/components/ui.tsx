import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-700",
    LINK_GENERATED: "bg-amber-100 text-amber-800",
    PAID: "bg-blue-100 text-blue-800",
    CREDITED: "bg-emerald-100 text-emerald-800",
    CREDIT_FAILED: "bg-orange-100 text-orange-800",
    FAILED: "bg-rose-100 text-rose-800",
  };
  const label: Record<string, string> = {
    LINK_GENERATED: "Awaiting payment",
    PAID: "Paid — crediting",
    CREDITED: "Done ✓",
    CREDIT_FAILED: "Paid, MT5 failed",
    FAILED: "Failed",
    PENDING: "Pending",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || map.PENDING}`}>
      {label[status] || status}
    </span>
  );
}

export function TopBar({ user }: { user: { email: string; role: string } }) {
  const links =
    user.role === "TECHNICAL"
      ? [
          { href: "/admin/transactions", label: "Transactions" },
          { href: "/admin/settings", label: "Settings" },
        ]
      : [
          { href: "/deposit", label: "New Deposit" },
          { href: "/deposit/history", label: "My Deposits" },
        ];
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href={user.role === "TECHNICAL" ? "/admin/transactions" : "/deposit"} className="font-semibold text-brand">
          PSP Portal
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-600 hover:text-slate-900">
              {l.label}
            </Link>
          ))}
          <span className="hidden text-slate-400 sm:inline">{user.email}</span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
