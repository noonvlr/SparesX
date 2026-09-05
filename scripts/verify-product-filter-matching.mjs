/**
 * Phase 7 checks: structured deviceModel filter + deterministic legacy category.
 * Run: node scripts/verify-product-filter-matching.mjs
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

const listQuery = read("src/lib/products/listQuery.ts");
const structured = read("src/lib/products/structuredModelFilter.ts");
const productsPage = read("src/app/products/page.tsx");
const productsApi = read("src/app/api/products/route.ts");

assert(
  /export function buildStructuredModelFilter/.test(structured),
  "buildStructuredModelFilter is exported from structuredModelFilter",
);
assert(
  /from "@\/lib\/products\/structuredModelFilter"/.test(listQuery),
  "listQuery imports structured model filter",
);
assert(
  /export async function resolveLegacyCategoryParam/.test(listQuery),
  "resolveLegacyCategoryParam is exported",
);

assert(
  /deviceModel:\s*\{/.test(structured),
  "structured model filter uses deviceModel field",
);
assert(
  !/\["deviceModel",\s*"name",\s*"modelNumber"\]/.test(structured),
  "structured model filter does not OR name/modelNumber",
);
assert(
  !/fields\.map\(\(field\)/.test(structured),
  "structured model filter does not use multi-field map",
);
assert(
  structured.includes("(^|[\\\\s\\\\-_/])"),
  "structured model uses bounded token matching",
);

const searchFn = listQuery.slice(
  listQuery.indexOf("function buildSearchFilter"),
  listQuery.indexOf("function sanitizeTextSearch"),
);
assert(
  /"name"/.test(searchFn) && /"modelNumber"/.test(searchFn),
  "free-text search still includes name and modelNumber",
);

assert(
  /params\.deviceModel\s*\|\|\s*params\.model/.test(listQuery),
  "model query param aliases to deviceModel",
);

assert(
  !/\{\s*deviceCategory:\s*category\.toLowerCase\(\)\s*\},\s*\{\s*category\s*\},\s*\{\s*partType:\s*category\s*\}/.test(
    listQuery,
  ),
  "legacy category no longer uses deviceCategory|category|partType OR",
);
assert(
  /Explicit deviceCategory wins over legacy/.test(listQuery),
  "documents deviceCategory precedence over legacy category",
);
assert(
  /Explicit partType takes precedence over legacy category/.test(listQuery),
  "documents partType precedence over legacy category→partType",
);
assert(
  /kind === "deviceCategory"/.test(listQuery) &&
    /kind === "partType"/.test(listQuery) &&
    /legacyField/.test(listQuery),
  "legacy category resolves to device, partType, or legacy field",
);

assert(
  /status:\s*"approved"/.test(listQuery),
  "public list still filters status approved",
);

assert(
  /fetchProductList/.test(productsPage),
  "/products uses fetchProductList",
);
assert(
  /fetchProductList/.test(productsApi),
  "/api/products uses fetchProductList",
);

const runtime = spawnSync(
  "npx",
  ["tsx", "scripts/check-structured-model-filter.ts"],
  {
    cwd: root,
    encoding: "utf8",
    shell: true,
  },
);
if (runtime.status !== 0) {
  console.error(runtime.stdout || "");
  console.error(runtime.stderr || "");
  assert(false, "runtime structured-model checks");
} else {
  console.log((runtime.stdout || "").trim());
  assert(true, "runtime structured-model checks");
}

if (process.exitCode) {
  console.error("\nverify-product-filter-matching: FAILED");
  process.exit(1);
}
console.log("\nverify-product-filter-matching: PASSED");
