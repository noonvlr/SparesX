import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import {
  WhatsAppConnect,
  MAX_WHATSAPP_REQUESTS_PER_DAY,
} from "@/lib/models/WhatsAppConnect";
import {
  expireStalePending,
  getPublicConnectStatus,
  pendingExpiryDate,
} from "@/lib/whatsapp/connect";
import { formatListingTitle } from "@/lib/products/listingTitle";
import { productUrl } from "@/lib/seo/site";

/**
 * GET /api/whatsapp-connect?sellerId=&productId=
 *   → status for this viewer↔seller (unlock is per user pair)
 * GET /api/whatsapp-connect?box=incoming|outgoing
 *   → list of requests
 */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    await expireStalePending();

    const { searchParams } = new URL(req.url);
    const box = searchParams.get("box");
    const sellerId = searchParams.get("sellerId")?.trim();
    const productId = searchParams.get("productId")?.trim() || undefined;

    if (box === "incoming" || box === "outgoing") {
      const filter =
        box === "incoming"
          ? { seller: auth.id }
          : { requester: auth.id };

      const rows = await WhatsAppConnect.find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("requester", "name profilePicture city")
        .populate("seller", "name profilePicture city")
        .populate("product", "name slug")
        .lean();

      const items = rows.map((r) => {
        const peerDoc =
          box === "incoming"
            ? (r.requester as any)
            : (r.seller as any);
        return {
          _id: String(r._id),
          status: r.status,
          message: r.message,
          createdAt: r.createdAt,
          respondedAt: r.respondedAt,
          expiresAt: r.expiresAt,
          product:
            r.product && typeof r.product === "object"
              ? {
                  _id: String((r.product as any)._id),
                  name: (r.product as any).name,
                  slug: (r.product as any).slug || undefined,
                }
              : null,
          peer: peerDoc
            ? {
                _id: String(peerDoc._id),
                name: peerDoc.name,
                profilePicture: peerDoc.profilePicture,
                city: peerDoc.city,
              }
            : { _id: "", name: "User" },
        };
      });

      const pendingIncoming =
        box === "incoming"
          ? items.filter((i) => i.status === "pending").length
          : undefined;

      return NextResponse.json(
        { items, pendingIncoming },
        { status: 200 },
      );
    }

    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return NextResponse.json(
        { message: "sellerId is required" },
        { status: 400 },
      );
    }

    let productName: string | undefined;
    let productUrlValue: string | undefined;
    let brand: string | undefined;
    let deviceModel: string | undefined;
    let partType: string | undefined;
    let price: number | null | undefined;
    let condition: string | null | undefined;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      const p = await Product.findById(productId)
        .select("name slug brand deviceModel partType price condition")
        .lean();
      if (p) {
        productName = formatListingTitle(p);
        productUrlValue = productUrl(p);
        brand = p.brand || undefined;
        deviceModel = p.deviceModel || undefined;
        partType = p.partType || undefined;
        price = typeof p.price === "number" ? p.price : null;
        condition = p.condition || null;
      }
    }

    const status = await getPublicConnectStatus({
      viewerId: auth.id,
      sellerId,
      productId,
      productName,
      productUrl: productUrlValue,
      brand,
      deviceModel,
      partType,
      price,
      condition,
    });

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST — create or re-open a WhatsApp connect request (per user pair). */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const body = await req.json();
    const sellerId = String(body?.sellerId || "").trim();
    const productId = body?.productId
      ? String(body.productId).trim()
      : undefined;
    const message =
      typeof body?.message === "string"
        ? body.message.trim().slice(0, 300)
        : "";

    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return NextResponse.json(
        { message: "Valid sellerId is required" },
        { status: 400 },
      );
    }
    if (sellerId === auth.id) {
      return NextResponse.json(
        { message: "You cannot request WhatsApp from yourself" },
        { status: 400 },
      );
    }

    const { isPeerBlocked } = await import("@/lib/chat/peerBlock");
    if (await isPeerBlocked(auth.id, sellerId)) {
      return NextResponse.json(
        { message: "You cannot contact this seller" },
        { status: 403 },
      );
    }

    const seller = await User.findById(sellerId)
      .select("_id isBlocked whatsappNumber mobile")
      .lean();
    if (!seller || seller.isBlocked) {
      return NextResponse.json(
        { message: "Seller not found" },
        { status: 404 },
      );
    }
    if (!seller.whatsappNumber && !seller.mobile) {
      return NextResponse.json(
        { message: "This seller has no WhatsApp number on file" },
        { status: 400 },
      );
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      const product = await Product.findById(productId)
        .select("technician status")
        .lean();
      if (
        !product ||
        product.status !== "approved" ||
        String(product.technician) !== sellerId
      ) {
        return NextResponse.json(
          { message: "Invalid product for this seller" },
          { status: 400 },
        );
      }
    }

    await expireStalePending({
      requester: auth.id,
      seller: sellerId,
    });

    // Already unlocked either direction
    const unlocked = await WhatsAppConnect.findOne({
      status: "approved",
      $or: [
        { requester: auth.id, seller: sellerId },
        { requester: sellerId, seller: auth.id },
      ],
    }).lean();
    if (unlocked) {
      return NextResponse.json(
        {
          message:
            "WhatsApp is already unlocked with this user for all listings",
          status: "approved",
          unlocked: true,
        },
        { status: 200 },
      );
    }

    const existing = await WhatsAppConnect.findOne({
      requester: auth.id,
      seller: sellerId,
    });

    if (existing?.status === "pending") {
      return NextResponse.json(
        {
          message: "Request already pending",
          status: "pending",
          requestId: String(existing._id),
        },
        { status: 200 },
      );
    }

    if (existing?.status === "declined" && existing.respondedAt) {
      const elapsed =
        Date.now() - new Date(existing.respondedAt).getTime();
      if (elapsed < 24 * 60 * 60 * 1000) {
        return NextResponse.json(
          {
            message:
              "Please wait 24 hours after a decline before requesting again",
          },
          { status: 429 },
        );
      }
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await WhatsAppConnect.countDocuments({
      requester: auth.id,
      createdAt: { $gte: dayAgo },
      status: { $in: ["pending", "approved", "declined"] },
    });
    // Count new creates; allow updates of existing row without counting again if re-open
    if (!existing && recentCount >= MAX_WHATSAPP_REQUESTS_PER_DAY) {
      return NextResponse.json(
        {
          message: `You can send up to ${MAX_WHATSAPP_REQUESTS_PER_DAY} WhatsApp requests per day`,
        },
        { status: 429 },
      );
    }

    const doc = await WhatsAppConnect.findOneAndUpdate(
      { requester: auth.id, seller: sellerId },
      {
        $set: {
          status: "pending",
          message: message || undefined,
          product: productId || undefined,
          expiresAt: pendingExpiryDate(),
        },
        $unset: { respondedAt: 1 },
        $setOnInsert: {
          requester: auth.id,
          seller: sellerId,
        },
      },
      { upsert: true, new: true },
    );

    const { createNotification } = await import("@/lib/notifications/create");
    const requester = await User.findById(auth.id).select("name").lean();
    await createNotification({
      userId: sellerId,
      type: "whatsapp_request",
      title: "New WhatsApp connect request",
      body: `${requester?.name || "A technician"} wants to contact you on WhatsApp.`,
      href: "/whatsapp-connect",
      meta: { connectId: String(doc._id), requesterId: auth.id },
    });

    try {
      const { trackMarketplaceEvent } = await import("@/lib/analytics/events");
      void trackMarketplaceEvent({
        type: "whatsapp_request",
        productId: productId || undefined,
      });
    } catch {
      // ignore
    }

    return NextResponse.json(
      {
        message:
          "WhatsApp request sent. Once approved, you can message this seller on WhatsApp for any of their listings.",
        status: "pending",
        requestId: String(doc._id),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
