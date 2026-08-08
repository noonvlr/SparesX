import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { bumpSessionVersion } from "@/lib/auth/sessionVersion";

/**
 * POST /api/auth/logout — invalidate this user's JWTs (best-effort).
 * Client should still clear localStorage.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  const payload = verifyJwt(authHeader.split(" ")[1]);
  if (payload?.id) {
    try {
      await bumpSessionVersion(payload.id);
    } catch {
      // still return ok so client logout proceeds
    }
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
