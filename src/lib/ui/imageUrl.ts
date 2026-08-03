/**
 * Normalize an uploaded image URL for `next/image`.
 *
 * Uploads arrive from a few places over the years: absolute blob URLs,
 * protocol-relative URLs, bare relative paths, and inline data URLs from
 * client-side previews. Returns an empty string when there's nothing to render.
 */
export function resolveUploadUrl(url?: string | null): string {
  if (!url) return "";
  const value = String(url).trim();
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("https://")) return value;
  if (value.startsWith("http://")) return value.replace("http://", "https://");
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return value;
  return `/${value}`;
}

/** Data and blob URLs can't go through the image optimizer. */
export function isUnoptimizableUrl(url: string): boolean {
  return url.startsWith("data:") || url.startsWith("blob:");
}
