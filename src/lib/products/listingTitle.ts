/** Humanize part-type slugs for display (e.g. charging_port → Charging Port). */
export function formatPartTypeLabel(partType?: string | null): string {
  if (!partType) return "";
  return String(partType)
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Card / SEO title: prefer "Device Model — Part Type"
 * so listings aren't phone-model-only.
 */
export function formatListingTitle(p: {
  name?: string | null;
  deviceModel?: string | null;
  partType?: string | null;
}): string {
  const part = formatPartTypeLabel(p.partType);
  const model = String(p.deviceModel || "").trim();
  const name = String(p.name || "").trim();

  if (model && part) return `${model} — ${part}`;
  if (name && part) {
    const lower = name.toLowerCase();
    if (!lower.includes(part.toLowerCase()) && !lower.includes("—")) {
      return `${name} — ${part}`;
    }
  }
  return name || model || "Listing";
}
