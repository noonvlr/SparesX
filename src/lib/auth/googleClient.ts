/** Client helpers for Google Identity Services (GIS). */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              getNotDisplayedReason: () => string;
              getSkippedReason: () => string;
            }) => void,
          ) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
}

let scriptPromise: Promise<void> | null = null;

export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window unavailable"));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${GIS_SRC}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google script")),
      );
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Opens Google One Tap / account chooser and resolves with the ID token (JWT).
 */
export async function requestGoogleIdToken(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("Google Sign-In is not configured");
  }

  await loadGoogleScript();
  if (!window.google?.accounts?.id) {
    throw new Error("Google Sign-In failed to load");
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          finish(() => resolve(response.credential));
        } else {
          finish(() => reject(new Error("No credential from Google")));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        finish(() =>
          reject(
            new Error(
              "Google Sign-In was cancelled or blocked. Check that this site is an authorized origin in Google Cloud Console.",
            ),
          ),
        );
      }
    });
  });
}
