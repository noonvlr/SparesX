/** URL-safe segment for product slugs and `/parts/...` hubs. */
export function slugifyPathSegment(value?: string | null): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parts hub path `/parts/{partType}/{brand}/{model}` when all segments exist.
 * Matches sitemap aggregation (partType × brand × deviceModel).
 */
export function partsPath(parts: {
  partType?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
}): string | null {
  const category = slugifyPathSegment(parts.partType);
  const brand = slugifyPathSegment(parts.brand);
  const model = slugifyPathSegment(parts.deviceModel);
  if (!category || !brand || !model) return null;
  return `/parts/${category}/${brand}/${model}`;
}
