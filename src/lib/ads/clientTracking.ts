/** Browser-only promo tracking helpers (sessionStorage, beacon). */

const SESSION_KEY = "sparesx_promo_sid";
const DESKTOP_MQ = "(min-width: 768px)";

export function getPromoSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (id && id.length >= 8) return id;
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s-${Date.now()}`;
  }
}

export function getPromoDeviceType(): "desktop" | "mobile" {
  if (typeof window === "undefined") return "desktop";
  try {
    return window.matchMedia(DESKTOP_MQ).matches ? "desktop" : "mobile";
  } catch {
    return "desktop";
  }
}

export type PromoBeaconEvent = {
  token: string;
  eventType: "impression" | "click";
  device: "desktop" | "mobile";
  sessionId: string;
};

export function sendPromoEvents(events: PromoBeaconEvent[]): void {
  if (!events.length || typeof window === "undefined") return;
  const body = JSON.stringify({ events });
  const url = "/api/promos/events";

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    // fall through
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => {});
}
