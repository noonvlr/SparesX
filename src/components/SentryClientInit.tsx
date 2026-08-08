"use client";

import { useEffect } from "react";

/** Client-side Sentry bootstrap when NEXT_PUBLIC_SENTRY_DSN is set. */
export default function SentryClientInit() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    void import("@/lib/observability/sentry").then(({ initSentry }) => {
      initSentry("client");
    });
  }, []);
  return null;
}
