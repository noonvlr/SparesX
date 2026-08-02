import { Types } from "mongoose";
import Category from "@/lib/models/Category";
import DeviceType from "@/lib/models/DeviceType";

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

/**
 * Public part-category query.
 *
 * - No device filter → all active categories (global + device-scoped).
 * - With device / deviceId → that device's categories plus global fallbacks.
 *
 * Global = deviceId null/absent (from /admin/categories).
 * Device-scoped = deviceId set (from device-management).
 */
export async function findPublicCategories(options?: {
  device?: string | null;
  deviceId?: string | null;
}): Promise<PublicCategory[]> {
  const deviceParam = options?.device?.trim().toLowerCase() || null;
  const deviceIdParam = options?.deviceId?.trim() || null;

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

  return rows.map((cat) => {
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
  });
}
