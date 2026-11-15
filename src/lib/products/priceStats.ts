/** Pure percentile helper for price suggestion ranges. */
export function pricePercentile(sorted: number[], p: number) {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return Math.round(sorted[lo] * (1 - w) + sorted[hi] * w);
}
