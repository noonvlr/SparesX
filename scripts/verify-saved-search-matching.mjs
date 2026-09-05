/**
 * Phase 8A/8B checks: saved-search model, city/nearby, partType aliases.
 * Run: node scripts/verify-saved-search-matching.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const filtersSrc = read("src/lib/saved-searches/filters.ts");
const matchSrc = read("src/lib/saved-searches/match.ts");
const savedModel = read("src/lib/models/SavedSearch.ts");
const productFilters = read("src/app/products/_components/ProductFilters.tsx");
const nearby = read("src/lib/geo/nearbyCities.ts");
const partType = read("src/lib/categories/partTypeMatch.ts");

assert(
  /matchesStructuredDeviceModel/.test(filtersSrc),
  "saved filters use matchesStructuredDeviceModel",
);
assert(
  !/modelHay\s*=\s*`\$\{product\.deviceModel/.test(filtersSrc),
  "saved filters no longer concatenate name into model haystack",
);
assert(
  /sellerCityMatchesFilter/.test(filtersSrc),
  "saved filters use sellerCityMatchesFilter",
);
assert(
  !/includesIgnoreCase\(seller\.city/.test(filtersSrc),
  "saved filters no longer substring-match city",
);
assert(
  /partTypeValueInAliases|partTypeAliasValues/.test(filtersSrc),
  "saved filters support partType aliases",
);
assert(
  /nearby\?: boolean/.test(savedModel),
  "SavedSearchFilters includes optional nearby",
);
assert(
  /params\.set\("nearby", "1"\)/.test(savedModel),
  "buildQueryString writes nearby=1",
);
assert(
  /includeNearby \? true/.test(productFilters),
  "ProductFilters save payload includes nearby",
);
assert(
  /export function sellerCityMatchesFilter/.test(nearby),
  "shared sellerCityMatchesFilter exported",
);
assert(
  /export function collectPartTypeAliasValues/.test(partType),
  "shared collectPartTypeAliasValues exported",
);
assert(
  /createPartTypeAliasResolver/.test(matchSrc),
  "notify loads Category alias resolver once",
);
assert(
  /limit\(100\)/.test(matchSrc),
  "notify still applies limit(100)",
);
assert(
  filtersSrc.includes('"filters.partType"'),
  "candidate $or includes partType existence",
);
assert(
  filtersSrc.includes('"filters.city"'),
  "candidate $or includes city existence",
);

const runtime = spawnSync(
  "npx",
  ["tsx", "scripts/check-saved-search-matching.ts"],
  { cwd: root, encoding: "utf8", shell: true },
);
if (runtime.status !== 0) {
  console.error(runtime.stdout || "");
  console.error(runtime.stderr || "");
  assert(false, "runtime saved-search matching checks");
} else {
  console.log((runtime.stdout || "").trim());
  assert(true, "runtime saved-search matching checks");
}

if (process.exitCode) {
  console.error("\nverify-saved-search-matching: FAILED");
  process.exit(1);
}
console.log("\nverify-saved-search-matching: PASSED");
