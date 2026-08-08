import {
  formatDeviceLabel,
  formatListingTitle,
  formatPartTypeLabel,
} from "@/lib/products/listingTitle";
import { SITE_NAME } from "@/lib/seo/site";

export type ProductMetaInput = {
  name?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  modelNumber?: string | null;
  partType?: string | null;
  condition?: string | null;
  description?: string | null;
  price?: number | null;
  priceNegotiable?: boolean | null;
  deviceCategory?: string | null;
  category?: string | null;
  technician?: { name?: string | null; city?: string | null } | string | null;
};

export { formatDeviceLabel };

export function formatConditionLabel(condition?: string | null): string {
  const value = String(condition || "").trim().toLowerCase();
  if (value === "used") return "Used";
  if (value === "new") return "New";
  return value ? value.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

/**
 * On-page H1 / Open Graph title.
 * Prefers "Samsung S24 Ultra — Mobile Camera" over a brand-less card title.
 */
export function formatProductHeading(p: ProductMetaInput): string {
  return formatListingTitle(p);
}

/**
 * Document title, without the site suffix.
 *
 * The root layout applies `template: "%s | SparesX"`, so returning a bare
 * product title here avoids the double "| SparesX | SparesX" that happens when
 * the page title already includes the brand name.
 *
 * Example: "Samsung S24 Ultra Camera (Used)"
 */
export function buildProductSeoTitle(p: ProductMetaInput): string {
  const device = formatDeviceLabel(p);
  const part = formatPartTypeLabel(p.partType);
  const condition = formatConditionLabel(p.condition);

  // Drop a leading "Mobile " from part labels so the title doesn't read
  // "… Mobile Camera" when the part slug already encodes the device class.
  const partClean = part.replace(/^Mobile\s+/i, "") || part;

  const subject = [device, partClean].filter(Boolean).join(" ");
  const base = subject || formatListingTitle(p);

  return condition ? `${base} (${condition})` : base;
}

/**
 * Meta description built from structured product fields.
 *
 * Seller descriptions on SparesX are often one short sentence (or misspelled),
 * so we never rely on them alone. When a longer seller note exists we append
 * it; otherwise the structured sentence stands on its own.
 */
export function buildProductSeoDescription(p: ProductMetaInput): string {
  const heading = formatProductHeading(p);
  const condition = formatConditionLabel(p.condition).toLowerCase() || "listed";
  const price =
    typeof p.price === "number" && Number.isFinite(p.price)
      ? `₹${p.price.toLocaleString("en-IN")}`
      : null;

  const seller =
    p.technician && typeof p.technician === "object" ? p.technician : null;
  const sellerBit = seller?.city
    ? `listed by a technician in ${seller.city}`
    : "listed by a verified technician";

  const parts = [
    `${heading} in ${condition} condition, ${sellerBit} on ${SITE_NAME}.`,
  ];

  if (price) {
    parts.push(
      p.priceNegotiable
        ? `Priced at ${price} (negotiable).`
        : `Priced at ${price}.`,
    );
  }

  if (p.modelNumber) {
    parts.push(`Model number ${p.modelNumber}.`);
  }

  parts.push(
    `Contact the seller directly — ${SITE_NAME} does not process payments.`,
  );

  const structured = parts.join(" ");
  const sellerNote = String(p.description || "")
    .replace(/\s+/g, " ")
    .trim();

  // Only append the seller note when it adds more than a few words and isn't
  // already covered by the structured sentence.
  if (
    sellerNote.length >= 40 &&
    !structured.toLowerCase().includes(sellerNote.toLowerCase())
  ) {
    return `${structured} Seller note: ${sellerNote}`.slice(0, 300);
  }

  return structured.slice(0, 300);
}

/** Keyword list for the metadata API — only real product attributes. */
export function buildProductKeywords(p: ProductMetaInput): string[] {
  return [
    formatProductHeading(p),
    formatDeviceLabel(p),
    String(p.brand || "").trim(),
    String(p.deviceModel || "").trim(),
    formatPartTypeLabel(p.partType),
    p.modelNumber || "",
    "spare parts",
    "mobile spare parts",
    SITE_NAME,
  ].filter((value, index, all) => Boolean(value) && all.indexOf(value) === index);
}
