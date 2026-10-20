import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  shouldOfferInstall,
  shouldOfferIosInstall,
  shouldShowInstallBanner,
  shouldShowIosBanner,
  detectIosBrowser,
} from "@/components/pwa/installPrompt";

describe("install app option", () => {
  it("offers install only when the browser can prompt and the app is not installed", () => {
    assert.equal(shouldOfferInstall({ canPrompt: true, standalone: false }), true);
    assert.equal(shouldOfferInstall({ canPrompt: false, standalone: false }), false);
    assert.equal(shouldOfferInstall({ canPrompt: true, standalone: true }), false);
  });

  it("hides the banner after dismiss but the menu can still offer install", () => {
    const base = { canPrompt: true, standalone: false, dismissed: false };
    assert.equal(shouldShowInstallBanner(base), true);
    assert.equal(shouldShowInstallBanner({ ...base, dismissed: true }), false);
    assert.equal(shouldOfferInstall(base), true);
  });

  it("recognizes iPhone Safari, iPadOS Safari, and non-Safari Apple browsers", () => {
    const iphoneSafari =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    const iphoneChrome =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1";
    const ipadSafari =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
    const macSafari = ipadSafari;
    const android =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

    assert.equal(detectIosBrowser({ userAgent: iphoneSafari }), "safari");
    assert.equal(detectIosBrowser({ userAgent: iphoneChrome }), "other");
    assert.equal(
      detectIosBrowser({ userAgent: ipadSafari, platform: "MacIntel", maxTouchPoints: 5 }),
      "safari",
    );
    assert.equal(
      detectIosBrowser({ userAgent: macSafari, platform: "MacIntel", maxTouchPoints: 0 }),
      null,
    );
    assert.equal(detectIosBrowser({ userAgent: android }), null);
  });

  it("offers Home Screen steps on Apple until the app is installed or dismissed", () => {
    assert.equal(shouldOfferIosInstall({ ios: true, standalone: false }), true);
    assert.equal(shouldOfferIosInstall({ ios: true, standalone: true }), false);
    assert.equal(shouldOfferIosInstall({ ios: false, standalone: false }), false);
    const base = { ios: true, standalone: false, dismissed: false };
    assert.equal(shouldShowIosBanner(base), true);
    assert.equal(shouldShowIosBanner({ ...base, dismissed: true }), false);
  });
});
