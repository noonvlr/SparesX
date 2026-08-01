import type { SmsSendResult } from "@/lib/services/sms/types";
import {
  getOrCreateSiteSettings,
  type ISiteSettings,
  type SmsProvider,
} from "@/lib/models/SiteSettings";
import { decryptSecret } from "@/lib/security/secrets";
import {
  sendTwilioSms,
  startTwilioVerify,
  checkTwilioVerify,
} from "@/lib/services/sms/providers/twilio";
import { sendMsg91Sms } from "@/lib/services/sms/providers/msg91";

export type { SmsSendResult };

/** Sentinel stored in phoneVerifyOTP when using Twilio Verify (OTP not stored locally). */
export const TWILIO_VERIFY_SENTINEL = "twilio_verify";

function toE164(countryCode: string, mobile: string): string {
  const cc = (countryCode || "+91").replace(/\s/g, "");
  const digits = mobile.replace(/\D/g, "");
  if (cc.startsWith("+")) return `${cc}${digits}`;
  return `+${cc}${digits}`;
}

export async function loadSmsRuntimeConfig(): Promise<{
  provider: SmsProvider;
  settings: ISiteSettings;
  twilio?: {
    accountSid: string;
    authToken: string;
    from: string;
    verifyServiceSid: string;
  };
  msg91?: { authKey: string; senderId: string; templateId: string };
}> {
  const settings = await getOrCreateSiteSettings();
  const provider = settings.activeSmsProvider || "twilio";

  if (provider === "twilio") {
    const authToken = settings.twilioAuthTokenEnc
      ? decryptSecret(settings.twilioAuthTokenEnc)
      : "";
    return {
      provider,
      settings,
      twilio: {
        accountSid: settings.twilioAccountSid || "",
        authToken,
        from: settings.twilioFromNumber || "",
        verifyServiceSid: settings.twilioVerifyServiceSid || "",
      },
    };
  }

  const authKey = settings.msg91AuthKeyEnc
    ? decryptSecret(settings.msg91AuthKeyEnc)
    : "";
  return {
    provider,
    settings,
    msg91: {
      authKey,
      senderId: settings.msg91SenderId || "",
      templateId: settings.msg91TemplateId || "",
    },
  };
}

export type SendSmsOtpResult = SmsSendResult & {
  /** When true, confirm must use Twilio Verify check (not local hash). */
  viaTwilioVerify?: boolean;
};

export async function sendSmsOtp(params: {
  countryCode: string;
  mobile: string;
  otp: string;
}): Promise<SendSmsOtpResult> {
  const e164 = toE164(params.countryCode, params.mobile);
  const cfg = await loadSmsRuntimeConfig();

  if (cfg.provider === "twilio") {
    const t = cfg.twilio!;
    if (!t.accountSid || !t.authToken) {
      return {
        ok: false,
        message:
          "SMS not configured. Ask admin to set Twilio Account SID and Auth Token in Site Settings.",
      };
    }

    // Prefer Verify API (required for Twilio trial OTP)
    if (t.verifyServiceSid) {
      const result = await startTwilioVerify({
        accountSid: t.accountSid,
        authToken: t.authToken,
        serviceSid: t.verifyServiceSid,
        to: e164,
      });
      if (!result.ok) return result;
      return { ok: true, viaTwilioVerify: true };
    }

    if (!t.from) {
      return {
        ok: false,
        message:
          "Twilio Verify Service SID is required for trial accounts. Create a Verify service in Twilio Console and paste the VA... SID in Site Settings. Or set a From number after upgrading Twilio.",
      };
    }

    const msgResult = await sendTwilioSms({
      accountSid: t.accountSid,
      authToken: t.authToken,
      from: t.from,
      to: e164,
      body: `Your SparesX verification code is ${params.otp}. Valid for 10 minutes.`,
    });
    return msgResult;
  }

  const m = cfg.msg91!;
  if (!m.authKey || !m.senderId) {
    return {
      ok: false,
      message:
        "SMS not configured. Ask admin to set MSG91 credentials in Site Settings.",
    };
  }
  return sendMsg91Sms({
    authKey: m.authKey,
    senderId: m.senderId,
    templateId: m.templateId,
    mobile: params.mobile.replace(/\D/g, ""),
    countryCode: (params.countryCode || "+91").replace("+", ""),
    otp: params.otp,
  });
}

export async function confirmTwilioVerifyOtp(params: {
  countryCode: string;
  mobile: string;
  code: string;
}): Promise<SmsSendResult> {
  const e164 = toE164(params.countryCode, params.mobile);
  const cfg = await loadSmsRuntimeConfig();
  if (cfg.provider !== "twilio" || !cfg.twilio?.verifyServiceSid) {
    return { ok: false, message: "Twilio Verify is not configured" };
  }
  const t = cfg.twilio;
  return checkTwilioVerify({
    accountSid: t.accountSid,
    authToken: t.authToken,
    serviceSid: t.verifyServiceSid,
    to: e164,
    code: params.code,
  });
}

export { toE164 };
