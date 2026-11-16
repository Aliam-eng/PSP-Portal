// Maps internal transaction statuses to the stable vocabulary exposed by the
// external API, so consumers never see our internal names and can filter clearly.

export type ApiStatus = "pending" | "processing" | "completed" | "credit_failed" | "failed";

// internal -> external
const MAP: Record<string, ApiStatus> = {
  PENDING: "pending",
  LINK_GENERATED: "pending",
  PAID: "processing", // paid on the PSP, crediting to MT5 in progress
  CREDITED: "completed", // paid AND credited to the MT5 account
  CREDIT_FAILED: "credit_failed", // paid but crediting failed — needs attention
  FAILED: "failed",
};

// external -> internal (for status filtering in queries)
const REVERSE: Record<ApiStatus, string[]> = {
  pending: ["PENDING", "LINK_GENERATED"],
  processing: ["PAID"],
  completed: ["CREDITED"],
  credit_failed: ["CREDIT_FAILED"],
  failed: ["FAILED"],
};

export function toApiStatus(internal: string): ApiStatus {
  return MAP[internal] ?? "pending";
}

// Returns the internal statuses to query for, or null if any value is invalid.
export function internalStatusesFor(apiStatuses: string[]): string[] | null {
  const out = new Set<string>();
  for (const s of apiStatuses) {
    const key = s.trim().toLowerCase() as ApiStatus;
    if (!REVERSE[key]) return null;
    REVERSE[key].forEach((v) => out.add(v));
  }
  return [...out];
}

export const isPaid = (internal: string) =>
  internal === "PAID" || internal === "CREDITED" || internal === "CREDIT_FAILED";
export const isCredited = (internal: string) => internal === "CREDITED";
