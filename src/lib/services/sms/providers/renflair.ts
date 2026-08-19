import type { SmsSendResult } from "@/lib/services/sms/types";

const DEFAULT_ENDPOINT = "https://sms.renflair.in/V1.php";

/** Last 10 digits for Indian mobiles (Renflair expects 9876543210, not +91). */
export function toRenflairPhone(countryCode: string, mobile: string): string | null {
  const digits = `${countryCode || ""}${mobile || ""}`.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(last10)) return null;
  return last10;
}

function failureMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const rec = data as Record<string, unknown>;
  for (const key of ["message", "msg", "error", "reason"]) {
    const value = rec[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function isSuccessPayload(data: unknown): boolean {
  if (data == null) return false;
  if (typeof data !== "object") {
    const text = String(data).toLowerCase();
    return text.includes("success") || text === "ok" || text === "1";
  }
  const rec = data as Record<string, unknown>;
  const status = rec.status ?? rec.Status ?? rec.TYPE ?? rec.type ?? rec.result;
  if (typeof status === "boolean") return status;
  if (typeof status === "number") return status === 1 || status === 200;
  if (typeof status === "string") {
    const s = status.toLowerCase();
    if (["error", "fail", "failed", "invalid"].includes(s)) return false;
    if (["success", "ok", "sent", "true", "1"].includes(s)) return true;
  }
  if (rec.error === true) return false;
  if (typeof rec.error === "string" && rec.error.trim()) return false;
  // HTTP 200 with JSON and no explicit error — treat as delivered.
  return true;
}

export async function sendRenflairOtp(params: {
  apiKey: string;
  phone: string;
  otp: string;
  endpoint?: string;
}): Promise<SmsSendResult> {
  const endpoint = (params.endpoint || DEFAULT_ENDPOINT).trim() || DEFAULT_ENDPOINT;
  const url = new URL(endpoint);
  url.searchParams.set("API", params.apiKey);
  url.searchParams.set("PHONE", params.phone);
  url.searchParams.set("OTP", params.otp);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const raw = await res.text();
    let data: unknown = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      /* gateway sometimes returns plain text */
    }

    if (!res.ok) {
      return {
        ok: false,
        message: failureMessage(data, `Renflair SMS failed (${res.status})`),
      };
    }
    if (!isSuccessPayload(data)) {
      return {
        ok: false,
        message: failureMessage(data, "Renflair did not accept the SMS"),
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Renflair request failed",
    };
  }
}
