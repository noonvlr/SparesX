import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SEC = 15 * 60;

function secret(): string {
  const s = process.env.PROMO_HMAC_SECRET || process.env.JWT_SECRET;
  if (!s) {
    throw new Error("PROMO_HMAC_SECRET (or JWT_SECRET) is not configured");
  }
  return s;
}

export type PromoTokenPayload = {
  campaignId: string;
  placementKey: string;
  exp: number;
};

function encodePayload(payload: PromoTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(raw: string): PromoTokenPayload | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as PromoTokenPayload;
    if (
      typeof parsed.campaignId !== "string" ||
      typeof parsed.placementKey !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function signPromoToken(params: {
  campaignId: string;
  placementKey: string;
  ttlSec?: number;
  now?: number;
}): string {
  const exp =
    Math.floor((params.now ?? Date.now()) / 1000) +
    (params.ttlSec ?? DEFAULT_TTL_SEC);
  const body = encodePayload({
    campaignId: params.campaignId,
    placementKey: params.placementKey,
    exp,
  });
  return `${body}.${sign(body)}`;
}

export function verifyPromoToken(
  token: string,
  expected?: { campaignId?: string; placementKey?: string },
  nowMs: number = Date.now(),
): PromoTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  let expectedSig: string;
  try {
    expectedSig = sign(body);
  } catch {
    return null;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const payload = decodePayload(body);
  if (!payload) return null;
  if (payload.exp * 1000 < nowMs) return null;
  if (expected?.campaignId && payload.campaignId !== expected.campaignId) {
    return null;
  }
  if (
    expected?.placementKey &&
    payload.placementKey !== expected.placementKey
  ) {
    return null;
  }
  return payload;
}
