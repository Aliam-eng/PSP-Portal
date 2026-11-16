import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateKey } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

// GET — list keys (never returns the secret).
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TECHNICAL")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      lastUsedAt: true,
      revokedAt: true,
      createdByEmail: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ keys });
}

const createSchema = z.object({ name: z.string().trim().min(1).max(80) });

// POST — create a key. Returns the plaintext ONCE; only the hash is stored.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "TECHNICAL")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A name is required" }, { status: 400 });

  const { key, keyHash, prefix } = generateKey();
  const row = await prisma.apiKey.create({
    data: { name: parsed.data.name, keyHash, prefix, createdByEmail: session.email },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });

  // `key` is shown this one time only.
  return NextResponse.json({ ...row, key }, { status: 201 });
}
