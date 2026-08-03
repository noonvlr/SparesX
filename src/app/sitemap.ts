import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { SITE_URL } from "@/lib/seo/site";

const PRODUCT_LIMIT = 20000;

const staticRoutes = [
  { path: "", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/requests", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/sellers", priority: 0.8, changeFrequency: "weekly" as const },
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

    return [...staticEntries, ...productEntries];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticEntries;
  }
}
