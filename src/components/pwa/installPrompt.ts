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
