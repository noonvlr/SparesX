function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Filters that create a separate listing view. Pagination of the default list is not one of these. */
export const LISTING_FILTER_KEYS = [
  "deviceCategory",
  "category",
  "brand",
  "deviceModel",
  "model",
  "partType",
  "condition",
  "minPrice",
  "maxPrice",
  "search",
  "city",
  "nearby",
  "sellerType",
  "negotiable",
] as const;

export type ListingSearch = Record<string, string | string[] | undefined>;

const CANONICAL_KEYS = [
  ...LISTING_FILTER_KEYS,
  "sort",
  "limit",
  "page",
] as const;

/** Positive integer without leading zeros. `page=1` is valid but not a separate URL. */
export function listingPageParam(
  value: string | undefined,
): "absent" | "valid" | "invalid" {
  if (value == null || value === "") return "absent";
  if (!/^[1-9]\d*$/.test(value)) return "invalid";
  return "valid";
}

export function requestedListingPage(raw: ListingSearch): number {
  const value = firstParam(raw.page);
  if (listingPageParam(value) !== "valid") return 1;
  return Number(value);
}

export function hasListingFilters(raw: ListingSearch): boolean {
  return LISTING_FILTER_KEYS.some((key) => Boolean(firstParam(raw[key])?.trim()));
}

/** Default browse list: no filters, featured sort, page size 12. */
export function isDefaultListing(raw: ListingSearch): boolean {
  if (hasListingFilters(raw)) return false;
  const sort = firstParam(raw.sort)?.trim();
  if (sort && sort !== "featured") return false;
  const limit = firstParam(raw.limit)?.trim();
  if (limit && limit !== "12") return false;
  return true;
}

export function clampListingPage(page: number, pageCount: number): number {
  const pages = Math.max(1, pageCount);
  return Math.min(Math.max(1, page), pages);
}

/**
 * Href used by Previous, Next, and page-number anchors.
 * Keeps the visitor's filters. Omits `page` on page 1 so it does not duplicate `/products`.
 */
export function listingHref(raw: ListingSearch, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const single = firstParam(value)?.trim();
    if (!single || key === "page") continue;
    params.set(key, single);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

function normalizedHref(raw: ListingSearch, page: number): string {
  const params = new URLSearchParams();
  for (const key of CANONICAL_KEYS) {
    if (key === "page") continue;
    const single = firstParam(raw[key])?.trim();
    if (!single) continue;
    if (key === "sort" && single === "featured") continue;
    if (key === "limit" && single === "12") continue;
    params.set(key, single);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

/**
 * Indexability and canonical for a listing URL.
 * The default list, including page 2 and later, is indexable.
 * Each indexable page canonicalizes to itself. `?page=1` collapses to `/products`.
 * Filtered, sorted, resized, invalid, and out-of-range pages stay out of the index.
 */
export function listingPageMeta(
  raw: ListingSearch,
  pageCount: number,
): { index: boolean; canonical: string } {
  const pageValue = firstParam(raw.page);
  const kind = listingPageParam(pageValue);
  const requested = requestedListingPage(raw);
  const pages = Math.max(0, pageCount);

  if (!isDefaultListing(raw)) {
    const page =
      kind === "valid" ? clampListingPage(requested, Math.max(pages, 1)) : 1;
    return { index: false, canonical: normalizedHref(raw, pages > 0 ? page : 1) };
  }

  if (kind === "invalid") {
    return { index: false, canonical: "/products" };
  }

  if (kind === "valid" && pageValue === "1") {
    return { index: false, canonical: "/products" };
  }

  if (requested > Math.max(pages, 1)) {
    return {
      index: false,
      canonical: normalizedHref(raw, Math.max(pages, 1)),
    };
  }

  return {
    index: true,
    canonical: normalizedHref(raw, requested),
  };
}

/** Page numbers to render as anchors. Every page when the list is short enough to crawl in one hop. */
export function listingPageNumbers(current: number, pageCount: number): number[] {
  if (pageCount <= 1) return [];
  if (pageCount <= 15) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const here = clampListingPage(current, pageCount);
  const pages = new Set<number>([1, pageCount]);
  for (let page = here - 2; page <= here + 2; page += 1) {
    if (page >= 1 && page <= pageCount) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}
