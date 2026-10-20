import { sanitizeStoredImageUrl } from "@/lib/security/allowedImageUrl";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Product JSON-LD `image` values: only this listing's own public photos.
 * The site Open Graph fallback is not a product photo and must not be used.
 */
const FALLBACK_IMAGE_PATH = "/og-image.jpg";

function toPublicHttpsImage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let value = raw.trim();
  if (!value) return null;
  if (value.startsWith("//")) value = `https:${value}`;
  else if (/^http:\/\//i.test(value)) value = `https://${value.slice("http://".length)}`;

  const safe = sanitizeStoredImageUrl(value, { allowGoogleAvatar: false });
  if (!safe) return null;
  const absolute = absoluteUrl(safe);
  if (!absolute.startsWith("https://")) return null;
  if (
    absolute === absoluteUrl(FALLBACK_IMAGE_PATH) ||
    safe === FALLBACK_IMAGE_PATH
  ) {
    return null;
  }
  return absolute;
}

/**
 * Absolute HTTPS URLs for Schema.org Product.image.
 * Empty when the listing has no valid uploaded image — callers must omit
 * the property rather than invent a URL.
 */
export function productJsonLdImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of images) {
    const url = toPublicHttpsImage(item);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}
