import Category from "@/lib/models/Category";
import { normalizeCategoryName } from "@/lib/categories/normalize";
import { reconcilePartCategories } from "@/lib/categories/reconcile";

let inFlight: Promise<unknown> | null = null;
/** Skip duplicate-name scans for a short window after a clean check. */
let lastCleanAt = 0;
const CLEAN_TTL_MS = 5 * 60 * 1000;

/**
 * Mirrors what reconcilePartCategories actually resolves: a global category
 * sharing a name with any other category, or two categories with the same
 * name under the same device. The same name under different devices
 * (e.g. Mobile "Battery" and Laptop "Battery") is intentional, not a duplicate.
 */
function hasReconcilableDuplicates(
  active: Array<{ name?: string | null; deviceId?: unknown }>,
): boolean {
  const groups = new Map<string, { globals: number; byDevice: Map<string, number> }>();
  for (const cat of active) {
    const key = normalizeCategoryName(cat.name || "");
    if (!key) continue;
    const group = groups.get(key) || { globals: 0, byDevice: new Map() };
    if (cat.deviceId) {
      const did = String(cat.deviceId);
      group.byDevice.set(did, (group.byDevice.get(did) || 0) + 1);
    } else {
      group.globals += 1;
    }
    groups.set(key, group);
  }

  for (const { globals, byDevice } of groups.values()) {
    if (globals > 1) return true;
    if (globals > 0 && byDevice.size > 0) return true;
    for (const n of byDevice.values()) {
      if (n > 1) return true;
    }
  }
  return false;
}

/**
 * If active categories contain reconcilable duplicates, run reconcile once.
 * Safe to call on every public read (including page renders) — no-ops when
 * clean and never triggers cache revalidation.
 * Caches a clean result briefly to avoid full Category scans on every list request.
 */
export async function ensureCategoriesReconciled() {
  if (inFlight) return inFlight;
  if (Date.now() - lastCleanAt < CLEAN_TTL_MS) return null;

  inFlight = (async () => {
    const active = await Category.find({ isActive: { $ne: false } })
      .select("name deviceId")
      .lean();

    if (!hasReconcilableDuplicates(active)) {
      lastCleanAt = Date.now();
      return null;
    }

    const result = await reconcilePartCategories({
      deleteInactiveDuplicates: true,
      revalidate: false,
    });
    lastCleanAt = Date.now();
    return result;
  })()
    .catch((err) => {
      // Never break a public read because background cleanup failed.
      console.warn("[ensureCategoriesReconciled]", err);
      return null;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
