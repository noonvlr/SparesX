import type { SmsSendResult } from "@/lib/services/sms/types";

/**
 * MSG91 OTP flow — uses SendOTP API when templateId is set,
 * otherwise falls back to Flow/SMS API with plain text.
 */
export async function sendMsg91Sms(params: {
  authKey: string;
  senderId: string;
  templateId?: string;
  mobile: string;
  countryCode: string;
  otp: string;
}): Promise<SmsSendResult> {
  try {
    if (params.templateId) {
      const url = new URL("https://control.msg91.com/api/v5/otp");
      url.searchParams.set("template_id", params.templateId);
      url.searchParams.set("mobile", `${params.countryCode}${params.mobile}`);
      url.searchParams.set("otp", params.otp);
      url.searchParams.set("otp_length", "6");

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          authkey: params.authKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data as { type?: string }).type === "error") {
        return {
          ok: false,
          message:
            (data as { message?: string }).message ||
            `MSG91 OTP error (${res.status})`,
        };
      }
      return { ok: true };
    }

    // Fallback text SMS
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: params.authKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: params.senderId,
        short_url: "0",
        recipients: [
          {
            mobiles: `${params.countryCode}${params.mobile}`,
            var1: params.otp,
          },
        ],
      }),
    });

    // If flow API fails without template, try classic sendhttp SMS
    if (!res.ok) {
      const qs = new URLSearchParams({
        authkey: params.authKey,
        mobiles: `${params.countryCode}${params.mobile}`,
        message: `Your SparesX verification code is ${params.otp}. Valid for 10 minutes.`,
        sender: params.senderId,
        route: "4",
        country: params.countryCode,
      });
      const classic = await fetch(
        `https://control.msg91.com/api/sendhttp.php?${qs.toString()}`,
      );
      const text = await classic.text();
      if (!classic.ok) {
        return { ok: false, message: `MSG91 SMS failed: ${text}` };
      }
      return { ok: true };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "MSG91 request failed",
    };
  }
}
