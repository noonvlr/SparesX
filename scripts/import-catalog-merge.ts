/**
 * Merge catalog CSV/JSON into CategoryBrand (safe mode A).
 *
 * CSV columns:
 *   category,brand,modelName,modelNumber,releaseYear
 *
 * Usage:
 *   set MONGODB_URI=...
 *   npx tsx scripts/import-catalog-merge.ts --file=./data/catalog.csv
 *   npx tsx scripts/import-catalog-merge.ts --file=./data/catalog.json --dry-run
 *
 * Or:
 *   npm run import:catalog -- --file=path/to/file.csv
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { parseCatalogFile } from "../src/lib/catalog/mergeCatalog";
import { applyCatalogMerge } from "../src/lib/catalog/applyCatalogMerge";

dotenv.config();

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (hit) return hit.slice(prefix.length);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1];
  return undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const fileArg = getArg("file") || process.env.CATALOG_FILE;
  if (!fileArg) {
    throw new Error(
      "Provide --file=path/to/catalog.csv|json (or CATALOG_FILE env)",
    );
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const dryRun =
    hasFlag("dry-run") ||
    String(process.env.DRY_RUN || "").toLowerCase() === "true";

  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  const text = fs.readFileSync(filePath, "utf8");
  const rows = parseCatalogFile(text, filePath);
  if (rows.length === 0) {
    throw new Error("No valid catalog rows found in file");
  }

  console.log(`File: ${filePath}`);
  console.log(`Rows: ${rows.length}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "APPLY"}`);

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || "sparesx" });
  const summary = await applyCatalogMerge(rows, { dryRun });
  await mongoose.disconnect();

  console.log("\nSummary");
  console.log(`  Brands touched: ${summary.brandsTouched}`);
  console.log(`  Brands created: ${summary.brandsCreated}`);
  console.log(`  Models added: ${summary.modelsAdded}`);
  console.log(`  Models updated: ${summary.modelsUpdated}`);
  console.log(`  Models unchanged: ${summary.modelsUnchanged}`);
  if (summary.errors.length) {
    console.log(`  Errors: ${summary.errors.length}`);
    for (const err of summary.errors.slice(0, 20)) {
      console.log(`   - ${err}`);
    }
  }

  for (const brand of summary.byBrand.slice(0, 30)) {
    console.log(
      `  • [${brand.category}] ${brand.brand}: +${brand.modelsAdded} ~${brand.modelsUpdated}${
        brand.brandCreated ? " (new brand)" : ""
      }`,
    );
  }
  if (summary.byBrand.length > 30) {
    console.log(`  …and ${summary.byBrand.length - 30} more brands`);
  }
}

main().catch(async (error) => {
  console.error("Import failed:", error?.message || error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
