import { connectDB } from "@/lib/db/connect";
import { SiteSettings, getOrCreateSiteSettings } from "@/lib/models/SiteSettings";
import { Product } from "@/lib/models/Product";
import { MarketplaceEvent } from "@/lib/models/MarketplaceEvent";

/**
 * Monotonic marketplace counter: once a listing is marked sold, the public
 * "sold / fulfilled" total must not drop when the product row is later deleted.
 */
export async function recordLifetimeSoldListing(count = 1): Promise<void> {
  if (count <= 0) return;
  try {
    await connectDB();
    await getOrCreateSiteSettings();
    await SiteSettings.updateOne(
      { key: "default" },
      { $inc: { lifetimeSoldListings: count } },
    );
  } catch (err) {
    console.warn("[lifetimeSold] record failed:", err);
  }
}

/**
 * Public sold-listings total (excludes fulfilled requests).
 * Uses a durable SiteSettings counter that only increases.
 * Bootstraps / heals from current sold products and listing_sold events
 * when the stored counter is behind (legacy data).
 */
export async function getLifetimeSoldListingCount(): Promise<number> {
  await connectDB();
  const settings = await getOrCreateSiteSettings();
  const stored =
    typeof settings.lifetimeSoldListings === "number"
      ? settings.lifetimeSoldListings
      : 0;

  const [soldProducts, soldEvents] = await Promise.all([
    Product.countDocuments({ status: "sold" }),
    MarketplaceEvent.countDocuments({ type: "listing_sold" }),
  ]);
  const floor = Math.max(soldProducts, soldEvents);

  if (stored >= floor) return stored;

  await SiteSettings.updateOne(
    { key: "default" },
    { $set: { lifetimeSoldListings: floor } },
  );
  return floor;
}
