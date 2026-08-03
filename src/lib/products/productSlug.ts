import { Product } from "@/lib/models/Product";

export type SlugParts = {
  brand?: string | null;
  deviceModel?: string | null;
  partType?: string | null;
  condition?: string | null;
};

function slugifySegment(value?: string | null): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Readable base slug, e.g. "apple-iphone-15-pro-max-display-used". */
export function buildProductSlugBase(parts: SlugParts): string {
  const base = [parts.brand, parts.deviceModel, parts.partType, parts.condition]
    .map(slugifySegment)
    .filter(Boolean)
    .join("-")
    .replace(/-{2,}/g, "-");

  return base || "listing";
}

/**
 * Unique product slug. Appends a short suffix only when the readable slug
 * is already taken, so the common case stays clean.
 */
export async function generateUniqueProductSlug(
  parts: SlugParts,
): Promise<string> {
  const base = buildProductSlugBase(parts);

  const existing = await Product.findOne({ slug: base }).select("_id").lean();
  if (!existing) return base;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 7);
    const candidate = `${base}-${suffix}`;
    const clash = await Product.findOne({ slug: candidate })
      .select("_id")
      .lean();
    if (!clash) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}
