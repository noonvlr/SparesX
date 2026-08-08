import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Product, type ProductCondition } from "@/lib/models/Product";
import { User } from "@/lib/models/User";

export type CreateListingInput = {
  name?: string;
  description: string;
  price: number;
  deviceCategory: string;
  brand: string;
  deviceModel: string;
  modelNumber?: string;
  partType: string;
  condition: ProductCondition;
  images?: string[];
  priceNegotiable?: boolean;
};

export type CreateListingResult = {
  product: InstanceType<typeof Product>;
  possibleDuplicate: boolean;
};

const CONDITIONS: ProductCondition[] = ["new", "used", "refurbished"];

export function normalizeCondition(raw: string): ProductCondition | null {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (CONDITIONS.includes(v as ProductCondition)) return v as ProductCondition;
  if (v === "refurb" || v === "refurbished") return "refurbished";
  if (v === "second hand" || v === "secondhand") return "used";
  return null;
}

/**
 * Shared listing create used by single POST and bulk CSV import.
 */
export async function createTechnicianListing(params: {
  technicianId: string;
  input: CreateListingInput;
}): Promise<CreateListingResult> {
  await connectDB();

  const technician = await User.findById(params.technicianId).select(
    "phoneVerified role",
  );
  if (!technician) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  if (!technician.phoneVerified) {
    throw Object.assign(
      new Error("Verify your phone number before posting a listing"),
      { status: 403, code: "PHONE_UNVERIFIED" },
    );
  }

  const input = params.input;
  const condition = normalizeCondition(input.condition);
  if (!condition) {
    throw Object.assign(new Error("Invalid condition"), { status: 400 });
  }
  if (
    !input.description?.trim() ||
    !input.deviceCategory?.trim() ||
    !input.brand?.trim() ||
    !input.deviceModel?.trim() ||
    !input.partType?.trim() ||
    !(typeof input.price === "number" && input.price >= 0)
  ) {
    throw Object.assign(new Error("Missing required listing fields"), {
      status: 400,
    });
  }

  const { formatListingTitle } = await import("@/lib/products/listingTitle");
  const listingName =
    (typeof input.name === "string" && input.name.trim()) ||
    formatListingTitle({
      deviceModel: input.deviceModel,
      partType: input.partType,
      name: input.name,
    });

  const { generateUniqueProductSlug } = await import(
    "@/lib/products/productSlug"
  );
  const slug = await generateUniqueProductSlug({
    brand: input.brand,
    deviceModel: input.deviceModel,
    partType: input.partType,
    condition,
  });

  const { getOrCreateSiteSettings } = await import(
    "@/lib/models/SiteSettings"
  );
  const settings = await getOrCreateSiteSettings();
  const status = settings.requireListingApproval ? "pending" : "approved";

  const { resolveCatalogRefs } = await import("@/lib/catalog/resolveRefs");
  const catalogRefs = await resolveCatalogRefs({
    deviceCategory: input.deviceCategory,
    brand: input.brand,
    partType: input.partType,
  });

  // Soft duplicate signal for moderation (same seller + brand/model/part/price, 7d)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const possibleDuplicate = Boolean(
    await Product.exists({
      technician: new Types.ObjectId(params.technicianId),
      brand: new RegExp(`^${input.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      deviceModel: new RegExp(
        `^${input.deviceModel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
      partType: new RegExp(
        `^${input.partType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
      price: input.price,
      createdAt: { $gte: weekAgo },
      status: { $in: ["pending", "approved"] },
    }),
  );

  const tags = possibleDuplicate ? ["possible_duplicate"] : [];

  const product = await Product.create({
    name: listingName,
    description: input.description.trim(),
    price: input.price,
    deviceCategory: input.deviceCategory.trim().toLowerCase(),
    brand: input.brand.trim(),
    deviceModel: input.deviceModel.trim(),
    modelNumber: input.modelNumber || "",
    partType: input.partType.trim(),
    condition,
    priceNegotiable: !!input.priceNegotiable,
    images: Array.isArray(input.images) ? input.images.filter(Boolean) : [],
    technician: params.technicianId,
    slug,
    status,
    tags,
    deviceTypeId: catalogRefs.deviceTypeId || null,
    brandId: catalogRefs.brandId || null,
    partCategoryId: catalogRefs.partCategoryId || null,
  });

  if (status === "approved") {
    const { notifySavedSearchesForProduct } = await import(
      "@/lib/saved-searches/match"
    );
    void notifySavedSearchesForProduct(product.toObject());
  }

  return { product, possibleDuplicate };
}

/** Parse CSV text into listing rows. Header required. */
export function parseListingsCsv(csv: string): {
  rows: Array<Record<string, string>>;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV needs a header row and at least one data row"] };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const required = [
    "brand",
    "devicemodel",
    "parttype",
    "devicecategory",
    "condition",
    "price",
    "description",
  ];
  const normalized = headers.map((h) => h.replace(/[_\s-]/g, ""));
  for (const req of required) {
    if (!normalized.includes(req)) {
      errors.push(`Missing column: ${req}`);
    }
  }
  if (errors.length) return { rows: [], errors };

  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.every((c) => !c.trim())) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.replace(/[_\s-]/g, "")] = (cols[idx] || "").trim();
    });
    rows.push(row);
  }
  return { rows, errors };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}
