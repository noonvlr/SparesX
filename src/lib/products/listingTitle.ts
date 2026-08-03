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

/**
 * Image alt text. Unlike the display title this leads with the brand, since
 * "Samsung Galaxy S24 Ultra display" is what people search for.
 */
export function formatListingAlt(p: {
  name?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  partType?: string | null;
  condition?: string | null;
}): string {
  const brand = String(p.brand || "").trim();
  const model = String(p.deviceModel || "").trim();
  const part = formatPartTypeLabel(p.partType);
  const condition = String(p.condition || "").trim();

  // Avoid "Samsung Samsung Galaxy S24" when the model already carries the brand.
  const device =
    brand && model.toLowerCase().startsWith(brand.toLowerCase())
      ? model
      : [brand, model].filter(Boolean).join(" ");

  const subject = [device, part].filter(Boolean).join(" ");
  if (!subject) return formatListingTitle(p);

  return condition
    ? `${subject} spare part (${condition})`
    : `${subject} spare part`;
}
