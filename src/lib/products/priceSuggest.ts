import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { pricePercentile } from "@/lib/products/priceStats";

export type PriceSuggestInput = {
  brand?: string | null;
  partType?: string | null;
  deviceModel?: string | null;
  condition?: string | null;
};

export type PriceSuggestResult = {
  sampleSize: number;
  median: number | null;
  low: number | null;
  high: number | null;
  currency: "INR";
  match: "full" | "brand_part" | "none";
};

export { pricePercentile } from "@/lib/products/priceStats";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatch(
  input: PriceSuggestInput,
  mode: "full" | "brand_part",
): Record<string, unknown> | null {
  const brand = input.brand?.trim();
  const partType = input.partType?.trim();
  const deviceModel = input.deviceModel?.trim();
  const condition = input.condition?.trim();

  if (!brand || !partType) return null;

  const match: Record<string, unknown> = {
    status: "approved",
    brand: { $regex: `^${escapeRegex(brand)}$`, $options: "i" },
    partType,
    price: { $gt: 0 },
  };

  if (mode === "full") {
    if (!deviceModel) return null;
    match.deviceModel = {
      $regex: escapeRegex(deviceModel),
      $options: "i",
    };
  }

  if (condition && ["new", "used", "refurbished"].includes(condition)) {
    match.condition = condition;
  }

  return match;
}

async function pricesFor(match: Record<string, unknown>): Promise<number[]> {
  const rows = await Product.find(match)
    .select("price")
    .limit(120)
    .lean();
  return rows
    .map((r) => Number(r.price))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

/**
 * Live asking-price comps for the create/edit listing form.
 * Prefer brand+part+model; fall back to brand+part when sample is thin.
 */
export async function suggestListingPrice(
  input: PriceSuggestInput,
): Promise<PriceSuggestResult> {
  await connectDB();

  const empty: PriceSuggestResult = {
    sampleSize: 0,
    median: null,
    low: null,
    high: null,
    currency: "INR",
    match: "none",
  };

  const fullMatch = buildMatch(input, "full");
  let prices: number[] = [];
  let mode: PriceSuggestResult["match"] = "none";

  if (fullMatch) {
    prices = await pricesFor(fullMatch);
    if (prices.length >= 3) mode = "full";
  }

  if (mode === "none") {
    const loose = buildMatch(input, "brand_part");
    if (!loose) return empty;
    // If full match was thin, retry without condition for more signal
    if (fullMatch && input.condition) {
      const { condition: _c, ...withoutCond } = fullMatch as Record<
        string,
        unknown
      > & { condition?: unknown };
      void _c;
      const fullNoCond = await pricesFor(withoutCond);
      if (fullNoCond.length >= 3) {
        prices = fullNoCond;
        mode = "full";
      }
    }
    if (mode === "none") {
      prices = await pricesFor(loose);
      if (prices.length >= 3) mode = "brand_part";
      else if (prices.length > 0) {
        // Still show something when 1–2 comps exist
        mode = "brand_part";
      } else {
        return empty;
      }
    }
  }

  if (prices.length === 0) return empty;

  return {
    sampleSize: prices.length,
    median: pricePercentile(prices, 0.5),
    low: pricePercentile(prices, 0.25),
    high: pricePercentile(prices, 0.75),
    currency: "INR",
    match: mode,
  };
}
