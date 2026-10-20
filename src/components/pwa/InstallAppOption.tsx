"use client";

import { useSyncExternalStore } from "react";
import {
  INSTALL_BANNER_DISMISS_KEY,
  isStandaloneDisplay,
  shouldOfferInstall,
  shouldShowInstallBanner,
  type InstallPromptOutcome,
} from "@/components/pwa/installPrompt";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
let standalone = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  return deferred;
}

let listening = false;

function ensureListeners() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  standalone = isStandaloneDisplay();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  if (standalone) return;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    standalone = true;
    emit();
  });
}

if (typeof window !== "undefined") ensureListeners();

function useInstallPrompt() {
  const prompt = useSyncExternalStore(subscribe, snapshot, () => null);
  const canPrompt = Boolean(prompt);
  const installed = typeof window !== "undefined" && isStandaloneDisplay();
  return {
    offer: shouldOfferInstall({ canPrompt, standalone: installed || standalone }),
    prompt,
  };
}

async function runInstall(
  prompt: BeforeInstallPromptEvent | null,
): Promise<InstallPromptOutcome> {
  if (!prompt) return "unavailable";
  deferred = null;
  emit();
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") standalone = true;
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}

export function InstallAppMenuItem({ onDone }: { onDone?: () => void }) {
  const { offer, prompt } = useInstallPrompt();
  if (!offer) return null;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-3.5 text-sm font-medium min-h-12 text-[var(--brand)] hover:bg-[var(--brand-soft)]"
      onClick={() => {
        onDone?.();
        void runInstall(prompt);
      }}
    >
      <InstallIcon />
      Install app
    </button>
  );
}

export function InstallAppBanner() {
  const { offer, prompt } = useInstallPrompt();
  const dismissed = useSyncExternalStore(
    subscribeDismiss,
    readDismissed,
    () => true,
  );
  if (!shouldShowInstallBanner({ canPrompt: offer, standalone: false, dismissed })) {
    return null;
  }

  return (
    <div className="md:hidden fixed inset-x-3 z-30 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px)+0.5rem)] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-modal)] px-3 py-2.5 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--ink)]">Install SparesX</p>
        <p className="text-xs text-[var(--muted)]">Add it to your Android home screen</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white"
        onClick={() => void runInstall(prompt)}
      >
        Install
      </button>
      <button
        type="button"
        className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-3)]"
        aria-label="Dismiss install prompt"
        onClick={() => {
          try {
            sessionStorage.setItem(INSTALL_BANNER_DISMISS_KEY, "1");
          } catch {
            // ignore
          }
          emit();
        }}
      >
        ×
      </button>
    </div>
  );
}

function subscribeDismiss(listener: () => void) {
  return subscribe(listener);
}

function readDismissed() {
  try {
    return sessionStorage.getItem(INSTALL_BANNER_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function InstallIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 4v10m0 0l-3.5-3.5M12 14l3.5-3.5M5 18h14"
      />
    </svg>
  );
}
