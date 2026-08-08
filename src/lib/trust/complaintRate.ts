import mongoose from "mongoose";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";

/**
 * Recompute complaintRate from upheld abuse reports vs completed sales.
 * Rate is 0–100 (percent of sales that drew an upheld complaint).
 */
export async function recomputeComplaintRate(
  userId: string | mongoose.Types.ObjectId,
): Promise<number> {
  const upheld = await SupportRequest.countDocuments({
    reportedUser: userId,
    type: "abuse",
    status: { $in: ["resolved", "closed"] },
    complaintUpheld: { $ne: false },
  });

  const user = await User.findById(userId).select("completedSales").lean();
  if (!user) return 0;

  const sales = Math.max(0, user.completedSales ?? 0);
  let rate = 0;
  if (upheld > 0) {
    rate =
      sales === 0
        ? Math.min(100, upheld * 25)
        : Math.min(100, Math.round((100 * upheld) / sales));
  }

  await User.updateOne(
    { _id: userId },
    { $set: { complaintRate: rate, complaintCount: upheld } },
  );

  try {
    const { recomputeUserBadges } = await import("@/lib/badges/engine");
    await recomputeUserBadges(String(userId));
  } catch (err) {
    console.warn("[trust] badge recompute after complaintRate failed:", err);
  }

  return rate;
}
