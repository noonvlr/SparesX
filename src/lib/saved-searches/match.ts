import { connectDB } from "@/lib/db/connect";
import {
  SavedSearch,
  type SavedSearchFilters,
} from "@/lib/models/SavedSearch";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import { createNotification } from "@/lib/notifications/create";
import { productPath } from "@/lib/seo/site";
import { formatListingTitle } from "@/lib/products/listingTitle";
import {
  buildSavedSearchCandidateOr,
  productMatchesSavedFilters,
  type SavedSearchProductLike,
} from "@/lib/saved-searches/filters";

export {
  buildSavedSearchCandidateOr,
  productMatchesSavedFilters,
  savedSearchPassesCandidateOr,
} from "@/lib/saved-searches/filters";

type ProductLike = SavedSearchProductLike;

/**
 * After a listing becomes publicly approved, notify users with matching saved searches.
 * Dedupes: one alert per user per product; skips overlapping searches for the same listing.
 */
export async function notifySavedSearchesForProduct(product: ProductLike) {
  if (product.status && product.status !== "approved") return;

  try {
    await connectDB();
    const ownerId = String(product.technician || "");
    const or = buildSavedSearchCandidateOr(product);

    // Scale cap (deferred): may miss matches when >100 candidates match $or.
    const searches = await SavedSearch.find({ $or: or })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    if (searches.length === 0) return;

    const seller = ownerId
      ? await User.findById(ownerId)
          .select(
            "city isTrusted kycVerified businessVerified phoneVerified eliteApproved",
          )
          .lean()
      : null;
    const href = productPath(product as { slug?: string | null; _id: unknown });
    const title = formatListingTitle(product);
    const productId = String(product._id);

    /** One notification per user for this product (across overlapping saved searches). */
    const notifiedUsers = new Set<string>();

    for (const row of searches) {
      const userId = String(row.userId);
      if (!userId || userId === ownerId) continue;
      if (notifiedUsers.has(userId)) continue;

      const filters = (row.filters || {}) as SavedSearchFilters;
      if (!productMatchesSavedFilters(product, filters, seller)) continue;

      // Avoid spamming the same search within 30 minutes
      if (
        row.lastNotifiedAt &&
        Date.now() - new Date(row.lastNotifiedAt).getTime() < 30 * 60 * 1000
      ) {
        continue;
      }

      // Never re-alert the same listing to the same user
      const already = await Notification.exists({
        user: userId,
        type: "saved_search",
        "meta.productId": productId,
      });
      if (already) {
        notifiedUsers.add(userId);
        continue;
      }

      await createNotification({
        userId,
        type: "saved_search",
        title: "New listing matches your search",
        body: title,
        href,
        collapseKey: `saved:${userId}:${productId}`,
        meta: {
          productId,
          savedSearchId: String(row._id),
        },
      });

      notifiedUsers.add(userId);

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
