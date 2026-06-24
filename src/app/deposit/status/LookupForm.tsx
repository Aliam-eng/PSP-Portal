"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LookupForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [ref, setRef] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = ref.trim();
    if (v) router.push(`/deposit/status?ref=${encodeURIComponent(v)}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="PSP-XXXXXXXX"
        className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <button
        type="submit"
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Check
      </button>
    </form>
  );
}
