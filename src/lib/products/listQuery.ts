import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { buildPartTypeMatch } from "@/lib/categories/partTypeMatch";
import { ensureCategoriesReconciled } from "@/lib/categories/ensureReconciled";
import { buildStructuredModelFilter } from "@/lib/products/structuredModelFilter";

export { buildStructuredModelFilter } from "@/lib/products/structuredModelFilter";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Marketing / filler words that shouldn't block a multi-token search. */
const OPTIONAL_SEARCH_TOKENS = new Set([
  "galaxy",
  "iphone",
  "ipad",
  "pixel",
  "redmi",
  "poco",
  "moto",
  "nokia",
  "oneplus",
  "realme",
  "oppo",
  "vivo",
  "for",
  "the",
  "and",
  "with",
  "mobile",
  "phone",
]);

type LegacyCategoryResolution =
  | { kind: "deviceCategory"; slug: string }
  | { kind: "partType"; value: string }
  | { kind: "legacyField"; value: string };

/**
 * Resolve legacy `?category=` to one deterministic axis.
 * Preference: known DeviceType → known part Category → exact Product.category.
 * Does not OR across unrelated fields.
 */
export async function resolveLegacyCategoryParam(
  category: string,
): Promise<LegacyCategoryResolution> {
  const raw = category.trim();
  if (!raw) return { kind: "legacyField", value: raw };
  const slug = raw.toLowerCase();

  const DeviceType = (await import("@/lib/models/DeviceType")).default;
  const device = await DeviceType.findOne({
    $or: [
      { slug },
      { name: { $regex: `^${escapeRegex(raw)}$`, $options: "i" } },
    ],
    isActive: { $ne: false },
  })
    .select("slug")
    .lean();
  if (device?.slug) {
    return { kind: "deviceCategory", slug: String(device.slug) };
  }

  const Category = (await import("@/lib/models/Category")).default;
  const { normalizeCategoryName } = await import("@/lib/categories/normalize");
  const allParts = await Category.find({ isActive: { $ne: false } })
    .select("name slug")
    .lean();
  const nameKey = normalizeCategoryName(raw);
  const part =
    allParts.find((c) => c.slug === slug || c.slug === raw) ||
    allParts.find(
      (c) => normalizeCategoryName(c.name) === nameKey,
    ) ||
    // Device-prefixed slugs e.g. mobile-display ↔ display
    allParts.find(
      (c) =>
        typeof c.slug === "string" &&
        c.slug.includes("-") &&
        c.slug.split("-").slice(1).join("-") === slug,
    );

  if (part) {
    return { kind: "partType", value: raw };
  }

  return { kind: "legacyField", value: raw };
}

async function applyDeviceCategoryFilter(
  slug: string,
  query: Record<string, unknown>,
  andClauses: Record<string, unknown>[],
): Promise<void> {
  const normalized = slug.toLowerCase();
  try {
    const { resolveCatalogRefs } = await import("@/lib/catalog/resolveRefs");
    const refs = await resolveCatalogRefs({ deviceCategory: normalized });
    if (refs.deviceTypeId) {
      andClauses.push({
        $or: [
          { deviceCategory: normalized },
          { deviceTypeId: refs.deviceTypeId },
        ],
      });
    } else {
      query.deviceCategory = normalized;
    }
  } catch {
    query.deviceCategory = normalized;
  }
}

/**
 * Free-text search: prefer MongoDB `$text` index; fall back to per-token regex.
 */
function buildSearchFilter(search: string) {
  const rawTokens = search
    .trim()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  const requiredTokens = rawTokens.filter(
    (t) => !OPTIONAL_SEARCH_TOKENS.has(t.toLowerCase()),
  );
  const tokens = requiredTokens.length > 0 ? requiredTokens : rawTokens;

  const fields = [
    "name",
    "brand",
    "deviceModel",
    "modelNumber",
    "partType",
    "tags",
    "description",
  ] as const;

  const fieldMatch = (pattern: string) => ({
    $or: fields.map((field) => ({
      [field]: { $regex: pattern, $options: "i" },
    })),
  });

  if (tokens.length > 0) {
    return {
      $and: tokens.map((token) => fieldMatch(escapeRegex(token))),
    };
  }

  return fieldMatch(escapeRegex(search.trim()));
}

function sanitizeTextSearch(search: string) {
  // Strip operators that change $text semantics; keep words/numbers.
  return search
    .replace(/[\$\"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

async function prepareSearchQuery(raw: string): Promise<string> {
  const { expandSearchSynonyms } = await import(
    "@/lib/products/searchSynonyms"
  );
  return expandSearchSynonyms(sanitizeTextSearch(raw));
}

type SortKey = "featured" | "newest" | "price_asc" | "price_desc";

function resolveSort(sortParam?: string | null): Record<string, 1 | -1> {
  const sort = (sortParam || "featured") as SortKey;
  switch (sort) {
    case "newest":
      return { createdAt: -1 };
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "featured":
    default:
      return { featured: -1, createdAt: -1 };
  }
}

async function resolveSellerIds(opts: {
  city?: string | null;
  sellerType?: string | null;
  nearby?: boolean;
}): Promise<{
  ids: Types.ObjectId[] | null;
  cityBySellerId: Map<string, string>;
  preferredCity: string | null;
} | null> {
  const { city, sellerType, nearby } = opts;
  if (!city && !sellerType) return null;

  const sellerQuery: Record<string, unknown> = {
    role: "technician",
    isBlocked: false,
  };

  let preferredCity: string | null = null;
  if (city) {
    const { expandNearbyCities, canonicalizeCity } = await import(
      "@/lib/geo/nearbyCities"
    );
    preferredCity = canonicalizeCity(city);
    const cities = nearby
      ? expandNearbyCities(city)
      : preferredCity
        ? [preferredCity]
        : [city.trim()];
    sellerQuery.city = {
      $in: cities.map((c) => new RegExp(`^${escapeRegex(c)}$`, "i")),
    };
  }

  switch (sellerType) {
    case "trusted":
      sellerQuery.isTrusted = true;
      break;
    case "kyc":
      sellerQuery.kycVerified = true;
      break;
    case "business":
      sellerQuery.businessVerified = true;
      break;
    case "phone":
      sellerQuery.phoneVerified = true;
      break;
    case "elite":
      sellerQuery.eliteApproved = true;
      break;
    default:
      break;
  }

  const sellers = await User.find(sellerQuery).select("_id city").lean();
  const cityBySellerId = new Map<string, string>();
  for (const s of sellers) {
    if (s.city) cityBySellerId.set(String(s._id), String(s.city));
  }
  return {
    ids: sellers.map((s) => s._id as Types.ObjectId),
    cityBySellerId,
    preferredCity,
  };
}

/**
 * Every filter the listing page and the public products API understand.
 * Values are raw query-string strings so both callers can pass through
 * `searchParams` without pre-parsing.
 */
export type ProductListParams = {
  page?: string | null;
  limit?: string | null;
  deviceCategory?: string | null;
  category?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  model?: string | null;
  partType?: string | null;
  condition?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  search?: string | null;
  city?: string | null;
  /** When "1"/true with city — include metro/region nearby cities */
  nearby?: string | null;
  /**
   * Soft city preference (e.g. profile city): boost same-city sellers on
   * featured sort without filtering other cities out. Ignored when `city` set.
   */
  preferCity?: string | null;
  sellerType?: string | null;
  sort?: string | null;
  negotiable?: string | null;
};

/** Plain, RSC-serializable product shape for listing grids. */
export type ProductListItem = {
  _id: string;
  slug?: string;
  name: string;
  price: number;
  images: string[];
  brand?: string;
  partType?: string;
  deviceModel?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
  priceNegotiable?: boolean;
  /** Owner user id — used client-side to swap Contact for owner actions. */
  technician?: string;
  /** Seller city when available (location discovery). */
  sellerCity?: string;
  /** Same preferred city (not merely nearby). */
  sameCity?: boolean;
};

export type ProductListResult = {
  products: ProductListItem[];
  total: number;
  page: number;
  pages: number;
};

/** Read one filter, tolerating array values from Next's searchParams. */
export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Shared listing query for approved products.
 *
 * Both `/api/products` and the server-rendered `/products` page call this so
 * the grid crawlers see is generated by the same filters the client uses.
 */
export async function fetchProductList(
  params: ProductListParams,
): Promise<ProductListResult> {
  await connectDB();
  await ensureCategoriesReconciled();

  const { applyNaturalQueryToParams } = await import(
    "@/lib/products/parseNaturalQuery"
  );
  params = applyNaturalQueryToParams(params);

  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const limit = Math.min(
    60,
    Math.max(1, parseInt(params.limit || "12", 10) || 12),
  );

  const { deviceCategory, category, brand, partType, condition } = params;
  const deviceModel = params.deviceModel || params.model;
  const minPrice = parseFloat(params.minPrice || "0");
  const maxPrice = parseFloat(params.maxPrice || "0");
  const { search, city, sellerType, sort, negotiable } = params;
  const preferCityRaw =
    !city && params.preferCity ? String(params.preferCity).trim() : "";
  let softPreferredCity: string | null = null;
  if (preferCityRaw) {
    const { canonicalizeCity } = await import("@/lib/geo/nearbyCities");
    softPreferredCity = canonicalizeCity(preferCityRaw) || preferCityRaw;
  }
  const nearby =
    params.nearby === "1" ||
    params.nearby === "true" ||
    String(params.nearby || "").toLowerCase() === "yes";

  const query: Record<string, unknown> = { status: "approved" };
  const andClauses: Record<string, unknown>[] = [];

  // Explicit deviceCategory wins over legacy `category`.
  // Legacy `category` is resolved to exactly one axis (device / part / legacy field).
  let effectivePartType = partType || null;
  if (deviceCategory) {
    await applyDeviceCategoryFilter(deviceCategory, query, andClauses);
  } else if (category) {
    const resolved = await resolveLegacyCategoryParam(category);
    if (resolved.kind === "deviceCategory") {
      await applyDeviceCategoryFilter(resolved.slug, query, andClauses);
    } else if (resolved.kind === "partType") {
      // Explicit partType takes precedence over legacy category→partType.
      if (!effectivePartType) {
        effectivePartType = resolved.value;
      }
    } else {
      andClauses.push({
        category: {
          $regex: `^${escapeRegex(resolved.value)}$`,
          $options: "i",
        },
      });
    }
  }

  if (effectivePartType) {
    Object.assign(query, await buildPartTypeMatch(effectivePartType));
  }

  if (brand) {
    try {
      const { resolveCatalogRefs } = await import("@/lib/catalog/resolveRefs");
      const refs = await resolveCatalogRefs({
        deviceCategory: deviceCategory || undefined,
        brand,
      });
      if (refs.brandId) {
        andClauses.push({
          $or: [
            {
              brand: {
                $regex: `^${escapeRegex(brand)}$`,
                $options: "i",
              },
            },
            { brandId: refs.brandId },
          ],
        });
      } else {
        query.brand = {
          $regex: `^${escapeRegex(brand)}$`,
          $options: "i",
        };
      }
    } catch {
      query.brand = {
        $regex: `^${escapeRegex(brand)}$`,
        $options: "i",
      };
    }
  }

  if (deviceModel) {
    andClauses.push(buildStructuredModelFilter(deviceModel, brand));
  }

  if (condition) query.condition = condition;

  if (minPrice || maxPrice) {
    const priceQuery: { $gte?: number; $lte?: number } = {};
    if (minPrice) priceQuery.$gte = minPrice;
    if (maxPrice) priceQuery.$lte = maxPrice;
    query.price = priceQuery;
  }

  if (negotiable === "1" || negotiable === "true") {
    query.priceNegotiable = true;
  }

  let usedTextSearch = false;
  let usedAtlasSearch = false;
  let preparedSearch = "";
  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    preparedSearch = await prepareSearchQuery(trimmedSearch);
    if (preparedSearch.length >= 2) {
      const { atlasSearchEnabled } = await import("@/lib/products/atlasSearch");
      if (atlasSearchEnabled()) {
        usedAtlasSearch = true;
      } else {
        query.$text = { $search: preparedSearch };
        usedTextSearch = true;
      }
    } else {
      andClauses.push(buildSearchFilter(trimmedSearch));
    }
  }

  const sellerResolution = await resolveSellerIds({ city, sellerType, nearby });
  if (sellerResolution) {
    query.technician = { $in: sellerResolution.ids || [] };
  }

  if (andClauses.length > 0) {
    query.$and = andClauses;
  }

  const sortSpec = resolveSort(sort);
  const preferredCity =
    sellerResolution?.preferredCity || softPreferredCity || null;
  const cityBySellerId = sellerResolution?.cityBySellerId || new Map();
  const { isSameCity } = await import("@/lib/geo/nearbyCities");

  async function ensureSellerCities(
    docs: Array<{ technician?: unknown }>,
  ): Promise<void> {
    if (!softPreferredCity || sellerResolution) return;
    const missing = [
      ...new Set(
        docs
          .map((d) => (d.technician ? String(d.technician) : ""))
          .filter((id) => id && !cityBySellerId.has(id)),
      ),
    ];
    if (missing.length === 0) return;
    const { User } = await import("@/lib/models/User");
    const sellers = await User.find({ _id: { $in: missing } })
      .select("_id city")
      .lean();
    for (const s of sellers) {
      if (s.city) cityBySellerId.set(String(s._id), String(s.city));
    }
  }

  const decorate = (doc: Record<string, any>): ProductListItem => {
    const techId = doc.technician ? String(doc.technician) : undefined;
    const sellerCity = techId ? cityBySellerId.get(techId) : undefined;
    return {
      _id: String(doc._id),
      slug: doc.slug || undefined,
      name: doc.name || "",
      price: typeof doc.price === "number" ? doc.price : 0,
      images: Array.isArray(doc.images) ? doc.images.filter(Boolean) : [],
      brand: doc.brand || undefined,
      partType: doc.partType || undefined,
      deviceModel: doc.deviceModel || undefined,
      category: doc.category || undefined,
      deviceCategory: doc.deviceCategory || undefined,
      condition: doc.condition || undefined,
      priceNegotiable: Boolean(doc.priceNegotiable),
      technician: techId,
      sellerCity,
      sameCity: preferredCity
        ? isSameCity(preferredCity, sellerCity)
        : undefined,
    };
  };

  const preferSameCity =
    Boolean(preferredCity) && (params.sort || "featured") === "featured";

  const orderBySameCity = (items: ProductListItem[]) => {
    if (!preferSameCity) return items;
    return [...items].sort(
      (a, b) => Number(Boolean(b.sameCity)) - Number(Boolean(a.sameCity)),
    );
  };

  // Prefer text relevance when searching and sort is default featured
  let findSort: Record<string, 1 | -1 | { $meta: "textScore" }> =
    usedTextSearch && (params.sort || "featured") === "featured"
      ? { score: { $meta: "textScore" as const }, ...sortSpec }
      : sortSpec;

  // Atlas Search aggregation path (when ATLAS_SEARCH_INDEX is configured)
  if (usedAtlasSearch && preparedSearch) {
    try {
      const {
        buildAtlasProductSearchStage,
      } = await import("@/lib/products/atlasSearch");
      const matchQuery = { ...query };
      delete matchQuery.$text;
      const preferRelevance = (params.sort || "featured") === "featured";
      const overFetch = preferSameCity ? Math.min(60, limit * 3) : limit;
      const docsPipeline: Record<string, unknown>[] = preferRelevance
        ? [
            { $addFields: { searchScore: { $meta: "searchScore" } } },
            {
              $sort: {
                searchScore: -1,
                featured: -1,
                createdAt: -1,
              },
            },
            { $skip: preferSameCity ? 0 : (page - 1) * limit },
            { $limit: overFetch },
          ]
        : [
            { $sort: sortSpec },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ];
      const pipeline: Record<string, unknown>[] = [
        buildAtlasProductSearchStage(preparedSearch),
        { $match: matchQuery },
        {
          $facet: {
            total: [{ $count: "count" }],
            docs: [
              ...docsPipeline,
              {
                $project: {
                  _id: 1,
                  slug: 1,
                  name: 1,
                  price: 1,
                  images: 1,
                  brand: 1,
                  partType: 1,
                  deviceModel: 1,
                  category: 1,
                  deviceCategory: 1,
                  condition: 1,
                  priceNegotiable: 1,
                  technician: 1,
                },
              },
            ],
          },
        },
      ];
      const [facet] = await Product.aggregate(pipeline as any[]);
      const total = facet?.total?.[0]?.count || 0;
      const docs = facet?.docs || [];
      await ensureSellerCities(docs);
      let products = orderBySameCity(docs.map(decorate));
      if (preferSameCity) {
        products = products.slice((page - 1) * limit, page * limit);
      }
      return { products, total, page, pages: Math.ceil(total / limit) || 1 };
    } catch (err) {
      console.warn("[products] Atlas Search failed; falling back to $text", err);
      query.$text = { $search: preparedSearch };
      usedTextSearch = true;
      usedAtlasSearch = false;
      if ((params.sort || "featured") === "featured") {
        findSort = { score: { $meta: "textScore" as const }, ...sortSpec };
      }
    }
  }

  try {
    const total = await Product.countDocuments(query);
    const overFetch = preferSameCity ? Math.min(60, limit * 3) : limit;
    const docs = await Product.find(query)
      .select(
        "_id slug name price images brand partType deviceModel category deviceCategory condition priceNegotiable technician",
      )
      .skip(preferSameCity ? 0 : (page - 1) * limit)
      .limit(overFetch)
      .sort(findSort)
      .lean();

    await ensureSellerCities(docs);
    let products = orderBySameCity(docs.map(decorate));
    if (preferSameCity) {
      products = products.slice((page - 1) * limit, page * limit);
    }

    return { products, total, page, pages: Math.ceil(total / limit) };
  } catch (err) {
    // Text index may not exist yet — fall back to regex token match
    if (usedTextSearch) {
      delete query.$text;
      andClauses.push(buildSearchFilter(preparedSearch || trimmedSearch!));
      query.$and = andClauses;
      const total = await Product.countDocuments(query);
      const docs = await Product.find(query)
        .select(
          "_id slug name price images brand partType deviceModel category deviceCategory condition priceNegotiable technician",
        )
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sortSpec)
        .lean();

      await ensureSellerCities(docs);
      const products = orderBySameCity(docs.map(decorate));

      return { products, total, page, pages: Math.ceil(total / limit) };
    }
    throw err;
  }
}
