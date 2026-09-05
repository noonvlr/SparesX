/**
 * Runtime Phase 8A assertions (no Mongo).
 * Invoked by verify-saved-search-matching.mjs
 */
import { matchesStructuredDeviceModel } from "../src/lib/products/structuredModelFilter";
import {
  buildSavedSearchCandidateOr,
  productMatchesSavedFilters,
  savedSearchPassesCandidateOr,
} from "../src/lib/saved-searches/filters";

function assert(c: boolean, m: string) {
  if (!c) {
    console.error("FAIL: " + m);
    process.exit(1);
  }
  console.log("OK: " + m);
}

// Test 1 — model false positive (name must not satisfy)
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

// Test 2 — model positive
assert(
  productMatchesSavedFilters(
    { deviceModel: "iPhone 15", name: "anything" },
    { deviceModel: "iPhone 15" },
  ) === true,
  "deviceModel=iPhone 15 matches iPhone 15",
);

// Test 3 — multi-word
assert(
  productMatchesSavedFilters(
    { deviceModel: "iPhone 15 Pro Max" },
    { deviceModel: "iPhone 15 Pro Max" },
  ) === true,
  "multi-word iPhone 15 Pro Max matches",
);
assert(
  matchesStructuredDeviceModel("iPhone 15 Pro Max", "iPhone 15 Pro Max") ===
    true,
  "shared helper multi-word match",
);

// Test 4 — candidate: model-only saved search
const modelOnly = { deviceModel: "iPhone 15" };
const product = {
  deviceModel: "iPhone 15",
  brand: "Apple",
  partType: "display",
};
assert(
  savedSearchPassesCandidateOr(modelOnly, product) === true,
  "model-only saved search enters candidate set",
);
assert(
  buildSavedSearchCandidateOr(product).some(
    (clause) =>
      clause["filters.deviceModel"] &&
      typeof clause["filters.deviceModel"] === "object",
  ),
  "candidate $or includes deviceModel existence clause",
);

// Test 5 — candidate: city / price structured-only
assert(
  savedSearchPassesCandidateOr({ city: "Chennai" }, product) === true,
  "city-only saved search enters candidate set",
);
assert(
  savedSearchPassesCandidateOr({ minPrice: "500", condition: "new" }, product) ===
    true,
  "price/condition-only saved search enters candidate set",
);
assert(
  savedSearchPassesCandidateOr({}, { brand: "Other" }) === false,
  "empty filters do not pass candidate or",
);

// Test 6 — final matcher remains authoritative
assert(
  savedSearchPassesCandidateOr({ deviceModel: "15" }, fpProduct) === true,
  "candidate allows model=15 against unrelated product (superset)",
);
assert(
  productMatchesSavedFilters(fpProduct, { deviceModel: "15" }) === false,
  "final matcher still rejects name-only model false positive",
);
assert(
  productMatchesSavedFilters(
    { deviceModel: "iPhone 15", price: 100 },
    { deviceModel: "iPhone 15", maxPrice: "50" },
  ) === false,
  "candidate expansion does not bypass price filter in final matcher",
);
