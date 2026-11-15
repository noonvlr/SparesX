import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mergeFeaturedSlots,
  type HomepageFeaturedItem,
} from "@/lib/products/featuredSlots";

function item(
  partial: Partial<HomepageFeaturedItem> & Pick<HomepageFeaturedItem, "_id">,
): HomepageFeaturedItem {
  return {
    name: partial.name || partial._id,
    price: partial.price ?? 100,
    images: partial.images ?? [],
    technician: partial.technician,
    featured: partial.featured,
    ...partial,
  };
}

describe("mergeFeaturedSlots", () => {
  it("puts admin pins first and fills remaining slots", () => {
    const pinned = [
      item({ _id: "pin1", featured: true, images: ["a.jpg"] }),
      item({ _id: "pin2", featured: true, images: ["b.jpg"] }),
    ];
    const candidates = [
      item({ _id: "c1", images: [], technician: "t1" }),
      item({ _id: "c2", images: ["c.jpg"], technician: "t2" }),
      item({ _id: "c3", images: ["d.jpg"], technician: "t3" }),
    ];
    const merged = mergeFeaturedSlots(pinned, candidates, new Set(), 4);
    assert.deepEqual(
      merged.map((m) => m._id),
      ["pin1", "pin2", "c2", "c3"],
    );
  });

  it("prefers imaged and trusted sellers when filling", () => {
    const candidates = [
      item({ _id: "noimg", images: [], technician: "trusted" }),
      item({ _id: "img", images: ["x.jpg"], technician: "other" }),
      item({ _id: "imgTrusted", images: ["y.jpg"], technician: "trusted" }),
    ];
    const merged = mergeFeaturedSlots(
      [],
      candidates,
      new Set(["trusted"]),
      2,
    );
    assert.deepEqual(
      merged.map((m) => m._id),
      ["imgTrusted", "img"],
    );
  });

  it("does not duplicate pins in the fill pool", () => {
    const pin = item({ _id: "pin1", featured: true, images: ["a.jpg"] });
    const merged = mergeFeaturedSlots(
      [pin],
      [pin, item({ _id: "c1", images: ["b.jpg"] })],
      new Set(),
      2,
    );
    assert.deepEqual(
      merged.map((m) => m._id),
      ["pin1", "c1"],
    );
  });
});
