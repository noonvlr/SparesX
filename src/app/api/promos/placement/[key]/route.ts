import { NextRequest, NextResponse } from "next/server";
import { getEligibleAds } from "@/lib/ads/eligibility";
import { checkRateLimitAsync, clientIpFromRequest } from "@/lib/security/authRateLimit";

type Ctx = { params: Promise<{ key: string }> };

/**
 * Public eligible promo list for a placement (minimal payload).
 * Cached ~60s server-side; clients rotate + re-check dates.
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { key } = await ctx.params;
    const placementKey = String(key || "").trim();
    if (!placementKey || placementKey.length > 64) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const ip = clientIpFromRequest(req);
    const rate = await checkRateLimitAsync({
      key: `promo-placement:${ip}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { message: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }

    const payload = await getEligibleAds(placementKey);
    if (!payload) {
      return NextResponse.json(
        {
          placementKey,
          maxSlots: 1,
          fallbackToHouseAds: false,
          aspectDesktop: { width: 1, height: 1 },
          aspectMobile: null,
          items: [],
          fetchedAt: new Date().toISOString(),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
          },
        },
      );
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[promos/placement GET]", error);
    return NextResponse.json({ message: "Unavailable" }, { status: 503 });
  }
}
