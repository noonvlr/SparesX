import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * Public crawl rules. Prefix paths (no trailing slash) match the page and
 * nested URLs. Google ignores the non-standard Host directive, so it is omitted.
 * Nothing here blocks `/` or other public marketing/listing pages.
 */
const PRIVATE_PATHS = [
  "/admin",
  "/dashboard",
  "/technician",
  "/api",
  "/messages",
  "/notifications",
  "/support/cases",
  "/support/report",
  "/support/submitted",
  "/complete-profile",
  "/verify",
  "/whatsapp-connect",
  "/forgot-password",
  "/login",
  "/register",
];

export default function robots(): MetadataRoute.Robots {
  const publicRules = {
    allow: "/",
    disallow: PRIVATE_PATHS,
  };

  return {
    rules: [
      { userAgent: "Googlebot", ...publicRules },
      { userAgent: "*", ...publicRules },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
