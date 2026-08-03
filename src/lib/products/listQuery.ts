import type { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { buildPartTypeMatch } from "@/lib/categories/partTypeMatch";
import { ensureCategoriesReconciled } from "@/lib/categories/ensureReconciled";

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

/** Strip brand / marketing prefixes so "Galaxy S24 Ultra" ≈ "S24 Ultra". */
function normalizeModelTokens(deviceModel: string, brand?: string | null) {
  let normalized = deviceModel.trim();

  if (brand) {
    normalized = normalized.replace(
      new RegExp(`^${escapeRegex(brand)}\\s+`, "i"),
      "",
    );
  }

  normalized = normalized.replace(
    /^(galaxy|iphone|ipad|pixel|redmi|poco|moto|nokia|oneplus|realme|oppo|vivo)\s+/i,
    "",
  );

  return normalized
    .split(/[\s\-_/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function buildModelFilter(deviceModel: string, brand?: string | null) {
  const tokens = normalizeModelTokens(deviceModel, brand);
  const fields = ["deviceModel", "name", "modelNumber"] as const;

  const fieldMatch = (pattern: string) => ({
    $or: fields.map((field) => ({
      [field]: { $regex: pattern, $options: "i" },
    })),
  });

  // Prefer token match so catalog "Galaxy S24 Ultra" hits product "S24 Ultra"
  if (tokens.length > 0) {
    return {
      $and: tokens.map((token) => fieldMatch(escapeRegex(token))),
    };
  }

  return fieldMatch(escapeRegex(deviceModel));
}

/**
 * Free-text search: each keyword must match at least one searchable field.
 * So "samsung s24 ultra" matches brand=Samsung + deviceModel=S24 Ultra.
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
}): Promise<Types.ObjectId[] | null> {
  const { city, sellerType } = opts;
  if (!city && !sellerType) return null;

  const sellerQuery: Record<string, unknown> = {
    role: "technician",
    isBlocked: false,
  };

  if (city) {
    sellerQuery.city = {
      $regex: `^${escapeRegex(city.trim())}$`,
      $options: "i",
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

  const sellers = await User.find(sellerQuery).select("_id").lean();
  return sellers.map((s) => s._id as Types.ObjectId);
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

  const query: Record<string, unknown> = { status: "approved" };
  const andClauses: Record<string, unknown>[] = [];

  if (deviceCategory) {
    query.deviceCategory = deviceCategory.toLowerCase();
  } else if (category) {
    // Legacy `category` may be a device slug or a part-type slug
    andClauses.push({
      $or: [
        { deviceCategory: category.toLowerCase() },
        { category },
        { partType: category },
      ],
    });
  }

  if (partType) {
    Object.assign(query, await buildPartTypeMatch(partType));
  }

  if (brand) {
    query.brand = {
      $regex: `^${escapeRegex(brand)}$`,
      $options: "i",
    };
  }

  if (deviceModel) {
    andClauses.push(buildModelFilter(deviceModel, brand));
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

  if (search?.trim()) {
    andClauses.push(buildSearchFilter(search));
  }

  const sellerIds = await resolveSellerIds({ city, sellerType });
  if (sellerIds) {
    query.technician = { $in: sellerIds };
  }

  if (andClauses.length > 0) {
    query.$and = andClauses;
  }

  const total = await Product.countDocuments(query);
  const docs = await Product.find(query)
    .select(
      "_id slug name price images brand partType deviceModel category deviceCategory condition priceNegotiable",
    )
    .skip((page - 1) * limit)
    .limit(limit)
    .sort(resolveSort(sort))
    .lean();

  const products: ProductListItem[] = docs.map((doc: Record<string, any>) => ({
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
  }));

  return { products, total, page, pages: Math.ceil(total / limit) };
}
