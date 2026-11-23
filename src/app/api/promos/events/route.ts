import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { verifyPromoToken } from "@/lib/ads/token";
import { recordPromoEvent } from "@/lib/ads/tracking";
import {
  checkRateLimitAsync,
  clientIpFromRequest,
} from "@/lib/security/authRateLimit";

type IncomingEvent = {
  token?: unknown;
  eventType?: unknown;
  device?: unknown;
  sessionId?: unknown;
};

/**
 * Batch impression/click events from sendBeacon / fetch keepalive.
 * Body: { events: [{ token, eventType, device, sessionId }] }
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromRequest(req);
    const rate = await checkRateLimitAsync({
      key: `promo-events:${ip}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { message: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSec) },
        },
      );
    }

    const body = await req.json().catch(() => null);
    const raw = Array.isArray(body?.events) ? body.events : null;
    if (!raw || raw.length === 0) {
      return NextResponse.json({ message: "No events" }, { status: 400 });
    }
    if (raw.length > 20) {
      return NextResponse.json({ message: "Too many events" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent");
    await connectDB();

    let accepted = 0;
    for (const row of raw as IncomingEvent[]) {
      const token = String(row.token || "").trim();
      const eventType = String(row.eventType || "").trim();
      const device = String(row.device || "").trim();
      const sessionId = String(row.sessionId || "").trim();

      if (eventType !== "impression" && eventType !== "click") continue;
      if (device !== "desktop" && device !== "mobile") continue;
      if (!token || !sessionId) continue;

      const payload = verifyPromoToken(token);
      if (!payload) continue;

      const result = await recordPromoEvent({
        campaignId: payload.campaignId,
        placementKey: payload.placementKey,
        eventType,
        device,
        sessionId,
        userAgent: ua,
      });
      if (result.counted) accepted += 1;
    }

    return NextResponse.json({ ok: true, accepted });
  } catch (error) {
    console.error("[promos/events POST]", error);
    return NextResponse.json({ message: "Unavailable" }, { status: 503 });
  }
}
