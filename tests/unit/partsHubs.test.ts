import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PartsHubRawGroup } from "@/lib/seo/partsHubsData";

type Hubs = typeof import("@/lib/seo/partsHubsData");

let buildPartsHubBrands: Hubs["buildPartsHubBrands"];
let buildPartsHubCategories: Hubs["buildPartsHubCategories"];
let buildPartsHubModels: Hubs["buildPartsHubModels"];
let buildQualifyingPartsHubsFromRaw: Hubs["buildQualifyingPartsHubsFromRaw"];

function group(
  partial: Partial<PartsHubRawGroup> &
    Pick<PartsHubRawGroup, "partType" | "brand" | "deviceModel" | "count">,
): PartsHubRawGroup {
  return {
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    ...partial,
  };
}

describe("parts hubs", () => {
  before(async () => {
    process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/sparesx-unit";
    const mod = await import("@/lib/seo/partsHubsData");
    buildPartsHubBrands = mod.buildPartsHubBrands;
    buildPartsHubCategories = mod.buildPartsHubCategories;
    buildPartsHubModels = mod.buildPartsHubModels;
    buildQualifyingPartsHubsFromRaw = mod.buildQualifyingPartsHubsFromRaw;
  });
  it("returns no hubs for an empty catalog", () => {
    assert.deepEqual(buildQualifyingPartsHubsFromRaw([]), []);
    assert.deepEqual(buildPartsHubCategories([]), []);
    assert.deepEqual(buildPartsHubBrands([], "mobile-battery"), []);
    assert.deepEqual(buildPartsHubModels([], "mobile-battery", "realme"), []);
  });

  it("creates a hub only when a model has at least two approved listings", () => {
    const single = buildQualifyingPartsHubsFromRaw([
      group({
        partType: "mobile-battery",
        brand: "Realme",
        deviceModel: "10 5G",
        count: 1,
      }),
    ]);
    assert.equal(single.length, 0);

    const pair = buildQualifyingPartsHubsFromRaw([
      group({
        partType: "mobile-battery",
        brand: "Realme",
        deviceModel: "10 5G",
        count: 2,
        updatedAt: new Date("2026-09-28T12:52:17.136Z"),
      }),
    ]);
    assert.equal(pair.length, 1);
    assert.equal(pair[0].path, "/parts/mobile-battery/realme/10-5g");
    assert.equal(pair[0].count, 2);

    const categories = buildPartsHubCategories(pair);
    assert.equal(categories.length, 1);
    assert.equal(categories[0].slug, "mobile-battery");
    const brands = buildPartsHubBrands(pair, "mobile-battery");
    assert.equal(brands[0].slug, "realme");
    const models = buildPartsHubModels(pair, "mobile-battery", "realme");
    assert.equal(models[0].path, pair[0].path);
  });

  it("still builds hubs after the cache JSON round-trip turns dates into strings", () => {
    const stored = JSON.parse(
      JSON.stringify([
        group({
          partType: "mobile-motherboard",
          brand: "Redmi",
          deviceModel: "K20",
          count: 3,
          updatedAt: new Date("2026-09-06T10:14:14.925Z"),
        }),
        group({
          partType: "mobile-motherboard",
          brand: "Redmi",
          deviceModel: "K20 Pro",
          count: 2,
          updatedAt: new Date("2026-08-01T00:00:00.000Z"),
        }),
      ]),
    ) as PartsHubRawGroup[];

    const hubs = buildQualifyingPartsHubsFromRaw(stored);
    assert.equal(hubs.length, 2);
    assert.equal(hubs[0].updatedAt instanceof Date, true);
    assert.equal(Number.isNaN(hubs[0].updatedAt.getTime()), false);
    const categories = buildPartsHubCategories(hubs);
    assert.equal(categories[0].hubCount, 2);
    assert.equal(categories[0].brandCount, 1);
  });
});
