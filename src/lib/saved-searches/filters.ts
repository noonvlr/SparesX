/**
 * Pure saved-search filter matching (no DB).
 * Used by notification fan-out and verification scripts.
 */
import { matchesStructuredDeviceModel } from "@/lib/products/structuredModelFilter";
import { sellerCityMatchesFilter } from "@/lib/geo/nearbyCities";
import { partTypeValueInAliases } from "@/lib/categories/partTypeMatch";
import type { SavedSearchFilters } from "@/lib/models/SavedSearch";

export type SavedSearchProductLike = {
  _id?: unknown;
  name?: string;
  description?: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
  price?: number;
  priceNegotiable?: boolean;
  slug?: string | null;
  technician?: unknown;
  status?: string;
};

export type SavedSearchSellerFlags = {
  city?: string | null;
  isTrusted?: boolean;
  kycVerified?: boolean;
  businessVerified?: boolean;
  phoneVerified?: boolean;
  eliteApproved?: boolean;
};

export type SavedSearchMatchContext = {
  /**
   * Optional Category-driven alias values for `filters.partType`
   * (from `collectPartTypeAliasValues` / `createPartTypeAliasResolver`).
   * When omitted, falls back to exact case-insensitive equality.
   */
  partTypeAliasValues?: string[] | null;
};

function includesIgnoreCase(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function sellerMatchesType(
  seller: SavedSearchSellerFlags | null | undefined,
  sellerType?: string,
): boolean {
  if (!sellerType?.trim()) return true;
  if (!seller) return false;
  switch (sellerType.trim().toLowerCase()) {
    case "trusted":
      return Boolean(seller.isTrusted);
    case "kyc":
      return Boolean(seller.kycVerified);
    case "business":
      return Boolean(seller.businessVerified);
    case "phone":
      return Boolean(seller.phoneVerified);
    case "elite":
      return Boolean(seller.eliteApproved);
    default:
      return true;
  }
}

/**
 * Mongo `$or` used to load notification candidates.
 * Must be a *superset*: false positives OK; omitting a potentially matching
 * saved search is not. Final authority remains `productMatchesSavedFilters`.
 *
 * Note: callers still apply `.limit(100)` — that scale cap is intentional and deferred.
 */
export function buildSavedSearchCandidateOr(
  product: SavedSearchProductLike,
): Record<string, unknown>[] {
  const or: Record<string, unknown>[] = [
    { "filters.search": { $exists: true, $ne: "" } },
    // Structured-only searches (model/city/price/partType/…) must still enter the set
    { "filters.deviceModel": { $exists: true, $ne: "" } },
    { "filters.city": { $exists: true, $ne: "" } },
    { "filters.partType": { $exists: true, $ne: "" } },
    { "filters.minPrice": { $exists: true, $ne: "" } },
    { "filters.maxPrice": { $exists: true, $ne: "" } },
    { "filters.condition": { $exists: true, $ne: "" } },
    { "filters.sellerType": { $exists: true, $ne: "" } },
    { "filters.negotiable": { $exists: true, $ne: "" } },
  ];

  if (product.brand) {
    or.push({
      "filters.brand": {
        $regex: `^${String(product.brand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });
  }
  if (product.partType || product.category) {
    const part = String(product.partType || product.category);
    or.push({
      "filters.partType": {
        $regex: `^${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });
  }
  if (product.deviceCategory) {
    or.push({
      "filters.deviceCategory": product.deviceCategory,
    });
  }

  return or;
}

/**
 * Pure check: would this saved-search document satisfy the candidate `$or`
 * for the given product? (Does not run `productMatchesSavedFilters`.)
 */
export function savedSearchPassesCandidateOr(
  filters: SavedSearchFilters,
  product: SavedSearchProductLike,
): boolean {
  if (filters.search?.trim()) return true;
  if (filters.deviceModel?.trim()) return true;
  if (filters.city?.trim()) return true;
  if (filters.partType?.trim()) return true;
  if (filters.minPrice?.trim()) return true;
  if (filters.maxPrice?.trim()) return true;
  if (filters.condition?.trim()) return true;
  if (filters.sellerType?.trim()) return true;
  if (filters.negotiable?.trim()) return true;

  if (
    filters.brand?.trim() &&
    product.brand &&
    filters.brand.toLowerCase() === String(product.brand).toLowerCase()
  ) {
    return true;
  }
  if (
    filters.deviceCategory?.trim() &&
    product.deviceCategory &&
    filters.deviceCategory === product.deviceCategory
  ) {
    return true;
  }
  return false;
}

export function productMatchesSavedFilters(
  product: SavedSearchProductLike,
  filters: SavedSearchFilters,
  seller?: SavedSearchSellerFlags | null,
  context?: SavedSearchMatchContext,
): boolean {
  if (filters.deviceCategory) {
    if (
      String(product.deviceCategory || "").toLowerCase() !==
      filters.deviceCategory.toLowerCase()
    ) {
      return false;
    }
  }
  if (filters.brand) {
    if (
      String(product.brand || "").toLowerCase() !== filters.brand.toLowerCase()
    ) {
      return false;
    }
  }
  if (filters.partType) {
    const part = String(product.partType || product.category || "");
    const aliases = context?.partTypeAliasValues;
    if (aliases && aliases.length > 0) {
      if (!partTypeValueInAliases(part, aliases)) return false;
    } else if (part.toLowerCase() !== filters.partType.toLowerCase()) {
      return false;
    }
  }
  if (filters.condition) {
    if (
      String(product.condition || "").toLowerCase() !==
      filters.condition.toLowerCase()
    ) {
      return false;
    }
  }
  if (filters.deviceModel) {
    // Same Phase 7 structured semantics as live `/products` (deviceModel only).
    if (
      !matchesStructuredDeviceModel(
        product.deviceModel,
        filters.deviceModel,
        filters.brand,
      )
    ) {
      return false;
    }
  }
  if (filters.search) {
    const hay = `${product.name || ""} ${product.description || ""} ${product.brand || ""} ${product.deviceModel || ""} ${product.partType || ""}`;
    if (!includesIgnoreCase(hay, filters.search)) return false;
  }
  if (filters.minPrice) {
    const min = Number(filters.minPrice);
    if (!Number.isNaN(min) && Number(product.price || 0) < min) return false;
  }
  if (filters.maxPrice) {
    const max = Number(filters.maxPrice);
    if (!Number.isNaN(max) && Number(product.price || 0) > max) return false;
  }
  if (filters.negotiable === "1" || filters.negotiable === "true") {
    if (!product.priceNegotiable) return false;
  }
  if (filters.city) {
    if (
      !sellerCityMatchesFilter(
        seller?.city,
        filters.city,
        Boolean(filters.nearby),
      )
    ) {
      return false;
    }
  }
  if (!sellerMatchesType(seller, filters.sellerType)) return false;
  return true;
}
