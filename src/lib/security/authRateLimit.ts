/**
 * Rate limiter — in-memory fast path + optional Mongo shared store.
 * When MONGODB is connected, checkRateLimitAsync uses RateLimitBucket so
 * limits work across serverless instances. Sync checkRateLimit stays for
 * callers that cannot await (rare); prefer async in API routes.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(params.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return { ok: true };
  }
  if (existing.count >= params.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { ok: true };
}

/**
 * Shared rate limit via Mongo when available; falls back to in-memory.
 */
export async function checkRateLimitAsync(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  try {
    const { connectDB } = await import("@/lib/db/connect");
    const { RateLimitBucket } = await import("@/lib/models/RateLimitBucket");
    await connectDB();

    const now = new Date();
    const existing = await RateLimitBucket.findById(params.key).lean();

    if (!existing || existing.resetAt <= now) {
      const resetAt = new Date(now.getTime() + params.windowMs);
      await RateLimitBucket.findByIdAndUpdate(
        params.key,
        { $set: { count: 1, resetAt } },
        { upsert: true },
      );
      // Keep memory in sync for hot paths
      buckets.set(params.key, { count: 1, resetAt: resetAt.getTime() });
      return { ok: true };
    }

    if (existing.count >= params.limit) {
      return {
        ok: false,
        retryAfterSec: Math.max(
          1,
          Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000),
        ),
      };
    }

    const updated = await RateLimitBucket.findOneAndUpdate(
      {
        _id: params.key,
        count: { $lt: params.limit },
        resetAt: { $gt: now },
      },
      { $inc: { count: 1 } },
      { new: true },
    );

    if (!updated) {
      const again = await RateLimitBucket.findById(params.key).lean();
      return {
        ok: false,
        retryAfterSec: Math.max(
          1,
          Math.ceil(
            ((again?.resetAt?.getTime() || now.getTime()) - now.getTime()) /
              1000,
          ),
        ),
      };
    }

    buckets.set(params.key, {
      count: updated.count,
      resetAt: updated.resetAt.getTime(),
    });
    return { ok: true };
  } catch {
    // DB unavailable — memory fallback
    return checkRateLimit(params);
  }
}

export function clientIpFromRequest(req: {
  headers: { get(name: string): string | null };
}): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/** Convenience for NextRequest handlers */
export async function enforceRateLimit(
  req: NextRequest,
  opts: { key: string; limit: number; windowMs: number },
): Promise<NextResponse | null> {
  const rate = await checkRateLimitAsync(opts);
  if (rate.ok) return null;
  return NextResponse.json(
    { message: "Too many requests. Try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSec) },
    },
  );
}
