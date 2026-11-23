/** Client-safe CTR helpers (no Mongo imports). */

export function formatCtr(
  impressions: number,
  clicks: number,
): number | null {
  if (impressions <= 0) return null;
  return Math.round((clicks / impressions) * 10000) / 100;
}

export function formatCtrDisplay(
  impressions: number,
  clicks: number,
): string {
  const ctr = formatCtr(impressions, clicks);
  return ctr === null ? "—" : `${ctr.toFixed(2)}%`;
}
