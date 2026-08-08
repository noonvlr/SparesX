import webpush from "web-push";
import { connectDB } from "@/lib/db/connect";
import { PushSubscription } from "@/lib/models/PushSubscription";
import { absoluteUrl } from "@/lib/seo/site";

function configured() {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

function ensureVapid() {
  if (!configured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export async function sendPushToUser(params: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  if (!ensureVapid()) return;

  try {
    await connectDB();
    const subs = await PushSubscription.find({ user: params.userId }).lean();
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title: params.title.slice(0, 120),
      body: params.body.slice(0, 200),
      url: params.href
        ? absoluteUrl(params.href)
        : absoluteUrl("/notifications"),
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            payload,
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          } else {
            console.warn("[push] send failed:", err);
          }
        }
      }),
    );
  } catch (err) {
    console.warn("[push] sendPushToUser failed:", err);
  }
}
