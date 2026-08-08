import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import {
  blockPeer,
  listBlockedPeers,
  unblockPeer,
} from "@/lib/chat/peerBlock";
import { checkRateLimitAsync } from "@/lib/security/authRateLimit";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  const peers = await listBlockedPeers(auth.id);
  return NextResponse.json(
    {
      blockedUserIds: peers.map((p) => p._id),
      blockedUsers: peers,
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  const rate = await checkRateLimitAsync({
    key: `chat:block:${auth.id}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Too many block actions. Try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const peerId = String(body?.userId || "").trim();
  if (!peerId) {
    return NextResponse.json({ message: "userId required" }, { status: 400 });
  }

  try {
    await blockPeer(auth.id, peerId);
    return NextResponse.json({ ok: true, blocked: true }, { status: 200 });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    const message =
      err instanceof Error ? err.message : "Could not block user";
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  const rate = await checkRateLimitAsync({
    key: `chat:block:${auth.id}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Too many block actions. Try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const peerId = String(body?.userId || "").trim();
  if (!peerId) {
    return NextResponse.json({ message: "userId required" }, { status: 400 });
  }

  await unblockPeer(auth.id, peerId);
  return NextResponse.json({ ok: true, blocked: false }, { status: 200 });
}
