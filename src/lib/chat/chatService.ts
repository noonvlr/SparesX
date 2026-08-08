import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Conversation, IConversation, conversationPairKey, ensureConversationIndexes } from "@/lib/models/Conversation";
import { Message, IMessage, MessageType } from "@/lib/models/Message";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { previewFromMessage, sanitizeChatText } from "@/lib/chat/sanitize";
import {
  allowConversationCreate,
  allowMessageSend,
} from "@/lib/chat/rateLimit";
import { pickTrustFields } from "@/lib/trust";

void User;
void Product;

/** Consider online if lastSeen within this window (Vercel REST presence). */
export const ONLINE_WINDOW_MS = 90_000;
export const TYPING_WINDOW_MS = 4_000;

function toOid(id: string | Types.ObjectId) {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

function isRecentlyOnline(lastSeen?: Date | string | null) {
  if (!lastSeen) return false;
  const t = new Date(lastSeen).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ONLINE_WINDOW_MS;
}

function isActivelyTyping(
  typingUserId: unknown,
  typingUntil: Date | string | null | undefined,
  peerId: string,
) {
  if (!typingUserId || !typingUntil) return false;
  if (String(typingUserId) !== String(peerId)) return false;
  const t = new Date(typingUntil).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function assertParticipant(
  conversation: IConversation,
  userId: string,
): boolean {
  return conversation.participants.some(
    (p) => String((p as any)?._id || p) === String(userId),
  );
}

export async function getOrCreateConversation(params: {
  userId: string;
  peerId: string;
  productId?: string;
}) {
  const { userId, peerId, productId } = params;
  if (userId === peerId) {
    throw Object.assign(new Error("Cannot chat with yourself"), { status: 400 });
  }
  if (!(await allowConversationCreate(userId))) {
    throw Object.assign(new Error("Too many conversation requests"), {
      status: 429,
    });
  }

  await connectDB();
  await ensureConversationIndexes();

  const peer = await User.findById(peerId).select("_id isBlocked").lean();
  if (!peer || peer.isBlocked) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  if (productId) {
    const product = await Product.findById(productId).select("_id technician").lean();
    if (!product) {
      throw Object.assign(new Error("Product not found"), { status: 404 });
    }
  }

  const [p1, p2] = sortedPair(userId, peerId);
  const pairKey = conversationPairKey(p1, p2);
  const productOid = productId ? toOid(productId) : undefined;

  const pairMatch = {
    $or: [
      { pairKey },
      {
        participants: { $all: [toOid(p1), toOid(p2)], $size: 2 },
      },
    ],
  };

  const filter: Record<string, unknown> = productOid
    ? { productId: productOid, ...pairMatch }
    : {
        $and: [
          { $or: [{ productId: { $exists: false } }, { productId: null }] },
          pairMatch,
        ],
      };

  let conversation = await Conversation.findOne(filter);
  if (conversation) {
    if (!conversation.pairKey) {
      conversation.pairKey = pairKey;
      await conversation.save().catch(() => {});
    }
    return conversation;
  }

  try {
    conversation = await Conversation.create({
      participants: [toOid(p1), toOid(p2)],
      pairKey,
      ...(productOid ? { productId: productOid } : {}),
      unreadCounts: new Map([
        [userId, 0],
        [peerId, 0],
      ]),
    });
  } catch (err: unknown) {
    // Race: another request created the same pair — return existing
    const code = (err as { code?: number })?.code;
    if (code === 11000) {
      conversation = await Conversation.findOne(
        productOid
          ? { pairKey, productId: productOid }
          : {
              pairKey,
              $or: [{ productId: { $exists: false } }, { productId: null }],
            },
      );
      if (!conversation) {
        conversation = await Conversation.findOne({
          participants: { $all: [toOid(p1), toOid(p2)], $size: 2 },
          ...(productOid
            ? { productId: productOid }
            : {
                $or: [{ productId: { $exists: false } }, { productId: null }],
              }),
        });
      }
      if (conversation) return conversation;
    }
    throw err;
  }

  return conversation;
}

export async function listConversations(userId: string, page = 1, limit = 30) {
  await connectDB();
  const skip = (page - 1) * limit;
  const filter = { participants: toOid(userId) };

  const [items, total, unreadRows] = await Promise.all([
    Conversation.find(filter)
      .sort({ lastMessageTime: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("participants", "name profilePicture lastSeen role phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys createdAt")
      .populate("productId", "name images price brand deviceModel slug status")
      .lean(),
    Conversation.countDocuments(filter),
    Message.aggregate([
      {
        $match: {
          receiverId: toOid(userId),
          read: false,
          deletedFor: { $ne: toOid(userId) },
        },
      },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]),
  ]);

  const unreadByConv = new Map<string, number>(
    unreadRows.map((r: { _id: Types.ObjectId; count: number }) => [
      String(r._id),
      r.count,
    ]),
  );

  const conversations = items.map((c) => {
    const peer = (c.participants as any[]).find(
      (p) => String(p._id) !== String(userId),
    );
    const peerId = peer?._id ? String(peer._id) : "";
    return {
      ...c,
      unreadCount: unreadByConv.get(String(c._id)) || 0,
      peer: peer
        ? {
            ...peer,
            ...pickTrustFields(peer),
            _id: peerId,
            online: isRecentlyOnline(peer.lastSeen),
          }
        : peer,
      peerOnline: isRecentlyOnline(peer?.lastSeen),
      peerTyping: isActivelyTyping(
        (c as any).typingUserId,
        (c as any).typingUntil,
        peerId,
      ),
    };
  });

  return { conversations, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function getConversationForUser(
  conversationId: string,
  userId: string,
) {
  await connectDB();
  const conversation = await Conversation.findById(conversationId)
    .populate("participants", "name profilePicture lastSeen role phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys createdAt")
    .populate("productId", "name images price brand deviceModel slug status")
    .lean();
  if (!conversation) return null;
  if (
    !conversation.participants.some(
      (p: any) => String(p._id || p) === String(userId),
    )
  ) {
    return null;
  }
  const peer = (conversation.participants as any[]).find(
    (p) => String(p._id) !== String(userId),
  );
  const peerId = peer?._id ? String(peer._id) : "";
  const unread = await Message.countDocuments({
    conversationId: conversation._id,
    receiverId: toOid(userId),
    read: false,
    deletedFor: { $ne: toOid(userId) },
  });
  return {
    ...conversation,
    peer: peer
      ? {
          ...peer,
          ...pickTrustFields(peer),
          _id: peerId,
          online: isRecentlyOnline(peer.lastSeen),
        }
      : peer,
    peerOnline: isRecentlyOnline(peer?.lastSeen),
    peerTyping: isActivelyTyping(
      (conversation as any).typingUserId,
      (conversation as any).typingUntil,
      peerId,
    ),
    unreadCount: unread,
  };
}

export async function listMessages(params: {
  conversationId: string;
  userId: string;
  cursor?: string;
  limit?: number;
}) {
  const { conversationId, userId, cursor } = params;
  const limit = Math.min(50, Math.max(1, params.limit ?? 40));
  await connectDB();

  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation || !assertParticipant(conversation as any, userId)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const query: Record<string, unknown> = {
    conversationId: toOid(conversationId),
    deletedFor: { $ne: toOid(userId) },
  };
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const nextCursor =
    messages.length === limit
      ? messages[messages.length - 1].createdAt.toISOString()
      : null;

  return {
    messages: messages.reverse(),
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  type?: MessageType;
  text?: string;
  mediaUrl?: string;
  receiverOnline?: boolean;
}) {
  const {
    conversationId,
    senderId,
    type = "text",
    text,
    mediaUrl,
    receiverOnline = false,
  } = params;

  if (!(await allowMessageSend(senderId))) {
    throw Object.assign(new Error("Too many messages"), { status: 429 });
  }

  await connectDB();
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !assertParticipant(conversation, senderId)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const receiverId = conversation.participants
    .map(String)
    .find((id) => id !== senderId);
  if (!receiverId) {
    throw Object.assign(new Error("Invalid conversation"), { status: 400 });
  }

  let cleanText: string | undefined;
  if (type === "text") {
    cleanText = sanitizeChatText(text || "");
    if (!cleanText) {
      throw Object.assign(new Error("Message text required"), { status: 400 });
    }
  } else if (type === "image") {
    if (!mediaUrl?.trim() || !/^https?:\/\/|^\/uploads\//.test(mediaUrl)) {
      throw Object.assign(new Error("Valid mediaUrl required"), { status: 400 });
    }
  } else {
    throw Object.assign(new Error("Unsupported message type"), { status: 400 });
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: toOid(senderId),
    receiverId: toOid(receiverId),
    type,
    text: cleanText,
    mediaUrl: type === "image" ? mediaUrl!.trim() : undefined,
    delivered: receiverOnline,
    deliveredAt: receiverOnline ? new Date() : undefined,
    read: false,
  });

  const preview = previewFromMessage(type, cleanText);
  conversation.lastMessage = preview;
  conversation.lastMessageType = type;
  conversation.lastMessageTime = message.createdAt;
  conversation.lastMessageSenderId = toOid(senderId);

  const currentUnread =
    conversation.unreadCounts.get(receiverId) || 0;
  conversation.unreadCounts.set(receiverId, currentUnread + 1);
  conversation.unreadCounts.set(senderId, 0);
  await conversation.save();

  return { message, conversation, receiverId };
}

export async function markConversationRead(params: {
  conversationId: string;
  userId: string;
}) {
  const { conversationId, userId } = params;
  await connectDB();

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !assertParticipant(conversation, userId)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  const now = new Date();
  const result = await Message.updateMany(
    {
      conversationId: conversation._id,
      receiverId: toOid(userId),
      read: false,
      deletedFor: { $ne: toOid(userId) },
    },
    { $set: { read: true, readAt: now, delivered: true, deliveredAt: now } },
  );

  conversation.unreadCounts.set(userId, 0);
  await conversation.save();

  const senderIds = await Message.distinct("senderId", {
    conversationId: conversation._id,
    receiverId: toOid(userId),
    read: true,
    readAt: now,
  });

  return {
    conversation,
    modifiedCount: result.modifiedCount,
    peerIds: senderIds.map(String),
  };
}

export async function softDeleteMessage(params: {
  messageId: string;
  userId: string;
}) {
  const { messageId, userId } = params;
  await connectDB();

  const message = await Message.findById(messageId);
  if (!message) {
    throw Object.assign(new Error("Message not found"), { status: 404 });
  }

  const conversation = await Conversation.findById(message.conversationId);
  if (!conversation || !assertParticipant(conversation, userId)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  if (!message.deletedFor.some((id) => String(id) === userId)) {
    message.deletedFor.push(toOid(userId));
    await message.save();
  }

  return message;
}

export async function markMessagesDelivered(params: {
  receiverId: string;
  conversationId?: string;
}) {
  await connectDB();
  const filter: Record<string, unknown> = {
    receiverId: toOid(params.receiverId),
    delivered: false,
  };
  if (params.conversationId) {
    filter.conversationId = toOid(params.conversationId);
  }
  const now = new Date();
  await Message.updateMany(filter, {
    $set: { delivered: true, deliveredAt: now },
  });
}

export async function getTotalUnread(userId: string) {
  await connectDB();
  return Message.countDocuments({
    receiverId: toOid(userId),
    read: false,
    deletedFor: { $ne: toOid(userId) },
  });
}

export async function updateLastSeen(userId: string) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
}

/** Force offline immediately (logout / tab close). */
export async function markUserOffline(userId: string) {
  await connectDB();
  const offlineAt = new Date(Date.now() - ONLINE_WINDOW_MS - 5_000);
  await Promise.all([
    User.findByIdAndUpdate(userId, { lastSeen: offlineAt }),
    Conversation.updateMany(
      { typingUserId: toOid(userId) },
      { $unset: { typingUserId: 1, typingUntil: 1 } },
    ),
  ]);
}

export async function setConversationTyping(params: {
  conversationId: string;
  userId: string;
  typing: boolean;
}) {
  const { conversationId, userId, typing } = params;
  await connectDB();
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !assertParticipant(conversation, userId)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  if (typing) {
    await Conversation.updateOne(
      { _id: conversation._id },
      {
        $set: {
          typingUserId: toOid(userId),
          typingUntil: new Date(Date.now() + TYPING_WINDOW_MS),
        },
      },
    );
    return {
      typingUserId: userId,
      typingUntil: new Date(Date.now() + TYPING_WINDOW_MS),
    };
  }

  if (String(conversation.typingUserId || "") === String(userId)) {
    await Conversation.updateOne(
      { _id: conversation._id },
      { $unset: { typingUserId: 1, typingUntil: 1 } },
    );
  }
  return { typingUserId: null, typingUntil: null };
}

/** Admin: list all conversations for dispute review (bypasses participant check). */
export async function adminListConversations(params: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  await connectDB();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 30));
  const skip = (page - 1) * limit;
  const q = (params.q || "").trim();

  let filter: Record<string, unknown> = {};
  if (q) {
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("_id")
      .limit(40)
      .lean();
    const ids = users.map((u) => u._id);
    if (Types.ObjectId.isValid(q)) {
      ids.push(new Types.ObjectId(q));
      filter = {
        $or: [
          { participants: { $in: ids } },
          { _id: new Types.ObjectId(q) },
        ],
      };
    } else if (ids.length) {
      filter = { participants: { $in: ids } };
    } else {
      return { conversations: [], total: 0, page, pages: 1 };
    }
  }

  const [items, total, conversationCount, messageCount] = await Promise.all([
    Conversation.find(filter)
      .sort({ lastMessageTime: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("participants", "name email profilePicture role lastSeen isBlocked phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys createdAt")
      .populate("productId", "name images price brand deviceModel status")
      .lean(),
    Conversation.countDocuments(filter),
    Conversation.countDocuments(),
    Message.countDocuments(),
  ]);

  const convIds = items.map((c) => c._id);
  const messageCounts = await Message.aggregate([
    { $match: { conversationId: { $in: convIds } } },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map<string, number>(
    messageCounts.map((r: { _id: Types.ObjectId; count: number }) => [
      String(r._id),
      r.count,
    ]),
  );

  const conversations = items.map((c) => ({
    ...c,
    _id: String(c._id),
    participants: (c.participants as any[]).map((p) => ({
      ...p,
      _id: String(p._id),
      online: isRecentlyOnline(p.lastSeen),
    })),
    productId:
      c.productId && typeof c.productId === "object"
        ? {
            ...(c.productId as object),
            _id: String((c.productId as any)._id),
          }
        : c.productId
          ? String(c.productId)
          : undefined,
    messageCount: countMap.get(String(c._id)) || 0,
  }));

  return {
    conversations,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    stats: { conversationCount, messageCount },
  };
}

/** Admin: full conversation + messages for dispute review. */
export async function adminGetConversation(conversationId: string) {
  await connectDB();
  const conversation = await Conversation.findById(conversationId)
    .populate("participants", "name email profilePicture role lastSeen isBlocked phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys createdAt")
    .populate("productId", "name images price brand deviceModel status slug")
    .lean();
  if (!conversation) return null;

  const messages = await Message.find({ conversationId: toOid(conversationId) })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();

  return {
    conversation: {
      ...conversation,
      _id: String(conversation._id),
      participants: (conversation.participants as any[]).map((p) => ({
        ...p,
        _id: String(p._id),
        online: isRecentlyOnline(p.lastSeen),
      })),
      productId:
        conversation.productId && typeof conversation.productId === "object"
          ? {
              ...(conversation.productId as object),
              _id: String((conversation.productId as any)._id),
            }
          : conversation.productId
            ? String(conversation.productId)
            : undefined,
    },
    messages: messages.map((m) => ({
      ...m,
      _id: String(m._id),
      conversationId: String(m.conversationId),
      senderId: String(m.senderId),
      receiverId: String(m.receiverId),
    })),
  };
}

/** Admin: hard-delete a message (moderation). */
export async function adminDeleteMessage(messageId: string) {
  await connectDB();
  const msg = await Message.findByIdAndDelete(messageId);
  if (!msg) {
    throw Object.assign(new Error("Message not found"), { status: 404 });
  }
  return { deleted: true, messageId: String(messageId) };
}

export type { IMessage, IConversation };
