/** Shared catalog merge helpers for CLI + admin bulk import. */

export type CatalogRow = {
  category: string;
  brand: string;
  modelName: string;
  modelNumber?: string;
  releaseYear?: number;
};

export type CatalogModel = {
  name: string;
  slug?: string;
  modelNumber?: string;
  releaseYear?: number;
  isActive?: boolean;
};

export type BrandMergeStats = {
  category: string;
  brand: string;
  brandCreated: boolean;
  modelsAdded: number;
  modelsUpdated: number;
  modelsUnchanged: number;
};

export type CatalogMergeSummary = {
  rows: number;
  brandsTouched: number;
  brandsCreated: number;
  modelsAdded: number;
  modelsUpdated: number;
  modelsUnchanged: number;
  byBrand: BrandMergeStats[];
  errors: string[];
};

export function slugify(value: string): string {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeKey(value: string): string {
  return String(value).trim().toLowerCase();
}

const BRAND_TITLE_SPECIAL: Record<string, string> = {
  apple: "Apple",
  samsung: "Samsung",
  google: "Google",
  xiaomi: "Xiaomi",
  oneplus: "OnePlus",
  oppo: "OPPO",
  vivo: "vivo",
  realme: "realme",
  redmi: "Redmi",
  poco: "POCO",
  iqoo: "iQOO",
  itel: "itel",
  asus: "Asus",
  nokia: "Nokia",
  motorola: "Motorola",
  nothing: "Nothing",
  tecno: "Tecno",
  infinix: "Infinix",
  lava: "Lava",
  karbonn: "Karbonn",
  mi: "Mi",
  hp: "HP",
  dell: "Dell",
  lenovo: "Lenovo",
  acer: "Acer",
  msi: "MSI",
};

export function titleCaseBrand(name: string): string {
  const key = slugify(name);
  if (BRAND_TITLE_SPECIAL[key]) return BRAND_TITLE_SPECIAL[key];
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function cleanModelName(raw: string, brandName: string): string | null {
  let name = String(raw || "").trim();
  if (!name) return null;
  name = name.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  const brandPattern = new RegExp(`^${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
  name = name.replace(brandPattern, "").trim();
  name = name.replace(/\s+/g, " ").trim();
  return name || null;
}

function toRow(input: Record<string, unknown>): CatalogRow | null {
  const category = String(
    input.category ?? input.deviceCategory ?? input.device ?? "",
  )
    .trim()
    .toLowerCase();
  const brandRaw = String(input.brand ?? input.brandName ?? "").trim();
  const modelRaw = String(
    input.modelName ?? input.model ?? input.name ?? "",
  ).trim();

  if (!category || !brandRaw || !modelRaw) return null;

  const brand = titleCaseBrand(brandRaw);
  const modelName = cleanModelName(modelRaw, brand);
  if (!modelName) return null;

  const modelNumberRaw = input.modelNumber ?? input.model_number ?? input.sku;
  const modelNumber =
    modelNumberRaw != null && String(modelNumberRaw).trim()
      ? String(modelNumberRaw).trim()
      : undefined;

  const yearRaw = input.releaseYear ?? input.release_year ?? input.year;
  let releaseYear: number | undefined;
  if (yearRaw != null && String(yearRaw).trim()) {
    const parsed = parseInt(String(yearRaw).trim(), 10);
    if (!Number.isNaN(parsed) && parsed >= 1990 && parsed <= 2100) {
      releaseYear = parsed;
    }
  }

  return { category, brand, modelName, modelNumber, releaseYear };
}

export function parseCatalogCsv(text: string): CatalogRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.length === 0) return [];

  const headerCells = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, ""),
  );
  const hasHeader = headerCells.some((h) =>
    ["category", "brand", "modelname", "model"].includes(h),
  );

  const rows: CatalogRow[] = [];

  if (hasHeader) {
    const index = (aliases: string[]) =>
      headerCells.findIndex((h) => aliases.includes(h));

    const categoryIdx = index(["category", "devicecategory", "device"]);
    const brandIdx = index(["brand", "brandname"]);
    const modelIdx = index(["modelname", "model", "name"]);
    const modelNumberIdx = index(["modelnumber", "model_number", "sku"]);
    const yearIdx = index(["releaseyear", "release_year", "year"]);

    for (const line of lines.slice(1)) {
      const cells = parseCsvLine(line);
      const row = toRow({
        category: categoryIdx >= 0 ? cells[categoryIdx] : "",
        brand: brandIdx >= 0 ? cells[brandIdx] : "",
        modelName: modelIdx >= 0 ? cells[modelIdx] : "",
        modelNumber: modelNumberIdx >= 0 ? cells[modelNumberIdx] : undefined,
        releaseYear: yearIdx >= 0 ? cells[yearIdx] : undefined,
      });
      if (row) rows.push(row);
    }
    return rows;
  }

  // Headerless: category,brand,modelName[,modelNumber[,releaseYear]]
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const row = toRow({
      category: cells[0],
      brand: cells[1],
      modelName: cells[2],
      modelNumber: cells[3],
      releaseYear: cells[4],
    });
    if (row) rows.push(row);
  }
  return rows;
}

export function parseCatalogJson(text: string): CatalogRow[] {
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.rows)
      ? parsed.rows
      : Array.isArray(parsed?.models)
        ? parsed.models
        : null;

  if (!list) {
    throw new Error("JSON must be an array or { rows: [] } / { models: [] }");
  }

  const rows: CatalogRow[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = toRow(item as Record<string, unknown>);
    if (row) rows.push(row);
  }
  return rows;
}

export function parseCatalogFile(text: string, filename = ""): CatalogRow[] {
  const lower = filename.toLowerCase();
  const trimmed = text.trim();
  if (
    lower.endsWith(".json") ||
    trimmed.startsWith("[") ||
    trimmed.startsWith("{")
  ) {
    return parseCatalogJson(trimmed);
  }
  return parseCatalogCsv(trimmed);
}

export type BrandGroup = {
  category: string;
  brand: string;
  brandSlug: string;
  models: Array<{
    name: string;
    slug: string;
    modelNumber?: string;
    releaseYear?: number;
  }>;
};

export function groupCatalogRows(rows: CatalogRow[]): BrandGroup[] {
  const map = new Map<string, BrandGroup>();

  for (const row of rows) {
    const brandSlug = slugify(row.brand);
    if (!brandSlug) continue;
    const key = `${row.category}::${brandSlug}`;
    let group = map.get(key);
    if (!group) {
      group = {
        category: row.category,
        brand: row.brand,
        brandSlug,
        models: [],
      };
      map.set(key, group);
    }

    const modelSlug = slugify(row.modelName);
    if (!modelSlug) continue;
    const existing = group.models.find(
      (m) =>
        m.slug === modelSlug ||
        normalizeKey(m.name) === normalizeKey(row.modelName),
    );
    if (existing) {
      if (row.modelNumber) existing.modelNumber = row.modelNumber;
      if (row.releaseYear != null) existing.releaseYear = row.releaseYear;
      continue;
    }

    group.models.push({
      name: row.modelName,
      slug: modelSlug,
      modelNumber: row.modelNumber,
      releaseYear: row.releaseYear,
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.brand.localeCompare(b.brand),
  );
}

/**
 * Safe merge (mode A): update/add models; never delete models missing from import.
 */
export function mergeModelsSafe(
  existing: CatalogModel[],
  incoming: BrandGroup["models"],
): {
  models: CatalogModel[];
  added: number;
  updated: number;
  unchanged: number;
} {
  const models: CatalogModel[] = existing.map((m) => ({ ...m }));
  let added = 0;
  let updated = 0;
  let unchanged = 0;

  for (const next of incoming) {
    const index = models.findIndex(
      (m) =>
        (m.slug && m.slug === next.slug) ||
        normalizeKey(m.name) === normalizeKey(next.name),
    );

    if (index === -1) {
      models.push({
        name: next.name,
        slug: next.slug,
        modelNumber: next.modelNumber,
        releaseYear: next.releaseYear,
        isActive: true,
      });
      added += 1;
      continue;
    }

    const current = models[index];
    let changed = false;
    const patched: CatalogModel = { ...current, isActive: current.isActive !== false };

    if (!patched.slug) patched.slug = next.slug;

    if (next.modelNumber && next.modelNumber !== (current.modelNumber || "")) {
      patched.modelNumber = next.modelNumber;
      changed = true;
    }
    if (
      next.releaseYear != null &&
      next.releaseYear !== current.releaseYear
    ) {
      patched.releaseYear = next.releaseYear;
      changed = true;
    }
    if (current.isActive === false) {
      patched.isActive = true;
      changed = true;
    }

    models[index] = patched;
    if (changed) updated += 1;
    else unchanged += 1;
  }

  return { models, added, updated, unchanged };
}
