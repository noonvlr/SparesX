import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/technician",
          "/technician/*",
          "/api",
          "/api/*",
          // Authenticated-only surfaces: no indexable content, wastes crawl budget
          "/messages",
          "/messages/*",
          "/complete-profile",
          "/verify",
          "/whatsapp-connect",
          "/forgot-password",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
