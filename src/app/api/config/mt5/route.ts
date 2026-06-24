import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  gatewayUrl: z.string().url().optional().nullable(),
  gatewayKey: z.string().optional().nullable(),
  defaultGroup: z.string().optional().nullable(),
  mt5Server: z.string().optional().nullable(),
  mt5Login: z.string().optional().nullable(),
  mt5Password: z.string().optional().nullable(),
  enabled: z.boolean().optional(),
});

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "TECHNICAL")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const d = parsed.data;
  const data: Record<string, unknown> = {
    gatewayUrl: d.gatewayUrl ?? undefined,
    defaultGroup: d.defaultGroup ?? undefined,
    mt5Server: d.mt5Server ?? undefined,
    mt5Login: d.mt5Login ?? undefined,
    enabled: d.enabled ?? undefined,
  };
  // Secrets: empty string = leave unchanged (so we never wipe a saved value).
  if (d.gatewayKey) data.gatewayKey = d.gatewayKey;
  if (d.mt5Password) data.mt5Password = d.mt5Password;

  const cfg = await prisma.mt5Config.upsert({
    where: { id: "mt5" },
    update: data,
    create: { id: "mt5", ...data, gatewayKey: d.gatewayKey ?? null, mt5Password: d.mt5Password ?? null },
  });

  return NextResponse.json({
    ok: true,
    hasKey: !!cfg.gatewayKey,
    hasPassword: !!cfg.mt5Password,
    enabled: cfg.enabled,
  });
}
