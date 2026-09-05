/**
 * Structured `deviceModel` / `model` matching.
 * Kept free of DB imports so list queries and saved-search matching share
 * the same semantics without Mongo coupling.
 */

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip brand / marketing prefixes so "Galaxy S24 Ultra" ≈ "S24 Ultra". */
export function normalizeModelTokens(deviceModel: string, brand?: string | null) {
  let normalized = deviceModel.trim();

  if (brand) {
    normalized = normalized.replace(
      new RegExp(`^${escapeRegex(brand)}\\s+`, "i"),
      "",
    );
  }

  normalized = normalized.replace(
    /^(galaxy|iphone|ipad|pixel|redmi|poco|moto|nokia|oneplus|realme|oppo|vivo)\s+/i,
    "",
  );

  return normalized
    .split(/[\s\-_/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

/** Bounded token segment inside a deviceModel string (not mid-word). */
function deviceModelHasToken(deviceModel: string, token: string): boolean {
  return new RegExp(
    `(^|[\\s\\-_/])${escapeRegex(token)}([\\s\\-_/]|$)`,
    "i",
  ).test(deviceModel);
}

/**
 * In-memory structured `deviceModel` match — same rules as
 * `buildStructuredModelFilter` / live `/products` listing.
 * Only inspects Product.deviceModel (never name/modelNumber).
 */
export function matchesStructuredDeviceModel(
  productDeviceModel: string | null | undefined,
  filterDeviceModel: string,
  brand?: string | null,
): boolean {
  const filter = filterDeviceModel.trim();
  if (!filter) return true;

  const hay = String(productDeviceModel || "");
  const tokens = normalizeModelTokens(filter, brand);

  if (tokens.length > 0) {
    return tokens.every((token) => deviceModelHasToken(hay, token));
  }

  // Values shorter than the token threshold: exact deviceModel only
  return new RegExp(`^${escapeRegex(filter)}$`, "i").test(hay);
}

/**
 * Structured `deviceModel` / `model` Mongo filter clause.
 * Matches only Product.deviceModel (not name/modelNumber) — free-text `search`
 * remains responsible for broad multi-field matching.
 */
export function buildStructuredModelFilter(
  deviceModel: string,
  brand?: string | null,
): Record<string, unknown> {
  const tokens = normalizeModelTokens(deviceModel, brand);

  /** Token must appear as a whole segment in deviceModel (bounded, not mid-word). */
  const deviceModelTokenMatch = (token: string) => ({
    deviceModel: {
      $regex: `(^|[\\s\\-_/])${escapeRegex(token)}([\\s\\-_/]|$)`,
      $options: "i",
    },
  });

  // Prefer token match so catalog "Galaxy S24 Ultra" hits product "S24 Ultra"
  if (tokens.length > 0) {
    return {
      $and: tokens.map((token) => deviceModelTokenMatch(token)),
    };
  }

  const raw = deviceModel.trim();
  if (!raw) return {};
  // Values shorter than the token threshold: exact deviceModel only
  return {
    deviceModel: {
      $regex: `^${escapeRegex(raw)}$`,
      $options: "i",
    },
  };
}
