import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { connectDB } from "@/lib/db/connect";
import { PushSubscription } from "@/lib/models/PushSubscription";
import { getVapidPublicKey } from "@/lib/push/send";

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  if (!getVapidPublicKey()) {
    return NextResponse.json(
      { message: "Web push not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const endpoint = String(body?.endpoint || "").trim();
  const p256dh = String(body?.keys?.p256dh || "").trim();
  const authKey = String(body?.keys?.auth || "").trim();
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json(
      { message: "Invalid push subscription" },
      { status: 400 },
    );
  }

  await connectDB();
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      $set: {
        user: auth.id,
        endpoint,
        keys: { p256dh, auth: authKey },
        userAgent: req.headers.get("user-agent") || "",
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => null);
  const endpoint = String(body?.endpoint || "").trim();
  if (!endpoint) {
    return NextResponse.json({ message: "endpoint required" }, { status: 400 });
  }

  await connectDB();
  await PushSubscription.deleteOne({ endpoint, user: auth.id });
  return NextResponse.json({ ok: true }, { status: 200 });
}
