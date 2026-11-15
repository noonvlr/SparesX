import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildPrimaryTokenAndFilter,
  buildSearchFilter,
  canonicalizeSearchRequirements,
  canonicalizeSearchTokens,
  tokenMatchRegex,
} from "@/lib/products/searchRelevance";

describe("search relevance", () => {
  it("maps part synonyms and drops filler words", () => {
    assert.deepEqual(canonicalizeSearchTokens("iphone 13 screen for phone"), [
      "iphone",
      "13",
      "display",
    ]);
  });

  it("keeps brand tokens required (not optional)", () => {
    const reqs = canonicalizeSearchRequirements("samsung battery");
    assert.equal(reqs.length, 2);
    assert.deepEqual(
      reqs.map((r) => (r.type === "all" ? r.tokens[0] : r.groups[0][0])),
      ["samsung", "battery"],
    );
  });

  it("accepts compact model aliases or expanded phrase", () => {
    const reqs = canonicalizeSearchRequirements("s24u camera");
    assert.equal(reqs.length, 2);
    const alias = reqs[0];
    assert.equal(alias.type, "anyOf");
    if (alias.type === "anyOf") {
      assert.deepEqual(alias.groups[0], ["s24u"]);
      assert.deepEqual(alias.groups[1], ["s24", "ultra"]);
    }
  });

  it("builds a primary-field AND gate that excludes description-only paths", () => {
    const gate = buildPrimaryTokenAndFilter("samsung display");
    assert.ok(gate);
    assert.ok(Array.isArray(gate!.$and));
    assert.equal(gate!.$and.length, 2);
    const json = JSON.stringify(gate);
    assert.equal(json.includes("description"), false);
    assert.equal(json.includes('"brand"'), true);
    assert.equal(json.includes('"partType"'), true);
  });

  it("does not let short alpha tokens match inside longer words", () => {
    const re = tokenMatchRegex("ic");
    assert.equal(re.test("device"), false);
    assert.equal(re.test("power ic"), true);
    assert.equal(re.test("IC"), true);
  });

  it("lets digit model tokens match compact codes", () => {
    const re = tokenMatchRegex("s24");
    assert.equal(re.test("S24U Battery"), true);
    assert.equal(re.test("Galaxy S24 Ultra"), true);
  });

  it("regex fallback uses the same primary gate", () => {
    const filter = buildSearchFilter("redmi battery");
    const gate = buildPrimaryTokenAndFilter("redmi battery");
    assert.deepEqual(filter, gate);
  });
});
