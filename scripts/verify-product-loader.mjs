/**
 * Static Phase 6 checks: shared product loader + canonical product links.
 * Run: node scripts/verify-product-loader.mjs
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

const loader = read("src/lib/products/loadPublicProduct.ts");
const api = read("src/app/api/products/[id]/route.ts");
const pdp = read("src/app/product/[slug]/page.tsx");
const detail = read("src/app/product/[slug]/_components/ProductDetail.tsx");
const header = read("src/components/chat/ProductHeader.tsx");
const waClient = read("src/app/whatsapp-connect/WhatsAppConnectClient.tsx");
const nextConfig = read("next.config.ts");

assert(
  fs.existsSync(path.join(root, "src/lib/products/loadPublicProduct.ts")),
  "shared loader file exists",
);
assert(
  /export async function loadPublicProduct/.test(loader),
  "loadPublicProduct exported",
);
assert(
  /isWhatsAppUnlocked/.test(loader),
  "loader preserves WhatsApp unlock",
);
assert(/Access denied/.test(loader), "loader preserves 403 access denied");
assert(/Product not found/.test(loader), "loader preserves 404 not found");

assert(
  /from "@\/lib\/products\/loadPublicProduct"/.test(api),
  "API route imports shared loader",
);
assert(
  /loadPublicProduct\(id, auth\)/.test(api),
  "API route calls loadPublicProduct with viewer",
);
assert(
  !/Product\.findById/.test(api),
  "API route no longer embeds Product.findById",
);

assert(
  /loadPublicProductForPage/.test(pdp),
  "PDP uses loadPublicProductForPage",
);
assert(
  !/\/api\/products\//.test(pdp),
  "PDP no longer self-fetches /api/products",
);
assert(
  !/NEXT_PUBLIC_BASE_URL/.test(pdp),
  "PDP does not use NEXT_PUBLIC_BASE_URL for product load",
);
assert(
  !/requestOrigin|fetch\(`\$\{origin\}/.test(pdp),
  "PDP removed HTTP origin self-fetch helpers",
);

assert(
  /productPath\(product\)/.test(detail),
  "ProductDetail nextPath uses productPath",
);
assert(
  !/nextPath=\{`\/product\/\$\{product\._id\}`\}/.test(detail),
  "ProductDetail no longer hardcodes /product/${_id}",
);
assert(/productPath\(product\)/.test(header), "ProductHeader uses productPath");
assert(
  /productPath\(item\.product\)/.test(waClient),
  "WhatsAppConnectClient uses productPath",
);

assert(
  /source:\s*"\/products\/:id"/.test(nextConfig) &&
    /destination:\s*"\/product\/:id"/.test(nextConfig),
  "legacy /products/:id redirect preserved",
);

if (!process.exitCode) {
  console.log("\nProduct loader verification passed.");
}
