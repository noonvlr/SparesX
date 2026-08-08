"use client";

import { useEffect, useState } from "react";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";
import { Button } from "@/components/ui/Button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** Opt-in browser push when VAPID is configured. */
export default function PushEnableButton({
  className,
}: {
  className?: string;
}) {
  const [status, setStatus] = useState<
    "hidden" | "loading" | "ready" | "subscribed" | "denied"
  >("hidden");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!isLoggedInClient()) return;

    let cancelled = false;
    (async () => {
      const res = await authFetch("/api/push/vapid-public-key");
      const data = await res.json();
      if (cancelled) return;
      if (!data.enabled || !data.publicKey) {
        setStatus("hidden");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "ready");
    })().catch(() => setStatus("hidden"));

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const keyRes = await authFetch("/api/push/vapid-public-key");
      const keyData = await keyRes.json();
      if (!keyData.publicKey) {
        setStatus("hidden");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });
      const json = sub.toJSON();
      await authFetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      setStatus("subscribed");
    } catch {
      setStatus("ready");
    }
  }

  if (status === "hidden" || status === "subscribed") return null;

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={className}
      disabled={status === "loading" || status === "denied"}
      onClick={() => void enable()}
    >
      {status === "denied"
        ? "Notifications blocked"
        : status === "loading"
          ? "Enabling…"
          : "Enable push alerts"}
    </Button>
  );
}
