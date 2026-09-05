/**
 * Single source of truth for the public base URL. Canonicals, Open Graph URLs,
 * robots.txt, and the sitemap all read it.
 *
 * Deliberately does not fall back to NEXT_PUBLIC_BASE_URL: that variable is the
 * base for internal self-fetches and legitimately points at a deployment URL,
 * which would silently poison every canonical tag. Override per environment
 * with NEXT_PUBLIC_SITE_URL only.
 */
const FALLBACK_SITE_URL = "https://www.sparesx.com";

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export const SITE_URL = normalize(
  process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL,
);

export const SITE_NAME = "SparesX";
export const SITE_OPERATOR = "Noon Computers";
export const SITE_CONTACT_EMAIL = "noon.vlr@gmail.com";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Site-relative product detail path. Prefers the readable slug when available. */
export function productPath(product: {
  _id?: unknown;
  slug?: string | null;
}): string {
  const identifier = product.slug || String(product._id ?? "");
  return `/product/${identifier}`;
}

/** Canonical product detail URL. Prefers the readable slug when available. */
export function productUrl(product: {
  _id?: unknown;
  slug?: string | null;
}): string {
  return absoluteUrl(productPath(product));
}

export {
  partsPath,
  partsCategoryPath,
  partsBrandPath,
  slugifyPathSegment,
} from "@/lib/seo/partsPath";
