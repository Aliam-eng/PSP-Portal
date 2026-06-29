import { Logo } from "./ui";

// Header for the public (no-login) deposit pages.
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
        <Logo href="/deposit" />
        <span className="hidden items-center gap-1.5 text-xs text-ink-dim sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-neon animate-pulse-soft" />
          Secured by Whish Pay
        </span>
      </div>
    </header>
  );
}
