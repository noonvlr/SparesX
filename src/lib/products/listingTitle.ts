/** Humanize part-type slugs for display (e.g. charging_port → Charging Port). */
export function formatPartTypeLabel(partType?: string | null): string {
  if (!partType) return "";
  return String(partType)
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "Samsung" + "S24 Ultra" → "Samsung S24 Ultra", without doubling the brand. */
export function formatDeviceLabel(p: {
  brand?: string | null;
  deviceModel?: string | null;
}): string {
  const brand = String(p.brand || "").trim();
  const model = String(p.deviceModel || "").trim();
  if (!brand) return model;
  if (!model) return brand;
  if (model.toLowerCase().startsWith(brand.toLowerCase())) return model;
  return `${brand} ${model}`;
}

/**
 * Card / anchor-text title: "Samsung S24 Ultra — Mobile Camera".
 * Brand is included so internal links carry useful keywords for crawlers.
 */
export function formatListingTitle(p: {
  name?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  partType?: string | null;
}): string {
  const part = formatPartTypeLabel(p.partType);
  const device = formatDeviceLabel(p);
  const name = String(p.name || "").trim();

  if (device && part) return `${device} — ${part}`;
  if (device) return device;
  if (name && part) {
    const lower = name.toLowerCase();
    if (!lower.includes(part.toLowerCase()) && !lower.includes("—")) {
      return `${name} — ${part}`;
    }
  }
  return name || "Listing";
}

/**
 * Image alt text. Leads with brand + model + part, since that is what
 * people search for.
 */
export function formatListingAlt(p: {
  name?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  partType?: string | null;
  condition?: string | null;
}): string {
  const device = formatDeviceLabel(p);
  const part = formatPartTypeLabel(p.partType);
  const condition = String(p.condition || "").trim();
  const subject = [device, part].filter(Boolean).join(" ");
  if (!subject) return formatListingTitle(p);

  return condition
    ? `${subject} spare part (${condition})`
    : `${subject} spare part`;
}
