import Category from "@/lib/models/Category";
import { normalizeCategoryName } from "@/lib/categories/normalize";

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

  const selected =
    all.find((c) => c.slug === raw) ||
    all.find(
      (c) => normalizeCategoryName(c.name) === normalizeCategoryName(raw),
    );

  const nameKey = selected
    ? normalizeCategoryName(selected.name)
    : normalizeCategoryName(raw);

  const values = new Set<string>([raw]);
  if (selected?.name) values.add(selected.name);

  for (const alias of all) {
    if (normalizeCategoryName(alias.name) === nameKey) {
      values.add(alias.slug);
      if (alias.name) values.add(alias.name);
    }
  }

  // Legacy bare slug without device prefix (mobile-display → display)
  if (raw.includes("-")) {
    const bare = raw.split("-").slice(1).join("-");
    if (bare) values.add(bare);
  }

  const list = [...values];
  if (list.length === 1) {
    return { partType: list[0] };
  }
  return { partType: { $in: list } };
}
