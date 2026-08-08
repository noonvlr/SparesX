import { connectDB } from "@/lib/db/connect";
import {
  Notification,
  type NotificationType,
} from "@/lib/models/Notification";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
  /**
   * When set, updates an existing unread notification with the same key
   * instead of creating a new row (chat / alert collapse).
   */
  collapseKey?: string;
  /** Skip web-push when collapsing a recent unread notification (default true). */
  skipPushOnCollapse?: boolean;
}) {
  try {
    await connectDB();

    const title = params.title.slice(0, 120);
    const body = params.body.slice(0, 400);
    const href = params.href?.slice(0, 300);
    const collapseKey = params.collapseKey?.trim().slice(0, 120) || undefined;

    if (collapseKey) {
      const existing = await Notification.findOne({
        user: params.userId,
        collapseKey,
        readAt: null,
      }).sort({ updatedAt: -1 });

      if (existing) {
        const count =
          typeof existing.meta?.count === "number"
            ? existing.meta.count + 1
            : 2;
        existing.title = title;
        existing.body = body;
        if (href) existing.href = href;
        existing.meta = {
          ...(existing.meta || {}),
          ...(params.meta || {}),
          count,
          collapsedAt: new Date().toISOString(),
        };
        existing.type = params.type;
        await existing.save();
        return { created: false, id: String(existing._id), count };
      }
    }

    const doc = await Notification.create({
      user: params.userId,
      type: params.type,
      title,
      body,
      href,
      meta: {
        ...(params.meta || {}),
        ...(collapseKey ? { count: 1 } : {}),
      },
      collapseKey,
    });

    const { sendPushToUser } = await import("@/lib/push/send");
    void sendPushToUser({
      userId: params.userId,
      title: params.title,
      body: params.body,
      href: params.href,
    });

    return { created: true, id: String(doc._id), count: 1 };
  } catch (err) {
    console.warn("[notification] create failed:", err);
    return { created: false, id: null, count: 0 };
  }
}

export async function countUnreadNotifications(userId: string) {
  await connectDB();
  return Notification.countDocuments({
    user: userId,
    readAt: null,
  });
}
