/**
 * Phase 8A + 8B runtime assertions for saved-search matching (no Mongo required
 * for city/model/nearby/partType alias pure helpers).
 * Invoked by verify-saved-search-matching.mjs
 */
import { matchesStructuredDeviceModel } from "../src/lib/products/structuredModelFilter";
import {
  sellerCityMatchesFilter,
  isSameCity,
  expandNearbyCities,
} from "../src/lib/geo/nearbyCities";
import {
  collectPartTypeAliasValues,
  partTypeValueInAliases,
} from "../src/lib/categories/partTypeMatch";
import {
  buildSavedSearchCandidateOr,
  productMatchesSavedFilters,
  savedSearchPassesCandidateOr,
} from "../src/lib/saved-searches/filters";
import {
  buildQueryString,
  normalizeFilters,
  labelFromFilters,
} from "../src/lib/models/SavedSearch";

function assert(c: boolean, m: string) {
  if (!c) {
    console.error("FAIL: " + m);
    process.exit(1);
  }
  console.log("OK: " + m);
}

// ——— Phase 8A: structured deviceModel ———
const fpProduct = {
  deviceModel: "Galaxy S24",
  name: "OEM glass for iPhone 15",
  brand: "Samsung",
};
assert(
  productMatchesSavedFilters(fpProduct, { deviceModel: "15" }) === false,
  "deviceModel=15 does not match via name",
);
assert(
  matchesStructuredDeviceModel("Galaxy S24", "15") === false,
  "shared helper rejects Galaxy S24 for filter 15",
);
assert(
  productMatchesSavedFilters(
    { deviceModel: "iPhone 15", name: "anything" },
    { deviceModel: "iPhone 15" },
  ) === true,
  "deviceModel=iPhone 15 matches iPhone 15",
);
assert(
  productMatchesSavedFilters(
    { deviceModel: "iPhone 15 Pro Max" },
    { deviceModel: "iPhone 15 Pro Max" },
  ) === true,
  "multi-word iPhone 15 Pro Max matches",
);

// ——— Nearby persistence / normalize / queryString ———
const withNearby = normalizeFilters({
  city: "Chennai",
  nearby: true,
  partType: "screen",
});
assert(withNearby.nearby === true, "normalize preserves nearby with city");
assert(
  buildQueryString(withNearby).includes("city=Chennai"),
  "queryString includes city",
);
assert(
  buildQueryString(withNearby).includes("nearby=1"),
  "queryString includes nearby=1",
);
assert(
  labelFromFilters(withNearby).includes("nearby"),
  "label indicates nearby",
);

const cityOnly = normalizeFilters({ city: "Chennai", nearby: false });
assert(cityOnly.nearby === undefined, "nearby false not persisted");
assert(
  !buildQueryString(cityOnly).includes("nearby"),
  "city-only queryString omits nearby",
);

const nearbyNoCity = normalizeFilters({ nearby: true });
assert(
  nearbyNoCity.nearby === undefined && !nearbyNoCity.city,
  "nearby without city is not persisted",
);

const missingNearby = normalizeFilters({ city: "Chennai" });
assert(
  missingNearby.nearby === undefined,
  "existing docs missing nearby remain city-only",
);
assert(
  buildQueryString({ city: "Chennai", nearby: true }) ===
    "city=Chennai&nearby=1" ||
    buildQueryString({ city: "Chennai", nearby: true }).includes("nearby=1"),
  "replay preserves nearby intent",
);

// ——— City exact / aliases / nearby ———
assert(
  sellerCityMatchesFilter("Chennai", "Chennai") === true,
  "exact city matches",
);
assert(
  sellerCityMatchesFilter("Chennai", "Chen") === false,
  "partial Chen does not match Chennai",
);
assert(
  productMatchesSavedFilters(
    { deviceModel: "x" },
    { city: "Chen" },
    { city: "Chennai" },
  ) === false,
  "saved matcher rejects substring city",
);
assert(
  isSameCity("Bangalore", "Bengaluru") === true,
  "canonical aliases Bangalore/Bengaluru",
);
assert(
  sellerCityMatchesFilter("Bangalore", "Bengaluru") === true,
  "seller Bangalore matches filter Bengaluru",
);
assert(
  sellerCityMatchesFilter("Tambaram", "Chennai", true) === true,
  "nearby cluster city matches when nearby enabled",
);
assert(
  sellerCityMatchesFilter("Tambaram", "Chennai", false) === false,
  "nearby cluster city does not match when nearby disabled",
);
assert(
  productMatchesSavedFilters(
    {},
    { city: "Chennai", nearby: true },
    { city: "Tambaram" },
  ) === true,
  "saved matcher nearby cluster AND city",
);
assert(
  productMatchesSavedFilters(
    {},
    { city: "Chennai" },
    { city: "Tambaram" },
  ) === false,
  "saved matcher city-only excludes cluster peer",
);

const unknown = "SomeUnknownCityXYZ";
assert(
  expandNearbyCities(unknown).length === 1 &&
    expandNearbyCities(unknown)[0] === unknown.trim(),
  "unknown city falls back to single canonical list",
);
assert(
  sellerCityMatchesFilter(unknown, unknown) === true,
  "unknown city exact self-match",
);

// ——— Part type Category aliases (pure, seeded-like rows) ———
const categories = [
  { name: "Screen/Display", slug: "screen" },
  { name: "Screen/Display", slug: "mobile-screen" },
  { name: "Battery", slug: "battery" },
  { name: "Camera", slug: "camera" },
];
const screenAliases = collectPartTypeAliasValues("screen", categories);
assert(
  partTypeValueInAliases("screen", screenAliases),
  "canonical screen slug matches",
);
assert(
  partTypeValueInAliases("Screen/Display", screenAliases),
  "display name alias matches screen filter",
);
assert(
  partTypeValueInAliases("mobile-screen", screenAliases),
  "same-name-key slug alias matches",
);
assert(
  !partTypeValueInAliases("battery", screenAliases),
  "unrelated Category does not match",
);
assert(
  !partTypeValueInAliases("lcd", screenAliases),
  "free-text synonym lcd is not a Category alias",
);

const prefixed = collectPartTypeAliasValues("mobile-display", [
  { name: "Display", slug: "mobile-display" },
]);
assert(
  partTypeValueInAliases("display", prefixed),
  "prefixed slug adds bare suffix display",
);

assert(
  productMatchesSavedFilters(
    { partType: "Screen/Display" },
    { partType: "screen" },
    null,
    { partTypeAliasValues: screenAliases },
  ) === true,
  "final matcher uses Category aliases",
);
assert(
  productMatchesSavedFilters(
    { partType: "Screen/Display" },
    { partType: "screen" },
  ) === false,
  "without alias context exact equality fails (final matcher authoritative)",
);

// ——— Combined AND ———
assert(
  productMatchesSavedFilters(
    { partType: "screen", deviceModel: "iPhone 15" },
    { partType: "screen", city: "Chennai" },
    { city: "Chennai" },
    { partTypeAliasValues: screenAliases },
  ) === true,
  "city + partType AND match",
);
assert(
  productMatchesSavedFilters(
    { partType: "screen" },
    { partType: "screen", city: "Chennai", nearby: true },
    { city: "Tambaram" },
    { partTypeAliasValues: screenAliases },
  ) === true,
  "city + nearby + partType AND match",
);
assert(
  productMatchesSavedFilters(
    { partType: "screen", deviceModel: "iPhone 15" },
    { deviceModel: "iPhone 15", city: "Chennai" },
    { city: "Mumbai" },
  ) === false,
  "deviceModel + city remains ANDed (city miss)",
);

// ——— Candidate set ———
const product = {
  deviceModel: "iPhone 15",
  brand: "Apple",
  partType: "Screen/Display",
};
assert(
  savedSearchPassesCandidateOr({ deviceModel: "iPhone 15" }, product) === true,
  "model-only enters candidate set",
);
assert(
  savedSearchPassesCandidateOr({ city: "Chennai", nearby: true }, product) ===
    true,
  "city/nearby enters candidate set",
);
assert(
  savedSearchPassesCandidateOr({ partType: "screen" }, product) === true,
  "partType-only enters candidate set (alias-safe)",
);
assert(
  buildSavedSearchCandidateOr(product).some(
    (c) => c["filters.partType"] && typeof c["filters.partType"] === "object",
  ),
  "candidate $or includes partType existence",
);
assert(
  savedSearchPassesCandidateOr({ partType: "screen" }, product) === true &&
    productMatchesSavedFilters(
      product,
      { partType: "battery" },
      null,
      { partTypeAliasValues: collectPartTypeAliasValues("battery", categories) },
    ) === false,
  "candidate expansion does not bypass final partType matcher",
);
