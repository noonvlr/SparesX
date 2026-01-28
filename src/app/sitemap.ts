import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";

const baseUrl = "https://spares-x-h1cj.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDB();
    const products = await Product.find({ status: "approved" })
      .select("_id updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();

    const staticRoutes = [
      { path: "", priority: 1.0, changeFrequency: "daily" as const },
      { path: "/browse", priority: 0.9, changeFrequency: "daily" as const },
      { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
      { path: "/requests", priority: 0.8, changeFrequency: "weekly" as const },
      { path: "/sellers", priority: 0.8, changeFrequency: "weekly" as const },
      {
        path: "/how-it-works",
        priority: 0.7,
        changeFrequency: "monthly" as const,
      },
      { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
      { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
      { path: "/login", priority: 0.5, changeFrequency: "yearly" as const },
      {
        path: "/register",
        priority: 0.5,
        changeFrequency: "yearly" as const,
      },
    ];

    const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product._id}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticEntries, ...productEntries];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return basic sitemap if database connection fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1.0,
      },
    ];
  }
}
