import { SiteUpdate } from "@/lib/models/SiteUpdate";
import { User } from "@/lib/models/User";
import { recomputeUserBadges } from "@/lib/badges/engine";
import {
  DEFAULT_BUG_THANKS_POINTS,
  normalizeBugThanksPoints,
} from "@/lib/updates/format";

/**
 * Grant trust points once per published bug_thanks update.
 * Amount comes from SiteUpdate.rewardPoints (falls back to default).
 * Idempotent via SiteUpdate.pointsAwarded.
 */
export async function awardBugThanksPoints(opts: {
  siteUpdateId: string;
  userId: string;
}): Promise<boolean> {
  const update = await SiteUpdate.findOneAndUpdate(
    {
      _id: opts.siteUpdateId,
      kind: "bug_thanks",
      isPublished: true,
      pointsAwarded: { $ne: true },
      mentionedUser: opts.userId,
    },
    { $set: { pointsAwarded: true } },
    { new: true },
  );
  if (!update) return false;

  const points = normalizeBugThanksPoints(
    typeof update.rewardPoints === "number"
      ? update.rewardPoints
      : DEFAULT_BUG_THANKS_POINTS,
  );

  if (points > 0) {
    await User.findByIdAndUpdate(opts.userId, {
      $inc: { bugThanksPoints: points },
    });
    try {
      await recomputeUserBadges(opts.userId);
    } catch (err) {
      console.warn("[bugThanks] recompute badges failed:", err);
    }
  }
  return true;
}
