import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import DeviceType from "@/lib/models/DeviceType";
import { CategoryBrand } from "@/lib/models/CategoryBrand";
import Category from "@/lib/models/Category";

export type CatalogRefs = {
  deviceTypeId?: Types.ObjectId;
  brandId?: Types.ObjectId;
  partCategoryId?: Types.ObjectId;
};

/**
 * Resolve string catalog fields to ObjectId refs when they exist.
 * Non-blocking for unknown custom brands/models — returns whatever matched.
 */
export async function resolveCatalogRefs(params: {
  deviceCategory?: string | null;
  brand?: string | null;
  brandSlug?: string | null;
  partType?: string | null;
}): Promise<CatalogRefs> {
  await connectDB();
  const refs: CatalogRefs = {};

  const deviceSlug = (params.deviceCategory || "").toLowerCase().trim();
  if (deviceSlug) {
    const device = await DeviceType.findOne({
      slug: deviceSlug,
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();
    if (device?._id) refs.deviceTypeId = device._id as Types.ObjectId;
  }

  const brandSlug = (params.brandSlug || "").toLowerCase().trim();
  const brandName = (params.brand || "").trim();
  if (deviceSlug && (brandSlug || brandName)) {
    const brandQuery: Record<string, unknown> = {
      category: deviceSlug,
      isActive: { $ne: false },
    };
    if (brandSlug) brandQuery.slug = brandSlug;
    else {
      brandQuery.name = {
        $regex: `^${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }
    const brand = await CategoryBrand.findOne(brandQuery).select("_id").lean();
    if (brand?._id) refs.brandId = brand._id as Types.ObjectId;
  }

  const partType = (params.partType || "").trim();
  if (partType) {
    const part = await Category.findOne({
      $or: [
        { slug: partType.toLowerCase() },
        {
          name: {
            $regex: `^${partType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        },
      ],
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();
    if (part?._id) refs.partCategoryId = part._id as Types.ObjectId;
  }

  return refs;
}
