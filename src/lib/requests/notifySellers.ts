import { Types } from "mongoose";
import { matchListingsForRequest } from "@/lib/requests/matchListings";
import { createNotification } from "@/lib/notifications/create";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { requestBoardHref } from "@/lib/requests/demandLinks";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * When no exact listing matches exist, notify sellers who stock the same
 * brand and/or part type (capped) so unmet demand still reaches supply.
 */
async function findCatalogOpportunitySellers(params: {
  brand?: string | null;
  category?: string | null;
  deviceModel?: string | null;
  brandId?: string | null;
  partCategoryId?: string | null;
  excludeUserId: string;
  limit: number;
}): Promise<string[]> {
  const and: Record<string, unknown>[] = [
    { status: "approved" },
    {
      technician: {
        $ne: Types.ObjectId.isValid(params.excludeUserId)
          ? new Types.ObjectId(params.excludeUserId)
          : params.excludeUserId,
      },
    },
  ];
  const or: Record<string, unknown>[] = [];

  if (params.brandId && Types.ObjectId.isValid(params.brandId)) {
    or.push({ brandId: new Types.ObjectId(params.brandId) });
  }
  if (params.partCategoryId && Types.ObjectId.isValid(params.partCategoryId)) {
    or.push({ partCategoryId: new Types.ObjectId(params.partCategoryId) });
  }
  if (params.brand?.trim()) {
    or.push({
      brand: new RegExp(`^${escapeRegex(params.brand.trim())}$`, "i"),
    });
  }
  if (params.category?.trim()) {
    const cat = escapeRegex(params.category.trim());
    or.push({ partType: new RegExp(cat, "i") });
    or.push({ category: new RegExp(cat, "i") });
  }
  if (params.deviceModel?.trim()) {
    or.push({
      deviceModel: new RegExp(escapeRegex(params.deviceModel.trim()), "i"),
    });
  }

  if (or.length === 0) return [];
  and.push({ $or: or });

  const rows = await Product.find({ $and: and })
    .select("technician")
    .limit(80)
    .lean();

  return [
    ...new Set(rows.map((r) => String(r.technician)).filter(Boolean)),
  ].slice(0, params.limit);
}

/**
 * When a part request is posted, notify unique matching sellers (capped)
 * and tell the requester how many listings already match.
 * If nothing matches yet, still notify relevant catalog sellers + reassure requester.
 */
export async function notifyOnPartRequestCreated(params: {
  requestId: string;
  requesterId: string;
  category?: string | null;
  brand?: string | null;
  deviceModel?: string | null;
  deviceCategory?: string | null;
  description?: string | null;
  brandId?: string | null;
  partCategoryId?: string | null;
  deviceTypeId?: string | null;
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
      brandId: params.brandId,
      partCategoryId: params.partCategoryId,
      deviceTypeId: params.deviceTypeId,
      city: requester?.city || null,
      excludeUserId: params.requesterId,
      limit: 20,
    });

    const label = [params.brand, params.deviceModel, params.category]
      .map((p) => (p || "").trim())
      .filter(Boolean)
      .join(" · ");

    const summary =
      label ||
      (params.description || "Part request").trim().slice(0, 80) ||
      "Part request";

    const boardHref = requestBoardHref({
      brand: params.brand,
      deviceModel: params.deviceModel,
      category: params.category,
      requestId: params.requestId,
    });

    if (matches.length > 0) {
      await createNotification({
        userId: params.requesterId,
        type: "request_match",
        title: `${matches.length} listing${matches.length === 1 ? "" : "s"} may match`,
        body: summary,
        href: `/requests?tab=mine`,
        meta: { requestId: params.requestId, matchCount: matches.length },
      });
    } else {
      await createNotification({
        userId: params.requesterId,
        type: "request_match",
        title: "Request posted — sellers notified",
        body: "No live listings matched yet. Relevant sellers were alerted.",
        href: `/requests?tab=mine`,
        meta: { requestId: params.requestId, matchCount: 0 },
      });
    }

    let sellerIds =
      matches.length > 0
        ? [...new Set(matches.map((m) => m.seller._id).filter(Boolean))].slice(
            0,
            10,
          )
        : await findCatalogOpportunitySellers({
            brand: params.brand,
            category: params.category,
            deviceModel: params.deviceModel,
            brandId: params.brandId ? String(params.brandId) : null,
            partCategoryId: params.partCategoryId
              ? String(params.partCategoryId)
              : null,
            excludeUserId: params.requesterId,
            limit: 10,
          });

    if (sellerIds.length === 0) return;

    const sellers = await User.find({ _id: { $in: sellerIds } })
      .select("name email")
      .lean();
    const sellerMap = new Map(sellers.map((s) => [String(s._id), s]));

    const { sendPartRequestAlertEmail } = await import(
      "@/lib/services/emailService"
    );
    const { absoluteUrl } = await import("@/lib/seo/site");
    const requestsHref = absoluteUrl(boardHref);

    await Promise.all(
      sellerIds.map(async (sellerId) => {
        await createNotification({
          userId: sellerId,
          type: "part_request",
          title:
            matches.length > 0
              ? "Buyer looking for a part you stock"
              : "New demand for parts you may stock",
          body: summary,
          href: boardHref,
          meta: { requestId: params.requestId },
        });
        const seller = sellerMap.get(String(sellerId));
        if (seller?.email) {
          void sendPartRequestAlertEmail({
            recipientEmail: seller.email,
            recipientName: seller.name || "Seller",
            summary,
            href: requestsHref,
          });
        }
      }),
    );
  } catch (err) {
    console.warn("[request] seller notify failed:", err);
  }
}
