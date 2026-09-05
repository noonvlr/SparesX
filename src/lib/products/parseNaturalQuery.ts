import type { ProductListParams } from "@/lib/products/listQuery";
import { expandSearchSynonyms } from "@/lib/products/searchSynonyms";
import { knownCityNames, canonicalizeCity } from "@/lib/geo/nearbyCities";

export type ParsedNaturalQuery = {
  filters: Partial<ProductListParams>;
  /** Residual free-text after structured tokens are removed */
  residualSearch: string;
  /** Human-readable hints for UI (optional) */
  hints: string[];
};

const BRANDS = [
  "samsung",
  "apple",
  "iphone",
  "xiaomi",
  "redmi",
  "oneplus",
  "vivo",
  "oppo",
  "realme",
  "motorola",
  "nokia",
  "google",
  "pixel",
  "huawei",
  "honor",
  "nothing",
  "asus",
  "lenovo",
  "hp",
  "dell",
  "acer",
  "msi",
];

const PARTS: Array<{ keys: string[]; value: string }> = [
  { keys: ["camera", "cam", "cams"], value: "camera" },
  { keys: ["display", "screen", "lcd", "oled", "amoled"], value: "display" },
  { keys: ["battery", "batt", "bat"], value: "battery" },
  { keys: ["charging port", "charge port", "charging", "charger port"], value: "charging-port" },
  { keys: ["rear glass", "back glass"], value: "rear-glass" },
  { keys: ["front glass"], value: "front-glass" },
  { keys: ["speaker", "earpiece"], value: "speaker" },
  { keys: ["microphone", "mic"], value: "microphone" },
  { keys: ["flex", "fpc"], value: "flex" },
];

const CONDITIONS: Array<{ keys: string[]; value: string }> = [
  { keys: ["refurbished", "refurb"], value: "refurbished" },
  { keys: ["used", "second hand", "secondhand", "preowned", "pre-owned"], value: "used" },
  { keys: ["new", "original", "oem"], value: "new" },
];

/**
 * Rule-based NL → structured filters.
 * Example: "original S24 ultra camera under 1500 near Chennai"
 * → partType camera, maxPrice 1500, city Chennai, residual "S24 ultra"
 *
 * No external LLM required. Optional OPENAI path can be added later behind env.
 */
export function parseNaturalQuery(raw: string): ParsedNaturalQuery {
  let q = expandSearchSynonyms(raw || "").trim();
  const filters: Partial<ProductListParams> = {};
  const hints: string[] = [];
  if (!q) return { filters, residualSearch: "", hints };

  // Price: under/below/upto/max/less than ₹1500 | rs 1500 | 1500 rs
  const priceMatch = q.match(
    /\b(?:under|below|upto|up to|max|less than|within)\s*(?:₹|rs\.?|inr)?\s*(\d{2,7})\b/i,
  );
  if (priceMatch) {
    filters.maxPrice = priceMatch[1];
    hints.push(`Max ₹${priceMatch[1]}`);
    q = q.replace(priceMatch[0], " ");
  } else {
    const barePrice = q.match(/\b(?:₹|rs\.?|inr)\s*(\d{2,7})\b/i);
    if (barePrice) {
      filters.maxPrice = barePrice[1];
      hints.push(`Max ₹${barePrice[1]}`);
      q = q.replace(barePrice[0], " ");
    }
  }

  // Min price: above/over/from
  const minMatch = q.match(
    /\b(?:above|over|from|min(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*(\d{2,7})\b/i,
  );
  if (minMatch) {
    filters.minPrice = minMatch[1];
    hints.push(`Min ₹${minMatch[1]}`);
    q = q.replace(minMatch[0], " ");
  }

  // City: near/in/at <city>
  const cities = knownCityNames().sort((a, b) => b.length - a.length);
  for (const city of cities) {
    const re = new RegExp(
      `\\b(?:near|in|at|around)\\s+${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    );
    if (re.test(q)) {
      filters.city = canonicalizeCity(city);
      hints.push(`City ${filters.city}`);
      q = q.replace(re, " ");
      break;
    }
  }

  // Condition
  for (const c of CONDITIONS) {
    for (const key of c.keys) {
      const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(q)) {
        filters.condition = c.value;
        hints.push(`Condition ${c.value}`);
        q = q.replace(re, " ");
        break;
      }
    }
    if (filters.condition) break;
  }

  // Part type (prefer longer phrases)
  const partSorted = [...PARTS].sort(
    (a, b) =>
      Math.max(...b.keys.map((k) => k.length)) -
      Math.max(...a.keys.map((k) => k.length)),
  );
  for (const part of partSorted) {
    for (const key of part.keys) {
      const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(q)) {
        filters.partType = part.value;
        hints.push(`Part ${part.value}`);
        q = q.replace(re, " ");
        break;
      }
    }
    if (filters.partType) break;
  }

  // Brand
  for (const brand of BRANDS) {
    const re = new RegExp(`\\b${brand}\\b`, "i");
    if (re.test(q)) {
      const label =
        brand === "iphone" || brand === "pixel"
          ? brand === "iphone"
            ? "Apple"
            : "Google"
          : brand.charAt(0).toUpperCase() + brand.slice(1);
      filters.brand = label === "Iphone" ? "Apple" : label;
      if (brand === "iphone" && !/\biphone\b/i.test(filters.deviceModel || "")) {
        // keep iphone token for model residual
      } else {
        q = q.replace(re, " ");
      }
      hints.push(`Brand ${filters.brand}`);
      break;
    }
  }

  // Device category hints
  if (/\b(laptop|notebook)\b/i.test(q)) {
    filters.deviceCategory = "laptop";
    q = q.replace(/\b(laptop|notebook)\b/gi, " ");
    hints.push("Device laptop");
  } else if (/\b(mobile|phone|smartphone)\b/i.test(q)) {
    filters.deviceCategory = "mobile";
    q = q.replace(/\b(mobile|phone|smartphone)\b/gi, " ");
    hints.push("Device mobile");
  }

  // Negotiable
  if (/\b(negotiable|nego)\b/i.test(q)) {
    filters.negotiable = "1";
    q = q.replace(/\b(negotiable|nego)\b/gi, " ");
    hints.push("Negotiable");
  }

  const residualSearch = q.replace(/\s+/g, " ").trim();
  if (residualSearch.length >= 2) {
    // Prefer residual as deviceModel when it looks like a model string
    if (
      !filters.deviceModel &&
      /^(iphone|galaxy|s\d|note|pixel|nord|redmi|poco)/i.test(residualSearch)
    ) {
      filters.deviceModel = residualSearch;
      hints.push(`Model ${residualSearch}`);
    }
  }

  return {
    filters,
    residualSearch:
      filters.deviceModel && residualSearch === filters.deviceModel
        ? ""
        : residualSearch,
    hints,
  };
}

/**
 * Merge NL-parsed filters into list params.
 * Explicit query params win over parsed guesses.
 */
export function applyNaturalQueryToParams(
  params: ProductListParams,
): ProductListParams {
  const search = params.search?.trim();
  if (!search || search.length < 4) return params;

  // Skip if many filters already set (user used structured UI)
  const structuredCount = [
    params.brand,
    params.partType,
    params.deviceModel || params.model,
    params.city,
    params.minPrice,
    params.maxPrice,
    params.condition,
  ].filter(Boolean).length;
  if (structuredCount >= 2) return params;

  const parsed = parseNaturalQuery(search);
  const next: ProductListParams = { ...params };

  for (const [key, value] of Object.entries(parsed.filters) as Array<
    [keyof ProductListParams, string | undefined]
  >) {
    if (!value) continue;
    if (!next[key]) next[key] = value;
  }

  if (parsed.residualSearch) {
    next.search = parsed.residualSearch;
  } else {
    // Structured filters fully consumed the query — do not reattach
    // deviceModel as free-text (that AND'd $text and over-filtered results).
    // Browser URL may still show the original `search=` for shareability;
    // server-side interpretation remains authoritative for results.
    next.search = undefined;
  }

  return next;
}
