import { NextRequest, NextResponse } from "next/server";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { errorResponse } from "@/lib/auth/requireUser";
import { normalizeBroadcastFilters } from "@/lib/admin/broadcastAudience";
import { sendAdminBroadcast } from "@/lib/admin/sendBroadcast";
import { checkRateLimitAsync } from "@/lib/security/authRateLimit";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const rate = await checkRateLimitAsync({
      key: `admin:broadcast:${admin.id}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { message: "Too many broadcasts. Try again later." },
        { status: 429 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const text = typeof body.text === "string" ? body.text : "";
    const filters = normalizeBroadcastFilters({
      ...(typeof body.filters === "object" && body.filters
        ? (body.filters as Record<string, unknown>)
        : body),
      excludeUserId: admin.id,
    });

    const result = await sendAdminBroadcast({
      adminId: admin.id,
      text,
      filters,
    });

    return NextResponse.json({
      message: `Sent ${result.sent} of ${result.attempted} messages`,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
