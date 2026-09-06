import { sanitizeChatText } from "@/lib/chat/sanitize";
import {
  getOrCreateConversation,
  sendMessage,
} from "@/lib/chat/chatService";
import {
  BROADCAST_MAX_RECIPIENTS,
  resolveBroadcastAudience,
  type BroadcastFilters,
} from "@/lib/admin/broadcastAudience";

export async function previewBroadcastAudience(filters: BroadcastFilters) {
  const { userIds, totalMatched } = await resolveBroadcastAudience(filters);
  return {
    matched: totalMatched,
    willSend: Math.min(totalMatched, BROADCAST_MAX_RECIPIENTS),
    capped: totalMatched > BROADCAST_MAX_RECIPIENTS,
    maxRecipients: BROADCAST_MAX_RECIPIENTS,
    sampleIds: userIds.slice(0, 20),
  };
}

export async function sendAdminBroadcast(params: {
  adminId: string;
  text: string;
  filters: BroadcastFilters;
}) {
  const clean = sanitizeChatText(params.text || "");
  if (!clean || clean.length < 2) {
    throw Object.assign(new Error("Message text is required"), { status: 400 });
  }
  if (clean.length > 2000) {
    throw Object.assign(new Error("Message is too long (max 2000 characters)"), {
      status: 400,
    });
  }

  const filters: BroadcastFilters = {
    ...params.filters,
    excludeUserId: params.adminId,
  };

  const { userIds, totalMatched } = await resolveBroadcastAudience(filters);
  if (userIds.length === 0) {
    throw Object.assign(new Error("No users match these filters"), {
      status: 400,
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Sequential in small chunks to avoid hammering Mongo / SMTP.
  const chunkSize = 8;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map(async (peerId) => {
        const conversation = await getOrCreateConversation({
          userId: params.adminId,
          peerId,
          skipRateLimit: true,
        });
        await sendMessage({
          conversationId: String(conversation._id),
          senderId: params.adminId,
          type: "text",
          text: clean,
          receiverOnline: false,
          receiverViewing: false,
          skipRateLimit: true,
        });
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled") sent += 1;
      else {
        failed += 1;
        const msg =
          r.reason instanceof Error ? r.reason.message : "send failed";
        if (errors.length < 5) errors.push(msg);
      }
    }
  }

  return {
    matched: totalMatched,
    attempted: userIds.length,
    sent,
    failed,
    capped: totalMatched > BROADCAST_MAX_RECIPIENTS,
    maxRecipients: BROADCAST_MAX_RECIPIENTS,
    errors,
  };
}
