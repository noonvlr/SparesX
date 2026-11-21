import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { istDay, istLocalToUtc, formatIstLocal } from "@/lib/ads/ist";
import {
  checkCreativeDimensions,
  aspectRatioLabel,
} from "@/lib/ads/dimensions";
import { validateDestinationUrl } from "@/lib/ads/destinationUrl";

describe("IST bucketing", () => {
  it("buckets UTC evenings into the next IST day after 18:30Z", () => {
    // 2026-11-21 18:30 UTC = 2026-11-22 00:00 IST
    assert.equal(istDay(new Date("2026-11-21T18:30:00.000Z")), "2026-11-22");
    assert.equal(istDay(new Date("2026-11-21T18:29:59.000Z")), "2026-11-21");
  });

  it("parses IST local to UTC and formats back", () => {
    const utc = istLocalToUtc("2026-11-22T00:00");
    assert.ok(utc);
    assert.equal(utc.toISOString(), "2026-11-21T18:30:00.000Z");
    assert.equal(formatIstLocal(utc), "2026-11-22T00:00");
  });
});

describe("creative dimensions", () => {
  it("accepts exact and 2× only", () => {
    const req = { width: 1200, height: 300 };
    assert.equal(checkCreativeDimensions(req, req, "Desktop").ok, true);
    assert.deepEqual(
      checkCreativeDimensions({ width: 2400, height: 600 }, req, "Desktop"),
      { ok: true, scale: 2 },
    );
    const bad = checkCreativeDimensions(
      { width: 1199, height: 300 },
      req,
      "Desktop image for Homepage Hero",
    );
    assert.equal(bad.ok, false);
    if (!bad.ok) {
      assert.match(bad.message, /1200×300/);
      assert.match(bad.message, /1199×300/);
    }
  });

  it("aspect ratio label", () => {
    assert.equal(aspectRatioLabel({ width: 1200, height: 300 }), "4:1");
    assert.equal(aspectRatioLabel({ width: 300, height: 600 }), "1:2");
  });
});

describe("destination URL", () => {
  it("allows https and rejects dangerous targets", () => {
    assert.equal(
      validateDestinationUrl("https://example.com/path").ok,
      true,
    );
    assert.equal(validateDestinationUrl("javascript:alert(1)").ok, false);
    assert.equal(validateDestinationUrl("https://localhost/x").ok, false);
    assert.equal(validateDestinationUrl("https://192.168.1.1/x").ok, false);
    assert.equal(
      validateDestinationUrl("https://user:pass@evil.com/").ok,
      false,
    );
  });
});
