import Category from "@/lib/models/Category";
import { normalizeCategoryName } from "@/lib/categories/normalize";
import { reconcilePartCategories } from "@/lib/categories/reconcile";

let inFlight: Promise<unknown> | null = null;
/** Skip duplicate-name scans for a short window after a clean check. */
let lastCleanAt = 0;
const CLEAN_TTL_MS = 5 * 60 * 1000;

/**
 * If active categories share the same display name (legacy global + device-scoped),
 * run reconcile once. Safe to call on every public read — no-ops when clean.
 * Caches a clean result briefly to avoid full Category scans on every list request.
 */
export async function ensureCategoriesReconciled() {
  if (inFlight) return inFlight;
  if (Date.now() - lastCleanAt < CLEAN_TTL_MS) return null;

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
    if (!hasDupes) {
      lastCleanAt = Date.now();
      return null;
    }

    const result = await reconcilePartCategories({
      deleteInactiveDuplicates: true,
    });
    lastCleanAt = Date.now();
    return result;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
