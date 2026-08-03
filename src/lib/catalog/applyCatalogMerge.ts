import { connectDB } from "@/lib/db/connect";
import { CategoryBrand } from "@/lib/models/CategoryBrand";
import DeviceType from "@/lib/models/DeviceType";
import {
  CatalogRow,
  CatalogMergeSummary,
  groupCatalogRows,
  mergeModelsSafe,
} from "@/lib/catalog/mergeCatalog";

export async function applyCatalogMerge(
  rows: CatalogRow[],
  options: { dryRun?: boolean } = {},
): Promise<CatalogMergeSummary> {
  const dryRun = options.dryRun === true;
  await connectDB();

  const summary: CatalogMergeSummary = {
    rows: rows.length,
    brandsTouched: 0,
    brandsCreated: 0,
    modelsAdded: 0,
    modelsUpdated: 0,
    modelsUnchanged: 0,
    byBrand: [],
    errors: [],
  };

  const groups = groupCatalogRows(rows);
  const deviceSlugs = new Set(
    (await DeviceType.find({}).select("slug").lean()).map((d) =>
      String(d.slug).toLowerCase(),
    ),
  );

  for (const group of groups) {
    if (!deviceSlugs.has(group.category)) {
      summary.errors.push(
        `Unknown device category "${group.category}" for brand ${group.brand}`,
      );
      continue;
    }

    let brand = await CategoryBrand.findOne({
      category: group.category,
      slug: group.brandSlug,
    });

    const brandCreated = !brand;
    const existingModels = brand?.models ? [...brand.models] : [];
    const merged = mergeModelsSafe(existingModels as any, group.models);

    summary.brandsTouched += 1;
    if (brandCreated) summary.brandsCreated += 1;
    summary.modelsAdded += merged.added;
    summary.modelsUpdated += merged.updated;
    summary.modelsUnchanged += merged.unchanged;

    summary.byBrand.push({
      category: group.category,
      brand: group.brand,
      brandCreated,
      modelsAdded: merged.added,
      modelsUpdated: merged.updated,
      modelsUnchanged: merged.unchanged,
    });

    if (dryRun) continue;

    if (!brand) {
      brand = await CategoryBrand.create({
        category: group.category,
        name: group.brand,
        slug: group.brandSlug,
        models: merged.models,
        isActive: true,
      });
    } else {
      brand.name = group.brand;
      brand.models = merged.models as any;
      brand.isActive = true;
      brand.updatedAt = new Date();
      await brand.save();
    }
  }

  return summary;
}
