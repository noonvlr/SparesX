/**
 * Wire Desktop "brand api" scrape output → SparesX catalog (safe merge).
 *
 * Does not re-scrape GSMArena. Run your brand-api scrape first, then:
 *
 *   set MONGODB_URI=...
 *   set BRAND_API_DIR=C:\Users\idree\OneDrive\Desktop\brand api
 *   set CATEGORY=mobile
 *   npx tsx scripts/import-from-brand-api.ts --dry-run
 *   npx tsx scripts/import-from-brand-api.ts
 *
 * Looks for (in order):
 *   1) $BRAND_API_DIR/output/final/*.txt
 *   2) $BRAND_API_DIR/output/brands/*.txt
 *   3) $BRAND_API_DIR/output/brands-with-models.json
 *
 * TXT format: line 1 = brand name, following lines = model names.
 * modelNumber is not in GSMArena list scrapes — enrich later via CSV.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  CatalogRow,
  titleCaseBrand,
} from "../src/lib/catalog/mergeCatalog";
import { applyCatalogMerge } from "../src/lib/catalog/applyCatalogMerge";

dotenv.config();

const DEFAULT_BRAND_API_DIR = path.join(
  "C:",
  "Users",
  "idree",
  "OneDrive",
  "Desktop",
  "brand api",
);

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (hit) return hit.slice(prefix.length);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1];
  return undefined;
}

function cleanModelName(raw: string, brandName: string): string | null {
  let name = String(raw || "").trim();
  if (!name) return null;
  name = name.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  const brandPattern = new RegExp(
    `^${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`,
    "i",
  );
  name = name.replace(brandPattern, "").trim();
  name = name.replace(/\s+/g, " ").trim();
  return name || null;
}

function parseBrandTxt(filePath: string, category: string): CatalogRow[] {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const brand = titleCaseBrand(lines[0]);
  const rows: CatalogRow[] = [];
  const seen = new Set<string>();

  for (const line of lines.slice(1)) {
    const modelName = cleanModelName(line, brand);
    if (!modelName) continue;
    const key = modelName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ category, brand, modelName });
  }
  return rows;
}

function parseBrandsWithModelsJson(
  filePath: string,
  category: string,
): CatalogRow[] {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error("brands-with-models.json must be an array");
  }

  const rows: CatalogRow[] = [];
  for (const brandEntry of raw) {
    const brand = titleCaseBrand(
      String(brandEntry?.name || brandEntry?.id || "").trim(),
    );
    if (!brand) continue;
    const models = Array.isArray(brandEntry.models) ? brandEntry.models : [];
    for (const model of models) {
      const modelName = cleanModelName(
        String(model?.name || model?.id || ""),
        brand,
      );
      if (!modelName) continue;
      rows.push({ category, brand, modelName });
    }
  }
  return rows;
}

function resolveSource(brandApiDir: string): {
  kind: "txt-dir" | "json";
  path: string;
} {
  const finalDir = path.join(brandApiDir, "output", "final");
  const brandsDir = path.join(brandApiDir, "output", "brands");
  const jsonPath = path.join(brandApiDir, "output", "brands-with-models.json");

  if (fs.existsSync(finalDir)) {
    const txts = fs
      .readdirSync(finalDir)
      .filter((f) => f.toLowerCase().endsWith(".txt"));
    if (txts.length > 0) return { kind: "txt-dir", path: finalDir };
  }

  if (fs.existsSync(brandsDir)) {
    const txts = fs
      .readdirSync(brandsDir)
      .filter((f) => f.toLowerCase().endsWith(".txt"));
    if (txts.length > 0) return { kind: "txt-dir", path: brandsDir };
  }

  if (fs.existsSync(jsonPath)) {
    return { kind: "json", path: jsonPath };
  }

  throw new Error(
    `No brand-api output found under ${brandApiDir}\\output. ` +
      `Run the GSMArena scrape first, then retry. Expected one of: ` +
      `output\\final\\*.txt, output\\brands\\*.txt, output\\brands-with-models.json`,
  );
}

async function main() {
  const brandApiDir = path.resolve(
    getArg("brand-api-dir") ||
      process.env.BRAND_API_DIR ||
      DEFAULT_BRAND_API_DIR,
  );
  const category = (
    getArg("category") ||
    process.env.CATEGORY ||
    "mobile"
  ).toLowerCase();
  const dryRun =
    hasFlag("dry-run") ||
    String(process.env.DRY_RUN || "").toLowerCase() === "true";

  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;
  if (!uri) throw new Error("MONGODB_URI is required");

  if (!fs.existsSync(brandApiDir)) {
    throw new Error(`Brand API directory not found: ${brandApiDir}`);
  }

  const source = resolveSource(brandApiDir);
  let rows: CatalogRow[] = [];

  if (source.kind === "txt-dir") {
    const files = fs
      .readdirSync(source.path)
      .filter((f) => f.toLowerCase().endsWith(".txt"))
      .sort((a, b) => a.localeCompare(b));
    for (const file of files) {
      rows.push(...parseBrandTxt(path.join(source.path, file), category));
    }
  } else {
    rows = parseBrandsWithModelsJson(source.path, category);
  }

  if (rows.length === 0) {
    throw new Error("No models parsed from brand-api output");
  }

  console.log(`Brand API dir: ${brandApiDir}`);
  console.log(`Source: ${source.path} (${source.kind})`);
  console.log(`Category: ${category}`);
  console.log(`Rows: ${rows.length}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "APPLY"}`);

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "sparesx",
  });
  const summary = await applyCatalogMerge(rows, { dryRun });
  await mongoose.disconnect();

  console.log("\nSummary");
  console.log(`  Brands touched: ${summary.brandsTouched}`);
  console.log(`  Brands created: ${summary.brandsCreated}`);
  console.log(`  Models added: ${summary.modelsAdded}`);
  console.log(`  Models updated: ${summary.modelsUpdated}`);
  console.log(`  Models unchanged: ${summary.modelsUnchanged}`);
  if (summary.errors.length) {
    console.log("  Errors:");
    for (const err of summary.errors) console.log(`   - ${err}`);
  }
}

main().catch(async (error) => {
  console.error("Brand-api import failed:", error?.message || error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
