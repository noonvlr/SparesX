import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyHouseFallback,
  filterStillLive,
  pickWeightedPromos,
  type PublicPromoItem,
} from "@/lib/ads/rotation";
import { signPromoToken, verifyPromoToken } from "@/lib/ads/token";

function item(
  partial: Partial<PublicPromoItem> & Pick<PublicPromoItem, "campaignId" | "priority" | "advertiserType">,
): PublicPromoItem {
  const now = Date.now();
  return {
    placementKey: "homepage_hero",
    destinationLabel: "x",
    startDate: new Date(now - 1000).toISOString(),
    endDate: new Date(now + 60_000).toISOString(),
    token: "t",
    desktop: {
      url: "https://example.com/d.jpg",
      width: 1200,
      height: 300,
      altText: "a",
    },
    mobile: null,
    ...partial,
  };
}

describe("promo rotation", () => {
  it("picks higher priority more often over many runs", () => {
    const items = [
      item({ campaignId: "a", priority: 5, advertiserType: "paid" }),
      item({ campaignId: "b", priority: 1, advertiserType: "paid" }),
    ];
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 2000; i++) {
      const picked = pickWeightedPromos(items, 1);
      counts[picked[0].campaignId as "a" | "b"] += 1;
    }
    assert.ok(counts.a > counts.b * 2);
  });

  it("filters expired and applies house fallback", () => {
    const now = new Date();
    const livePaid = item({
      campaignId: "p",
      priority: 3,
      advertiserType: "paid",
    });
    const house = item({
      campaignId: "h",
      priority: 3,
      advertiserType: "house",
    });
    const expired = item({
      campaignId: "e",
      priority: 3,
      advertiserType: "paid",
      endDate: new Date(now.getTime() - 1000).toISOString(),
    });
    assert.equal(filterStillLive([livePaid, expired], now).length, 1);
    assert.equal(applyHouseFallback([house], true)[0].campaignId, "h");
    assert.equal(applyHouseFallback([house], false).length, 0);
    assert.equal(
      applyHouseFallback([livePaid, house], true)[0].campaignId,
      "p",
    );
  });
});

describe("promo HMAC token", () => {
  it("signs and verifies", () => {
    process.env.PROMO_HMAC_SECRET =
      process.env.PROMO_HMAC_SECRET || "test-promo-secret-for-unit";
    const token = signPromoToken({
      campaignId: "507f1f77bcf86cd799439011",
      placementKey: "homepage_hero",
      ttlSec: 60,
    });
    const ok = verifyPromoToken(token, {
      campaignId: "507f1f77bcf86cd799439011",
      placementKey: "homepage_hero",
    });
    assert.ok(ok);
    assert.equal(
      verifyPromoToken(token + "x", {
        campaignId: "507f1f77bcf86cd799439011",
        placementKey: "homepage_hero",
      }),
      null,
    );
  });
});
