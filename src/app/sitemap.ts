import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { SITE_URL } from "@/lib/seo/site";
import { slugifyPathSegment } from "@/lib/seo/partsPath";

/** Rebuild hourly — avoids sticky failed prerenders and keeps crawl data fresh. */
export const revalidate = 3600;

/** Soft ceiling for serverless generation (Vercel). */
export const maxDuration = 60;

const PRODUCT_LIMIT = 5000;
const PARTS_HUB_LIMIT = 1500;
const SELLER_LIMIT = 2000;
/** Abort slow Mongo work so the route still returns static URLs. */
const DB_BUDGET_MS = 20_000;

const staticRoutes = [
  { path: "", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/requests", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/sellers", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/support", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/trust-score", priority: 0.6, changeFrequency: "monthly" as const },
  {
    path: "/seller-guidelines",
    priority: 0.5,
    changeFrequency: "yearly" as const,
  },
  { path: "/guidelines", priority: 0.5, changeFrequency: "yearly" as const },
  {
    path: "/prohibited-items",
    priority: 0.5,
    changeFrequency: "yearly" as const,
  },
  { path: "/disputes", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/refund", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/report-abuse", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
];

function asDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function sitemapUrl(path: string): string | null {
  try {
    const href = path.startsWith("http")
      ? path
      : `${SITE_URL}${path.startsWith("/") || path === "" ? path : `/${path}`}`;
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function entry(
  path: string,
  extra?: Partial<MetadataRoute.Sitemap[number]>,
): MetadataRoute.Sitemap[number] | null {
  const url = sitemapUrl(path);
  if (!url) return null;
  return { url, ...extra };
}

function compact(entries: Array<MetadataRoute.Sitemap[number] | null>): MetadataRoute.Sitemap {
  return entries.filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item?.url));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`sitemap ${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function loadProductEntries(): Promise<MetadataRoute.Sitemap> {
  const products = await Product.find({ status: "approved" })
    .select("_id slug updatedAt tags")
    .sort({ updatedAt: -1 })
    .limit(PRODUCT_LIMIT)
    .lean();

  return compact(
    products.map((product) => {
      const tags = Array.isArray(product.tags) ? product.tags : [];
      if (tags.includes("possible_duplicate")) return null;
      const ident = String(product.slug || product._id || "").trim();
      if (!ident) return null;
      return entry(`/product/${encodeURIComponent(ident)}`, {
        lastModified: asDate(product.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }),
  );
}

async function loadPartsEntries(): Promise<MetadataRoute.Sitemap> {
  const partHubs = await Product.aggregate<{
    _id: {
      partType?: string;
      brand?: string;
      deviceModel?: string;
    };
    updatedAt: Date;
    count: number;
  }>([
    {
      $match: {
        status: "approved",
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
    // Align with hub page robots: thin single-listing hubs stay out of the sitemap.
    { $match: { count: { $gte: 2 } } },
    { $sort: { updatedAt: -1 } },
    { $limit: PARTS_HUB_LIMIT },
  ]);

  return compact(
    partHubs.map((hub) => {
      const category = slugifyPathSegment(String(hub._id.partType || ""));
      const brand = slugifyPathSegment(String(hub._id.brand || ""));
      const model = slugifyPathSegment(String(hub._id.deviceModel || ""));
      if (!category || !brand || !model) return null;
      return entry(`/parts/${category}/${brand}/${model}`, {
        lastModified: asDate(hub.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }),
  );
}

async function loadSellerEntries(): Promise<MetadataRoute.Sitemap> {
  const activeSellerIds = await Product.distinct("technician", {
    status: "approved",
  });
  const sellers = await User.find({
    _id: { $in: activeSellerIds },
    isBlocked: { $ne: true },
    role: { $in: ["technician", "admin"] },
  })
    .select("_id updatedAt")
    .sort({ updatedAt: -1 })
    .limit(SELLER_LIMIT)
    .lean();

  return compact(
    sellers.map((seller) =>
      entry(`/u/${encodeURIComponent(String(seller._id))}`, {
        lastModified: asDate(seller.updatedAt),
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    ),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = compact(
    staticRoutes.map((route) =>
      entry(route.path, {
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      }),
    ),
  );

  try {
    const started = Date.now();
    await withTimeout(connectDB(), Math.min(8_000, DB_BUDGET_MS), "connect");

    // Products first so a slow hub aggregation cannot starve listing URLs.
    const products = await withTimeout(
      loadProductEntries(),
      12_000,
      "products",
    ).catch((error) => {
      console.error("sitemap products failed:", error);
      return [] as MetadataRoute.Sitemap;
    });

    const remaining = Math.max(4_000, DB_BUDGET_MS - (Date.now() - started));
    const [parts, sellers] = await Promise.all([
      withTimeout(loadPartsEntries(), remaining, "parts").catch((error) => {
        console.error("sitemap parts failed:", error);
        return [] as MetadataRoute.Sitemap;
      }),
      withTimeout(loadSellerEntries(), remaining, "sellers").catch((error) => {
        console.error("sitemap sellers failed:", error);
        return [] as MetadataRoute.Sitemap;
      }),
    ]);

    return [...staticEntries, ...products, ...parts, ...sellers];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticEntries;
  }
}
