/**
 * Static Phase 5 checks: Parts leaf membership + product breadcrumb shape + FAQ copy.
 * Run: node scripts/verify-parts-seo-integrity.mjs
 */
import fs from "node:fs";
import path from "node:path";

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

const leafPage = read(
  "src/app/parts/[category]/[brand]/[model]/page.tsx",
);
const hubs = read("src/lib/seo/partsHubs.ts");
const hubsData = read("src/lib/seo/partsHubsData.ts");
const productPage = read("src/app/product/[slug]/page.tsx");
const homePage = read("src/app/page.tsx");
const faq = read("src/app/faq/page.tsx");
const nextConfig = read("next.config.ts");
const partsPath = read("src/lib/seo/partsPath.ts");

assert(
  fs.existsSync(path.join(root, "src/app/parts/page.tsx")),
  "/parts route exists",
);
assert(
  fs.existsSync(path.join(root, "src/app/parts/[category]/page.tsx")),
  "/parts/[category] route exists",
);
assert(
  fs.existsSync(
    path.join(root, "src/app/parts/[category]/[brand]/page.tsx"),
  ),
  "/parts/[category]/[brand] route exists",
);
assert(
  fs.existsSync(
    path.join(
      root,
      "src/app/parts/[category]/[brand]/[model]/page.tsx",
    ),
  ),
  "/parts/[category]/[brand]/[model] route exists",
);

assert(
  /loadPartsHubLeafListings/.test(leafPage),
  "leaf page uses loadPartsHubLeafListings",
);
assert(
  !/fetchProductList\(/.test(leafPage),
  "leaf page no longer uses fetchProductList for hub membership",
);
assert(
  /resolvePartsHubLeafMembership|loadPartsHubLeafListings/.test(hubs),
  "hubs module exports leaf membership loader",
);
assert(
  /buildQualifyingPartsHubsFromRaw|loadRawPartsHubGroups/.test(hubsData),
  "raw aggregation is shared for qualifying hubs + leaf membership",
);
assert(
  /total >= 2/.test(leafPage),
  "leaf robots still gated on total >= 2",
);

assert(
  /name:\s*"Parts"/.test(productPage) &&
    /href:\s*"\/parts"/.test(productPage),
  "product breadcrumbs include Parts when hub path exists",
);
assert(
  /slugifyPathSegment\(product\.partType\)/.test(productPage),
  "product breadcrumbs link category/brand via slugifyPathSegment",
);
assert(
  /productUrl\(product\)/.test(productPage),
  "product canonical still uses productUrl",
);

assert(/href="\/parts"/.test(homePage), "homepage links to /parts");

assert(
  !/seller dashboard/.test(faq),
  'FAQ no longer says "seller dashboard"',
);
assert(
  /technician dashboard/.test(faq),
  'FAQ says "technician dashboard"',
);

assert(
  /source:\s*"\/sellers"/.test(nextConfig) &&
    /destination:\s*"\/technicians"/.test(nextConfig),
  "/sellers → /technicians redirect preserved",
);
assert(
  /source:\s*"\/seller-guidelines"/.test(nextConfig) &&
    /destination:\s*"\/technician-guidelines"/.test(nextConfig),
  "/seller-guidelines redirect preserved",
);
assert(
  /source:\s*"\/dashboard\/seller"/.test(nextConfig),
  "Phase 1 dashboard seller redirects preserved",
);

assert(
  /export function slugifyPathSegment/.test(partsPath),
  "slugifyPathSegment still defined in partsPath.ts",
);
assert(
  /\/parts\/\$\{category\}\/\$\{brand\}\/\$\{model\}/.test(partsPath),
  "partsPath URL format unchanged",
);

if (!process.exitCode) {
  console.log("\nParts SEO integrity static checks passed.");
}
