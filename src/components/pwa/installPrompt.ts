export const INSTALL_BANNER_DISMISS_KEY = "sparesx_install_banner_dismissed";

export type InstallPromptOutcome = "accepted" | "dismissed" | "unavailable";

/** True when the site is already running as an installed app. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
  );
}

export function shouldOfferInstall(state: {
  canPrompt: boolean;
  standalone: boolean;
}): boolean {
  return state.canPrompt && !state.standalone;
}

export function shouldShowInstallBanner(state: {
  canPrompt: boolean;
  standalone: boolean;
  dismissed: boolean;
}): boolean {
  return shouldOfferInstall(state) && !state.dismissed;
}

export type IosBrowser = "safari" | "other";

const IOS_DEVICE = /iPad|iPhone|iPod/i;
const IOS_NON_SAFARI =
  /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\/|FBAN|FBAV|Instagram|Line\//i;

/** Safari on iPhone, iPad, and iPadOS. Other Apple browsers cannot add a Home Screen app. */
export function detectIosBrowser(input: {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
}): IosBrowser | null {
  const ua = input.userAgent || "";
  const ipadOs =
    input.platform === "MacIntel" && (input.maxTouchPoints ?? 0) > 1 && !IOS_DEVICE.test(ua);
  if (!IOS_DEVICE.test(ua) && !ipadOs) return null;
  if (IOS_NON_SAFARI.test(ua)) return "other";
  if (ipadOs || /Safari/i.test(ua)) return "safari";
  return "other";
}

export function shouldOfferIosInstall(state: {
  ios: boolean;
  standalone: boolean;
}): boolean {
  return state.ios && !state.standalone;
}

export function shouldShowIosBanner(state: {
  ios: boolean;
  standalone: boolean;
  dismissed: boolean;
}): boolean {
  return shouldOfferIosInstall(state) && !state.dismissed;
}
