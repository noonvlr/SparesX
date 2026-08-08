import type { Server, Socket } from "socket.io";
import {
  getOrCreateConversation,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
  softDeleteMessage,
  markMessagesDelivered,
  updateLastSeen,
  getTotalUnread,
  assertParticipant,
} from "../../src/lib/chat/chatService";
import {
  addSocket,
  removeSocket,
  isOnline,
  listOnlineUserIds,
  setViewing,
  isViewing,
} from "./presence";

function uid(socket: Socket) {
  return socket.data.userId as string;
}

export function registerSocketHandlers(io: Server, socket: Socket) {
  const userId = uid(socket);
  const becameOnline = addSocket(userId, socket.id);
  socket.join(userId);
  socket.emit("presence-snapshot", {
    userIds: listOnlineUserIds(),
  });

  void (async () => {
    try {
      await markMessagesDelivered({ receiverId: userId });
    } catch {
      // ignore
    }
    if (becameOnline) {
      socket.broadcast.emit("user-online", { userId });
    }
  })();

  socket.on("get-conversations", async (payload, ack) => {
    try {
      const page = payload?.page || 1;
      const limit = payload?.limit || 30;
      const data = await listConversations(userId, page, limit);
      const unreadTotal = await getTotalUnread(userId);
      ack?.({ ok: true, ...data, unreadTotal });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      ack?.({ ok: false, message });
    }
  });

  socket.on("get-messages", async (payload, ack) => {
    try {
      const { conversationId, cursor, limit } = payload || {};
      if (!conversationId) {
        ack?.({ ok: false, message: "conversationId required" });
        return;
      }
      const data = await listMessages({
        conversationId,
        userId,
        cursor,
        limit,
      });
      ack?.({ ok: true, ...data });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      ack?.({ ok: false, message });
    }
  });

  socket.on("join-conversation", async (payload, ack) => {
    try {
      const conversationId = payload?.conversationId;
      if (!conversationId) {
        ack?.({ ok: false, message: "conversationId required" });
        return;
      }

      // Membership first — only then join room / mark viewing
      const result = await markConversationRead({ conversationId, userId });
      setViewing(userId, conversationId);
      socket.join(`conv:${conversationId}`);

      for (const peerId of result.peerIds) {
        io.to(peerId).emit("message-read", {
          conversationId,
          readerId: userId,
        });
      }
      io.to(userId).emit("conversation-updated", {
        conversationId,
        unreadCount: 0,
      });
      ack?.({ ok: true, modifiedCount: result.modifiedCount });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      ack?.({ ok: false, message });
    }
  });

  socket.on("leave-conversation", (payload) => {
    const conversationId = payload?.conversationId;
    setViewing(userId, null);
    if (conversationId) socket.leave(`conv:${conversationId}`);
  });

  socket.on("send-message", async (payload, ack) => {
    try {
      const { conversationId, type, text, mediaUrl, peerId, productId } =
        payload || {};

      let convId = conversationId as string | undefined;
      if (!convId && peerId) {
        const conv = await getOrCreateConversation({
          userId,
          peerId,
          productId,
        });
        convId = String(conv._id);
      }
      if (!convId) {
        ack?.({ ok: false, message: "conversationId or peerId required" });
        return;
      }

      // Resolve online after we know the peer — sendMessage looks up receiver
      const result = await sendMessage({
        conversationId: convId,
        senderId: userId,
        type: type === "image" ? "image" : "text",
        text,
        mediaUrl,
        receiverOnline: false,
      });

      const receiverId = result.receiverId;
      const online = isOnline(receiverId);
      if (online) {
        result.message.delivered = true;
        result.message.deliveredAt = new Date();
        await result.message.save();
      }

      const plain =
        typeof (result.message as { toObject?: () => unknown }).toObject ===
        "function"
          ? (result.message as { toObject: () => unknown }).toObject()
          : result.message;

      const messagePayload = {
        message: plain,
        conversationId: convId,
      };

      socket.emit("message-sent", messagePayload);
      io.to(receiverId).emit("new-message", messagePayload);

      if (online) {
        io.to(userId).emit("message-delivered", {
          messageId: String(result.message._id),
          conversationId: convId,
        });
      }

      if (isViewing(receiverId, convId)) {
        await markConversationRead({
          conversationId: convId,
          userId: receiverId,
        });
        io.to(userId).emit("message-read", {
          conversationId: convId,
          readerId: receiverId,
          messageId: String(result.message._id),
        });
      } else {
        const unread = result.conversation.unreadCounts.get(receiverId) || 0;
        io.to(receiverId).emit("notification", {
          type: "chat",
          conversationId: convId,
          preview: result.conversation.lastMessage,
          fromUserId: userId,
          unreadCount: unread,
        });
      }

      io.to(userId).emit("conversation-updated", {
        conversationId: convId,
        lastMessage: result.conversation.lastMessage,
        lastMessageTime: result.conversation.lastMessageTime,
      });
      io.to(receiverId).emit("conversation-updated", {
        conversationId: convId,
        lastMessage: result.conversation.lastMessage,
        lastMessageTime: result.conversation.lastMessageTime,
        unreadCount: isViewing(receiverId, convId)
          ? 0
          : result.conversation.unreadCounts.get(receiverId) || 0,
      });

      ack?.({
        ok: true,
        message: plain,
        conversationId: convId,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to send";
      ack?.({ ok: false, message });
    }
  });

  socket.on("typing-start", async (payload) => {
    const { conversationId, peerId } = payload || {};
    if (!peerId || !conversationId) return;
    try {
      const { Conversation } = await import("../../src/lib/models/Conversation");
      const { connectDB } = await import("../../src/lib/db/connect");
      await connectDB();
      const conv = await Conversation.findById(conversationId)
        .select("participants")
        .lean();
      if (!conv || !assertParticipant(conv as any, userId)) return;
      if (!assertParticipant(conv as any, peerId)) return;
      io.to(peerId).emit("typing", { conversationId, userId });
    } catch {
      // ignore typing failures
    }
  });

  socket.on("typing-stop", async (payload) => {
    const { conversationId, peerId } = payload || {};
    if (!peerId || !conversationId) return;
    try {
      const { Conversation } = await import("../../src/lib/models/Conversation");
      const { connectDB } = await import("../../src/lib/db/connect");
      await connectDB();
      const conv = await Conversation.findById(conversationId)
        .select("participants")
        .lean();
      if (!conv || !assertParticipant(conv as any, userId)) return;
      if (!assertParticipant(conv as any, peerId)) return;
      io.to(peerId).emit("stop-typing", { conversationId, userId });
    } catch {
      // ignore
    }
  });

  socket.on("mark-read", async (payload, ack) => {
    try {
      const conversationId = payload?.conversationId;
      if (!conversationId) {
        ack?.({ ok: false, message: "conversationId required" });
        return;
      }
      const result = await markConversationRead({ conversationId, userId });
      for (const peerId of result.peerIds) {
        io.to(peerId).emit("message-read", {
          conversationId,
          readerId: userId,
        });
      }
      ack?.({ ok: true, modifiedCount: result.modifiedCount });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      ack?.({ ok: false, message });
    }
  });

  socket.on("delete-message", async (payload, ack) => {
    try {
      const messageId = payload?.messageId;
      if (!messageId) {
        ack?.({ ok: false, message: "messageId required" });
        return;
      }
      await softDeleteMessage({ messageId, userId });
      ack?.({ ok: true, messageId });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed";
      ack?.({ ok: false, message });
    }
  });

  socket.on("disconnect", async () => {
    const { wentOffline } = removeSocket(userId, socket.id);
    if (wentOffline) {
      try {
        await updateLastSeen(userId);
      } catch {
        // ignore
      }
      socket.broadcast.emit("user-offline", {
        userId,
        lastSeen: new Date().toISOString(),
      });
    }
  });
}
