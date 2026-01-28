# Mobile Brands & Models Seeding - Quick Start

## 📦 What Was Created

Three new tools to populate your database with real mobile brands and models:

### 1. Seed Data (`src/lib/seeds/mobile-brands.ts`)

- **11 brands**: Apple, Samsung, Google, OnePlus, Xiaomi, Motorola, Oppo, Vivo, Realme, Huawei, Nothing
- **80+ models**: Real device names, model numbers, release years
- **Fully structured**: Ready to insert into MongoDB

### 2. API Endpoint (`/api/admin/seed/mobile-brands`)

```bash
# Check status
curl http://localhost:3000/api/admin/seed/mobile-brands \
  -H "Authorization: Bearer YOUR_TOKEN"

# Seed brands
curl -X POST http://localhost:3000/api/admin/seed/mobile-brands \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear brands
curl -X DELETE http://localhost:3000/api/admin/seed/mobile-brands \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. CLI Script (`scripts/seed-mobile-brands.ts`)

```bash
# Add to package.json scripts, then run:
npm run seed:mobile           # Seed (fails if exists)
npm run seed:mobile:clear     # Clear and re-seed
npm run seed:mobile:status    # Check status
```

---

## 🚀 Quick Setup

### Step 1: Update package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "seed:mobile": "tsx scripts/seed-mobile-brands.ts",
    "seed:mobile:clear": "tsx scripts/seed-mobile-brands.ts --clear",
    "seed:mobile:status": "tsx scripts/seed-mobile-brands.ts --status"
  }
}
```

### Step 2: Run the seeding script

```bash
# First time - seed the data
npm run seed:mobile:status    # Check if data exists
npm run seed:mobile           # Seed all brands

# Or clear and re-seed
npm run seed:mobile:clear
```

### Step 3: Verify in Admin Panel

1. Go to `http://localhost:3000/admin/device-management`
2. Click **"Brands"** tab
3. Select **"Mobile"** from the category filters
4. You should see all 11 brands with their models!

---

## 📊 What Gets Seeded

**Example output:**

```
✓ Successfully seeded mobile brands:
  • Brands added: 11
  • Apple: 13 models
  • Samsung: 11 models
  • Google: 8 models
  • OnePlus: 8 models
  • Xiaomi: 9 models
  • Motorola: 8 models
  • Oppo: 8 models
  • Vivo: 8 models
  • Realme: 8 models
  • Huawei: 8 models
  • Nothing: 3 models
  • Total models: 80
```

---

## 🔧 Usage Options

### Option A: CLI (Simplest)

```bash
npm run seed:mobile
```

### Option B: HTTP Request

```bash
curl -X POST http://localhost:3000/api/admin/seed/mobile-brands \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Option C: Admin UI (Coming soon)

A button in `/admin/device-management` to trigger seeding programmatically.

---

## 📝 Data Structure

Each brand includes:

- **Name**: Brand name (e.g., "Apple")
- **Slug**: URL-friendly name (e.g., "apple")
- **Logo**: Brand logo URL
- **Models**: Array of device models with:
  - Model name (e.g., "iPhone 15 Pro")
  - Model number (e.g., "A2846")
  - Release year (e.g., 2023)

---

## ✅ Files Created

| File                                            | Purpose                               |
| ----------------------------------------------- | ------------------------------------- |
| `src/lib/seeds/mobile-brands.ts`                | Seed data with 11 brands & 80+ models |
| `src/app/api/admin/seed/mobile-brands/route.ts` | API endpoints (POST/DELETE/GET)       |
| `scripts/seed-mobile-brands.ts`                 | CLI script for command-line seeding   |
| `SEEDING_GUIDE.md`                              | Detailed documentation                |

---

## 🆘 Troubleshooting

| Issue                  | Solution                                               |
| ---------------------- | ------------------------------------------------------ |
| "Brands already exist" | Run `npm run seed:mobile:clear`                        |
| No token error         | Add auth header: `-H "Authorization: Bearer TOKEN"`    |
| Script not found       | Run `npm install` first, check scripts in package.json |
| MongoDB error          | Verify `MONGODB_URI` in `.env.local`                   |

---

## 🎯 Next Steps

1. **Seed the data**: `npm run seed:mobile`
2. **Verify**: Visit `/admin/device-management` → Brands tab
3. **Edit if needed**: Add more models, update logos in admin panel
4. **Use in products**: Brands now available when creating products

---

## 📚 Full Documentation

For detailed information including:

- API reference
- Error handling
- Adding custom brands
- Exporting data
- Future enhancements

See: [SEEDING_GUIDE.md](./SEEDING_GUIDE.md)
