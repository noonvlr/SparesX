/**
 * Static Phase 4 parity check: disable/enable routes mirror each other.
 * Run: node scripts/verify-part-category-enable-parity.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const disablePath = path.join(
  root,
  "src/app/api/device-management/part-categories/[id]/disable/route.ts",
);
const enablePath = path.join(
  root,
  "src/app/api/device-management/part-categories/[id]/enable/route.ts",
);

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
}

const disableSrc = fs.readFileSync(disablePath, "utf8");
const enableSrc = fs.readFileSync(enablePath, "utf8");

assert(fs.existsSync(disablePath), "disable route exists");
assert(fs.existsSync(enablePath), "enable route exists");
assert(/export async function PATCH/.test(disableSrc), "disable exports PATCH");
assert(/export async function PATCH/.test(enableSrc), "enable exports PATCH");
assert(/requireAdmin/.test(disableSrc) && /requireAdmin/.test(enableSrc), "both require admin");
assert(/isActive:\s*false/.test(disableSrc), "disable sets isActive false");
assert(/isActive:\s*true/.test(enableSrc), "enable sets isActive true");
assert(/deviceId/.test(enableSrc), "enable rejects non-device-scoped");
assert(/revalidateCategoryCaches/.test(enableSrc), "enable revalidates caches");
assert(
  /\{ category: updated \}/.test(enableSrc) &&
    /\{ category: updated \}/.test(disableSrc),
  "response shapes match",
);

if (!process.exitCode) {
  console.log("\nPart-category disable/enable parity checks passed.");
}
