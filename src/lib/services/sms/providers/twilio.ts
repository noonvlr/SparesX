import type { SmsSendResult } from "@/lib/services/sms/types";

function basicAuth(accountSid: string, authToken: string) {
  return Buffer.from(`${accountSid}:${authToken}`).toString("base64");
}

/** Programmable Messaging (custom body). Trial accounts often reject custom bodies. */
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

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(params.accountSid, params.authToken)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (data as { message?: string }).message ||
        `Twilio error (${res.status})`;
      if (/template|trial/i.test(msg)) {
        return {
          ok: false,
          message:
            `${msg} — For Twilio trial, create a Verify Service and paste the Service SID (VA...) in Site Settings. Custom SMS bodies are blocked on trial.`,
        };
      }
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

/** Start Twilio Verify SMS OTP (works on trial with verified numbers). */
export async function startTwilioVerify(params: {
  accountSid: string;
  authToken: string;
  serviceSid: string;
  to: string;
}): Promise<SmsSendResult> {
  const url = `https://verify.twilio.com/v2/Services/${params.serviceSid}/Verifications`;
  const body = new URLSearchParams({
    To: params.to,
    Channel: "sms",
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(params.accountSid, params.authToken)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        message:
          (data as { message?: string }).message ||
          `Twilio Verify error (${res.status})`,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Twilio Verify request failed",
    };
  }
}

/** Check Twilio Verify OTP code. */
export async function checkTwilioVerify(params: {
  accountSid: string;
  authToken: string;
  serviceSid: string;
  to: string;
  code: string;
}): Promise<SmsSendResult> {
  const url = `https://verify.twilio.com/v2/Services/${params.serviceSid}/VerificationCheck`;
  const body = new URLSearchParams({
    To: params.to,
    Code: params.code,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth(params.accountSid, params.authToken)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      status?: string;
      valid?: boolean;
    };
    if (!res.ok) {
      return {
        ok: false,
        message: data.message || `Twilio Verify check failed (${res.status})`,
      };
    }
    if (data.status === "approved" || data.valid === true) {
      return { ok: true };
    }
    return { ok: false, message: "Invalid or expired OTP" };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Twilio Verify check failed",
    };
  }
}
