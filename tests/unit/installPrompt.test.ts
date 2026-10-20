import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  shouldOfferInstall,
  shouldShowInstallBanner,
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
});
