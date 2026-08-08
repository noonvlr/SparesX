"use client";

import { useEffect, useRef, useState } from "react";
import {
  getGoogleClientId,
  loadGoogleScript,
} from "@/lib/auth/googleClient";
import { authFetch } from "@/lib/auth/clientAuth";
import { showToast } from "@/components/ToastHost";
import { Button } from "@/components/ui/Button";

/**
 * One-tap / button to link Google to the currently signed-in account.
 */
export default function GoogleLinkButton({
  className = "",
  onLinked,
}: {
  className?: string;
  onLinked?: () => void;
}) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const clientId = getGoogleClientId();

  useEffect(() => {
    if (!clientId || !btnRef.current) return;
    let cancelled = false;

    const handleCredential = async (credential: string) => {
      setBusy(true);
      try {
        const res = await authFetch("/api/auth/google/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: credential }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.message || "Could not link Google", "error");
          return;
        }
        showToast("Google account linked");
        onLinked?.();
      } catch {
        showToast("Could not link Google", "error");
      } finally {
        setBusy(false);
      }
    };

    (async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !btnRef.current || !window.google?.accounts?.id) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) void handleCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 280,
        });
        if (!cancelled) setReady(true);
      } catch {
        // leave ready false
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId]); // onLinked intentionally omitted — parent may pass inline fn

  if (!clientId) return null;

  return (
    <div className={className}>
      {busy ? (
        <Button type="button" size="sm" variant="secondary" disabled>
          Linking…
        </Button>
      ) : null}
      <div
        ref={btnRef}
        className={ready && !busy ? "" : "opacity-0 h-0 overflow-hidden"}
        aria-hidden={!ready || busy}
      />
    </div>
  );
}
