"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  INSTALL_BANNER_DISMISS_KEY,
  detectIosBrowser,
  isStandaloneDisplay,
  shouldOfferInstall,
  shouldOfferIosInstall,
  shouldShowInstallBanner,
  shouldShowIosBanner,
  type IosBrowser,
  type InstallPromptOutcome,
} from "@/components/pwa/installPrompt";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
let standalone = false;
let iosBrowser: IosBrowser | null = null;
let guideOpen = false;
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

function readIos() {
  return iosBrowser;
}

function readGuideOpen() {
  return guideOpen;
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

function useInstallState() {
  const prompt = useSyncExternalStore(subscribe, snapshot, () => null);
  const ios = useSyncExternalStore(subscribe, readIos, () => null);
  const installed = typeof window !== "undefined" && (isStandaloneDisplay() || standalone);

  useEffect(() => {
    const detected = detectIosBrowser({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
    });
    if (detected !== iosBrowser) {
      iosBrowser = detected;
      emit();
    }
  }, []);

  return {
    chrome: shouldOfferInstall({ canPrompt: Boolean(prompt), standalone: installed }),
    ios: shouldOfferIosInstall({ ios: Boolean(ios), standalone: installed }) ? ios : null,
    prompt,
  };
}

function openInstallGuide() {
  guideOpen = true;
  emit();
}

function closeInstallGuide() {
  guideOpen = false;
  emit();
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
  const { chrome, ios, prompt } = useInstallState();
  if (!chrome && !ios) return null;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-3.5 text-sm font-medium min-h-12 text-[var(--brand)] hover:bg-[var(--brand-soft)]"
      onClick={() => {
        onDone?.();
        if (ios) openInstallGuide();
        else void runInstall(prompt);
      }}
    >
      <InstallIcon />
      Install app
    </button>
  );
}

export function InstallAppDesktopButton() {
  const { chrome, ios, prompt } = useInstallState();
  if (!chrome && !ios) return null;
  return (
    <button
      type="button"
      className="hidden md:inline-flex items-center rounded-full bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white"
      onClick={() => {
        if (ios) openInstallGuide();
        else void runInstall(prompt);
      }}
    >
      Install app
    </button>
  );
}

export function InstallAppBanner() {
  const { chrome, ios, prompt } = useInstallState();
  const dismissed = useSyncExternalStore(
    subscribeDismiss,
    readDismissed,
    () => true,
  );
  const showChrome = shouldShowInstallBanner({
    canPrompt: chrome,
    standalone: false,
    dismissed,
  });
  const showIos = shouldShowIosBanner({
    ios: Boolean(ios),
    standalone: false,
    dismissed,
  });
  if (!showChrome && !showIos) return null;

  const subtitle =
    ios === "safari"
      ? "Add it to your Home Screen"
      : ios === "other"
        ? "Open in Safari, then add to your Home Screen"
        : "Add it to your Android home screen";

  return (
    <div className="md:hidden fixed inset-x-3 z-30 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px)+0.5rem)] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-modal)] px-3 py-2.5 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--ink)]">Install SparesX</p>
        <p className="text-xs text-[var(--muted)]">{subtitle}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white"
        onClick={() => {
          if (ios) openInstallGuide();
          else void runInstall(prompt);
        }}
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

export function InstallAppGuide() {
  const open = useSyncExternalStore(subscribe, readGuideOpen, () => false);
  const ios = useSyncExternalStore(subscribe, readIos, () => null);
  if (!open || !ios) return null;

  const steps =
    ios === "safari"
      ? [
          "Tap the Share button in Safari (the square with an arrow).",
          "Scroll the share sheet and tap Add to Home Screen.",
          "Tap Add. SparesX then opens from your Home Screen.",
        ]
      : [
          "Open this page in Safari. Other Apple browsers cannot add the app.",
          "In Safari, tap Share, then Add to Home Screen.",
          "Tap Add. SparesX then opens from your Home Screen.",
        ];

  return (
    <div className="fixed inset-0 z-[var(--z-modal)]">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay)]"
        aria-label="Close install steps"
        onClick={closeInstallGuide}
      />
      <div
        role="dialog"
        aria-labelledby="install-ios-title"
        className="absolute inset-x-0 bottom-0 rounded-t-[var(--radius-xl)] bg-[var(--surface-elevated)] shadow-[var(--shadow-modal)] border-t border-[var(--border)] px-4 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id="install-ios-title" className="text-base font-semibold text-[var(--ink)]">
              Install SparesX
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              This adds an icon to your Home Screen. It is not an App Store download.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--surface-3)] text-2xl leading-none"
            aria-label="Close install steps"
            onClick={closeInstallGuide}
          >
            ×
          </button>
        </div>
        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm text-[var(--ink)]">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
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
