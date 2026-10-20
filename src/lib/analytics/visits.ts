import { connectDB } from "@/lib/db/connect";
import { SiteVisit } from "@/lib/models/SiteVisit";
import { recentUtcDays, utcDay } from "@/lib/analytics/visitRules";

export type UniqueVisitorStats = {
  today: number;
  last7: number;
  last30: number;
  allTime: number;
  series: { date: string; visitors: number }[];
};

/** Count this browser once for the UTC day. Duplicate calls are a no-op. */
export async function recordVisit(visitorKey: string, now = new Date()): Promise<void> {
  await connectDB();
  const day = utcDay(now);
  try {
    await SiteVisit.updateOne(
      { visitorKey, day },
      { $setOnInsert: { visitorKey, day } },
      { upsert: true },
    );
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return;
    throw err;
  }
}

export async function getUniqueVisitorStats(now = new Date()): Promise<UniqueVisitorStats> {
  await connectDB();
  const days = recentUtcDays(30, now);
  const today = days[days.length - 1];
  const since7 = days[days.length - 7];
  const since30 = days[0];

  const [todayCount, byDay, keys7, keys30, allTime] = await Promise.all([
    SiteVisit.countDocuments({ day: today }),
    SiteVisit.aggregate<{ _id: string; count: number }>([
      { $match: { day: { $gte: since30, $lte: today } } },
      { $group: { _id: "$day", count: { $sum: 1 } } },
    ]),
    SiteVisit.distinct("visitorKey", { day: { $gte: since7, $lte: today } }),
    SiteVisit.distinct("visitorKey", { day: { $gte: since30, $lte: today } }),
    SiteVisit.distinct("visitorKey"),
  ]);

  const counts = new Map(byDay.map((row) => [String(row._id), row.count || 0]));
  return {
    today: todayCount,
    last7: keys7.length,
    last30: keys30.length,
    allTime: allTime.length,
    series: days.map((date) => ({ date, visitors: counts.get(date) || 0 })),
  };
}
