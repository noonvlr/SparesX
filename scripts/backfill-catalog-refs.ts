/**
 * Backfill Product.deviceTypeId / brandId / partCategoryId from string fields.
 *
 * Usage:
 *   npm run backfill:catalog-refs -- --dry-run
 *   npm run backfill:catalog-refs
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { Product } from "../src/lib/models/Product";
import { resolveCatalogRefs } from "../src/lib/catalog/resolveRefs";

dotenv.config();

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const dryRun =
    hasFlag("dry-run") ||
    String(process.env.DRY_RUN || "").toLowerCase() === "true";

  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;
  if (!uri) throw new Error("MONGODB_URI is required");

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "sparesx",
  });

  const products = await Product.find({
    $or: [
      { deviceTypeId: { $in: [null, undefined] } },
      { brandId: { $in: [null, undefined] } },
      { partCategoryId: { $in: [null, undefined] } },
      { deviceTypeId: { $exists: false } },
      { brandId: { $exists: false } },
      { partCategoryId: { $exists: false } },
    ],
  })
    .select("_id deviceCategory brand partType deviceTypeId brandId partCategoryId")
    .lean();

  console.log(`Candidates: ${products.length}${dryRun ? " (dry-run)" : ""}`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const refs = await resolveCatalogRefs({
      deviceCategory: product.deviceCategory,
      brand: product.brand,
      partType: product.partType,
    });

    const set: Record<string, unknown> = {};
    if (!product.deviceTypeId && refs.deviceTypeId) {
      set.deviceTypeId = refs.deviceTypeId;
    }
    if (!product.brandId && refs.brandId) {
      set.brandId = refs.brandId;
    }
    if (!product.partCategoryId && refs.partCategoryId) {
      set.partCategoryId = refs.partCategoryId;
    }

    if (Object.keys(set).length === 0) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      await Product.updateOne({ _id: product._id }, { $set: set });
    }
    updated += 1;
  }

  console.log(`Updated: ${updated}, skipped (no match): ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
