/**
 * Backfill Product (+ optional Request) catalog ObjectId refs from string fields.
 *
 * Safe migration plan:
 *   1. Run against staging/local first
 *   2. Always dry-run and review the report before writing
 *   3. Do NOT run --write against production without ops approval
 *
 * Usage:
 *   npm run backfill:catalog-refs -- --dry-run
 *   npm run backfill:catalog-refs -- --dry-run --requests
 *   npm run backfill:catalog-refs -- --write
 *   npm run backfill:catalog-refs -- --write --requests
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { Product } from "../src/lib/models/Product";
import { RequestModel } from "../src/lib/models/Request";
import { resolveCatalogRefs } from "../src/lib/catalog/resolveRefs";

dotenv.config();

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

type UnmatchedSample = {
  id: string;
  deviceCategory?: string;
  brand?: string;
  partType?: string;
  missing: string[];
};

async function backfillProducts(dryRun: boolean) {
  const totalApproved = await Product.countDocuments({ status: "approved" });
  const withAllRefs = await Product.countDocuments({
    status: "approved",
    deviceTypeId: { $ne: null },
    brandId: { $ne: null },
    partCategoryId: { $ne: null },
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
    .select(
      "_id deviceCategory brand partType deviceTypeId brandId partCategoryId",
    )
    .lean();

  console.log("\n=== Products ===");
  console.log(`Approved listings: ${totalApproved}`);
  console.log(`Approved with full catalog refs: ${withAllRefs}`);
  console.log(
    `Candidates missing ≥1 ref: ${products.length}${dryRun ? " (dry-run)" : ""}`,
  );

  let updated = 0;
  let skipped = 0;
  const unmatchedSamples: UnmatchedSample[] = [];

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
      if (unmatchedSamples.length < 25) {
        const missing: string[] = [];
        if (!product.deviceTypeId && !refs.deviceTypeId) missing.push("deviceTypeId");
        if (!product.brandId && !refs.brandId) missing.push("brandId");
        if (!product.partCategoryId && !refs.partCategoryId) {
          missing.push("partCategoryId");
        }
        unmatchedSamples.push({
          id: String(product._id),
          deviceCategory: product.deviceCategory || undefined,
          brand: product.brand || undefined,
          partType: product.partType || undefined,
          missing,
        });
      }
      continue;
    }

    if (!dryRun) {
      await Product.updateOne({ _id: product._id }, { $set: set });
    }
    updated += 1;
  }

  console.log(`Would update / updated: ${updated}`);
  console.log(`Skipped (no catalog match): ${skipped}`);
  if (unmatchedSamples.length) {
    console.log("Unmatched samples (up to 25):");
    for (const row of unmatchedSamples) {
      console.log(
        `  ${row.id} | ${row.deviceCategory || "-"} / ${row.brand || "-"} / ${row.partType || "-"} → missing ${row.missing.join(",")}`,
      );
    }
  }
}

async function backfillRequests(dryRun: boolean) {
  const totalOpen = await RequestModel.countDocuments({ status: "open" });
  const withRefs = await RequestModel.countDocuments({
    status: "open",
    $or: [
      { brandId: { $ne: null } },
      { partCategoryId: { $ne: null } },
      { deviceTypeId: { $ne: null } },
    ],
  });

  const requests = await RequestModel.find({
    $or: [
      { deviceTypeId: { $in: [null, undefined] } },
      { brandId: { $in: [null, undefined] } },
      { partCategoryId: { $in: [null, undefined] } },
      { deviceTypeId: { $exists: false } },
      { brandId: { $exists: false } },
      { partCategoryId: { $exists: false } },
    ],
  })
    .select(
      "_id deviceCategory brand category deviceTypeId brandId partCategoryId",
    )
    .lean();

  console.log("\n=== Requests ===");
  console.log(`Open requests: ${totalOpen}`);
  console.log(`Open with any catalog ref: ${withRefs}`);
  console.log(
    `Candidates missing ≥1 ref: ${requests.length}${dryRun ? " (dry-run)" : ""}`,
  );

  let updated = 0;
  let skipped = 0;

  for (const req of requests) {
    const refs = await resolveCatalogRefs({
      deviceCategory: req.deviceCategory,
      brand: req.brand,
      partType: req.category,
    });

    const set: Record<string, unknown> = {};
    if (!req.deviceTypeId && refs.deviceTypeId) set.deviceTypeId = refs.deviceTypeId;
    if (!req.brandId && refs.brandId) set.brandId = refs.brandId;
    if (!req.partCategoryId && refs.partCategoryId) {
      set.partCategoryId = refs.partCategoryId;
    }

    if (Object.keys(set).length === 0) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      await RequestModel.updateOne({ _id: req._id }, { $set: set });
    }
    updated += 1;
  }

  console.log(`Would update / updated: ${updated}`);
  console.log(`Skipped (no catalog match): ${skipped}`);
}

async function main() {
  const write = hasFlag("write");
  const dryRun =
    !write ||
    hasFlag("dry-run") ||
    String(process.env.DRY_RUN || "").toLowerCase() === "true";
  const includeRequests = hasFlag("requests");

  if (!write && !hasFlag("dry-run")) {
    console.log(
      "Defaulting to dry-run. Pass --write to mutate. Pass --requests to include part requests.",
    );
  }

  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;
  if (!uri) throw new Error("MONGODB_URI is required");

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "sparesx",
  });

  console.log(
    `Mode: ${dryRun ? "DRY-RUN (no writes)" : "WRITE"} | DB: ${process.env.MONGODB_DB_NAME || "sparesx"}`,
  );

  await backfillProducts(dryRun);
  if (includeRequests) {
    await backfillRequests(dryRun);
  }

  await mongoose.disconnect();
  console.log("\nDone. Review unmatched samples before production --write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
