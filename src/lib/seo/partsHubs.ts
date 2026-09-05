import { unstable_cache } from "next/cache";
import { slugifyPathSegment } from "@/lib/seo/partsPath";
import {
  PARTS_HUB_SITEMAP_LEAF_LIMIT,
  buildPartsHubBrands,
  buildPartsHubCategories,
  buildPartsHubModels,
  loadQualifyingPartsHubs,
  type PartsHubBrand,
  type PartsHubCategory,
  type PartsHubModel,
  type QualifyingPartsHub,
} from "@/lib/seo/partsHubsData";

export {
  PARTS_HUB_SOFT_LIMIT,
  PARTS_HUB_SITEMAP_LEAF_LIMIT,
  type QualifyingPartsHub,
  type PartsHubCategory,
  type PartsHubBrand,
  type PartsHubModel,
} from "@/lib/seo/partsHubsData";

/** Cached qualifying leaf hubs — single source for pages + sitemap hierarchy. */
export const getQualifyingPartsHubs = unstable_cache(
  loadQualifyingPartsHubs,
  ["parts-seo-hubs-v1"],
  { revalidate: 3600 },
);

export async function getPartsHubCategories(): Promise<PartsHubCategory[]> {
  return buildPartsHubCategories(await getQualifyingPartsHubs());
}

export async function getPartsHubCategory(
  categorySlug: string,
): Promise<PartsHubCategory | null> {
  const slug = slugifyPathSegment(categorySlug);
  if (!slug) return null;
  const categories = await getPartsHubCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getPartsHubBrands(
  categorySlug: string,
): Promise<PartsHubBrand[]> {
  return buildPartsHubBrands(await getQualifyingPartsHubs(), categorySlug);
}

export async function getPartsHubBrand(
  categorySlug: string,
  brandSlug: string,
): Promise<PartsHubBrand | null> {
  const brands = await getPartsHubBrands(categorySlug);
  const slug = slugifyPathSegment(brandSlug);
  if (!slug) return null;
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function getPartsHubModels(
  categorySlug: string,
  brandSlug: string,
): Promise<PartsHubModel[]> {
  return buildPartsHubModels(
    await getQualifyingPartsHubs(),
    categorySlug,
    brandSlug,
  );
}

/** Leaf hubs for sitemap (recent-first, capped). Hierarchy pages use the full set. */
export async function getPartsHubLeavesForSitemap(
  limit = PARTS_HUB_SITEMAP_LEAF_LIMIT,
): Promise<QualifyingPartsHub[]> {
  const hubs = await getQualifyingPartsHubs();
  return hubs.slice(0, Math.max(0, limit));
}
