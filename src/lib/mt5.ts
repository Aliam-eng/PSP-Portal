import { prisma } from "./db";

// Client for the MT5 gateway — a small internal HTTP service (Python) that wraps
// the MetaTrader 5 Manager API (which cannot be loaded from Node directly).
// The MT5 connection (server/login/password) is configured in Settings and
// forwarded to the gateway, so the gateway itself holds no broker secrets.
// Contract we expect from the gateway:
//   POST {gatewayUrl}/deposit   headers: x-api-key: <gatewayKey>
//     body: { server, managerLogin, managerPassword, login, amount, currency, group?, comment, reference }
//     200 -> { ok: true, dealId: "12345", message?: string }
//     4xx/5xx -> { ok: false, message: string }
//   POST {gatewayUrl}/connect   -> validates the MT5 manager connection
//   GET  {gatewayUrl}/health    -> liveness
// gateway/mt5_gateway.py implements this; scripts/mock-mt5-gateway.ts mocks it.

export type Mt5DepositInput = {
  login: string;
  amount: number;
  currency: string;
  group?: string | null;
  comment: string;
  reference: string;
};

export type Mt5DepositResult =
  | { ok: true; dealId: string; message?: string }
  | { ok: false; message: string };

async function getConfig() {
  const cfg = await prisma.mt5Config.findUnique({ where: { id: "mt5" } });
  if (!cfg) throw new Error("MT5 gateway is not configured");
  return cfg;
}

function gatewayHeaders(key?: string | null) {
  return {
    "Content-Type": "application/json",
    ...(key ? { "x-api-key": key } : {}),
  };
}

export async function mt5Deposit(input: Mt5DepositInput): Promise<Mt5DepositResult> {
  const cfg = await getConfig();
  if (!cfg.enabled) return { ok: false, message: "MT5 gateway is disabled" };
  if (!cfg.gatewayUrl) return { ok: false, message: "MT5 gateway URL not set" };
  if (!cfg.mt5Server || !cfg.mt5Login || !cfg.mt5Password)
    return { ok: false, message: "MT5 connection (server/login/password) not configured" };

  try {
    const res = await fetch(`${cfg.gatewayUrl.replace(/\/+$/, "")}/deposit`, {
      method: "POST",
      headers: gatewayHeaders(cfg.gatewayKey),
      body: JSON.stringify({
        server: cfg.mt5Server,
        managerLogin: cfg.mt5Login,
        managerPassword: cfg.mt5Password,
        login: input.login,
        amount: input.amount,
        currency: input.currency,
        group: input.group ?? cfg.defaultGroup ?? null,
        comment: input.comment,
        reference: input.reference,
      }),
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) {
      return { ok: false, message: body.message || `Gateway HTTP ${res.status}` };
    }
    return { ok: true, dealId: String(body.dealId ?? ""), message: body.message };
  } catch (e: any) {
    return { ok: false, message: e?.message || "MT5 gateway unreachable" };
  }
}

// "Test connection" from Settings — verifies the gateway is up AND the MT5
// manager credentials actually connect to the broker server.
export async function mt5TestConnect(): Promise<{ ok: boolean; detail: string }> {
  const cfg = await getConfig();
  if (!cfg.gatewayUrl) return { ok: false, detail: "No gateway URL set" };
  if (!cfg.mt5Server || !cfg.mt5Login || !cfg.mt5Password)
    return { ok: false, detail: "Set server, manager login and password first" };
  try {
    const res = await fetch(`${cfg.gatewayUrl.replace(/\/+$/, "")}/connect`, {
      method: "POST",
      headers: gatewayHeaders(cfg.gatewayKey),
      body: JSON.stringify({
        server: cfg.mt5Server,
        managerLogin: cfg.mt5Login,
        managerPassword: cfg.mt5Password,
      }),
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) {
      return { ok: false, detail: body.message || `Gateway HTTP ${res.status}` };
    }
    return { ok: true, detail: body.message || "connected" };
  } catch (e: any) {
    return { ok: false, detail: e?.message || "gateway unreachable" };
  }
}
