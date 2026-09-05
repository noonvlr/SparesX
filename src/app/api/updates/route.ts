import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SiteUpdate } from "@/lib/models/SiteUpdate";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { serializeSiteUpdate } from "@/lib/updates/format";

/** Logged-in users see published site updates (dashboard feed). */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "8", 10) || 8),
    );

    const docs = await SiteUpdate.find({ isPublished: true })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      updates: docs.map((d) => serializeSiteUpdate(d)),
    });
  } catch (error) {
    console.error("[updates GET]", error);
    return NextResponse.json(
      { message: "Failed to load updates", updates: [] },
      { status: 500 },
    );
  }
}
