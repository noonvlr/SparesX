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

/**
 * Logged-in viewers may open WhatsApp for any peer who is not blocked.
 * Approval requests are no longer required.
 */
export async function isWhatsAppUnlocked(
  viewerId: string,
  peerId: string,
): Promise<boolean> {
  if (!viewerId || !peerId || viewerId === peerId) return false;
  await connectDB();
  const { isPeerBlocked } = await import("@/lib/chat/peerBlock");
  if (await isPeerBlocked(viewerId, peerId)) return false;
  return true;
}

export type WaProductContext = {
  productName?: string;
  productUrl?: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  price?: number | null;
  condition?: string | null;
};

/** Build a WhatsApp prefill that identifies the exact listing + deep link. */
export function buildWhatsAppInterestMessage(params: {
  sellerName?: string;
  product?: WaProductContext;
}): string {
  const greet = params.sellerName
    ? `Hi ${params.sellerName},`
    : "Hi,";
  const p = params.product;
  if (!p?.productName && !p?.productUrl) {
    return `${greet} I'm connecting from SparesX.`;
  }

  const lines: string[] = [
    `${greet} I'm interested in this spare part on SparesX:`,
    "",
    `• ${p.productName || "Listing"}`,
  ];

  const deviceBits = [p.brand, p.deviceModel].filter(Boolean).join(" ");
  if (deviceBits) lines.push(`• Device: ${deviceBits}`);
  if (p.partType) {
    const part = String(p.partType)
      .replace(/[-_]/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(`• Part: ${part}`);
  }
  if (p.condition) {
    lines.push(
      `• Condition: ${p.condition === "new" ? "New" : p.condition === "used" ? "Used" : p.condition}`,
    );
  }
  if (typeof p.price === "number" && Number.isFinite(p.price)) {
    lines.push(`• Price: ₹${p.price.toLocaleString("en-IN")}`);
  }
  if (p.productUrl) {
    lines.push("", `View listing: ${p.productUrl}`);
  }
  lines.push("", "Please let me know if it's still available.");
  return lines.join("\n");
}

export function buildWaMeLink(params: {
  countryCode?: string;
  whatsappNumber?: string;
  mobile?: string;
  productName?: string;
  sellerName?: string;
  productUrl?: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  price?: number | null;
  condition?: string | null;
}) {
  const code = (params.countryCode || "+91").replace(/\D/g, "");
  const number = (params.whatsappNumber || params.mobile || "").replace(
    /\D/g,
    "",
  );
  if (!number) return null;
  const phone = `${code}${number}`.replace(/^0+/, "");
  const text = encodeURIComponent(
    buildWhatsAppInterestMessage({
      sellerName: params.sellerName,
      product: {
        productName: params.productName,
        productUrl: params.productUrl,
        brand: params.brand,
        deviceModel: params.deviceModel,
        partType: params.partType,
        price: params.price,
        condition: params.condition,
      },
    }),
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
  productUrl?: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  price?: number | null;
  condition?: string | null;
}): Promise<PublicConnectStatus> {
  const {
    viewerId,
    sellerId,
    productName,
    productUrl,
    brand,
    deviceModel,
    partType,
    price,
    condition,
  } = params;

  if (viewerId === sellerId) {
    return {
      status: "none",
      unlocked: false,
      canRequest: false,
      reason: "This is your listing",
    };
  }

  const { isPeerBlocked } = await import("@/lib/chat/peerBlock");
  if (await isPeerBlocked(viewerId, sellerId)) {
    return {
      status: "none",
      unlocked: false,
      canRequest: false,
      reason: "You cannot contact this seller",
    };
  }

  const seller = await User.findById(sellerId)
    .select("countryCode whatsappNumber mobile name isBlocked")
    .lean();

  if (!seller || seller.isBlocked) {
    return {
      status: "none",
      unlocked: false,
      canRequest: false,
      reason: "Seller not found",
    };
  }

  if (!seller.whatsappNumber && !seller.mobile) {
    return {
      status: "none",
      unlocked: false,
      canRequest: false,
      reason: "This seller has no WhatsApp number on file",
    };
  }

  const url = buildWaMeLink({
    countryCode: seller.countryCode,
    whatsappNumber: seller.whatsappNumber,
    mobile: seller.mobile,
    productName,
    productUrl,
    brand,
    deviceModel,
    partType,
    price,
    condition,
    sellerName: seller.name,
  });
  const digits = seller.whatsappNumber || seller.mobile || "";

  return {
    status: "approved",
    unlocked: true,
    canRequest: false,
    whatsappUrl: url,
    maskedNumber: maskPhone(seller.countryCode, digits),
  };
}

export function pendingExpiryDate() {
  return new Date(Date.now() + WHATSAPP_PENDING_TTL_MS);
}
