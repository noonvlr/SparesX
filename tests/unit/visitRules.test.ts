import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isLikelyBot,
  isVisitorId,
  recentUtcDays,
  utcDay,
} from "@/lib/analytics/visitRules";

describe("unique visitor rules", () => {
  it("buckets days in UTC", () => {
    assert.equal(utcDay(new Date("2026-10-20T18:30:00.000Z")), "2026-10-20");
    assert.deepEqual(recentUtcDays(3, new Date("2026-10-20T18:30:00.000Z")), [
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
    ]);
  });

  it("accepts only a 32-char hex visitor id", () => {
    assert.equal(isVisitorId("a".repeat(32)), true);
    assert.equal(isVisitorId("A".repeat(32)), false);
    assert.equal(isVisitorId("not-an-id"), false);
    assert.equal(isVisitorId(undefined), false);
  });

  it("ignores crawlers and link previews", () => {
    assert.equal(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
    assert.equal(isLikelyBot("WhatsApp/2.23"), true);
    assert.equal(isLikelyBot("Mozilla/5.0 Chrome/120.0"), false);
    assert.equal(isLikelyBot(null), false);
  });
});
