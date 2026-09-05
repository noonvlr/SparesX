/**
 * Pure list sort / pagination helpers (no DB imports).
 */

type SortKey = "featured" | "newest" | "price_asc" | "price_desc";

/** Primary sort keys plus `_id` for stable pagination ties. */
export function resolveSort(sortParam?: string | null): Record<string, 1 | -1> {
  const sort = (sortParam || "featured") as SortKey;
  switch (sort) {
    case "newest":
      return { createdAt: -1, _id: 1 };
    case "price_asc":
      return { price: 1, _id: 1 };
    case "price_desc":
      return { price: -1, _id: 1 };
    case "featured":
    default:
      return { featured: -1, createdAt: -1, _id: 1 };
  }
}

/** Empty result sets always report at least one page (public browse/API contract). */
export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, limit)));
}
