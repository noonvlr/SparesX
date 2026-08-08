/**
 * Optional Sentry init. No-ops unless SENTRY_DSN (server) /
 * NEXT_PUBLIC_SENTRY_DSN (browser) is set.
 */
import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";

export function initSentry(runtime: "nodejs" | "edge" | "client") {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    enabled: Boolean(dsn),
    // Avoid sending auth cookies / PII by default
    sendDefaultPii: false,
  });
  void runtime;
}

export { Sentry };
