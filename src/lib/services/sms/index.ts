import type { SmsSendResult } from "@/lib/services/sms/types";
import {
  getOrCreateSiteSettings,
  type ISiteSettings,
  type SmsProvider,
} from "@/lib/models/SiteSettings";
import { decryptSecret } from "@/lib/security/secrets";
import { sendTwilioSms } from "@/lib/services/sms/providers/twilio";
import { sendMsg91Sms } from "@/lib/services/sms/providers/msg91";

export type { SmsSendResult };

function toE164(countryCode: string, mobile: string): string {
  const cc = (countryCode || "+91").replace(/\s/g, "");
  const digits = mobile.replace(/\D/g, "");
  if (cc.startsWith("+")) return `${cc}${digits}`;
  return `+${cc}${digits}`;
}

export async function loadSmsRuntimeConfig(): Promise<{
  provider: SmsProvider;
  settings: ISiteSettings;
  twilio?: { accountSid: string; authToken: string; from: string };
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

export async function sendSmsOtp(params: {
  countryCode: string;
  mobile: string;
  otp: string;
}): Promise<SmsSendResult> {
  const e164 = toE164(params.countryCode, params.mobile);
  const cfg = await loadSmsRuntimeConfig();

  if (cfg.provider === "twilio") {
    const t = cfg.twilio!;
    if (!t.accountSid || !t.authToken || !t.from) {
      return {
        ok: false,
        message:
          "SMS not configured. Ask admin to set Twilio credentials in Site Settings.",
      };
    }
    return sendTwilioSms({
      accountSid: t.accountSid,
      authToken: t.authToken,
      from: t.from,
      to: e164,
      body: `Your SparesX verification code is ${params.otp}. Valid for 10 minutes.`,
    });
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

export { toE164 };
