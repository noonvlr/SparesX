import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  /** Sorted `${idA}_${idB}` — non-multikey unique pair identity */
  pairKey: string;
  productId?: Types.ObjectId;
  lastMessage?: string;
  lastMessageType?: "text" | "image";
  lastMessageTime?: Date;
  lastMessageSenderId?: Types.ObjectId;
  /** Per-user unread counts keyed by userId string */
  unreadCounts: Map<string, number>;
  /** 1:1 typing indicator (REST/Vercel-safe) */
  typingUserId?: Types.ObjectId;
  typingUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Stable key for a 1:1 participant pair (order-independent). */
export function conversationPairKey(a: string, b: string): string {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}_${y}`;
}

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      validate: {
        validator: (v: Types.ObjectId[]) => Array.isArray(v) && v.length === 2,
        message: "Conversation must have exactly two participants",
      },
    },
    pairKey: { type: String, required: true, trim: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    lastMessage: { type: String, maxlength: 2000 },
    lastMessageType: { type: String, enum: ["text", "image"] },
    lastMessageTime: { type: Date },
    lastMessageSenderId: { type: Schema.Types.ObjectId, ref: "User" },
    unreadCounts: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    typingUserId: { type: Schema.Types.ObjectId, ref: "User" },
    typingUntil: { type: Date },
  },
  { timestamps: true },
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageTime: -1 });

/**
 * Unique per pair + product. Uses pairKey (string), NOT participants array —
 * MongoDB multikey unique on participants wrongly blocked multiple buyers
 * chatting the same seller about the same product.
 */
ConversationSchema.index(
  { pairKey: 1, productId: 1 },
  {
    unique: true,
    partialFilterExpression: { productId: { $type: "objectId" } },
  },
);

/** Unique general (non-product) chat per pair */
ConversationSchema.index(
  { pairKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [{ productId: { $exists: false } }, { productId: null }],
    },
  },
);

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

let indexesReady: Promise<void> | null = null;

/** Drop legacy bad unique index, backfill pairKey, ensure current indexes (once per process). */
export async function ensureConversationIndexes() {
  if (indexesReady) return indexesReady;
  indexesReady = (async () => {
    try {
      const col = Conversation.collection;
      const existing = await col.indexes();
      const bad = existing.find(
        (idx) =>
          idx.name === "participants_1_productId_1" ||
          (idx.unique &&
            idx.key &&
            (idx.key as Record<string, number>).participants === 1 &&
            (idx.key as Record<string, number>).productId === 1),
      );
      if (bad?.name) {
        await col.dropIndex(bad.name);
        console.log(`[chat] Dropped legacy unique index ${bad.name}`);
      }

      // Backfill pairKey so new unique indexes can be built
      const missing = await Conversation.find({
        $or: [{ pairKey: { $exists: false } }, { pairKey: null }, { pairKey: "" }],
      })
        .select("participants")
        .lean();
      for (const doc of missing) {
        const ids = ((doc as { participants?: unknown[] }).participants || [])
          .map((p) => String(p))
          .sort();
        if (ids.length === 2) {
          await Conversation.updateOne(
            { _id: (doc as { _id: Types.ObjectId })._id },
            { $set: { pairKey: `${ids[0]}_${ids[1]}` } },
          );
        }
      }

      await Conversation.syncIndexes();
    } catch (err) {
      console.warn("[chat] ensureConversationIndexes:", err);
      indexesReady = null;
    }
  })();
  return indexesReady;
}
