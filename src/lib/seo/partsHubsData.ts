import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { slugifyPathSegment } from "@/lib/seo/partsPath";

/** Soft ceiling so serverless aggregation cannot run unbounded. */
export const PARTS_HUB_SOFT_LIMIT = 10_000;

/** Sitemap leaf URL cap (unchanged from prior sitemap behavior). */
export const PARTS_HUB_SITEMAP_LEAF_LIMIT = 1500;

export type QualifyingPartsHub = {
  categorySlug: string;
  brandSlug: string;
  modelSlug: string;
  /** Representative display labels (prefer raw product field values). */
  categoryLabel: string;
  brandLabel: string;
  modelLabel: string;
  count: number;
  updatedAt: Date;
  path: string;
};

export type PartsHubCategory = {
  slug: string;
  label: string;
  brandCount: number;
  hubCount: number;
  updatedAt: Date;
};

export type PartsHubBrand = {
  slug: string;
  label: string;
  modelCount: number;
  hubCount: number;
  updatedAt: Date;
};

export type PartsHubModel = {
  slug: string;
  label: string;
  count: number;
  updatedAt: Date;
  path: string;
};

function asDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function preferLabel(current: string, candidate: string): string {
  const next = String(candidate || "").trim();
  if (!next) return current;
  if (!current) return next;
  return next.length > current.length ? next : current;
}

function labelFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type RawHubRow = {
  _id: {
    partType?: string | null;
    brand?: string | null;
    deviceModel?: string | null;
  };
  updatedAt: Date;
  count: number;
};

/**
 * Authoritative SEO hub eligibility (uncached): approved products grouped by
 * partType × brand × deviceModel with at least 2 listings, then merged by
 * slugified URL path (same convention as `partsPath()` / leaf hubs).
 */
export async function loadQualifyingPartsHubs(): Promise<QualifyingPartsHub[]> {
  await connectDB();

  const rows = await Product.aggregate<RawHubRow>([
    {
      $match: {
        status: "approved",
        partType: { $exists: true, $nin: [null, ""] },
        brand: { $exists: true, $nin: [null, ""] },
        deviceModel: { $exists: true, $nin: [null, ""] },
      },
    },
    {
      $group: {
        _id: {
          partType: "$partType",
          brand: "$brand",
          deviceModel: "$deviceModel",
        },
        updatedAt: { $max: "$updatedAt" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gte: 2 } } },
    { $sort: { updatedAt: -1 } },
    { $limit: PARTS_HUB_SOFT_LIMIT },
  ]);

  const byPath = new Map<string, QualifyingPartsHub>();

  for (const row of rows) {
    const partType = String(row._id.partType || "").trim();
    const brand = String(row._id.brand || "").trim();
    const deviceModel = String(row._id.deviceModel || "").trim();
    const categorySlug = slugifyPathSegment(partType);
    const brandSlug = slugifyPathSegment(brand);
    const modelSlug = slugifyPathSegment(deviceModel);
    if (!categorySlug || !brandSlug || !modelSlug) continue;

    const path = `/parts/${categorySlug}/${brandSlug}/${modelSlug}`;
    const updatedAt = asDate(row.updatedAt);
    const existing = byPath.get(path);

    if (!existing) {
      byPath.set(path, {
        categorySlug,
        brandSlug,
        modelSlug,
        categoryLabel: partType || labelFromSlug(categorySlug),
        brandLabel: brand || labelFromSlug(brandSlug),
        modelLabel: deviceModel || labelFromSlug(modelSlug),
        count: row.count,
        updatedAt,
        path,
      });
      continue;
    }

    existing.count += row.count;
    if (updatedAt.getTime() > existing.updatedAt.getTime()) {
      existing.updatedAt = updatedAt;
    }
    existing.categoryLabel = preferLabel(existing.categoryLabel, partType);
    existing.brandLabel = preferLabel(existing.brandLabel, brand);
    existing.modelLabel = preferLabel(existing.modelLabel, deviceModel);
  }

  return [...byPath.values()].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

export function buildPartsHubCategories(
  hubs: QualifyingPartsHub[],
): PartsHubCategory[] {
  const map = new Map<string, PartsHubCategory>();
  const brandsByCategory = new Map<string, Set<string>>();

  for (const hub of hubs) {
    let set = brandsByCategory.get(hub.categorySlug);
    if (!set) {
      set = new Set();
      brandsByCategory.set(hub.categorySlug, set);
    }
    set.add(hub.brandSlug);

    const existing = map.get(hub.categorySlug);
    if (!existing) {
      map.set(hub.categorySlug, {
        slug: hub.categorySlug,
        label: hub.categoryLabel,
        brandCount: 0,
        hubCount: 1,
        updatedAt: hub.updatedAt,
      });
      continue;
    }
    existing.hubCount += 1;
    existing.label = preferLabel(existing.label, hub.categoryLabel);
    if (hub.updatedAt.getTime() > existing.updatedAt.getTime()) {
      existing.updatedAt = hub.updatedAt;
    }
  }

  for (const [slug, cat] of map) {
    cat.brandCount = brandsByCategory.get(slug)?.size ?? 0;
  }

  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

export function buildPartsHubBrands(
  hubs: QualifyingPartsHub[],
  categorySlug: string,
): PartsHubBrand[] {
  const slug = slugifyPathSegment(categorySlug);
  if (!slug) return [];

  const filtered = hubs.filter((h) => h.categorySlug === slug);
  const map = new Map<string, PartsHubBrand>();
  const modelsByBrand = new Map<string, Set<string>>();

  for (const hub of filtered) {
    let models = modelsByBrand.get(hub.brandSlug);
    if (!models) {
      models = new Set();
      modelsByBrand.set(hub.brandSlug, models);
    }
    models.add(hub.modelSlug);

    const existing = map.get(hub.brandSlug);
    if (!existing) {
      map.set(hub.brandSlug, {
        slug: hub.brandSlug,
        label: hub.brandLabel,
        modelCount: 0,
        hubCount: 1,
        updatedAt: hub.updatedAt,
      });
      continue;
    }
    existing.hubCount += 1;
    existing.label = preferLabel(existing.label, hub.brandLabel);
    if (hub.updatedAt.getTime() > existing.updatedAt.getTime()) {
      existing.updatedAt = hub.updatedAt;
    }
  }

  for (const [brandSlug, brand] of map) {
    brand.modelCount = modelsByBrand.get(brandSlug)?.size ?? 0;
  }

  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

export function buildPartsHubModels(
  hubs: QualifyingPartsHub[],
  categorySlug: string,
  brandSlug: string,
): PartsHubModel[] {
  const cat = slugifyPathSegment(categorySlug);
  const brand = slugifyPathSegment(brandSlug);
  if (!cat || !brand) return [];

  return hubs
    .filter((h) => h.categorySlug === cat && h.brandSlug === brand)
    .map((h) => ({
      slug: h.modelSlug,
      label: h.modelLabel,
      count: h.count,
      updatedAt: h.updatedAt,
      path: h.path,
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
}
