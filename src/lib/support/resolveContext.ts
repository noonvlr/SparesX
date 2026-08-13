import mongoose from "mongoose";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { absoluteUrl, productPath } from "@/lib/seo/site";
import type { SupportTargetType } from "@/lib/support/constants";

export type ProductSnapshot = {
  productId: string;
  productTitle: string;
  productUrl: string;
  slug?: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  category?: string;
  price?: number;
  listingStatus?: string;
  image?: string;
  sellerId?: string;
  sellerName?: string;
  sellerProfileUrl?: string;
};

export type UserSnapshot = {
  userId: string;
  name: string;
  profileUrl: string;
  city?: string;
  state?: string;
  accountStatus: "active" | "blocked";
  role?: string;
  email?: string;
};

export type MessageSnapshot = {
  conversationId: string;
  messageId: string;
  messageContent: string;
  messageType: "text" | "image";
  mediaUrl?: string;
  messageSenderId: string;
  messageSenderName?: string;
  messageTimestamp?: string;
  recipientId?: string;
};

export type SourceSnapshot = {
  pageUrl?: string;
  pageType?: string;
};

export type ResolvedSupportContext = {
  targetType: SupportTargetType;
  product?: mongoose.Types.ObjectId;
  reportedUser?: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId;
  productSnapshot?: ProductSnapshot;
  reportedUserSnapshot?: UserSnapshot;
  messageSnapshot?: MessageSnapshot;
  source?: SourceSnapshot;
  subjectHint: string;
};

function oid(id: unknown): mongoose.Types.ObjectId | null {
  const s = String(id || "");
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

function publicUserSnapshot(
  user: {
    _id: unknown;
    name?: string;
    city?: string;
    state?: string;
    isBlocked?: boolean;
    role?: string;
    email?: string;
  },
  includeEmail: boolean,
): UserSnapshot {
  const id = String(user._id);
  return {
    userId: id,
    name: user.name || "Unknown user",
    profileUrl: absoluteUrl(`/u/${id}`),
    city: user.city || undefined,
    state: user.state || undefined,
    accountStatus: user.isBlocked ? "blocked" : "active",
    role: user.role,
    ...(includeEmail && user.email ? { email: user.email } : {}),
  };
}

async function loadProduct(idOrSlug: string) {
  const byId = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? await Product.findById(idOrSlug)
    : null;
  if (byId) return byId;
  return Product.findOne({ slug: idOrSlug });
}

export async function resolveSupportContext(params: {
  reporterId: string;
  targetType: SupportTargetType;
  productId?: string;
  reportedUserId?: string;
  conversationId?: string;
  messageId?: string;
  sourcePage?: string;
  sourcePageType?: string;
  /** Include emails in snapshots stored for admins */
  forAdminSnapshot?: boolean;
}): Promise<
  | { ok: true; context: ResolvedSupportContext }
  | { ok: false; status: number; message: string }
> {
  const source: SourceSnapshot | undefined =
    params.sourcePage || params.sourcePageType
      ? {
          pageUrl: params.sourcePage?.slice(0, 500),
          pageType: params.sourcePageType?.slice(0, 80),
        }
      : undefined;

  if (params.targetType === "product") {
    if (!params.productId?.trim()) {
      return { ok: false, status: 400, message: "Product is required" };
    }
    const product = await loadProduct(params.productId.trim());
    if (!product) {
      return { ok: false, status: 404, message: "This listing is no longer available" };
    }
    const sellerId = String(product.technician);
    if (sellerId === params.reporterId) {
      return { ok: false, status: 400, message: "You cannot report your own listing" };
    }
    const seller = await User.findById(sellerId).select(
      "name email city state isBlocked role",
    );
    const path = productPath(product);
    const snapshot: ProductSnapshot = {
      productId: String(product._id),
      productTitle: product.name,
      productUrl: absoluteUrl(path),
      slug: product.slug || undefined,
      brand: product.brand,
      deviceModel: product.deviceModel,
      partType: product.partType,
      category: product.deviceCategory || product.category,
      price: product.price,
      listingStatus: product.status,
      image: product.images?.[0],
      sellerId,
      sellerName: seller?.name || "Unknown seller",
      sellerProfileUrl: absoluteUrl(`/u/${sellerId}`),
    };
    return {
      ok: true,
      context: {
        targetType: "product",
        product: product._id as mongoose.Types.ObjectId,
        reportedUser: oid(sellerId) || undefined,
        productSnapshot: snapshot,
        reportedUserSnapshot: seller
          ? publicUserSnapshot(seller, !!params.forAdminSnapshot)
          : undefined,
        source,
        subjectHint: `Report: ${product.name}`.slice(0, 140),
      },
    };
  }

  if (params.targetType === "user") {
    if (!params.reportedUserId?.trim()) {
      return { ok: false, status: 400, message: "User is required" };
    }
    if (!mongoose.Types.ObjectId.isValid(params.reportedUserId)) {
      return { ok: false, status: 400, message: "Invalid user" };
    }
    if (String(params.reportedUserId) === params.reporterId) {
      return { ok: false, status: 400, message: "You cannot report yourself" };
    }
    const user = await User.findById(params.reportedUserId).select(
      "name email city state isBlocked role",
    );
    if (!user) {
      return { ok: false, status: 404, message: "This user is no longer available" };
    }

    let productSnapshot: ProductSnapshot | undefined;
    let productOid: mongoose.Types.ObjectId | undefined;
    let conversationOid: mongoose.Types.ObjectId | undefined;
    if (
      params.conversationId &&
      mongoose.Types.ObjectId.isValid(params.conversationId)
    ) {
      const conversation = await Conversation.findById(params.conversationId);
      if (
        conversation &&
        conversation.participants.some((p) => String(p) === params.reporterId) &&
        conversation.participants.some((p) => String(p) === String(user._id))
      ) {
        conversationOid = conversation._id as mongoose.Types.ObjectId;
        if (!params.productId && conversation.productId) {
          params.productId = String(conversation.productId);
        }
      }
    }
    if (params.productId?.trim()) {
      const product = await loadProduct(params.productId.trim());
      if (product) {
        productOid = product._id as mongoose.Types.ObjectId;
        const sellerId = String(product.technician);
        const path = productPath(product);
        productSnapshot = {
          productId: String(product._id),
          productTitle: product.name,
          productUrl: absoluteUrl(path),
          slug: product.slug || undefined,
          brand: product.brand,
          deviceModel: product.deviceModel,
          partType: product.partType,
          category: product.deviceCategory || product.category,
          price: product.price,
          listingStatus: product.status,
          image: product.images?.[0],
          sellerId,
          sellerName: user.name,
          sellerProfileUrl: absoluteUrl(`/u/${user._id}`),
        };
      }
    }

    return {
      ok: true,
      context: {
        targetType: "user",
        reportedUser: user._id as mongoose.Types.ObjectId,
        product: productOid,
        conversationId: conversationOid,
        productSnapshot,
        reportedUserSnapshot: publicUserSnapshot(user, !!params.forAdminSnapshot),
        source,
        subjectHint: `Report user: ${user.name}`.slice(0, 140),
      },
    };
  }

  if (params.targetType === "message") {
    const messageId = params.messageId?.trim();
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return { ok: false, status: 400, message: "Message is required" };
    }
    const message = await Message.findById(messageId);
    if (!message) {
      return {
        ok: false,
        status: 404,
        message: "This message is no longer available",
      };
    }
    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation) {
      return { ok: false, status: 404, message: "Conversation not found" };
    }
    const participant = conversation.participants.some(
      (p) => String(p) === params.reporterId,
    );
    if (!participant) {
      return { ok: false, status: 403, message: "You cannot report this message" };
    }
    if (String(message.senderId) === params.reporterId) {
      return { ok: false, status: 400, message: "You cannot report your own message" };
    }

    const sender = await User.findById(message.senderId).select(
      "name email city state isBlocked role",
    );
    const content =
      message.type === "image"
        ? message.mediaUrl
          ? "[Image]"
          : "[Image]"
        : (message.text || "").slice(0, 2000);

    const messageSnapshot: MessageSnapshot = {
      conversationId: String(message.conversationId),
      messageId: String(message._id),
      messageContent: content,
      messageType: message.type,
      mediaUrl: message.mediaUrl || undefined,
      messageSenderId: String(message.senderId),
      messageSenderName: sender?.name,
      messageTimestamp: message.createdAt?.toISOString(),
      recipientId: String(message.receiverId),
    };

    let productSnapshot: ProductSnapshot | undefined;
    let productOid: mongoose.Types.ObjectId | undefined;
    if (conversation.productId) {
      const product = await Product.findById(conversation.productId);
      if (product) {
        productOid = product._id as mongoose.Types.ObjectId;
        const sellerId = String(product.technician);
        productSnapshot = {
          productId: String(product._id),
          productTitle: product.name,
          productUrl: absoluteUrl(productPath(product)),
          slug: product.slug || undefined,
          brand: product.brand,
          deviceModel: product.deviceModel,
          partType: product.partType,
          category: product.deviceCategory || product.category,
          price: product.price,
          listingStatus: product.status,
          image: product.images?.[0],
          sellerId,
          sellerName: sender?.name,
          sellerProfileUrl: sellerId
            ? absoluteUrl(`/u/${sellerId}`)
            : undefined,
        };
      }
    }

    return {
      ok: true,
      context: {
        targetType: "message",
        reportedUser: message.senderId as mongoose.Types.ObjectId,
        product: productOid,
        conversationId: message.conversationId as mongoose.Types.ObjectId,
        messageId: message._id as mongoose.Types.ObjectId,
        productSnapshot,
        reportedUserSnapshot: sender
          ? publicUserSnapshot(sender, !!params.forAdminSnapshot)
          : undefined,
        messageSnapshot,
        source,
        subjectHint: `Report message from ${sender?.name || "user"}`.slice(0, 140),
      },
    };
  }

  // Optional conversation context on a user report from chat (without a message id)
  if (params.conversationId && mongoose.Types.ObjectId.isValid(params.conversationId)) {
    const conversation = await Conversation.findById(params.conversationId);
    if (
      conversation &&
      conversation.participants.some((p) => String(p) === params.reporterId)
    ) {
      const peerId = conversation.participants
        .map(String)
        .find((id) => id !== params.reporterId);
      // Attach product snapshot if present; reported user handled by caller type
      if (conversation.productId && params.targetType === "none") {
        const product = await Product.findById(conversation.productId);
        if (product) {
          return {
            ok: true,
            context: {
              targetType: "none",
              product: product._id as mongoose.Types.ObjectId,
              reportedUser: oid(peerId) || undefined,
              conversationId: conversation._id as mongoose.Types.ObjectId,
              productSnapshot: {
                productId: String(product._id),
                productTitle: product.name,
                productUrl: absoluteUrl(productPath(product)),
                slug: product.slug || undefined,
                brand: product.brand,
                listingStatus: product.status,
                image: product.images?.[0],
                sellerId: String(product.technician),
              },
              source,
              subjectHint: "Support request",
            },
          };
        }
      }
    }
  }

  return {
    ok: true,
    context: {
      targetType: "none",
      source,
      subjectHint: "Support request",
    },
  };
}

/** Public preview for the report form — never includes emails of other users. */
export function toPublicContextPreview(context: ResolvedSupportContext) {
  const reported = context.reportedUserSnapshot
    ? {
        userId: context.reportedUserSnapshot.userId,
        name: context.reportedUserSnapshot.name,
        profileUrl: context.reportedUserSnapshot.profileUrl,
        city: context.reportedUserSnapshot.city,
        state: context.reportedUserSnapshot.state,
        accountStatus: context.reportedUserSnapshot.accountStatus,
      }
    : undefined;

  return {
    targetType: context.targetType,
    subjectHint: context.subjectHint,
    product: context.productSnapshot
      ? {
          productId: context.productSnapshot.productId,
          productTitle: context.productSnapshot.productTitle,
          productUrl: context.productSnapshot.productUrl,
          brand: context.productSnapshot.brand,
          deviceModel: context.productSnapshot.deviceModel,
          partType: context.productSnapshot.partType,
          category: context.productSnapshot.category,
          listingStatus: context.productSnapshot.listingStatus,
          image: context.productSnapshot.image,
          sellerId: context.productSnapshot.sellerId,
          sellerName: context.productSnapshot.sellerName,
        }
      : undefined,
    reportedUser: reported,
    message: context.messageSnapshot
      ? {
          conversationId: context.messageSnapshot.conversationId,
          messageId: context.messageSnapshot.messageId,
          messageContent: context.messageSnapshot.messageContent,
          messageType: context.messageSnapshot.messageType,
          messageSenderName: context.messageSnapshot.messageSenderName,
          messageTimestamp: context.messageSnapshot.messageTimestamp,
        }
      : undefined,
  };
}
