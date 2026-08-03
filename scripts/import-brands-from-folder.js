/**
 * Import mobile brands + models from compiled brand txt files into CategoryBrand.
 *
 * Prefer the safe-merge tooling instead:
 *   npm run import:brand-api -- --dry-run
 *   npm run import:catalog -- --file=./scripts/data/catalog-sample.csv --dry-run
 *
 * Usage (legacy replace-per-brand):
 *   set MONGODB_URI=mongodb+srv://...@cluster0...mongodb.net/sparesx?appName=Cluster0
 *   node scripts/import-brands-from-folder.js
 *
 * Optional:
 *   set BRANDS_DIR=C:\Users\idree\OneDrive\Desktop\brand api\output\final
 *   set CATEGORY=mobile
 *   set DRY_RUN=true
 *
 * Note: This legacy script REPLACES each brand's models array (does not keep
 * extra DB-only models). Use import:catalog / import:brand-api for safe merge.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DEFAULT_BRANDS_DIR = path.join(
  'C:',
  'Users',
  'idree',
  'OneDrive',
  'Desktop',
  'brand api',
  'output',
  'final'
);

const BRANDS_DIR = process.env.BRANDS_DIR || DEFAULT_BRANDS_DIR;
const CATEGORY = (process.env.CATEGORY || 'mobile').toLowerCase();
const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === 'true';

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCaseBrand(name) {
  const special = {
    apple: 'Apple',
    samsung: 'Samsung',
    google: 'Google',
    xiaomi: 'Xiaomi',
    oneplus: 'OnePlus',
    oppo: 'OPPO',
    vivo: 'vivo',
    realme: 'realme',
    redmi: 'Redmi',
    poco: 'POCO',
    iqoo: 'iQOO',
    itel: 'itel',
    asus: 'Asus',
    nokia: 'Nokia',
    motorola: 'Motorola',
    nothing: 'Nothing',
    tecno: 'Tecno',
    infinix: 'Infinix',
    lava: 'Lava',
    karbonn: 'Karbonn',
    mi: 'Mi',
  };
  const key = slugify(name);
  if (special[key]) return special[key];
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function cleanModelName(raw, brandName) {
  let name = String(raw).trim();
  if (!name) return null;

  // Drop storage / color variant suffixes in parentheses
  name = name.replace(/\s*\([^)]*\)\s*$/g, '').trim();

  // Remove leading brand name if duplicated
  const brandPattern = new RegExp(`^${brandName}\\s+`, 'i');
  name = name.replace(brandPattern, '').trim();

  // Normalize whitespace
  name = name.replace(/\s+/g, ' ').trim();
  return name || null;
}

function parseBrandFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const brandRaw = lines[0];
  const brandName = titleCaseBrand(brandRaw);
  const brandSlug = slugify(brandName);
  const seen = new Set();
  const models = [];

  for (const line of lines.slice(1)) {
    const cleaned = cleanModelName(line, brandName);
    if (!cleaned) continue;
    const modelSlug = slugify(cleaned);
    if (!modelSlug || seen.has(modelSlug)) continue;
    seen.add(modelSlug);
    models.push({
      name: cleaned,
      slug: modelSlug,
      isActive: true,
    });
  }

  return {
    category: CATEGORY,
    name: brandName,
    slug: brandSlug,
    models,
    isActive: true,
  };
}

const categoryBrandSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    logo: { type: String },
    models: [
      {
        name: { type: String, required: true },
        slug: { type: String, lowercase: true },
        modelNumber: { type: String },
        releaseYear: { type: Number },
        isActive: { type: Boolean, default: true },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categoryBrandSchema.index({ category: 1, slug: 1 }, { unique: true });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  if (!fs.existsSync(BRANDS_DIR)) {
    throw new Error(`Brands directory not found: ${BRANDS_DIR}`);
  }

  const files = fs
    .readdirSync(BRANDS_DIR)
    .filter((name) => name.toLowerCase().endsWith('.txt'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`No .txt brand files found in ${BRANDS_DIR}`);
  }

  const brands = [];
  for (const file of files) {
    const parsed = parseBrandFile(path.join(BRANDS_DIR, file));
    if (parsed) brands.push(parsed);
  }

  console.log(`Source: ${BRANDS_DIR}`);
  console.log(`Parsed ${brands.length} brands for category="${CATEGORY}"`);
  console.log(
    `Total models: ${brands.reduce((sum, brand) => sum + brand.models.length, 0)}`
  );

  if (DRY_RUN) {
    console.log('DRY_RUN=true — not writing to database');
    for (const brand of brands) {
      console.log(`- ${brand.name} (${brand.slug}): ${brand.models.length} models`);
    }
    return;
  }

  // Force database name to sparesx even if URI omits it
  await mongoose.connect(uri, { dbName: 'sparesx', bufferCommands: false });
  console.log(`Connected to database: ${mongoose.connection.name}`);

  const CategoryBrand =
    mongoose.models.CategoryBrand ||
    mongoose.model('CategoryBrand', categoryBrandSchema);

  let upserted = 0;
  let modelsWritten = 0;

  for (const brand of brands) {
    const result = await CategoryBrand.findOneAndUpdate(
      { category: brand.category, slug: brand.slug },
      {
        $set: {
          name: brand.name,
          models: brand.models,
          isActive: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          category: brand.category,
          slug: brand.slug,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    upserted += 1;
    modelsWritten += result.models?.length || 0;
    console.log(
      `✓ ${result.name}: ${result.models?.length || 0} models (id=${result._id})`
    );
  }

  const totalInDb = await CategoryBrand.countDocuments({ category: CATEGORY });
  console.log('\nDone');
  console.log(`Upserted brands: ${upserted}`);
  console.log(`Models written: ${modelsWritten}`);
  console.log(`Total ${CATEGORY} brands in DB: ${totalInDb}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Import failed:', error.message || error);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
