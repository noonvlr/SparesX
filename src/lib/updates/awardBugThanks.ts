import { SiteUpdate } from "@/lib/models/SiteUpdate";
import { User } from "@/lib/models/User";
import { recomputeUserBadges } from "@/lib/badges/engine";
import { BUG_THANKS_POINTS } from "@/lib/updates/format";

/**
 * Grant +BUG_THANKS_POINTS trust score once per published bug_thanks update.
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

  await User.findByIdAndUpdate(opts.userId, {
    $inc: { bugThanksPoints: BUG_THANKS_POINTS },
  });
  try {
    await recomputeUserBadges(opts.userId);
  } catch (err) {
    console.warn("[bugThanks] recompute badges failed:", err);
  }
  return true;
}
