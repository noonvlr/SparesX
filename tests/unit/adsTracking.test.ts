import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDedupeKey } from "@/lib/ads/tracking";
import { formatCtr, formatCtrDisplay } from "@/lib/ads/ctr";

describe("promo tracking helpers", () => {
  it("builds stable 30-minute dedupe keys", () => {
    const base = {
      sessionId: "sid-1",
      campaignId: "507f1f77bcf86cd799439011",
      placementKey: "homepage_hero",
      eventType: "impression" as const,
    };
    const t0 = new Date("2026-11-22T10:00:00.000Z");
    const t1 = new Date("2026-11-22T10:29:59.000Z");
    const t2 = new Date("2026-11-22T10:30:00.000Z");
    assert.equal(
      buildDedupeKey({ ...base, now: t0 }),
      buildDedupeKey({ ...base, now: t1 }),
    );
    assert.notEqual(
      buildDedupeKey({ ...base, now: t0 }),
      buildDedupeKey({ ...base, now: t2 }),
    );
  });

  it("CTR math and zero-impression dash", () => {
    assert.equal(formatCtr(10, 2), 20);
    assert.equal(formatCtrDisplay(10, 2), "20.00%");
    assert.equal(formatCtr(0, 0), null);
    assert.equal(formatCtrDisplay(0, 5), "—");
  });
});
