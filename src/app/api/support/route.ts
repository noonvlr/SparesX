import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { createSupportCase } from "@/lib/support/createCase";
import { ensureCaseNumber } from "@/lib/support/caseNumber";
import { serializePublicCase } from "@/lib/support/serialize";

void User;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (isAuthError(auth)) return auth;

    await connectDB();
    const tickets = await SupportRequest.find({ user: auth.id })
      .sort({ userUnread: -1, updatedAt: -1 })
      .lean();

    for (const ticket of tickets) {
      await ensureCaseNumber(ticket);
    }

    const unreadCount = tickets.filter((t) => t.userUnread).length;

    return NextResponse.json(
      {
        tickets: tickets.map((t) => serializePublicCase(t)),
        unreadCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[support GET]", error);
    return NextResponse.json(
      { message: "Failed to fetch support requests" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (isAuthError(auth)) {
      return NextResponse.json(
        { message: "Login required to contact support" },
        { status: 401 },
      );
    }

    const { checkRateLimitAsync, clientIpFromRequest } = await import(
      "@/lib/security/authRateLimit"
    );
    const ip = clientIpFromRequest(req);
    const hourly = await checkRateLimitAsync({
      key: `support-post:${auth.id}:${ip}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!hourly.ok) {
      return NextResponse.json(
        { message: "Too many support tickets. Try again later." },
        { status: 429 },
      );
    }
    const daily = await checkRateLimitAsync({
      key: `support-post-day:${auth.id}`,
      limit: 20,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!daily.ok) {
      return NextResponse.json(
        { message: "Daily support limit reached. Try again tomorrow." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => ({}));
    await connectDB();
    const result = await createSupportCase({
      reporterId: auth.id,
      type: body.type,
      reason: body.reason,
      subject: body.subject,
      message: body.message,
      targetType: body.targetType,
      productId: body.productId,
      reportedUserId: body.reportedUserId,
      conversationId: body.conversationId,
      messageId: body.messageId,
      sourcePage: body.sourcePage,
      sourcePageType: body.sourcePageType,
      attachments: body.attachments,
    });

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status },
      );
    }

    const lean = result.ticket.toObject
      ? result.ticket.toObject()
      : result.ticket;
    await ensureCaseNumber(lean as { _id: unknown; caseNumber?: string });

    return NextResponse.json(
      {
        ticket: serializePublicCase(lean),
        duplicate: Boolean(result.duplicate),
        message: result.duplicate
          ? "You already have an open case for this. We opened that case instead of creating a duplicate."
          : undefined,
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    console.error("[support POST]", error);
    return NextResponse.json(
      { message: "Failed to submit support request" },
      { status: 500 },
    );
  }
}

/** Mark the current user's tickets as read (after viewing admin replies). */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json().catch(() => ({}));
    const ticketId = body?.ticketId as string | undefined;

    await connectDB();

    if (ticketId) {
      await SupportRequest.updateOne(
        { _id: ticketId, user: auth.id },
        { $set: { userUnread: false } },
      );
    } else {
      await SupportRequest.updateMany(
        { user: auth.id, userUnread: true },
        { $set: { userUnread: false } },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[support PATCH]", error);
    return NextResponse.json(
      { message: "Failed to mark as read" },
      { status: 500 },
    );
  }
}
