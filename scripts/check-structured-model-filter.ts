/**
 * Runtime assertions for structured deviceModel matching (no Mongo required).
 * Invoked by verify-product-filter-matching.mjs
 */
import * as modelFilter from "../src/lib/products/structuredModelFilter";

const { buildStructuredModelFilter } = modelFilter;

function assert(c: boolean, m: string) {
  if (!c) {
    console.error("FAIL: " + m);
    process.exit(1);
  }
  console.log("OK: " + m);
}

const multi = buildStructuredModelFilter("iPhone 15 Pro Max");
assert(
  Boolean(multi.$and) && (multi.$and as unknown[]).length >= 2,
  "multi-word model uses token AND on deviceModel",
);
assert(
  (multi.$and as Record<string, unknown>[]).every(
    (c) => c.deviceModel && !("name" in c) && !("modelNumber" in c),
  ),
  "multi-word tokens only match deviceModel",
);

const short = buildStructuredModelFilter("15");
const shortJson = JSON.stringify(short);
assert(shortJson.includes("deviceModel"), "short model queries deviceModel");
assert(!shortJson.includes('"name"'), "short model does not query name");
assert(!/"modelNumber"/.test(shortJson), "short model does not query modelNumber");

const viaModelAliasPath = buildStructuredModelFilter("S24 Ultra");
assert(
  JSON.stringify(viaModelAliasPath).includes("deviceModel"),
  "model alias shares structured matcher (param-level)",
);

const branded = buildStructuredModelFilter("S24 Ultra", "Samsung");
assert(
  JSON.stringify(branded).includes("deviceModel") &&
    !JSON.stringify(branded).includes('"name"'),
  "brand-aware model still deviceModel-only",
);
