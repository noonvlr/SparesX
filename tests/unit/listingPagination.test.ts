import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  listingHref,
  listingPageMeta,
  listingPageNumbers,
} from "@/lib/seo/listingPagination";

describe("listing pagination", () => {
  it("keeps /products indexable with its own canonical", () => {
    assert.deepEqual(listingPageMeta({}, 10), {
      index: true,
      canonical: "/products",
    });
  });

  it("indexes later pages of the default list at their own URL", () => {
    assert.deepEqual(listingPageMeta({ page: "2" }, 10), {
      index: true,
      canonical: "/products?page=2",
    });
    assert.deepEqual(listingPageMeta({ page: "10" }, 10), {
      index: true,
      canonical: "/products?page=10",
    });
  });

  it("does not index page=1, invalid pages, or pages past the end", () => {
    assert.deepEqual(listingPageMeta({ page: "1" }, 10), {
      index: false,
      canonical: "/products",
    });
    assert.deepEqual(listingPageMeta({ page: "0" }, 10), {
      index: false,
      canonical: "/products",
    });
    assert.deepEqual(listingPageMeta({ page: "abc" }, 10), {
      index: false,
      canonical: "/products",
    });
    assert.deepEqual(listingPageMeta({ page: "01" }, 10), {
      index: false,
      canonical: "/products",
    });
    assert.deepEqual(listingPageMeta({ page: "99" }, 10), {
      index: false,
      canonical: "/products?page=10",
    });
    assert.deepEqual(listingPageMeta({ page: "2" }, 0), {
      index: false,
      canonical: "/products",
    });
  });

  it("keeps filtered views out of the index and canonicalizes the filtered URL", () => {
    assert.deepEqual(listingPageMeta({ brand: "Realme" }, 4), {
      index: false,
      canonical: "/products?brand=Realme",
    });
    assert.deepEqual(listingPageMeta({ brand: "Realme", page: "2" }, 4), {
      index: false,
      canonical: "/products?brand=Realme&page=2",
    });
    assert.deepEqual(listingPageMeta({ sort: "price", page: "2" }, 4), {
      index: false,
      canonical: "/products?sort=price&page=2",
    });
  });

  it("builds crawlable hrefs that keep filters and omit page 1", () => {
    assert.equal(listingHref({ brand: "Realme" }, 1), "/products?brand=Realme");
    assert.equal(
      listingHref({ brand: "Realme", page: "2" }, 3),
      "/products?brand=Realme&page=3",
    );
    assert.equal(listingHref({}, 2), "/products?page=2");
    assert.deepEqual(listingPageNumbers(1, 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(listingPageNumbers(8, 20), [1, 6, 7, 8, 9, 10, 20]);
    assert.deepEqual(listingPageNumbers(1, 1), []);
  });
});
