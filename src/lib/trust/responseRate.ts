import mongoose from "mongoose";
import { User } from "@/lib/models/User";

/** Recompute responseRate = hits / opportunities (0–100). */
export async function recomputeResponseRate(
  userId: string | mongoose.Types.ObjectId,
): Promise<void> {
  const user = await User.findById(userId)
    .select("chatInboundOpportunities chatResponseHits")
    .lean();
  if (!user) return;
  const opportunities = Math.max(0, user.chatInboundOpportunities ?? 0);
  const hits = Math.max(0, user.chatResponseHits ?? 0);
  const rate =
    opportunities === 0
      ? 0
      : Math.min(100, Math.round((100 * Math.min(hits, opportunities)) / opportunities));
  await User.updateOne({ _id: userId }, { $set: { responseRate: rate } });
}

export const RESPONSE_WINDOW_MS = 24 * 60 * 60 * 1000;
