import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredRequests } from "@/lib/requests/expiry";

/**
 * Vercel Cron: delete part requests past expiresAt.
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/cleanup-requests] CRON_SECRET is not configured");
    return NextResponse.json(
      { message: "Cron not configured" },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredRequests({ limit: 200 });
    console.log("[cron/cleanup-requests]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/cleanup-requests] failed:", error);
    return NextResponse.json(
      { message: "Cleanup failed" },
      { status: 500 },
    );
  }
}
