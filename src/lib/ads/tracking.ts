import mongoose from "mongoose";
import { AdEvent, type AdEventDevice, type AdEventType } from "@/lib/models/AdEvent";
import { AdDailyStat } from "@/lib/models/AdDailyStat";
import { istDay } from "@/lib/ads/ist";
import { isLikelyBot } from "@/lib/analytics/visitRules";

export { formatCtr, formatCtrDisplay } from "@/lib/ads/ctr";

const BUCKET_MS = 30 * 60 * 1000;

/** sessionId|campaignId|placementKey|eventType|30-minute bucket */
export function buildDedupeKey(params: {
  sessionId: string;
  campaignId: string;
  placementKey: string;
  eventType: AdEventType;
  now?: Date;
}): string {
  const t = (params.now ?? new Date()).getTime();
  const bucket = Math.floor(t / BUCKET_MS);
  return [
    params.sessionId,
    params.campaignId,
    params.placementKey,
    params.eventType,
    String(bucket),
  ].join("|");
}

export type RecordPromoEventInput = {
  campaignId: string;
  placementKey: string;
  eventType: AdEventType;
  device: AdEventDevice;
  sessionId: string;
  userAgent?: string | null;
  now?: Date;
};

export type RecordPromoEventResult =
  | { counted: true; isBot: false }
  | { counted: false; reason: "duplicate" | "bot" | "invalid" };

/**
 * Insert AdEvent (unique dedupeKey). On success and non-bot, $inc AdDailyStat.
 * Duplicate-key → drop silently.
 */
export async function recordPromoEvent(
  input: RecordPromoEventInput,
): Promise<RecordPromoEventResult> {
  if (!mongoose.Types.ObjectId.isValid(input.campaignId)) {
    return { counted: false, reason: "invalid" };
  }
  if (!input.sessionId || input.sessionId.length < 8 || input.sessionId.length > 80) {
    return { counted: false, reason: "invalid" };
  }
  if (!input.placementKey || input.placementKey.length > 64) {
    return { counted: false, reason: "invalid" };
  }

  const now = input.now ?? new Date();
  const isBot = isLikelyBot(input.userAgent);
  const dedupeKey = buildDedupeKey({
    sessionId: input.sessionId,
    campaignId: input.campaignId,
    placementKey: input.placementKey,
    eventType: input.eventType,
    now,
  });

  try {
    await AdEvent.create({
      campaignId: new mongoose.Types.ObjectId(input.campaignId),
      placementKey: input.placementKey,
      eventType: input.eventType,
      device: input.device,
      dedupeKey,
      isBot,
      createdAt: now,
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 11000) {
      return { counted: false, reason: "duplicate" };
    }
    throw err;
  }

  if (isBot) {
    return { counted: false, reason: "bot" };
  }

  const istDate = istDay(now);
  const inc =
    input.eventType === "impression"
      ? { impressions: 1 }
      : { clicks: 1 };

  await AdDailyStat.findOneAndUpdate(
    {
      istDate,
      campaignId: new mongoose.Types.ObjectId(input.campaignId),
      placementKey: input.placementKey,
      device: input.device,
    },
    { $inc: inc },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { counted: true, isBot: false };
}
