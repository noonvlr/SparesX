import { connectDB } from "@/lib/db/connect";
import {
  SavedSearch,
  type SavedSearchFilters,
} from "@/lib/models/SavedSearch";
import { User } from "@/lib/models/User";
import { createNotification } from "@/lib/notifications/create";
import { productPath } from "@/lib/seo/site";
import { formatListingTitle } from "@/lib/products/listingTitle";

type ProductLike = {
  _id: unknown;
  name?: string;
  description?: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
  price?: number;
  priceNegotiable?: boolean;
  slug?: string | null;
  technician?: unknown;
  status?: string;
};

function includesIgnoreCase(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function productMatchesSavedFilters(
  product: ProductLike,
  filters: SavedSearchFilters,
  sellerCity?: string | null,
): boolean {
  if (filters.deviceCategory) {
    if (
      String(product.deviceCategory || "").toLowerCase() !==
      filters.deviceCategory.toLowerCase()
    ) {
      return false;
    }
  }
  if (filters.brand) {
    if (
      String(product.brand || "").toLowerCase() !== filters.brand.toLowerCase()
    ) {
      return false;
    }
  }
  if (filters.partType) {
    const part = String(product.partType || product.category || "").toLowerCase();
    if (part !== filters.partType.toLowerCase()) return false;
  }
  if (filters.condition) {
    if (
      String(product.condition || "").toLowerCase() !==
      filters.condition.toLowerCase()
    ) {
      return false;
    }
  }
  if (filters.deviceModel) {
    const modelHay = `${product.deviceModel || ""} ${product.name || ""}`;
    if (!includesIgnoreCase(modelHay, filters.deviceModel)) return false;
  }
  if (filters.search) {
    const hay = `${product.name || ""} ${product.description || ""} ${product.brand || ""} ${product.deviceModel || ""} ${product.partType || ""}`;
    if (!includesIgnoreCase(hay, filters.search)) return false;
  }
  if (filters.minPrice) {
    const min = Number(filters.minPrice);
    if (!Number.isNaN(min) && Number(product.price || 0) < min) return false;
  }
  if (filters.maxPrice) {
    const max = Number(filters.maxPrice);
    if (!Number.isNaN(max) && Number(product.price || 0) > max) return false;
  }
  if (filters.negotiable === "1" || filters.negotiable === "true") {
    if (!product.priceNegotiable) return false;
  }
  if (filters.city) {
    if (!sellerCity || !includesIgnoreCase(sellerCity, filters.city)) {
      return false;
    }
  }
  // sellerType is not enforced on notify (needs trust flags); still useful for browse URL
  return true;
}

/**
 * After a listing becomes publicly approved, notify users with matching saved searches.
 */
export async function notifySavedSearchesForProduct(product: ProductLike) {
  if (product.status && product.status !== "approved") return;

  try {
    await connectDB();
    const ownerId = String(product.technician || "");
    const or: Record<string, unknown>[] = [{ "filters.search": { $exists: true, $ne: "" } }];
    if (product.brand) {
      or.push({
        "filters.brand": {
          $regex: `^${String(product.brand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      });
    }
    if (product.partType || product.category) {
      const part = String(product.partType || product.category);
      or.push({
        "filters.partType": {
          $regex: `^${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      });
    }
    if (product.deviceCategory) {
      or.push({
        "filters.deviceCategory": product.deviceCategory,
      });
    }

    const searches = await SavedSearch.find({ $or: or })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    if (searches.length === 0) return;

    const seller = ownerId
      ? await User.findById(ownerId).select("city").lean()
      : null;
    const href = productPath(product as { slug?: string | null; _id: unknown });
    const title = formatListingTitle(product);
    const productId = String(product._id);

    for (const row of searches) {
      const userId = String(row.userId);
      if (!userId || userId === ownerId) continue;
      const filters = (row.filters || {}) as SavedSearchFilters;
      if (!productMatchesSavedFilters(product, filters, seller?.city)) continue;

      // Avoid spamming the same search within 30 minutes
      if (
        row.lastNotifiedAt &&
        Date.now() - new Date(row.lastNotifiedAt).getTime() < 30 * 60 * 1000
      ) {
        continue;
      }

      await createNotification({
        userId,
        type: "saved_search",
        title: "New listing matches your search",
        body: title,
        href,
        meta: {
          productId,
          savedSearchId: String(row._id),
        },
      });

      const recipient = await User.findById(userId).select("name email").lean();
      if (recipient?.email) {
        const { sendSavedSearchMatchEmail } = await import(
          "@/lib/services/emailService"
        );
        const { absoluteUrl } = await import("@/lib/seo/site");
        void sendSavedSearchMatchEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name || "there",
          listingTitle: title,
          href: absoluteUrl(href),
        });
      }

      await SavedSearch.updateOne(
        { _id: row._id },
        { $set: { lastNotifiedAt: new Date() } },
      );
    }
  } catch (err) {
    console.warn("[saved-search] notify failed:", err);
  }
}
