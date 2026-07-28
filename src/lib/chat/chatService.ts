import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Conversation, IConversation } from "@/lib/models/Conversation";
import { Message, IMessage, MessageType } from "@/lib/models/Message";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { previewFromMessage, sanitizeChatText } from "@/lib/chat/sanitize";
import {
  conversationCreateLimiter,
  messageRateLimiter,
} from "@/lib/chat/rateLimit";

void User;
void Product;

function toOid(id: string | Types.ObjectId) {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function assertParticipant(
  conversation: IConversation,
  userId: string,
): boolean {
  return conversation.participants.some((p) => String(p) === userId);
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
  if (!conversationCreateLimiter.check(userId)) {
    throw Object.assign(new Error("Too many conversation requests"), {
      status: 429,
    });
  }

  await connectDB();

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
  const filter: Record<string, unknown> = {
    participants: { $all: [toOid(p1), toOid(p2)], $size: 2 },
  };
  if (productId) {
    filter.productId = toOid(productId);
  } else {
    filter.productId = { $exists: false };
  }

  let conversation = await Conversation.findOne(filter);
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [toOid(p1), toOid(p2)],
      ...(productId ? { productId: toOid(productId) } : {}),
      unreadCounts: new Map([
        [userId, 0],
        [peerId, 0],
      ]),
    });
  }

  return conversation;
}

export async function listConversations(userId: string, page = 1, limit = 30) {
  await connectDB();
  const skip = (page - 1) * limit;
  const filter = { participants: toOid(userId) };

  const [items, total] = await Promise.all([
    Conversation.find(filter)
      .sort({ lastMessageTime: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("participants", "name profilePicture lastSeen role")
      .populate("productId", "name images price brand deviceModel slug status")
      .lean(),
    Conversation.countDocuments(filter),
  ]);

  const conversations = items.map((c) => {
    const unread =
      (c.unreadCounts instanceof Map
        ? c.unreadCounts.get(userId)
        : (c.unreadCounts as Record<string, number> | undefined)?.[userId]) || 0;
    const peer = (c.participants as any[]).find((p) => String(p._id) !== userId);
    return {
      ...c,
      unreadCount: unread,
      peer,
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
    .populate("participants", "name profilePicture lastSeen role")
    .populate("productId", "name images price brand deviceModel slug status")
    .lean();
  if (!conversation) return null;
  if (!conversation.participants.some((p: any) => String(p._id || p) === userId)) {
    return null;
  }
  return conversation;
}

export async function listMessages(params: {
  conversationId: string;
  userId: string;
  cursor?: string;
  limit?: number;
}) {
  const { conversationId, userId, cursor, limit = 40 } = params;
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

  if (!messageRateLimiter.check(senderId)) {
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
  const conversations = await Conversation.find({
    participants: toOid(userId),
  })
    .select("unreadCounts")
    .lean();

  let total = 0;
  for (const c of conversations) {
    const counts = c.unreadCounts as Map<string, number> | Record<string, number>;
    if (counts instanceof Map) {
      total += counts.get(userId) || 0;
    } else if (counts && typeof counts === "object") {
      total += Number((counts as any)[userId] || 0);
    }
  }
  return total;
}

export async function updateLastSeen(userId: string) {
  await connectDB();
  await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
}

export type { IMessage, IConversation };
