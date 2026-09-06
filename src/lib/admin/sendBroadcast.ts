import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { sanitizeChatText } from "@/lib/chat/sanitize";
import {
  getOrCreateConversation,
  sendMessage,
} from "@/lib/chat/chatService";
import { User } from "@/lib/models/User";
import { Broadcast } from "@/lib/models/Broadcast";
import { BroadcastRecipient } from "@/lib/models/BroadcastRecipient";
import {
  BROADCAST_MAX_RECIPIENTS,
  BROADCAST_MAX_TEXT,
  applyMessageVariables,
  resolveBroadcastAudience,
  type BroadcastFilters,
} from "@/lib/admin/broadcastAudience";

export async function previewBroadcastAudience(filters: BroadcastFilters) {
  const audience = await resolveBroadcastAudience(filters);
  const sampleName = await sampleRecipientName(audience.userIds[0]);
  return {
    matched: audience.matchedCount,
    eligible: audience.eligibleCount,
    overLimit: audience.overLimit,
    maxRecipients: audience.maxRecipients,
    canSend:
      audience.eligibleCount > 0 &&
      !audience.overLimit &&
      audience.matchedCount <= audience.maxRecipients,
    exclusions: audience.exclusions,
    description: audience.description,
    chips: audience.chips,
    sampleName,
  };
}

async function sampleRecipientName(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const u = await User.findById(userId).select("name").lean();
  return u?.name?.trim() || null;
}

function serializeBroadcast(doc: {
  _id: Types.ObjectId;
  createdBy: Types.ObjectId;
  text: string;
  filters: Record<string, unknown>;
  audienceDescription: string;
  status: string;
  matchedCount: number;
  eligibleCount: number;
  attemptedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  maxRecipients: number;
  overLimit: boolean;
  errorSummary: string[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  idempotencyKey?: string;
}) {
  return {
    _id: String(doc._id),
    createdBy: String(doc.createdBy),
    text: doc.text,
    filters: doc.filters,
    audienceDescription: doc.audienceDescription,
    status: doc.status,
    matchedCount: doc.matchedCount,
    eligibleCount: doc.eligibleCount,
    attemptedCount: doc.attemptedCount,
    sentCount: doc.sentCount,
    failedCount: doc.failedCount,
    skippedCount: doc.skippedCount,
    maxRecipients: doc.maxRecipients,
    overLimit: doc.overLimit,
    errorSummary: doc.errorSummary || [],
    startedAt: doc.startedAt?.toISOString?.() || doc.startedAt || null,
    completedAt: doc.completedAt?.toISOString?.() || doc.completedAt || null,
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  };
}

export async function sendAdminBroadcast(params: {
  adminId: string;
  text: string;
  filters: BroadcastFilters;
  idempotencyKey: string;
}) {
  const key = String(params.idempotencyKey || "").trim().slice(0, 80);
  if (!key || key.length < 8) {
    throw Object.assign(new Error("Idempotency key required"), { status: 400 });
  }

  const clean = sanitizeChatText(params.text || "", BROADCAST_MAX_TEXT);
  if (!clean || clean.length < 2) {
    throw Object.assign(new Error("Message text is required"), { status: 400 });
  }
  if (clean.length > BROADCAST_MAX_TEXT) {
    throw Object.assign(
      new Error(`Message is too long (max ${BROADCAST_MAX_TEXT} characters)`),
      { status: 400 },
    );
  }

  await connectDB();

  const existing = await Broadcast.findOne({ idempotencyKey: key }).lean();
  if (existing) {
    return {
      ...serializeBroadcast(existing as never),
      duplicate: true,
      message: `Broadcast already ${existing.status}`,
    };
  }

  const filters: BroadcastFilters = {
    ...params.filters,
    excludeUserId: params.adminId,
  };

  const audience = await resolveBroadcastAudience(filters);

  if (audience.overLimit) {
    throw Object.assign(
      new Error(
        `${audience.matchedCount} users match, but broadcasts are limited to ${BROADCAST_MAX_RECIPIENTS}. Narrow your filters before sending.`,
      ),
      { status: 400 },
    );
  }

  if (audience.eligibleCount === 0 || audience.userIds.length === 0) {
    throw Object.assign(
      new Error("No eligible users match these filters"),
      { status: 400 },
    );
  }

  let broadcast;
  try {
    broadcast = await Broadcast.create({
      createdBy: params.adminId,
      idempotencyKey: key,
      text: clean,
      filters,
      audienceDescription: audience.description,
      status: "processing",
      matchedCount: audience.matchedCount,
      eligibleCount: audience.eligibleCount,
      attemptedCount: audience.userIds.length,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      maxRecipients: BROADCAST_MAX_RECIPIENTS,
      overLimit: false,
      startedAt: new Date(),
      errorSummary: [],
    });
  } catch (err: unknown) {
    // Race on unique idempotencyKey
    const again = await Broadcast.findOne({ idempotencyKey: key }).lean();
    if (again) {
      return {
        ...serializeBroadcast(again as never),
        duplicate: true,
        message: `Broadcast already ${again.status}`,
      };
    }
    throw err;
  }

  await BroadcastRecipient.insertMany(
    audience.userIds.map((userId) => ({
      broadcastId: broadcast._id,
      userId,
      status: "pending",
    })),
    { ordered: false },
  ).catch(() => {
    // ignore duplicate insert races
  });

  const nameMap = new Map<string, string>();
  const nameDocs = await User.find({
    _id: { $in: audience.userIds.map((id) => new Types.ObjectId(id)) },
  })
    .select("name")
    .lean();
  for (const u of nameDocs) {
    nameMap.set(String(u._id), u.name || "there");
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const chunkSize = 8;

  for (let i = 0; i < audience.userIds.length; i += chunkSize) {
    const chunk = audience.userIds.slice(i, i + chunkSize);
    const results = await Promise.allSettled(
      chunk.map(async (peerId) => {
        const personalized = applyMessageVariables(clean, {
          name: nameMap.get(peerId),
        });
        const conversation = await getOrCreateConversation({
          userId: params.adminId,
          peerId,
          skipRateLimit: true,
        });
        const result = await sendMessage({
          conversationId: String(conversation._id),
          senderId: params.adminId,
          type: "text",
          text: personalized,
          receiverOnline: false,
          receiverViewing: false,
          skipRateLimit: true,
        });
        await BroadcastRecipient.updateOne(
          { broadcastId: broadcast._id, userId: peerId },
          {
            $set: {
              status: "sent",
              conversationId: conversation._id,
              messageId: result.message._id,
              sentAt: new Date(),
              error: undefined,
            },
          },
        );
      }),
    );

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const peerId = chunk[j];
      if (r.status === "fulfilled") {
        sent += 1;
      } else {
        failed += 1;
        const msg =
          r.reason instanceof Error ? r.reason.message : "send failed";
        if (errors.length < 8) errors.push(msg);
        await BroadcastRecipient.updateOne(
          { broadcastId: broadcast._id, userId: peerId },
          {
            $set: {
              status: "failed",
              error: String(msg).slice(0, 300),
            },
          },
        );
      }
    }

    await Broadcast.updateOne(
      { _id: broadcast._id },
      { $set: { sentCount: sent, failedCount: failed, errorSummary: errors } },
    );
  }

  const status =
    failed === 0
      ? "completed"
      : sent === 0
        ? "failed"
        : "partial";

  broadcast.status = status;
  broadcast.sentCount = sent;
  broadcast.failedCount = failed;
  broadcast.errorSummary = errors;
  broadcast.completedAt = new Date();
  await broadcast.save();

  return {
    ...serializeBroadcast(broadcast),
    duplicate: false,
    message:
      status === "completed"
        ? `Sent ${sent} of ${audience.userIds.length} messages`
        : status === "partial"
          ? `Partially completed: ${sent} sent, ${failed} failed`
          : `Broadcast failed: ${failed} errors`,
  };
}

export async function listBroadcastHistory(params: {
  page?: number;
  limit?: number;
}) {
  await connectDB();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const total = await Broadcast.countDocuments();
  const rows = await Broadcast.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("createdBy", "name email")
    .lean();

  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    rows: rows.map((doc) => ({
      ...serializeBroadcast(doc as never),
      admin:
        doc.createdBy && typeof doc.createdBy === "object"
          ? {
              _id: String((doc.createdBy as { _id: Types.ObjectId })._id),
              name: (doc.createdBy as { name?: string }).name || "Admin",
              email: (doc.createdBy as { email?: string }).email || "",
            }
          : null,
    })),
  };
}

export async function getBroadcastDetail(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error("Broadcast not found"), { status: 404 });
  }
  const doc = await Broadcast.findById(id)
    .populate("createdBy", "name email")
    .lean();
  if (!doc) {
    throw Object.assign(new Error("Broadcast not found"), { status: 404 });
  }

  const recipients = await BroadcastRecipient.find({ broadcastId: doc._id })
    .sort({ updatedAt: -1 })
    .limit(100)
    .populate("userId", "name email role city")
    .lean();

  return {
    broadcast: {
      ...serializeBroadcast(doc as never),
      admin:
        doc.createdBy && typeof doc.createdBy === "object"
          ? {
              _id: String((doc.createdBy as { _id: Types.ObjectId })._id),
              name: (doc.createdBy as { name?: string }).name || "Admin",
              email: (doc.createdBy as { email?: string }).email || "",
            }
          : null,
    },
    recipients: recipients.map((r) => ({
      _id: String(r._id),
      status: r.status,
      error: r.error || null,
      sentAt: r.sentAt ? new Date(r.sentAt).toISOString() : null,
      conversationId: r.conversationId ? String(r.conversationId) : null,
      messageId: r.messageId ? String(r.messageId) : null,
      user:
        r.userId && typeof r.userId === "object"
          ? {
              _id: String((r.userId as { _id: Types.ObjectId })._id),
              name: (r.userId as { name?: string }).name || "—",
              email: (r.userId as { email?: string }).email || "",
              role: (r.userId as { role?: string }).role || "",
              city: (r.userId as { city?: string }).city || "",
            }
          : { _id: String(r.userId), name: "—", email: "", role: "", city: "" },
    })),
  };
}
