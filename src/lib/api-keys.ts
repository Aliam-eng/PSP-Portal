import crypto from "node:crypto";
import { prisma } from "./db";

// External management API keys. We store only the SHA-256 hash; the plaintext
// is returned once at creation and never persisted.
const PREFIX = "psp_live_";

export function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// Mint a new key. `key` is the plaintext to show once; `keyHash`/`prefix` persist.
export function generateKey(): { key: string; keyHash: string; prefix: string } {
  const secret = crypto.randomBytes(24).toString("base64url"); // ~32 url-safe chars
  const key = `${PREFIX}${secret}`;
  return { key, keyHash: hashKey(key), prefix: key.slice(0, PREFIX.length + 8) };
}

// Resolve a plaintext key to its active (non-revoked) row, or null.
// Lookup is by hash (unique index), so the raw secret is never compared directly.
export async function findActiveKey(plaintext: string) {
  if (!plaintext || !plaintext.startsWith(PREFIX)) return null;
  const row = await prisma.apiKey.findUnique({ where: { keyHash: hashKey(plaintext) } });
  if (!row || row.revokedAt) return null;
  return row;
}
