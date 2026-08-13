import { formatListingTitle } from "@/lib/products/listingTitle";
import { productUrl } from "@/lib/seo/site";

export type ShareableListing = {
  _id?: unknown;
  slug?: string | null;
  name?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  partType?: string | null;
  price?: number | null;
};

export type ShareIntent = "listed" | "found";

export type ListingSharePayload = {
  title: string;
  text: string;
  url: string;
  /** Full message including URL — for WhatsApp / copy / Instagram. */
  message: string;
};

function inr(price?: number | null) {
  if (typeof price !== "number" || Number.isNaN(price)) return "";
  return `₹${price.toLocaleString("en-IN")}`;
}

/**
 * Public share copy. Does not include seller phone, address, or chat.
 * `listed` = seller promoting their own listing.
 * `found` = someone sharing a listing they discovered.
 */
export function buildListingShare(
  product: ShareableListing,
  intent: ShareIntent,
): ListingSharePayload {
  const title = formatListingTitle(product);
  const url = productUrl(product);
  const price = inr(product.price);
  const headline =
    intent === "listed"
      ? `Hey, I have listed this product on SparesX.com — check it out.`
      : `Hey, I found this product on SparesX.com — check it out.`;

  const lines = [headline, title];
  if (price) lines.push(price);
  lines.push(url);

  return {
    title,
    text: `${headline} ${title}${price ? ` ${price}` : ""}`.trim(),
    url,
    message: lines.join("\n"),
  };
}

export function whatsappShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function facebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function telegramShareUrl(url: string, text: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function xShareUrl(url: string, text: string) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
