import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
  "http://localhost:3000");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();
  const products = await Product.find({ status: "approved" })
    .select("_id updatedAt")
    .sort({ updatedAt: -1 })
    .limit(5000);

  const staticRoutes = [
    "",
    "/browse",
    "/products",
    "/requests",
    "/sellers",
    "/how-it-works",
    "/about",
    "/faq",
    "/login",
    "/register",
  ];

  const staticEntries = staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  const productEntries = products.map((product) => ({
    url: `${baseUrl}/product/${product._id}`,
    lastModified: product.updatedAt || new Date(),
  }));

  return [...staticEntries, ...productEntries];
}
