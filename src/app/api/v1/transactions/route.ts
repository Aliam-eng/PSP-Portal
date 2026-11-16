import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { findActiveKey } from "@/lib/api-keys";
import { rateLimit, RATE_RPM } from "@/lib/rate-limit";
import { toApiStatus, internalStatusesFor, isPaid, isCredited } from "@/lib/api-status";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_RANGE_DAYS = 92;

// GET /api/v1/transactions — read-only, API-key authenticated, cursor-paginated.
// Filters: from, to (ISO-8601 UTC, on created date), status (comma-separated),
//          limit (1..100), cursor.
export async function GET(req: Request) {
  // --- authenticate ---
  const token = bearer(req);
  if (!token) return json401("Missing API key");
  const key = await findActiveKey(token);
  if (!key) return json401("Invalid or revoked API key");

  // --- rate limit + concurrency ---
  const rl = rateLimit(key.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.reason === "concurrency" ? "Too many concurrent requests" : "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter), "X-RateLimit-Limit": String(RATE_RPM) },
      }
    );
  }

  try {
    prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    const q = new URL(req.url).searchParams;
    const where: Prisma.TransactionWhereInput = {};

    // date range (created date, UTC)
    const fromRaw = q.get("from");
    const toRaw = q.get("to");
    const from = parseDate(fromRaw);
    const to = parseDate(toRaw);
    if (fromRaw && !from) return json400("Invalid 'from' date — use ISO-8601, e.g. 2026-11-01");
    if (toRaw && !to) return json400("Invalid 'to' date — use ISO-8601, e.g. 2026-11-30");
    if (from && to && to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86_400_000) {
      return json400(`Date range too large — max ${MAX_RANGE_DAYS} days`);
    }
    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (from) createdAt.gte = from;
      if (to) createdAt.lte = to;
      where.createdAt = createdAt;
    }

    // status filter
    const statusParam = q.get("status");
    if (statusParam) {
      const internal = internalStatusesFor(statusParam.split(","));
      if (!internal)
        return json400("Invalid status — use any of: pending, processing, completed, credit_failed, failed");
      where.status = { in: internal };
    }

    // limit
    let limit = parseInt(q.get("limit") || "", 10);
    if (Number.isNaN(limit)) limit = DEFAULT_LIMIT;
    limit = Math.min(Math.max(1, limit), MAX_LIMIT);

    // cursor pagination (newest first; id is the stable tie-breaker)
    const cursor = q.get("cursor");
    const rows = await prisma.transaction.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1, // +1 to detect another page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        reference: true,
        mt5Login: true,
        amount: true,
        fee: true,
        currency: true,
        status: true,
        rivalPaymentId: true,
        mt5DealId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const data = page.map((t) => ({
      id: t.id,
      reference: t.reference,
      mt5_account: t.mt5Login,
      amount: t.amount,
      fee: t.fee,
      currency: t.currency,
      status: toApiStatus(t.status),
      paid: isPaid(t.status),
      credited: isCredited(t.status),
      whish_payment_id: t.rivalPaymentId,
      mt5_deal_id: t.mt5DealId,
      created_at: t.createdAt.toISOString(),
      updated_at: t.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      { data, page: { limit, has_more: hasMore, next_cursor: hasMore ? page[page.length - 1].id : null } },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_RPM),
          "X-RateLimit-Remaining": String(rl.remaining),
          "Cache-Control": "no-store",
        },
      }
    );
  } finally {
    rl.release();
  }
}

function bearer(req: Request): string | null {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
function json400(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
function json401(error: string) {
  return NextResponse.json({ error }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
}
