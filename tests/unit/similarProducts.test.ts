import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildSimilarProductsQuery,
  rankSimilarProducts,
  scoreSimilarProduct,
  similarSectionCopy,
} from "@/lib/products/similarProducts";

const seed = {
  _id: "seed1",
  brand: "Samsung",
  partType: "display",
  deviceModel: "S24 Ultra",
  deviceCategory: "mobile",
  price: 2500,
};

describe("similar products ranking", () => {
  it("does not match on device category alone", () => {
    const query = buildSimilarProductsQuery(seed);
    assert.ok(query);
    const or = query!.$or as Array<Record<string, unknown>>;
    assert.equal(
      or.some((clause) => "deviceCategory" in clause),
      false,
    );
  });

  it("scores exact brand+part+model highest", () => {
    const exact = scoreSimilarProduct(seed, {
      _id: "a",
      brand: "Samsung",
      partType: "display",
      deviceModel: "S24 Ultra",
      price: 2400,
    });
    const brandOnly = scoreSimilarProduct(seed, {
      _id: "b",
      brand: "Samsung",
      partType: "battery",
      deviceModel: "A54",
      price: 900,
    });
    const categoryNoise = scoreSimilarProduct(seed, {
      _id: "c",
      brand: "Apple",
      partType: "camera",
      deviceModel: "iPhone 15",
      deviceCategory: "mobile",
      price: 3000,
    });
    assert.ok(exact > brandOnly);
    assert.equal(categoryNoise, 0);
  });

  it("ranks closest matches first", () => {
    const ranked = rankSimilarProducts(seed, [
      {
        _id: "loose",
        brand: "Samsung",
        partType: "battery",
        deviceModel: "A15",
        createdAt: "2026-01-01",
      },
      {
        _id: "best",
        brand: "Samsung",
        partType: "display",
        deviceModel: "S24 Ultra",
        createdAt: "2026-01-02",
      },
      {
        _id: "mid",
        brand: "Samsung",
        partType: "display",
        deviceModel: "S23",
        createdAt: "2026-01-03",
      },
    ]);
    assert.deepEqual(
      ranked.map((r) => String(r._id)),
      ["best", "mid", "loose"],
    );
  });

  it("builds a contextual section title", () => {
    const copy = similarSectionCopy({
      brand: "Samsung",
      deviceModel: "S24 Ultra",
      partType: "display",
      partLabel: "Display",
    });
    assert.equal(copy.title, "More Display for Samsung S24 Ultra");
    assert.match(copy.browseHref, /brand=Samsung/);
    assert.match(copy.browseHref, /partType=display/);
  });
});
