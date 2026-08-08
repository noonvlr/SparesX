/**
 * Redacted server logging helpers. Prefer these over raw console for ops paths.
 * Never log passwords, OTPs, refresh tokens, WhatsApp numbers, or KYC payloads.
 */

const SENSITIVE_KEY =
  /pass(word)?|otp|token|secret|authorization|cookie|whatsapp|mobile|phone|kyc|refresh|csrf|pepper|vapid.?private/i;

function scrubValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string" && value.length > 500) {
    return `${value.slice(0, 500)}…`;
  }
  return value;
}

export function scrubForLog(input: unknown): unknown {
  if (input == null) return input;
  if (input instanceof Error) {
    return { name: input.name, message: input.message };
  }
  if (Array.isArray(input)) return input.map((v) => scrubForLog(v));
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = scrubValue(k, scrubForLog(v));
    }
    return out;
  }
  return input;
}

export function logInfo(scope: string, message: string, meta?: unknown) {
  if (meta === undefined) {
    console.info(`[${scope}] ${message}`);
    return;
  }
  console.info(`[${scope}] ${message}`, scrubForLog(meta));
}

export function logWarn(scope: string, message: string, meta?: unknown) {
  if (meta === undefined) {
    console.warn(`[${scope}] ${message}`);
    return;
  }
  console.warn(`[${scope}] ${message}`, scrubForLog(meta));
}

export function logError(scope: string, message: string, meta?: unknown) {
  if (meta === undefined) {
    console.error(`[${scope}] ${message}`);
  } else {
    console.error(`[${scope}] ${message}`, scrubForLog(meta));
  }
  void import("@/lib/observability/sentry")
    .then(({ Sentry }) => {
      if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
      Sentry.captureMessage(`[${scope}] ${message}`, {
        level: "error",
        extra:
          meta === undefined
            ? undefined
            : (scrubForLog(meta) as Record<string, unknown>),
      });
    })
    .catch(() => undefined);
}
