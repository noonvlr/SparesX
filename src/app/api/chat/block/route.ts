import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import {
  blockPeer,
  listBlockedPeerIds,
  unblockPeer,
} from "@/lib/chat/peerBlock";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  const ids = await listBlockedPeerIds(auth.id);
  return NextResponse.json({ blockedUserIds: ids }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

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

  const body = await req.json().catch(() => null);
  const peerId = String(body?.userId || "").trim();
  if (!peerId) {
    return NextResponse.json({ message: "userId required" }, { status: 400 });
  }

  await unblockPeer(auth.id, peerId);
  return NextResponse.json({ ok: true, blocked: false }, { status: 200 });
}
