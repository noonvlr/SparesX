/** Normalize part-category names for duplicate detection / alias matching. */
export function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^(mobile|laptop|desktop|tablet)\s+/i, "");
}
