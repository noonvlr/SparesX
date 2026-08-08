import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { SITE_URL } from "@/lib/seo/site";

const PRODUCT_LIMIT = 20000;
const PARTS_HUB_LIMIT = 2000;
const SELLER_LIMIT = 5000;

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

function slugifySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    await connectDB();
    const products = await Product.find({ status: "approved" })
      .select("_id slug updatedAt")
      .sort({ updatedAt: -1 })
      .limit(PRODUCT_LIMIT)
      .lean();

    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${SITE_URL}/product/${product.slug || product._id}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Inventory-backed /parts hubs only (skip empty combinations)
    const partHubs = await Product.aggregate<{
      _id: {
        partType?: string;
        brand?: string;
        deviceModel?: string;
      };
      updatedAt: Date;
    }>([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: {
            partType: "$partType",
            brand: "$brand",
            deviceModel: "$deviceModel",
          },
          updatedAt: { $max: "$updatedAt" },
        },
      },
      { $sort: { updatedAt: -1 } },
      { $limit: PARTS_HUB_LIMIT },
    ]);

    const partsEntries: MetadataRoute.Sitemap = [];
    for (const hub of partHubs) {
      const category = slugifySegment(String(hub._id.partType || ""));
      const brand = slugifySegment(String(hub._id.brand || ""));
      const model = slugifySegment(String(hub._id.deviceModel || ""));
      if (!category || !brand || !model) continue;
      partsEntries.push({
        url: `${SITE_URL}/parts/${category}/${brand}/${model}`,
        lastModified: hub.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

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

    const sellerEntries: MetadataRoute.Sitemap = sellers.map((seller) => ({
      url: `${SITE_URL}/u/${seller._id}`,
      lastModified: seller.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [
      ...staticEntries,
      ...productEntries,
      ...partsEntries,
      ...sellerEntries,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticEntries;
  }
}
