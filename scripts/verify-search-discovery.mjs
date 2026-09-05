/**
 * Phase 9 Search & Discovery finalization checks.
 * Run: node scripts/verify-search-discovery.mjs
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
const nl = read("src/lib/products/parseNaturalQuery.ts");
const filtersUi = read("src/app/products/_components/ProductFilters.tsx");
const userModel = read("src/lib/models/User.ts");
const ensure = read("src/lib/categories/ensureReconciled.ts");
const productsPage = read("src/app/products/page.tsx");
const productsApi = read("src/app/api/products/route.ts");
const structured = read("src/lib/products/structuredModelFilter.ts");

assert(
  /next\.search = undefined/.test(nl) ||
    /next\.search = undefined;/.test(nl),
  "NL clears search when residual empty (no deviceModel reattach)",
);
assert(
  !/next\.search = parsed\.filters\.deviceModel/.test(nl),
  "NL no longer reattaches deviceModel as free-text",
);

assert(
  /from "@\/lib\/products\/listSort"/.test(listQuery),
  "listQuery uses listSort helpers",
);
assert(
  /export function totalPages/.test(read("src/lib/products/listSort.ts")),
  "totalPages helper exported",
);
assert(
  /export function resolveSort/.test(read("src/lib/products/listSort.ts")),
  "resolveSort exported with tie-break",
);
assert(
  /_id:\s*1/.test(listQuery),
  "sort specs include _id tie-breaker",
);
assert(
  /Within-page boost|within the current page only/.test(listQuery),
  "preferCity uses within-page soft boost (no deep-page overfetch)",
);
assert(
  !/overFetch = preferSameCity/.test(listQuery),
  "removed preferSameCity overfetch window",
);
assert(
  /status:\s*"approved"/.test(listQuery),
  "public list remains status approved",
);

assert(
  /limitValue/.test(filtersUi) && /params\.set\("limit"/.test(filtersUi),
  "ProductFilters preserves limit in URL rewrite",
);
assert(
  /page intentionally resets|intentionally resets when filters/.test(filtersUi),
  "documents page reset on filter change",
);

assert(
  /role:\s*1,\s*isBlocked:\s*1,\s*city:\s*1/.test(userModel),
  "User index {role, isBlocked, city} added",
);

assert(
  /CLEAN_TTL_MS/.test(ensure),
  "category reconcile clean TTL cache present",
);

assert(
  /fetchProductList/.test(productsPage) && /fetchProductList/.test(productsApi),
  "/products and /api/products share fetchProductList",
);

assert(
  /Parts SEO hubs|exact partType/.test(structured),
  "documents Parts exact vs browse structured model difference",
);

assert(
  /Intentional vs `\$text`|Intentional vs \$text|fuzzy/.test(
    read("src/lib/products/atlasSearch.ts"),
  ),
  "documents intentional Atlas vs $text differences",
);

const runtime = spawnSync(
  "npx",
  ["tsx", "scripts/check-search-discovery.ts"],
  { cwd: root, encoding: "utf8", shell: true },
);
if (runtime.status !== 0) {
  console.error(runtime.stdout || "");
  console.error(runtime.stderr || "");
  assert(false, "runtime search-discovery checks");
} else {
  console.log((runtime.stdout || "").trim());
  assert(true, "runtime search-discovery checks");
}

// Prior phase scripts still relevant
for (const script of [
  "scripts/verify-product-filter-matching.mjs",
  "scripts/verify-saved-search-matching.mjs",
]) {
  const r = spawnSync("node", [script], {
    cwd: root,
    encoding: "utf8",
    shell: true,
  });
  if (r.status !== 0) {
    console.error(r.stdout || "");
    console.error(r.stderr || "");
    assert(false, script);
  } else {
    assert(true, `${script} PASSED`);
  }
}

if (process.exitCode) {
  console.error("\nverify-search-discovery: FAILED");
  process.exit(1);
}
console.log("\nverify-search-discovery: PASSED");
