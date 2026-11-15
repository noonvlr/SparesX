import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pricePercentile } from "@/lib/products/priceStats";

describe("price suggest stats", () => {
  it("computes median and quartiles for odd samples", () => {
    const prices = [1000, 1500, 2000, 2500, 4000];
    assert.equal(pricePercentile(prices, 0.5), 2000);
    assert.equal(pricePercentile(prices, 0.25), 1500);
    assert.equal(pricePercentile(prices, 0.75), 2500);
  });

  it("handles a single sample", () => {
    assert.equal(pricePercentile([1800], 0.5), 1800);
    assert.equal(pricePercentile([1800], 0.25), 1800);
  });
});
