import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredSoldProducts } from "@/lib/products/cleanupSoldProducts";

/**
 * Vercel Cron: purge sold products past the retention window.
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/cleanup-sold] CRON_SECRET is not configured");
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
    const result = await cleanupExpiredSoldProducts({ limit: 200 });
    if (result.deleted > 0) {
      try {
        const { revalidateListingCaches } = await import(
          "@/lib/products/revalidateListings"
        );
        revalidateListingCaches();
      } catch {
        // cache optional
      }
    }
    console.log("[cron/cleanup-sold]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/cleanup-sold] failed:", error);
    return NextResponse.json(
      { message: "Cleanup failed" },
      { status: 500 },
    );
  }
}
