export async function register() {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSentry } = await import("@/lib/observability/sentry");
    initSentry("nodejs");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { initSentry } = await import("@/lib/observability/sentry");
    initSentry("edge");
  }
}
