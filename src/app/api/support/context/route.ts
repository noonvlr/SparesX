import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import {
  SUPPORT_TARGET_SET,
  type SupportTargetType,
} from "@/lib/support/constants";
import {
  resolveSupportContext,
  toPublicContextPreview,
} from "@/lib/support/resolveContext";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const rawType = searchParams.get("type") || "none";
    const targetType: SupportTargetType = SUPPORT_TARGET_SET.has(rawType)
      ? (rawType as SupportTargetType)
      : "none";

    await connectDB();
    const resolved = await resolveSupportContext({
      reporterId: auth.id,
      targetType,
      productId: searchParams.get("id") || searchParams.get("productId") || undefined,
      reportedUserId:
        searchParams.get("userId") ||
        searchParams.get("reportedUserId") ||
        (targetType === "user" ? searchParams.get("id") || undefined : undefined),
      conversationId: searchParams.get("conversationId") || undefined,
      messageId:
        searchParams.get("messageId") ||
        (targetType === "message" ? searchParams.get("id") || undefined : undefined),
      sourcePage: searchParams.get("source") || undefined,
      sourcePageType: searchParams.get("pageType") || undefined,
      forAdminSnapshot: false,
    });

    if (!resolved.ok) {
      return NextResponse.json(
        { message: resolved.message },
        { status: resolved.status },
      );
    }

    return NextResponse.json({
      context: toPublicContextPreview(resolved.context),
    });
  } catch (error) {
    console.error("[support/context]", error);
    return NextResponse.json(
      { message: "Failed to load report context" },
      { status: 500 },
    );
  }
}
