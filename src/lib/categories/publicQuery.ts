import { Types } from "mongoose";
import Category from "@/lib/models/Category";
import DeviceType from "@/lib/models/DeviceType";
import { normalizeCategoryName } from "@/lib/categories/normalize";
import { ensureCategoriesReconciled } from "@/lib/categories/ensureReconciled";

export type PublicCategory = {
  _id: string;
  name: string;
  icon: string;
  slug: string;
  description?: string;
  order: number;
  deviceId: string | null;
  deviceSlug: string | null;
};

type LeanCategory = {
  _id: Types.ObjectId;
  name: string;
  icon?: string;
  slug: string;
  description?: string;
  order?: number;
  deviceId?:
    | Types.ObjectId
    | { _id: Types.ObjectId; slug?: string; name?: string }
    | null;
};

function toPublic(cat: LeanCategory): PublicCategory {
  const populated =
    cat.deviceId &&
    typeof cat.deviceId === "object" &&
    !(cat.deviceId instanceof Types.ObjectId) &&
    "_id" in cat.deviceId
      ? (cat.deviceId as { _id: Types.ObjectId; slug?: string; name?: string })
      : null;
  const rawId = populated
    ? populated._id
    : cat.deviceId instanceof Types.ObjectId
      ? cat.deviceId
      : null;

  return {
    _id: String(cat._id),
    name: cat.name,
    icon: cat.icon || "📦",
    slug: cat.slug,
    description: cat.description,
    order: cat.order ?? 0,
    deviceId: rawId ? String(rawId) : null,
    deviceSlug: populated?.slug || null,
  };
}

/**
 * Prefer device-scoped categories over globals with the same name.
 * When a device filter is active, prefer that device's row.
 */
export function dedupeCategoriesByName(
  categories: PublicCategory[],
  preferredDeviceId?: string | null,
): PublicCategory[] {
  const best = new Map<string, PublicCategory>();

  for (const cat of categories) {
    const key = normalizeCategoryName(cat.name || cat.slug);
    if (!key) continue;
    const existing = best.get(key);
    if (!existing) {
      best.set(key, cat);
      continue;
    }

    const catMatchesDevice =
      preferredDeviceId && cat.deviceId === preferredDeviceId;
    const existingMatchesDevice =
      preferredDeviceId && existing.deviceId === preferredDeviceId;

    if (catMatchesDevice && !existingMatchesDevice) {
      best.set(key, cat);
      continue;
    }
    if (!catMatchesDevice && existingMatchesDevice) continue;

    // Prefer device-scoped over global
    if (cat.deviceId && !existing.deviceId) {
      best.set(key, cat);
      continue;
    }
    if (!cat.deviceId && existing.deviceId) continue;

    // Prefer lower order, then name
    if (cat.order < existing.order) {
      best.set(key, cat);
    }
  }

  return [...best.values()].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name),
  );
}

/**
 * Public part-category query.
 *
 * - No device filter → all active categories (global + device-scoped).
 * - With device / deviceId → that device's categories plus global fallbacks.
 * - dedupeByName (default true) collapses Display/Camera duplicates so UI
 *   shows one chip per name and links to the preferred slug.
 */
export async function findPublicCategories(options?: {
  device?: string | null;
  deviceId?: string | null;
  dedupeByName?: boolean;
}): Promise<PublicCategory[]> {
  const deviceParam = options?.device?.trim().toLowerCase() || null;
  const deviceIdParam = options?.deviceId?.trim() || null;
  const shouldDedupe = options?.dedupeByName !== false;

  // One-shot cleanup when legacy globals collide with device-scoped names
  await ensureCategoriesReconciled();

  let deviceObjectId: Types.ObjectId | null = null;

  if (deviceIdParam && Types.ObjectId.isValid(deviceIdParam)) {
    const dt = await DeviceType.findById(deviceIdParam).select("_id").lean();
    if (dt?._id) deviceObjectId = dt._id as Types.ObjectId;
  } else if (deviceParam) {
    const dt = await DeviceType.findOne({
      slug: deviceParam,
      isActive: true,
    })
      .select("_id")
      .lean();
    if (dt?._id) deviceObjectId = dt._id as Types.ObjectId;
  }

  const filter: Record<string, unknown> = { isActive: true };

  if (deviceObjectId) {
    filter.$or = [
      { deviceId: deviceObjectId },
      { deviceId: null },
      { deviceId: { $exists: false } },
    ];
  }

  const rows = (await Category.find(filter)
    .sort({ order: 1, name: 1 })
    .select("name icon slug description order deviceId")
    .populate("deviceId", "slug name")
    .lean()) as LeanCategory[];

  const mapped = rows.map(toPublic);
  if (!shouldDedupe) return mapped;

  return dedupeCategoriesByName(
    mapped,
    deviceObjectId ? String(deviceObjectId) : null,
  );
}
