import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";

export {
  DEFAULT_REQUEST_EXPIRE_DAYS,
  REQUEST_EXPIRE_DAY_OPTIONS,
  isValidRequestExpireDays,
  normalizeRequestExpireDays,
  requestExpiresAt,
  type RequestExpireDays,
} from "@/lib/requests/expireOptions";

/** Keep open-board queries free of expired requests; legacy rows without expiresAt stay visible until cron/backfill. */
export function openRequestActiveFilter(now = new Date()) {
  return {
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: null },
      { expiresAt: { $exists: false } },
    ],
  };
}

export type CleanupExpiredRequestsResult = {
  scanned: number;
  deleted: number;
  cutoff: string;
};

/** Hard-delete open (and stale) requests past expiresAt. */
export async function cleanupExpiredRequests(options?: {
  limit?: number;
}): Promise<CleanupExpiredRequestsResult> {
  const limit = Math.min(Math.max(options?.limit ?? 200, 1), 500);
  const now = new Date();
  await connectDB();

  const candidates = await RequestModel.find({
    expiresAt: { $lte: now },
  })
    .select("_id")
    .limit(limit)
    .lean();

  if (candidates.length === 0) {
    return { scanned: 0, deleted: 0, cutoff: now.toISOString() };
  }

  const ids = candidates.map((c) => c._id);
  const result = await RequestModel.deleteMany({ _id: { $in: ids } });

  return {
    scanned: candidates.length,
    deleted: result.deletedCount || 0,
    cutoff: now.toISOString(),
  };
}
