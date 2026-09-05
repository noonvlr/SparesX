/**
 * Phase 8A: saved-search structured deviceModel + candidate-query checks.
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
const structured = read("src/lib/products/structuredModelFilter.ts");

assert(
  /matchesStructuredDeviceModel/.test(filtersSrc),
  "saved filters use matchesStructuredDeviceModel",
);
assert(
  !/modelHay\s*=\s*`\$\{product\.deviceModel/.test(filtersSrc),
  "saved filters no longer concatenate name into model haystack",
);
assert(
  filtersSrc.includes('"filters.deviceModel"'),
  "candidate $or includes deviceModel existence",
);
assert(
  filtersSrc.includes('"filters.city"'),
  "candidate $or includes city existence",
);
assert(
  filtersSrc.includes('"filters.minPrice"') &&
    filtersSrc.includes('"filters.condition"'),
  "candidate $or includes price/condition existence",
);
assert(
  /limit\(100\)/.test(matchSrc),
  "notify still applies limit(100) (deferred scale cap)",
);
assert(
  /buildSavedSearchCandidateOr/.test(matchSrc),
  "notify uses buildSavedSearchCandidateOr",
);
assert(
  /export function matchesStructuredDeviceModel/.test(structured),
  "shared matchesStructuredDeviceModel exported",
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
