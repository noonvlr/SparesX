import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import {
  WhatsAppConnect,
  WHATSAPP_PENDING_TTL_MS,
  type WhatsAppConnectStatus,
} from "@/lib/models/WhatsAppConnect";

function toOid(id: string) {
  return new Types.ObjectId(id);
}

/** Expire stale pending requests for a pair (or globally for a user). */
export async function expireStalePending(filter: Record<string, unknown> = {}) {
  await connectDB();
  await WhatsAppConnect.updateMany(
    {
      status: "pending",
      expiresAt: { $lte: new Date() },
      ...filter,
    },
    { $set: { status: "expired", respondedAt: new Date() } },
  );
}

export async function getConnectionBetween(requesterId: string, sellerId: string) {
  await connectDB();
  await expireStalePending({
    requester: toOid(requesterId),
    seller: toOid(sellerId),
  });
  return WhatsAppConnect.findOne({
    requester: requesterId,
    seller: sellerId,
  }).lean();
}

export async function isWhatsAppUnlocked(
  viewerId: string,
  peerId: string,
): Promise<boolean> {
  if (!viewerId || !peerId || viewerId === peerId) return false;
  await connectDB();
  // Either direction: if A unlocked B, both can use WhatsApp with each other
  const row = await WhatsAppConnect.findOne({
    status: "approved",
    $or: [
      { requester: viewerId, seller: peerId },
      { requester: peerId, seller: viewerId },
    ],
  })
    .select("_id")
    .lean();
  return !!row;
}

export function buildWaMeLink(params: {
  countryCode?: string;
  whatsappNumber?: string;
  mobile?: string;
  productName?: string;
  sellerName?: string;
}) {
  const code = (params.countryCode || "+91").replace(/\D/g, "");
  const number = (params.whatsappNumber || params.mobile || "").replace(
    /\D/g,
    "",
  );
  if (!number) return null;
  const phone = `${code}${number}`.replace(/^0+/, "");
  const text = params.productName
    ? encodeURIComponent(
        `Hi${params.sellerName ? ` ${params.sellerName}` : ""}, I'm interested in "${params.productName}" on SparesX.`,
      )
    : encodeURIComponent(
        `Hi${params.sellerName ? ` ${params.sellerName}` : ""}, connecting from SparesX.`,
      );
  return `https://wa.me/${phone}?text=${text}`;
}

export function maskPhone(countryCode: string | undefined, digits: string) {
  const clean = digits.replace(/\D/g, "");
  if (clean.length < 4) return "••••";
  const code = countryCode || "+91";
  return `${code} ••••••${clean.slice(-4)}`;
}

export type PublicConnectStatus = {
  status: WhatsAppConnectStatus | "none";
  unlocked: boolean;
  canRequest: boolean;
  reason?: string;
  requestId?: string;
  /** Only present when unlocked for this viewer */
  whatsappUrl?: string | null;
  maskedNumber?: string | null;
};

export async function getPublicConnectStatus(params: {
  viewerId: string;
  sellerId: string;
  productId?: string;
  productName?: string;
}): Promise<PublicConnectStatus> {
  const { viewerId, sellerId, productName } = params;

  if (viewerId === sellerId) {
    return {
      status: "none",
      unlocked: false,
      canRequest: false,
      reason: "This is your listing",
    };
  }

  await expireStalePending({
    $or: [
      { requester: toOid(viewerId), seller: toOid(sellerId) },
      { requester: toOid(sellerId), seller: toOid(viewerId) },
    ],
  });

  // Mutual unlock: approved either direction
  const approved = await WhatsAppConnect.findOne({
    status: "approved",
    $or: [
      { requester: viewerId, seller: sellerId },
      { requester: sellerId, seller: viewerId },
    ],
  }).lean();

  if (approved) {
    const seller = await User.findById(sellerId)
      .select("countryCode whatsappNumber mobile name")
      .lean();
    const url = seller
      ? buildWaMeLink({
          countryCode: seller.countryCode,
          whatsappNumber: seller.whatsappNumber,
          mobile: seller.mobile,
          productName,
          sellerName: seller.name,
        })
      : null;
    const digits = seller?.whatsappNumber || seller?.mobile || "";
    return {
      status: "approved",
      unlocked: true,
      canRequest: false,
      requestId: String(approved._id),
      whatsappUrl: url,
      maskedNumber: maskPhone(seller?.countryCode, digits),
    };
  }

  const outgoing = await WhatsAppConnect.findOne({
    requester: viewerId,
    seller: sellerId,
  }).lean();

  if (outgoing?.status === "pending") {
    return {
      status: "pending",
      unlocked: false,
      canRequest: false,
      reason: "Waiting for the seller to approve your WhatsApp request",
      requestId: String(outgoing._id),
    };
  }

  if (outgoing?.status === "declined") {
    const cooled =
      outgoing.respondedAt &&
      Date.now() - new Date(outgoing.respondedAt).getTime() <
        24 * 60 * 60 * 1000;
    return {
      status: "declined",
      unlocked: false,
      canRequest: !cooled,
      reason: cooled
        ? "Request was declined. You can try again after 24 hours."
        : "Previous request was declined. You can request again.",
      requestId: String(outgoing._id),
    };
  }

  return {
    status: outgoing?.status === "expired" || outgoing?.status === "revoked"
      ? outgoing.status
      : "none",
    unlocked: false,
    canRequest: true,
  };
}

export function pendingExpiryDate() {
  return new Date(Date.now() + WHATSAPP_PENDING_TTL_MS);
}
