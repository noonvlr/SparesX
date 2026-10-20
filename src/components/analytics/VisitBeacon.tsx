"use client";

import { useEffect } from "react";

/**
 * Asks the server to count this browser once per UTC day.
 * The visitor id stays in an httpOnly cookie; nothing is sent in the body.
 */
export default function VisitBeacon() {
  useEffect(() => {
    const day = new Date().toISOString().slice(0, 10);
    const mark = `sparesx_visit_${day}`;
    try {
      if (sessionStorage.getItem(mark)) return;
      sessionStorage.setItem(mark, "1");
    } catch {
      // Private mode can block storage; the server cookie still dedupes.
    }
    void fetch("/api/analytics/visit", {
      method: "POST",
      credentials: "include",
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  }, []);

  return null;
}
