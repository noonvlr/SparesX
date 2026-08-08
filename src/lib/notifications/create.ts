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
}) {
  try {
    await connectDB();
    await Notification.create({
      user: params.userId,
      type: params.type,
      title: params.title.slice(0, 120),
      body: params.body.slice(0, 400),
      href: params.href?.slice(0, 300),
      meta: params.meta,
    });
  } catch (err) {
    console.warn("[notification] create failed:", err);
  }
}

export async function countUnreadNotifications(userId: string) {
  await connectDB();
  return Notification.countDocuments({
    user: userId,
    readAt: null,
  });
}
