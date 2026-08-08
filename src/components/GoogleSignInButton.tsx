"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import {
  getGoogleClientId,
  loadGoogleScript,
} from "@/lib/auth/googleClient";
import { resolvePostAuthPath } from "@/lib/auth/postAuthRedirect";
import { setAccessToken } from "@/lib/auth/clientAuth";

export default function GoogleSignInButton({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const btnRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const clientId = getGoogleClientId();

  useEffect(() => {
    if (!clientId || !btnRef.current) return;
    let cancelled = false;

    const handleCredential = async (credential: string) => {
      setBusy(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken: credential }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.message || "Google Sign-In failed", "error");
          return;
        }

        setAccessToken();
        showToast("Signed in with Google");

        if (data.profileComplete === false) {
          showToast("Please complete your profile to continue", "info");
        } else if (!data.phoneVerified && data.role !== "admin") {
          showToast("Please verify your phone number", "info");
        }
        if (
          data.hasPassword === false &&
          data.role !== "admin" &&
          data.profileComplete !== false
        ) {
          showToast(
            "Please set a password so you can also sign in with email",
            "info",
          );
        }

        router.push(resolvePostAuthPath(data));
      } catch {
        showToast("Google Sign-In failed", "error");
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
            if (response?.credential) {
              void handleCredential(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        btnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(btnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: btnRef.current.offsetWidth || 360,
        });
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) {
          setError("Could not load Google Sign-In");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, router]);

  if (!clientId) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled
          className="mx-auto w-full max-w-xs flex items-center justify-center gap-3 bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--muted)] py-3 rounded-[var(--radius)] font-semibold text-base cursor-not-allowed"
        >
          Continue with Google
        </button>
        <p className="mt-2 text-xs text-center text-[var(--warning)]">
          Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google Sign-In.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {busy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius)] bg-[var(--surface)]">
          <span className="w-5 h-5 border-2 border-[var(--border-strong)] border-t-[var(--brand)] rounded-full animate-spin" />
        </div>
      )}
      <div
        ref={btnRef}
        className="mx-auto w-full max-w-xs flex justify-center min-h-[44px]"
      />
      {!ready && !error && (
        <p className="text-xs text-center text-[var(--muted)] mt-1">
          Loading Google…
        </p>
      )}
      {error && (
        <p className="text-xs text-center text-[var(--danger)] mt-1">{error}</p>
      )}
    </div>
  );
}
