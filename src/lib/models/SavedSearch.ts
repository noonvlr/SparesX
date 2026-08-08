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
  return params.toString();
}

export function labelFromFilters(filters: SavedSearchFilters): string {
  const parts = [
    filters.brand,
    filters.deviceModel,
    filters.partType,
    filters.deviceCategory,
    filters.search,
    filters.city,
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
    const v = raw[key];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  return {
    search: pick("search"),
    deviceCategory: pick("deviceCategory"),
    brand: pick("brand"),
    deviceModel: pick("deviceModel"),
    partType: pick("partType"),
    condition: pick("condition"),
    minPrice: pick("minPrice"),
    maxPrice: pick("maxPrice"),
    city: pick("city"),
    sellerType: pick("sellerType"),
    negotiable: pick("negotiable"),
  };
}

export function filtersHaveCriteria(filters: SavedSearchFilters): boolean {
  return Object.values(filters).some((v) => Boolean(v && String(v).trim()));
}
