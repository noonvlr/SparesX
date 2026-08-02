import Category from "@/lib/models/Category";
import { normalizeCategoryName } from "@/lib/categories/normalize";
import { reconcilePartCategories } from "@/lib/categories/reconcile";

let inFlight: Promise<unknown> | null = null;

/**
 * If active categories share the same display name (legacy global + device-scoped),
 * run reconcile once. Safe to call on every public read — no-ops when clean.
 */
export async function ensureCategoriesReconciled() {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const active = await Category.find({ isActive: { $ne: false } })
      .select("name")
      .lean();

    const counts = new Map<string, number>();
    for (const cat of active) {
      const key = normalizeCategoryName(cat.name || "");
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const hasDupes = [...counts.values()].some((n) => n > 1);
    if (!hasDupes) return null;

    return reconcilePartCategories({ deleteInactiveDuplicates: true });
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
