import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  VISIT_DAY_COOKIE,
  VISIT_ID_COOKIE,
} from "@/lib/auth/cookieNames";
import { recordVisit } from "@/lib/analytics/visits";
import {
  VISIT_RETENTION_DAYS,
  isLikelyBot,
  isVisitorId,
  utcDay,
} from "@/lib/analytics/visitRules";

const MAX_AGE_SEC = VISIT_RETENTION_DAYS * 24 * 60 * 60;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

/** Record one unique browser for today. No account or page URL is stored. */
export async function POST(req: NextRequest) {
  if (isLikelyBot(req.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const today = utcDay();
  const existing = req.cookies.get(VISIT_ID_COOKIE)?.value;
  const visitorKey = isVisitorId(existing) ? existing : randomBytes(16).toString("hex");
  const alreadyCounted = req.cookies.get(VISIT_DAY_COOKIE)?.value === today;

  const res = NextResponse.json(
    { ok: true, counted: !alreadyCounted },
    { headers: { "Cache-Control": "no-store" } },
  );
  res.cookies.set(VISIT_ID_COOKIE, visitorKey, cookieOptions());

  if (alreadyCounted) return res;

  try {
    await recordVisit(visitorKey);
    res.cookies.set(VISIT_DAY_COOKIE, today, cookieOptions());
  } catch (err) {
    console.warn("[analytics] visit record failed:", err instanceof Error ? err.name : "error");
  }
  return res;
}
