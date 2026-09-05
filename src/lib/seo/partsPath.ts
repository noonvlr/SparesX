/** URL-safe segment for product slugs and `/parts/...` hubs. */
export function slugifyPathSegment(value?: string | null): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `/parts/{partType}` when the part-type segment exists. */
export function partsCategoryPath(partType?: string | null): string | null {
  const category = slugifyPathSegment(partType);
  if (!category) return null;
  return `/parts/${category}`;
}

/** `/parts/{partType}/{brand}` when both segments exist. */
export function partsBrandPath(parts: {
  partType?: string | null;
  brand?: string | null;
}): string | null {
  const category = slugifyPathSegment(parts.partType);
  const brand = slugifyPathSegment(parts.brand);
  if (!category || !brand) return null;
  return `/parts/${category}/${brand}`;
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
