import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SavedSearchFilters = {
  search?: string;
  deviceCategory?: string;
  brand?: string;
  deviceModel?: string;
  partType?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  city?: string;
  /** When true with city — include metro/region nearby cities (live `/products` semantics). */
  nearby?: boolean;
  sellerType?: string;
  negotiable?: string;
};

export interface ISavedSearch extends Document {
  userId: Types.ObjectId;
  name: string;
  filters: SavedSearchFilters;
  queryString: string;
  lastNotifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SavedSearchSchema = new Schema<ISavedSearch>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    filters: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    queryString: { type: String, required: true, trim: true, maxlength: 500 },
    lastNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

SavedSearchSchema.index({ userId: 1, createdAt: -1 });
SavedSearchSchema.index({ "filters.brand": 1 });
SavedSearchSchema.index({ "filters.partType": 1 });
SavedSearchSchema.index({ "filters.deviceCategory": 1 });

export const SavedSearch: Model<ISavedSearch> =
  mongoose.models.SavedSearch ||
  mongoose.model<ISavedSearch>("SavedSearch", SavedSearchSchema);

/** Soft cap per user to prevent abuse */
export const MAX_SAVED_SEARCHES = 10;

function parseNearbyFlag(raw: unknown): boolean {
  if (raw === true) return true;
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }
  return false;
}

export function buildQueryString(filters: SavedSearchFilters): string {
  const params = new URLSearchParams();
  const entries: [keyof SavedSearchFilters, string | undefined][] = [
    ["search", filters.search],
    ["deviceCategory", filters.deviceCategory],
    ["brand", filters.brand],
    ["deviceModel", filters.deviceModel],
    ["partType", filters.partType],
    ["condition", filters.condition],
    ["minPrice", filters.minPrice],
    ["maxPrice", filters.maxPrice],
    ["city", filters.city],
    ["sellerType", filters.sellerType],
    ["negotiable", filters.negotiable],
  ];
  for (const [key, value] of entries) {
    const trimmed = (value || "").trim();
    if (trimmed) params.set(key, trimmed);
  }
  // Replay uses live URL convention nearby=1 (only with city).
  if (filters.city?.trim() && filters.nearby) {
    params.set("nearby", "1");
  }
  return params.toString();
}

export function labelFromFilters(filters: SavedSearchFilters): string {
  const cityLabel =
    filters.city?.trim() && filters.nearby
      ? `${filters.city.trim()} + nearby`
      : filters.city;
  const parts = [
    filters.brand,
    filters.deviceModel,
    filters.partType,
    filters.deviceCategory,
    filters.search,
    cityLabel,
  ]
    .map((p) => (p || "").trim())
    .filter(Boolean);
  if (parts.length === 0) return "Saved search";
  return parts.slice(0, 4).join(" · ").slice(0, 80);
}

export function normalizeFilters(
  raw: Record<string, unknown> | SavedSearchFilters,
): SavedSearchFilters {
  const pick = (key: keyof SavedSearchFilters) => {
    if (key === "nearby") return undefined;
    const v = raw[key];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const city = pick("city");
  const nearby =
    Boolean(city) && parseNearbyFlag((raw as Record<string, unknown>).nearby)
      ? true
      : undefined;

  return {
    search: pick("search"),
    deviceCategory: pick("deviceCategory"),
    brand: pick("brand"),
    deviceModel: pick("deviceModel"),
    partType: pick("partType"),
    condition: pick("condition"),
    minPrice: pick("minPrice"),
    maxPrice: pick("maxPrice"),
    city,
    nearby,
    sellerType: pick("sellerType"),
    negotiable: pick("negotiable"),
  };
}

export function filtersHaveCriteria(filters: SavedSearchFilters): boolean {
  return Object.entries(filters).some(([key, v]) => {
    if (key === "nearby") return false; // nearby alone is not a criterion
    return Boolean(v && String(v).trim());
  });
}
