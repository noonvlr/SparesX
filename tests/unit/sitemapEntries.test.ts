import { before, describe, it } from "node:test";
import assert from "node:assert/strict";

type SitemapModule = typeof import("@/app/sitemap");

let productSitemapPath: SitemapModule["productSitemapPath"];
let uniqueSitemapEntries: SitemapModule["uniqueSitemapEntries"];

describe("sitemap entries", () => {
  before(async () => {
    process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/sparesx-unit";
    const mod = await import("@/app/sitemap");
    productSitemapPath = mod.productSitemapPath;
    uniqueSitemapEntries = mod.uniqueSitemapEntries;
  });
  it("uses the public slug and skips duplicate listings", () => {
    assert.equal(
      productSitemapPath({
        _id: "abc",
        slug: "redmi-k20-mobile-motherboard-used",
      }),
      "/product/redmi-k20-mobile-motherboard-used",
    );
    assert.equal(
      productSitemapPath({
        _id: "abc",
        slug: "redmi-k20-mobile-motherboard-used",
        tags: ["possible_duplicate"],
      }),
      null,
    );
    assert.equal(productSitemapPath({ _id: "", slug: "" }), null);
  });

  it("drops missing and repeated URLs", () => {
    const entries = uniqueSitemapEntries([
      { url: "https://www.sparesx.com/products" },
      { url: "https://www.sparesx.com/products" },
      null,
      { url: "https://www.sparesx.com/parts/mobile-battery/realme/10-5g" },
      { url: "https://www.sparesx.com/product/redmi-k20-mobile-motherboard-used" },
    ]);
    assert.deepEqual(
      entries.map((entry) => entry.url),
      [
        "https://www.sparesx.com/products",
        "https://www.sparesx.com/parts/mobile-battery/realme/10-5g",
        "https://www.sparesx.com/product/redmi-k20-mobile-motherboard-used",
      ],
    );
  });
});
