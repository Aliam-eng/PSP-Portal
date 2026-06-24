import Link from "next/link";

// Header for the public (no-login) deposit pages.
export function PublicHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/deposit" className="font-semibold text-brand">
          PSP Portal
        </Link>
      </div>
    </header>
  );
}
