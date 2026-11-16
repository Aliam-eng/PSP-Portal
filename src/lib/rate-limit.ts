// Per-key rate limiting + concurrency cap for the external API.
// In-memory token bucket — fine for a single web process (our deployment).
// For multiple instances, back this with Redis instead.

const RPM = Number(process.env.API_RATE_RPM || 60); // requests per minute per key
const MAX_CONCURRENT = Number(process.env.API_MAX_CONCURRENT || 5); // simultaneous per key
const WINDOW_MS = 60_000;

type Bucket = { tokens: number; updated: number; active: number };
const buckets = new Map<string, Bucket>();

export const RATE_RPM = RPM;

export type RateResult =
  | { ok: true; remaining: number; release: () => void }
  | { ok: false; reason: "rate" | "concurrency"; retryAfter: number; remaining: number };

export function rateLimit(keyId: string): RateResult {
  const now = Date.now();
  let b = buckets.get(keyId);
  if (!b) {
    b = { tokens: RPM, updated: now, active: 0 };
    buckets.set(keyId, b);
  }

  // Refill proportionally to time elapsed since the last request.
  b.tokens = Math.min(RPM, b.tokens + ((now - b.updated) / WINDOW_MS) * RPM);
  b.updated = now;

  // Concurrency guard — blocks a burst of simultaneous requests ("bulk at once").
  if (b.active >= MAX_CONCURRENT) {
    return { ok: false, reason: "concurrency", retryAfter: 1, remaining: Math.floor(b.tokens) };
  }
  // Steady-state rate guard.
  if (b.tokens < 1) {
    const retryAfter = Math.max(1, Math.ceil(((1 - b.tokens) / RPM) * 60));
    return { ok: false, reason: "rate", retryAfter, remaining: 0 };
  }

  b.tokens -= 1;
  b.active += 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const cur = buckets.get(keyId);
    if (cur) cur.active = Math.max(0, cur.active - 1);
  };
  return { ok: true, remaining: Math.floor(b.tokens), release };
}
