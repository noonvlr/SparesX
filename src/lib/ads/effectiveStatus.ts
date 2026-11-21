import type { AdCampaignStatus } from "@/lib/models/AdCampaign";

/**
 * Derived display / delivery status (D1).
 * Stored status is only draft | active | paused | archived.
 * Precedence: archived > draft > paused > expired > scheduled > live.
 */
export type EffectiveAdStatus =
  | "archived"
  | "draft"
  | "paused"
  | "expired"
  | "scheduled"
  | "live";

export type EffectiveStatusInput = {
  status: AdCampaignStatus;
  startDate: Date | null | undefined;
  endDate: Date | null | undefined;
  now?: Date;
  /**
   * When provided, must be true for `live`.
   * Used by delivery + placement-scoped admin views.
   */
  placementEnabled?: boolean;
  /**
   * When provided, must be true for `live`
   * (all required creatives present for the placement).
   */
  hasRequiredCreatives?: boolean;
};

/**
 * Single shared effective-status function for admin UI, delivery, and tests.
 * Start inclusive, end exclusive. Missing schedule while `active` → draft
 * (not publishable / not serveable).
 */
export function getEffectiveStatus(
  input: EffectiveStatusInput,
): EffectiveAdStatus {
  if (input.status === "archived") return "archived";
  if (input.status === "draft") return "draft";
  if (input.status === "paused") return "paused";

  // status === "active"
  const start = input.startDate;
  const end = input.endDate;
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return "draft";
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return "draft";
  if (end.getTime() <= start.getTime()) return "draft";

  const now = input.now ?? new Date();
  if (now.getTime() < start.getTime()) return "scheduled";
  if (now.getTime() >= end.getTime()) return "expired";

  if (input.placementEnabled === false) return "paused";
  if (input.hasRequiredCreatives === false) return "draft";

  return "live";
}

/** Delivery gate: live under D1 with placement + creatives when passed. */
export function isEligibleLive(input: EffectiveStatusInput): boolean {
  return getEffectiveStatus(input) === "live";
}
