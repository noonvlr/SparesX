import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { UserBlock } from "@/lib/models/UserBlock";

function toOid(id: string | Types.ObjectId) {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

/** True if either user has blocked the other. */
export async function isPeerBlocked(
  userA: string,
  userB: string,
): Promise<boolean> {
  if (!userA || !userB || userA === userB) return false;
  await connectDB();
  const hit = await UserBlock.exists({
    $or: [
      { blocker: toOid(userA), blocked: toOid(userB) },
      { blocker: toOid(userB), blocked: toOid(userA) },
    ],
  });
  return Boolean(hit);
}

export async function blockPeer(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw Object.assign(new Error("Cannot block yourself"), { status: 400 });
  }
  await connectDB();
  await UserBlock.findOneAndUpdate(
    { blocker: toOid(blockerId), blocked: toOid(blockedId) },
    { $setOnInsert: { blocker: toOid(blockerId), blocked: toOid(blockedId) } },
    { upsert: true },
  );
}

export async function unblockPeer(blockerId: string, blockedId: string) {
  await connectDB();
  await UserBlock.deleteOne({
    blocker: toOid(blockerId),
    blocked: toOid(blockedId),
  });
}

export async function listBlockedPeerIds(blockerId: string): Promise<string[]> {
  await connectDB();
  const rows = await UserBlock.find({ blocker: toOid(blockerId) })
    .select("blocked")
    .lean();
  return rows.map((r) => String(r.blocked));
}
