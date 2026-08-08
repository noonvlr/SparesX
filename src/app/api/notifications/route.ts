import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Notification } from "@/lib/models/Notification";
import { requireUser, isAuthError } from "@/lib/auth/requireUser";
import { countUnreadNotifications } from "@/lib/notifications/create";

/** GET /api/notifications — recent inbox items */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20),
    );

    const [items, unreadCount] = await Promise.all([
      Notification.find({ user: auth.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      countUnreadNotifications(auth.id),
    ]);

    return NextResponse.json(
      {
        items: items.map((n) => ({
          _id: String(n._id),
          type: n.type,
          title: n.title,
          body: n.body,
          href: n.href || null,
          readAt: n.readAt || null,
          createdAt: n.createdAt,
        })),
        unreadCount,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to load notifications" },
      { status: 500 },
    );
  }
}

/** PATCH /api/notifications — mark read (all or by ids) */
export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const all = body?.all === true;
    const ids = Array.isArray(body?.ids)
      ? body.ids.map(String).filter(Boolean).slice(0, 50)
      : [];

    const filter: Record<string, unknown> = {
      user: auth.id,
      readAt: null,
    };
    if (!all) {
      if (ids.length === 0) {
        return NextResponse.json(
          { message: "Provide ids or all: true" },
          { status: 400 },
        );
      }
      filter._id = { $in: ids };
    }

    const result = await Notification.updateMany(filter, {
      $set: { readAt: new Date() },
    });

    const unreadCount = await countUnreadNotifications(auth.id);
    return NextResponse.json(
      { modified: result.modifiedCount, unreadCount },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
