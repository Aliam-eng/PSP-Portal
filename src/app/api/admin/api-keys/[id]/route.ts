import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// DELETE — revoke a key (soft; sets revokedAt so it's instantly rejected).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "TECHNICAL")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.apiKey.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.revokedAt) return NextResponse.json({ ok: true, alreadyRevoked: true });

  await prisma.apiKey.update({ where: { id: params.id }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
