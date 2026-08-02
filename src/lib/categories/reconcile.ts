import { Types } from "mongoose";
import Category from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import DeviceType from "@/lib/models/DeviceType";
import { normalizeCategoryName } from "@/lib/categories/normalize";
import { revalidateCategoryCaches } from "@/lib/categories/revalidate";

type CatDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  deviceId?: Types.ObjectId | null;
  isActive?: boolean;
  order?: number;
  createdAt?: Date;
};

export type ReconcileReport = {
  groupsProcessed: number;
  productsRemapped: number;
  categoriesDeactivated: number;
  categoriesDeleted: number;
  remaps: Array<{ from: string; to: string; count: number }>;
  deactivated: Array<{ name: string; slug: string; id: string }>;
};

/**
 * Clean duplicate part categories and remap product.partType to a canonical slug.
 *
 * Rules per normalized name group:
 * 1. Prefer device-scoped categories (from device-management) over globals.
 * 2. Remap products from duplicate/legacy slugs → best matching canonical slug
 *    (same deviceCategory when possible).
 * 3. Deactivate (then optionally delete) non-canonical duplicates.
 */
export async function reconcilePartCategories(options?: {
  deleteInactiveDuplicates?: boolean;
}): Promise<ReconcileReport> {
  const deleteInactive = options?.deleteInactiveDuplicates ?? true;

  const [categories, deviceTypes] = await Promise.all([
    Category.find({}).lean() as Promise<CatDoc[]>,
    DeviceType.find({}).select("_id slug").lean(),
  ]);

  const deviceSlugById = new Map<string, string>();
  for (const dt of deviceTypes) {
    deviceSlugById.set(String(dt._id), dt.slug);
  }

  const groups = new Map<string, CatDoc[]>();
  for (const cat of categories) {
    const key = normalizeCategoryName(cat.name || cat.slug || "");
    if (!key) continue;
    const list = groups.get(key) || [];
    list.push(cat);
    groups.set(key, list);
  }

  const report: ReconcileReport = {
    groupsProcessed: 0,
    productsRemapped: 0,
    categoriesDeactivated: 0,
    categoriesDeleted: 0,
    remaps: [],
    deactivated: [],
  };

  const slugRemap = new Map<string, string>(); // oldSlug -> canonicalSlug
  const deactivateIds: Types.ObjectId[] = [];

  for (const [, group] of groups) {
    if (group.length === 0) continue;
    report.groupsProcessed += 1;

    const deviceScoped = group.filter((c) => !!c.deviceId);
    const globals = group.filter((c) => !c.deviceId);

    // Canonical set: all device-scoped if any exist; otherwise keep one global
    let keepers: CatDoc[];
    if (deviceScoped.length > 0) {
      keepers = deviceScoped;
      for (const g of globals) {
        // Map global slug → first device-scoped (products refined by device below)
        slugRemap.set(g.slug, deviceScoped[0].slug);
        if (g.isActive !== false) {
          deactivateIds.push(g._id);
          report.deactivated.push({
            name: g.name,
            slug: g.slug,
            id: String(g._id),
          });
        }
      }
    } else {
      // Keep the oldest / lowest order global; deactivate the rest
      const sorted = [...globals].sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
      keepers = sorted.slice(0, 1);
      for (const dup of sorted.slice(1)) {
        slugRemap.set(dup.slug, keepers[0].slug);
        if (dup.isActive !== false) {
          deactivateIds.push(dup._id);
          report.deactivated.push({
            name: dup.name,
            slug: dup.slug,
            id: String(dup._id),
          });
        }
      }
    }

    // Within device-scoped duplicates for same device+name, keep one
    const byDevice = new Map<string, CatDoc[]>();
    for (const k of keepers) {
      const did = k.deviceId ? String(k.deviceId) : "global";
      const list = byDevice.get(did) || [];
      list.push(k);
      byDevice.set(did, list);
    }
    const finalKeepers: CatDoc[] = [];
    for (const [, list] of byDevice) {
      const sorted = [...list].sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a._id).localeCompare(String(b._id));
      });
      finalKeepers.push(sorted[0]);
      for (const dup of sorted.slice(1)) {
        slugRemap.set(dup.slug, sorted[0].slug);
        deactivateIds.push(dup._id);
        report.deactivated.push({
          name: dup.name,
          slug: dup.slug,
          id: String(dup._id),
        });
      }
    }

    // Build device-aware remaps for products
    for (const cat of group) {
      if (finalKeepers.some((k) => String(k._id) === String(cat._id))) continue;
      const preferred =
        finalKeepers.find((k) => {
          if (!cat.deviceId || !k.deviceId) return false;
          return String(k.deviceId) === String(cat.deviceId);
        }) || finalKeepers[0];
      if (preferred) slugRemap.set(cat.slug, preferred.slug);
    }
  }

  // Remap products: match by old slug, prefer canonical for product's device
  for (const [fromSlug, defaultTo] of slugRemap) {
    if (fromSlug === defaultTo) continue;

    const products = await Product.find({ partType: fromSlug })
      .select("_id partType deviceCategory")
      .lean();

    if (products.length === 0) continue;

    let remapped = 0;
    for (const product of products) {
      let toSlug = defaultTo;

      // Prefer canonical category for this product's device
      const deviceSlug = (product.deviceCategory || "").toLowerCase();
      if (deviceSlug) {
        const deviceId = [...deviceSlugById.entries()].find(
          ([, slug]) => slug === deviceSlug,
        )?.[0];
        if (deviceId) {
          const match = categories.find(
            (c) =>
              c.deviceId &&
              String(c.deviceId) === deviceId &&
              normalizeCategoryName(c.name) ===
                normalizeCategoryName(
                  categories.find((x) => x.slug === fromSlug)?.name ||
                    fromSlug,
                ) &&
              !deactivateIds.some((id) => String(id) === String(c._id)),
          );
          if (match) toSlug = match.slug;
        }
      }

      if (product.partType === toSlug) continue;
      await Product.updateOne(
        { _id: product._id },
        { $set: { partType: toSlug } },
      );
      remapped += 1;
    }

    if (remapped > 0) {
      report.productsRemapped += remapped;
      report.remaps.push({ from: fromSlug, to: defaultTo, count: remapped });
    }
  }

  // Also remap products whose partType equals a category *name* (legacy)
  for (const cat of categories) {
    const name = cat.name?.trim();
    if (!name || name === cat.slug) continue;
    const canonical =
      categories.find(
        (c) =>
          normalizeCategoryName(c.name) === normalizeCategoryName(name) &&
          !!c.deviceId &&
          !deactivateIds.some((id) => String(id) === String(c._id)),
      ) ||
      categories.find(
        (c) =>
          normalizeCategoryName(c.name) === normalizeCategoryName(name) &&
          !deactivateIds.some((id) => String(id) === String(c._id)),
      );
    if (!canonical || canonical.slug === name) continue;

    const result = await Product.updateMany(
      { partType: name },
      { $set: { partType: canonical.slug } },
    );
    const n = result.modifiedCount || 0;
    if (n > 0) {
      report.productsRemapped += n;
      report.remaps.push({ from: name, to: canonical.slug, count: n });
    }
  }

  if (deactivateIds.length > 0) {
    const uniqueIds = [...new Set(deactivateIds.map(String))].map(
      (id) => new Types.ObjectId(id),
    );
    const deact = await Category.updateMany(
      { _id: { $in: uniqueIds } },
      { $set: { isActive: false } },
    );
    report.categoriesDeactivated = deact.modifiedCount || 0;

    if (deleteInactive) {
      const del = await Category.deleteMany({
        _id: { $in: uniqueIds },
        isActive: false,
      });
      report.categoriesDeleted = del.deletedCount || 0;
    }
  }

  revalidateCategoryCaches();
  return report;
}
