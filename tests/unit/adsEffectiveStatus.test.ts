import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getEffectiveStatus,
  isEligibleLive,
} from "@/lib/ads/effectiveStatus";

const start = new Date("2026-06-01T00:00:00.000Z");
const end = new Date("2026-07-01T00:00:00.000Z");

describe("getEffectiveStatus (D1)", () => {
  it("precedence: archived > draft > paused", () => {
    assert.equal(
      getEffectiveStatus({
        status: "archived",
        startDate: start,
        endDate: end,
        now: new Date("2026-06-15T00:00:00.000Z"),
      }),
      "archived",
    );
    assert.equal(
      getEffectiveStatus({
        status: "draft",
        startDate: start,
        endDate: end,
        now: new Date("2026-06-15T00:00:00.000Z"),
      }),
      "draft",
    );
    assert.equal(
      getEffectiveStatus({
        status: "paused",
        startDate: start,
        endDate: end,
        now: new Date("2026-06-15T00:00:00.000Z"),
      }),
      "paused",
    );
  });

  it("active: scheduled before start (inclusive start)", () => {
    assert.equal(
      getEffectiveStatus({
        status: "active",
        startDate: start,
        endDate: end,
        now: new Date("2026-05-31T23:59:59.999Z"),
      }),
      "scheduled",
    );
    assert.equal(
      getEffectiveStatus({
        status: "active",
        startDate: start,
        endDate: end,
        now: start,
      }),
      "live",
    );
  });

  it("active: expired at end (exclusive end)", () => {
    assert.equal(
      getEffectiveStatus({
        status: "active",
        startDate: start,
        endDate: end,
        now: new Date("2026-06-30T23:59:59.999Z"),
      }),
      "live",
    );
    assert.equal(
      getEffectiveStatus({
        status: "active",
        startDate: start,
        endDate: end,
        now: end,
      }),
      "expired",
    );
  });

  it("placement / creatives gates block live", () => {
    const base = {
      status: "active" as const,
      startDate: start,
      endDate: end,
      now: new Date("2026-06-15T00:00:00.000Z"),
    };
    assert.equal(
      getEffectiveStatus({ ...base, placementEnabled: false }),
      "paused",
    );
    assert.equal(
      getEffectiveStatus({ ...base, hasRequiredCreatives: false }),
      "draft",
    );
    assert.equal(isEligibleLive({ ...base, hasRequiredCreatives: true }), true);
    assert.equal(
      isEligibleLive({ ...base, hasRequiredCreatives: false }),
      false,
    );
  });
});
