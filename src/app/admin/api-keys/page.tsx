import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/ui";
import { ApiKeysClient } from "./ApiKeysClient";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "TECHNICAL") redirect("/deposit");

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      revokedAt: true,
      createdByEmail: true,
      createdAt: true,
    },
  });

  const base = process.env.APP_BASE_URL || "http://localhost:3000";

  return (
    <>
      <TopBar user={session} />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">API keys</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Read-only keys for the management API. Share a key with your CRM/FXBO; revoke it anytime.
          </p>
        </div>
        <ApiKeysClient
          initialKeys={keys.map((k) => ({
            ...k,
            lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
            revokedAt: k.revokedAt?.toISOString() ?? null,
            createdAt: k.createdAt.toISOString(),
          }))}
          endpoint={`${base}/api/v1/transactions`}
        />
      </main>
    </>
  );
}
