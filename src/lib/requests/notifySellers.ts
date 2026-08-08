import { matchListingsForRequest } from "@/lib/requests/matchListings";
import { createNotification } from "@/lib/notifications/create";
import { User } from "@/lib/models/User";

/**
 * When a part request is posted, notify unique matching sellers (capped)
 * and tell the requester how many listings already match.
 */
export async function notifyOnPartRequestCreated(params: {
  requestId: string;
  requesterId: string;
  category?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  deviceCategory?: string | null;
  description?: string | null;
}) {
  try {
    const requester = await User.findById(params.requesterId)
      .select("city")
      .lean();

    const matches = await matchListingsForRequest({
      category: params.category,
      brand: params.brand,
      deviceModel: params.deviceModel,
      deviceCategory: params.deviceCategory,
      city: requester?.city || null,
      excludeUserId: params.requesterId,
      limit: 20,
    });

    if (matches.length === 0) return;

    const label = [params.brand, params.deviceModel, params.category]
      .map((p) => (p || "").trim())
      .filter(Boolean)
      .join(" · ");

    const summary =
      label ||
      (params.description || "Part request").trim().slice(0, 80) ||
      "Part request";

    await createNotification({
      userId: params.requesterId,
      type: "request_match",
      title: `${matches.length} listing${matches.length === 1 ? "" : "s"} may match`,
      body: summary,
      href: `/requests?tab=mine`,
      meta: { requestId: params.requestId, matchCount: matches.length },
    });

    const sellerIds = [
      ...new Set(matches.map((m) => m.seller._id).filter(Boolean)),
    ].slice(0, 10);

    await Promise.all(
      sellerIds.map((sellerId) =>
        createNotification({
          userId: sellerId,
          type: "part_request",
          title: "Buyer looking for a part you stock",
          body: summary,
          href: "/requests",
          meta: { requestId: params.requestId },
        }),
      ),
    );
  } catch (err) {
    console.warn("[request] seller notify failed:", err);
  }
}
