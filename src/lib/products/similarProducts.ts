import type { Types } from "mongoose";

export type SimilarSeed = {
  _id: Types.ObjectId | string;
  brand?: string | null;
  partType?: string | null;
  deviceModel?: string | null;
  deviceCategory?: string | null;
  price?: number | null;
};

export type SimilarCandidate = {
  _id: Types.ObjectId | string;
  brand?: string | null;
  partType?: string | null;
  deviceModel?: string | null;
  deviceCategory?: string | null;
  price?: number | null;
  createdAt?: Date | string | null;
};

function norm(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a Mongo filter that only recalls listings sharing brand, part, or model.
 * Device category alone is excluded — it is too broad (e.g. all "mobile").
 */
export function buildSimilarProductsQuery(seed: SimilarSeed) {
  const clauses: Record<string, unknown>[] = [];

  if (seed.brand?.trim()) {
    clauses.push({
      brand: {
        $regex: `^${escapeRegex(seed.brand.trim())}$`,
        $options: "i",
      },
    });
  }
  if (seed.partType?.trim()) {
    clauses.push({ partType: seed.partType.trim() });
  }
  if (seed.deviceModel?.trim()) {
    clauses.push({
      deviceModel: {
        $regex: escapeRegex(seed.deviceModel.trim()),
        $options: "i",
      },
    });
  }

  const query: Record<string, unknown> = {
    _id: { $ne: seed._id },
    status: "approved",
  };

  if (clauses.length === 0) return null;
  query.$or = clauses;
  return query;
}

/**
 * Higher score = closer match for the current listing.
 * Prefer same brand + part + model, then step down.
 */
export function scoreSimilarProduct(
  seed: SimilarSeed,
  candidate: SimilarCandidate,
): number {
  const brandMatch =
    Boolean(norm(seed.brand)) && norm(seed.brand) === norm(candidate.brand);
  const partMatch =
    Boolean(norm(seed.partType)) &&
    norm(seed.partType) === norm(candidate.partType);
  const modelMatch =
    Boolean(norm(seed.deviceModel)) &&
    (norm(candidate.deviceModel).includes(norm(seed.deviceModel)) ||
      norm(seed.deviceModel).includes(norm(candidate.deviceModel)));

  let score = 0;
  if (brandMatch && partMatch && modelMatch) score = 100;
  else if (brandMatch && partMatch) score = 72;
  else if (partMatch && modelMatch) score = 64;
  else if (brandMatch && modelMatch) score = 58;
  else if (partMatch) score = 36;
  else if (modelMatch) score = 28;
  else if (brandMatch) score = 18;
  else return 0;

  // Soft preference for similar price band (±40%)
  const seedPrice = Number(seed.price);
  const candPrice = Number(candidate.price);
  if (
    Number.isFinite(seedPrice) &&
    seedPrice > 0 &&
    Number.isFinite(candPrice) &&
    candPrice > 0
  ) {
    const ratio = candPrice / seedPrice;
    if (ratio >= 0.6 && ratio <= 1.4) score += 6;
  }

  return score;
}

/** Rank candidates and keep the strongest matches. */
export function rankSimilarProducts<T extends SimilarCandidate>(
  seed: SimilarSeed,
  candidates: T[],
  limit = 8,
): T[] {
  return candidates
    .map((item) => ({
      item,
      score: scoreSimilarProduct(seed, item),
      createdAt: item.createdAt ? new Date(item.createdAt).getTime() : 0,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.createdAt - a.createdAt;
    })
    .slice(0, limit)
    .map((row) => row.item);
}

/** Contextual heading + browse URL for the similar section. */
export function similarSectionCopy(seed: {
  brand?: string | null;
  partType?: string | null;
  deviceModel?: string | null;
  partLabel?: string | null;
}) {
  const brand = seed.brand?.trim() || "";
  const model = seed.deviceModel?.trim() || "";
  const part = (seed.partLabel || seed.partType || "").trim();
  const device = [brand, model].filter(Boolean).join(" ");

  let title = "Similar parts";
  let subtitle = "Other listings that match this part";
  if (part && device) {
    title = `More ${part} for ${device}`;
    subtitle = "Closest matches by brand, model, and part type";
  } else if (part) {
    title = `More ${part} listings`;
  } else if (device) {
    title = `More parts for ${device}`;
  }

  const params = new URLSearchParams();
  if (seed.brand?.trim()) params.set("brand", seed.brand.trim());
  if (seed.partType?.trim()) params.set("partType", seed.partType.trim());
  if (seed.deviceModel?.trim()) {
    params.set("deviceModel", seed.deviceModel.trim());
  }
  const browseHref = params.toString() ? `/products?${params}` : "/products";

  return { title, subtitle, browseHref };
}
