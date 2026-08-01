import type { SmsSendResult } from "@/lib/services/sms/types";

export async function sendTwilioSms(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}): Promise<SmsSendResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${params.accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: params.to,
    From: params.from,
    Body: params.body,
  });

  const auth = Buffer.from(
    `${params.accountSid}:${params.authToken}`,
  ).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (data as { message?: string }).message ||
        `Twilio error (${res.status})`;
      return { ok: false, message: msg };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Twilio request failed",
    };
  }
}
