import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { slugifyPathSegment } from "@/lib/seo/partsPath";
import type { ProductListItem } from "@/lib/products/listQuery";
import {
  PARTS_HUB_SITEMAP_LEAF_LIMIT,
  buildPartsHubBrands,
  buildPartsHubCategories,
  buildPartsHubModels,
  buildQualifyingPartsHubsFromRaw,
  loadRawPartsHubGroups,
  resolvePartsHubLeafMembershipFromRaw,
  type PartsHubBrand,
  type PartsHubCategory,
  type PartsHubLeafMembership,
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
  type PartsHubLeafMembership,
  type PartsHubRawGroup,
} from "@/lib/seo/partsHubsData";

/** Cached raw partType×brand×deviceModel buckets — single aggregation source. */
export const getRawPartsHubGroups = unstable_cache(
  loadRawPartsHubGroups,
  ["parts-seo-raw-hubs-v1"],
  { revalidate: 3600 },
);

/** Qualifying leaf hubs (>=2) derived from the same raw aggregation. */
export async function getQualifyingPartsHubs(): Promise<QualifyingPartsHub[]> {
  return buildQualifyingPartsHubsFromRaw(await getRawPartsHubGroups());
}

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

/**
 * Resolve a Parts leaf URL to the exact approved-product groups that slugify
 * to the same path (same membership rules as sitemap / intermediate hubs).
 */
export async function resolvePartsHubLeafMembership(
  categorySlug: string,
  brandSlug: string,
  modelSlug: string,
): Promise<PartsHubLeafMembership | null> {
  return resolvePartsHubLeafMembershipFromRaw(
    await getRawPartsHubGroups(),
    categorySlug,
    brandSlug,
    modelSlug,
  );
}

export type PartsHubLeafListResult = {
  membership: PartsHubLeafMembership | null;
  products: ProductListItem[];
  total: number;
};

/**
 * Leaf hub listings + count from authoritative path membership.
 * Does not use approximate fetchProductList brand/model token matching.
 */
export async function loadPartsHubLeafListings(params: {
  categorySlug: string;
  brandSlug: string;
  modelSlug: string;
  limit?: number;
}): Promise<PartsHubLeafListResult> {
  const membership = await resolvePartsHubLeafMembership(
    params.categorySlug,
    params.brandSlug,
    params.modelSlug,
  );

  if (!membership || membership.rawGroups.length === 0) {
    return { membership: null, products: [], total: 0 };
  }

  const limit = Math.min(48, Math.max(1, params.limit ?? 24));
  await connectDB();

  const filter =
    membership.rawGroups.length === 1
      ? {
          status: "approved" as const,
          partType: membership.rawGroups[0].partType,
          brand: membership.rawGroups[0].brand,
          deviceModel: membership.rawGroups[0].deviceModel,
        }
      : {
          status: "approved" as const,
          $or: membership.rawGroups.map((group) => ({
            partType: group.partType,
            brand: group.brand,
            deviceModel: group.deviceModel,
          })),
        };

  const docs = await Product.find(filter)
    .select(
      "_id slug name price images brand partType deviceModel category deviceCategory condition priceNegotiable technician",
    )
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  const products: ProductListItem[] = docs.map((doc) => ({
    _id: String(doc._id),
    slug: doc.slug || undefined,
    name: doc.name,
    price: doc.price,
    images: Array.isArray(doc.images) ? doc.images : [],
    brand: doc.brand || undefined,
    partType: doc.partType || undefined,
    deviceModel: doc.deviceModel || undefined,
    category: doc.category || undefined,
    deviceCategory: doc.deviceCategory || undefined,
    condition: doc.condition || undefined,
    priceNegotiable: Boolean(doc.priceNegotiable),
    technician: doc.technician ? String(doc.technician) : undefined,
  }));

  return {
    membership,
    products,
    total: membership.total,
  };
}
