/**
 * Reconcile duplicate part categories and remap product.partType.
 *
 * Usage:
 *   node scripts/reconcile-categories.js
 *
 * Env: MONGODB_URI | MONGO_URI | DATABASE_URL, optional MONGODB_DB_NAME (default sparesx)
 */
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

function normalizeCategoryName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^(mobile|laptop|desktop|tablet)\s+/i, "");
}

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;
  const dbName = process.env.MONGODB_DB_NAME || "sparesx";

  if (!uri) {
    console.error("Missing MONGODB_URI / MONGO_URI / DATABASE_URL");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const categories = await db.collection("categories").find({}).toArray();
  const deviceTypes = await db
    .collection("devicetypes")
    .find({})
    .project({ slug: 1 })
    .toArray();

  const deviceSlugById = new Map(
    deviceTypes.map((d) => [String(d._id), d.slug]),
  );

  const groups = new Map();
  for (const cat of categories) {
    const key = normalizeCategoryName(cat.name || cat.slug || "");
    if (!key) continue;
    const list = groups.get(key) || [];
    list.push(cat);
    groups.set(key, list);
  }

  const report = {
    groupsProcessed: 0,
    productsRemapped: 0,
    categoriesDeleted: 0,
    remaps: [],
    deleted: [],
  };

  const slugRemap = new Map();
  const deleteIds = [];

  for (const [, group] of groups) {
    report.groupsProcessed += 1;
    const deviceScoped = group.filter((c) => c.deviceId);
    const globals = group.filter((c) => !c.deviceId);

    let keepers;
    if (deviceScoped.length > 0) {
      keepers = deviceScoped;
      for (const g of globals) {
        slugRemap.set(g.slug, deviceScoped[0].slug);
        deleteIds.push(g._id);
        report.deleted.push({ name: g.name, slug: g.slug });
      }
    } else {
      const sorted = [...globals].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      keepers = sorted.slice(0, 1);
      for (const dup of sorted.slice(1)) {
        slugRemap.set(dup.slug, keepers[0].slug);
        deleteIds.push(dup._id);
        report.deleted.push({ name: dup.name, slug: dup.slug });
      }
    }

    const byDevice = new Map();
    for (const k of keepers) {
      const did = k.deviceId ? String(k.deviceId) : "global";
      const list = byDevice.get(did) || [];
      list.push(k);
      byDevice.set(did, list);
    }

    const finalKeepers = [];
    for (const [, list] of byDevice) {
      const sorted = [...list].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      finalKeepers.push(sorted[0]);
      for (const dup of sorted.slice(1)) {
        slugRemap.set(dup.slug, sorted[0].slug);
        deleteIds.push(dup._id);
        report.deleted.push({ name: dup.name, slug: dup.slug });
      }
    }

    for (const cat of group) {
      if (finalKeepers.some((k) => String(k._id) === String(cat._id))) continue;
      const preferred =
        finalKeepers.find(
          (k) =>
            cat.deviceId &&
            k.deviceId &&
            String(k.deviceId) === String(cat.deviceId),
        ) || finalKeepers[0];
      if (preferred) slugRemap.set(cat.slug, preferred.slug);
    }
  }

  for (const [fromSlug, defaultTo] of slugRemap) {
    if (fromSlug === defaultTo) continue;
    const products = await db
      .collection("products")
      .find({ partType: fromSlug })
      .project({ partType: 1, deviceCategory: 1 })
      .toArray();

    let remapped = 0;
    for (const product of products) {
      let toSlug = defaultTo;
      const deviceSlug = String(product.deviceCategory || "").toLowerCase();
      if (deviceSlug) {
        const deviceId = [...deviceSlugById.entries()].find(
          ([, slug]) => slug === deviceSlug,
        )?.[0];
        if (deviceId) {
          const fromCat = categories.find((x) => x.slug === fromSlug);
          const match = categories.find(
            (c) =>
              c.deviceId &&
              String(c.deviceId) === deviceId &&
              normalizeCategoryName(c.name) ===
                normalizeCategoryName(fromCat?.name || fromSlug) &&
              !deleteIds.some((id) => String(id) === String(c._id)),
          );
          if (match) toSlug = match.slug;
        }
      }
      if (product.partType === toSlug) continue;
      await db
        .collection("products")
        .updateOne({ _id: product._id }, { $set: { partType: toSlug } });
      remapped += 1;
    }
    if (remapped > 0) {
      report.productsRemapped += remapped;
      report.remaps.push({ from: fromSlug, to: defaultTo, count: remapped });
    }
  }

  // Remap legacy partType stored as display name
  for (const cat of categories) {
    const name = (cat.name || "").trim();
    if (!name || name === cat.slug) continue;
    if (deleteIds.some((id) => String(id) === String(cat._id))) continue;
    const result = await db
      .collection("products")
      .updateMany({ partType: name }, { $set: { partType: cat.slug } });
    if (result.modifiedCount > 0) {
      report.productsRemapped += result.modifiedCount;
      report.remaps.push({
        from: name,
        to: cat.slug,
        count: result.modifiedCount,
      });
    }
  }

  if (deleteIds.length > 0) {
    const unique = [...new Set(deleteIds.map(String))].map(
      (id) => new ObjectId(id),
    );
    const del = await db.collection("categories").deleteMany({
      _id: { $in: unique },
    });
    report.categoriesDeleted = del.deletedCount || 0;
  }

  console.log(JSON.stringify(report, null, 2));
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
