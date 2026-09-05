/**
 * Phase 3 crawl-path check (standalone). Mirrors slugify + eligibility
 * from src/lib/seo/partsHubsData.ts without importing Next modules.
 */
import "dotenv/config";
import mongoose from "mongoose";

function slugifyPathSegment(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function labelFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function preferLabel(current, candidate) {
  const next = String(candidate || "").trim();
  if (!next) return current;
  if (!current) return next;
  return next.length > current.length ? next : current;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI / MONGO_URI required");

  await mongoose.connect(uri);
  const rows = await mongoose.connection.db.collection("products").aggregate([
    {
      $match: {
        status: "approved",
        partType: { $exists: true, $nin: [null, ""] },
        brand: { $exists: true, $nin: [null, ""] },
        deviceModel: { $exists: true, $nin: [null, ""] },
      },
    },
    {
      $group: {
        _id: {
          partType: "$partType",
          brand: "$brand",
          deviceModel: "$deviceModel",
        },
        updatedAt: { $max: "$updatedAt" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gte: 2 } } },
    { $sort: { updatedAt: -1 } },
    { $limit: 10000 },
  ]).toArray();

  const byPath = new Map();
  for (const row of rows) {
    const partType = String(row._id.partType || "").trim();
    const brand = String(row._id.brand || "").trim();
    const deviceModel = String(row._id.deviceModel || "").trim();
    const categorySlug = slugifyPathSegment(partType);
    const brandSlug = slugifyPathSegment(brand);
    const modelSlug = slugifyPathSegment(deviceModel);
    if (!categorySlug || !brandSlug || !modelSlug) continue;
    const path = `/parts/${categorySlug}/${brandSlug}/${modelSlug}`;
    const existing = byPath.get(path);
    if (!existing) {
      byPath.set(path, {
        categorySlug,
        brandSlug,
        modelSlug,
        categoryLabel: partType || labelFromSlug(categorySlug),
        brandLabel: brand || labelFromSlug(brandSlug),
        modelLabel: deviceModel || labelFromSlug(modelSlug),
        count: row.count,
        path,
      });
    } else {
      existing.count += row.count;
      existing.categoryLabel = preferLabel(existing.categoryLabel, partType);
      existing.brandLabel = preferLabel(existing.brandLabel, brand);
      existing.modelLabel = preferLabel(existing.modelLabel, deviceModel);
    }
  }

  const hubs = [...byPath.values()];
  const categories = new Map();
  const brands = new Map();
  const models = new Map();

  for (const hub of hubs) {
    categories.set(hub.categorySlug, hub.categoryLabel);
    brands.set(`${hub.categorySlug}/${hub.brandSlug}`, hub.brandLabel);
    models.set(hub.path, hub.modelLabel);
  }

  const unreachable = [];
  for (const hub of hubs) {
    if (!categories.has(hub.categorySlug)) {
      unreachable.push({ path: hub.path, reason: "missing category" });
      continue;
    }
    if (!brands.has(`${hub.categorySlug}/${hub.brandSlug}`)) {
      unreachable.push({ path: hub.path, reason: "missing brand" });
      continue;
    }
    if (!models.has(hub.path)) {
      unreachable.push({ path: hub.path, reason: "missing model" });
    }
  }

  // Sample crawl chains
  const samples = hubs.slice(0, 5).map((hub) => ({
    chain: [
      "/parts",
      `/parts/${hub.categorySlug}`,
      `/parts/${hub.categorySlug}/${hub.brandSlug}`,
      hub.path,
    ],
    reachable: true,
  }));

  console.log(
    JSON.stringify(
      {
        hubCount: hubs.length,
        categoryCount: categories.size,
        brandCount: brands.size,
        sampleHubs: hubs.slice(0, 8).map((h) => h.path),
        sampleCrawlChains: samples,
        unreachableCount: unreachable.length,
        unreachable: unreachable.slice(0, 20),
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
  if (unreachable.length > 0) process.exitCode = 1;
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
