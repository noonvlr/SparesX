import Category from "@/lib/models/Category";
import { normalizeCategoryName } from "@/lib/categories/normalize";

export type PartTypeCategoryRow = {
  name?: string | null;
  slug?: string | null;
};

/**
 * Pure Category-driven alias expansion used by live `buildPartTypeMatch`
 * and saved-search matching. Does not invent free-text synonyms.
 */
export function collectPartTypeAliasValues(
  partType: string,
  categories: PartTypeCategoryRow[],
): string[] {
  const raw = partType.trim();
  if (!raw) return [];

  const selected =
    categories.find((c) => c.slug === raw) ||
    categories.find(
      (c) =>
        c.name &&
        normalizeCategoryName(c.name) === normalizeCategoryName(raw),
    );

  const nameKey = selected?.name
    ? normalizeCategoryName(selected.name)
    : normalizeCategoryName(raw);

  const values = new Set<string>([raw]);
  if (selected?.name) values.add(selected.name);

  for (const alias of categories) {
    if (alias.name && normalizeCategoryName(alias.name) === nameKey) {
      if (alias.slug) values.add(alias.slug);
      values.add(alias.name);
    }
  }

  // Legacy bare slug without device prefix (mobile-display → display)
  if (raw.includes("-")) {
    const bare = raw.split("-").slice(1).join("-");
    if (bare) values.add(bare);
  }

  return [...values];
}

/** Case-insensitive membership against an alias value set. */
export function partTypeValueInAliases(
  productPartType: string | null | undefined,
  aliasValues: Iterable<string>,
): boolean {
  const part = String(productPartType || "").trim().toLowerCase();
  if (!part) return false;
  for (const value of aliasValues) {
    if (String(value).trim().toLowerCase() === part) return true;
  }
  return false;
}

/**
 * Build a product query fragment for partType that matches the selected
 * category slug and any alias slugs/names that share the same display name.
 */
export async function buildPartTypeMatch(
  partType: string,
): Promise<Record<string, unknown>> {
  const raw = partType.trim();
  if (!raw) return {};

  const all = await Category.find({})
    .select("name slug isActive")
    .lean();

  const list = collectPartTypeAliasValues(raw, all);
  if (list.length === 0) return {};
  if (list.length === 1) {
    return { partType: list[0] };
  }
  return { partType: { $in: list } };
}

/** Load Category rows once and resolve alias sets per filter partType. */
export async function createPartTypeAliasResolver(): Promise<
  (partType: string) => string[]
> {
  const all = await Category.find({})
    .select("name slug")
    .lean();
  const cache = new Map<string, string[]>();
  return (partType: string) => {
    const key = partType.trim().toLowerCase();
    if (!key) return [];
    const hit = cache.get(key);
    if (hit) return hit;
    const values = collectPartTypeAliasValues(partType, all);
    cache.set(key, values);
    return values;
  };
}
