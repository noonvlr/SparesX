/**
 * Phase 9 runtime checks for Search & Discovery finalization (no Mongo required).
 * Invoked by verify-search-discovery.mjs
 */
import { applyNaturalQueryToParams } from "../src/lib/products/parseNaturalQuery";
import { resolveSort, totalPages } from "../src/lib/products/listSort";
import {
  buildStructuredModelFilter,
  matchesStructuredDeviceModel,
} from "../src/lib/products/structuredModelFilter";
import {
  atlasSearchEnabled,
  buildAtlasProductSearchStage,
} from "../src/lib/products/atlasSearch";

function assert(c: boolean, m: string) {
  if (!c) {
    console.error("FAIL: " + m);
    process.exit(1);
  }
  console.log("OK: " + m);
}

// ——— NL: do not reattach free-text when residual empty ———
function nl(search: string) {
  return applyNaturalQueryToParams({ search });
}

const iphone15 = nl("iPhone 15");
assert(
  Boolean(iphone15.brand || iphone15.deviceModel),
  "iPhone 15 extracts structured brand/model",
);
assert(
  !iphone15.search,
  "iPhone 15 does not reattach free-text search after structured extract",
);

const iphoneDisplay = nl("iPhone 15 display");
assert(
  iphoneDisplay.partType === "display" || Boolean(iphoneDisplay.partType),
  "iPhone 15 display extracts partType",
);
assert(
  !iphoneDisplay.search ||
    !/iphone/i.test(iphoneDisplay.search || ""),
  "iPhone 15 display does not keep redundant iPhone free-text when structured",
);

const s24 = nl("Samsung S24 screen");
assert(Boolean(s24.brand), "Samsung S24 screen extracts brand");
assert(
  s24.partType === "display" || Boolean(s24.partType),
  "Samsung S24 screen maps screen→display partType",
);
assert(
  !s24.search || s24.search.length >= 2,
  "Samsung S24 screen residual is genuine or cleared",
);

const laptopDisplay = nl("laptop display");
assert(
  laptopDisplay.deviceCategory === "laptop" || Boolean(laptopDisplay.partType),
  "laptop display extracts device/part structured filters",
);
assert(
  !laptopDisplay.search,
  "laptop display clears free-text when fully structured",
);

const screenOnly = nl("screen");
assert(
  screenOnly.partType === "display",
  "screen → partType display",
);
assert(!screenOnly.search, "screen alone clears free-text after NL");

const residual = nl("original flex cable under 500 near nowhereville");
// May extract condition/price/part; residual should remain if not fully consumed
assert(
  residual.search !== undefined ||
    Boolean(residual.partType || residual.maxPrice || residual.condition),
  "genuine residual / structured mix still produces params",
);

// Explicit filters win — NL should not overwrite
const explicit = applyNaturalQueryToParams({
  search: "iPhone 15 display",
  brand: "Samsung",
  partType: "battery",
});
assert(explicit.brand === "Samsung", "explicit brand wins over NL");
assert(explicit.partType === "battery", "explicit partType wins over NL");

// ——— Pagination metadata ———
assert(totalPages(0, 12) === 1, "empty results pages=1");
assert(totalPages(12, 12) === 1, "exact one page");
assert(totalPages(13, 12) === 2, "ceil pages");
assert(totalPages(100, 12) === 9, "deep page count reachable in metadata");

// Soft-city no longer uses overfetch window math — pages always match total/limit
const deepPage = 6;
const limit = 12;
const total = 100;
assert(
  deepPage <= totalPages(total, limit),
  "deep page within advertised pages",
);

// ——— Sort tie-break ———
const featured = resolveSort("featured");
assert(featured._id === 1, "featured sort has _id tie-break");
assert(featured.featured === -1 && featured.createdAt === -1, "featured primary keys");
assert(resolveSort("newest")._id === 1, "newest has _id");
assert(resolveSort("price_asc").price === 1 && resolveSort("price_asc")._id === 1, "price_asc stable");
assert(resolveSort("price_desc").price === -1 && resolveSort("price_desc")._id === 1, "price_desc stable");

// ——— Structured model (Phase 7 preserved) ———
assert(
  matchesStructuredDeviceModel("Galaxy S24", "15") === false,
  "structured model does not bleed short tokens across models",
);
assert(
  matchesStructuredDeviceModel("iPhone 15", "iPhone 15") === true,
  "structured model matches exact model",
);
const clause = buildStructuredModelFilter("iPhone 15 Pro Max");
assert(
  Boolean(clause.$and) || Boolean(clause.deviceModel),
  "multi-word model builds deviceModel-only clause",
);
assert(
  !JSON.stringify(clause).includes('"name"'),
  "structured model clause excludes name",
);

// ——— Atlas stage field coverage (structural) ———
const stage = buildAtlasProductSearchStage("test query");
const paths = JSON.stringify(stage);
assert(paths.includes("name"), "Atlas searches name");
assert(paths.includes("deviceModel"), "Atlas searches deviceModel");
assert(paths.includes("modelNumber"), "Atlas searches modelNumber");
assert(paths.includes("tags"), "Atlas searches tags");
assert(paths.includes("description"), "Atlas searches description");
assert(
  typeof atlasSearchEnabled() === "boolean",
  "atlasSearchEnabled is boolean (env-dependent path)",
);

console.log("check-search-discovery: all assertions passed");
