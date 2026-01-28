# Mobile Brands & Models Seeding Guide

This guide explains how to populate your SparesX database with real mobile brands and models.

## What's Included

### 1. **Seed Data** (`src/lib/seeds/mobile-brands.ts`)

- 11 major mobile brands (Apple, Samsung, Google, OnePlus, Xiaomi, Motorola, Oppo, Vivo, Realme, Huawei, Nothing)
- 80+ real device models with authentic details:
  - Model names (e.g., iPhone 15 Pro)
  - Model numbers (e.g., A2846)
  - Release years (e.g., 2023)

### 2. **API Endpoint** (`/api/admin/seed/mobile-brands`)

HTTP endpoints to seed/clear data programmatically:

- **POST** - Seed all mobile brands and models
- **DELETE** - Clear all mobile brands from database
- **GET** - Check seeding status

### 3. **CLI Script** (`scripts/seed-mobile-brands.ts`)

Command-line tool for seeding without HTTP requests.

---

## How to Use

### **Option 1: Using the API Endpoint** (Recommended for UI)

#### Check Status

```bash
curl http://localhost:3000/api/admin/seed/mobile-brands \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### Seed Mobile Brands

```bash
curl -X POST http://localhost:3000/api/admin/seed/mobile-brands \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "message": "Mobile brands and models seeded successfully",
  "brandsCreated": 11,
  "totalModels": 80,
  "brands": [
    { "id": "...", "name": "Apple", "modelCount": 13 },
    { "id": "...", "name": "Samsung", "modelCount": 11 },
    ...
  ]
}
```

#### Clear Mobile Brands

```bash
curl -X DELETE http://localhost:3000/api/admin/seed/mobile-brands \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### **Option 2: Using the CLI Script** (Recommended for development)

First, add this script to your `package.json`:

```json
{
  "scripts": {
    "seed:mobile": "tsx scripts/seed-mobile-brands.ts",
    "seed:mobile:clear": "tsx scripts/seed-mobile-brands.ts --clear",
    "seed:mobile:status": "tsx scripts/seed-mobile-brands.ts --status"
  }
}
```

Then run:

```bash
# Check current status
npm run seed:mobile:status

# Seed mobile brands (fails if brands already exist)
npm run seed:mobile

# Clear existing brands and re-seed
npm run seed:mobile:clear

# Just clear without seeding
npx ts-node scripts/seed-mobile-brands.ts --clear
```

### **Option 3: Add Admin UI Button** (Coming Soon)

We can add a "Seed Data" button to `/admin/device-management` that calls the API endpoint.

---

## Database Structure

After seeding, your database will have this structure:

```
CategoryBrand Collection
├── category: "mobile"
├── name: "Apple"
├── slug: "apple"
├── logo: "https://..."
├── isActive: true
├── models: [
│   {
│     name: "iPhone 15 Pro",
│     modelNumber: "A2846",
│     releaseYear: 2023
│   },
│   {
│     name: "iPhone 15 Pro Max",
│     modelNumber: "A2847",
│     releaseYear: 2023
│   },
│   ...
│ ]
├── createdAt: "2024-01-29T..."
└── updatedAt: "2024-01-29T..."
```

---

## Included Brands

| Brand    | Models | Release Years |
| -------- | ------ | ------------- |
| Apple    | 13     | 2021-2023     |
| Samsung  | 11     | 2022-2024     |
| Google   | 8      | 2021-2023     |
| OnePlus  | 8      | 2021-2024     |
| Xiaomi   | 9      | 2022-2024     |
| Motorola | 8      | 2023-2024     |
| Oppo     | 8      | 2022-2023     |
| Vivo     | 8      | 2022-2024     |
| Realme   | 8      | 2023-2024     |
| Huawei   | 8      | 2023-2024     |
| Nothing  | 3      | 2022-2023     |

**Total: 11 brands, 80+ models**

---

## Adding More Data

### To add more brands:

1. Edit `src/lib/seeds/mobile-brands.ts`:

```typescript
export const mobileBrandsSeedData = [
  // ... existing brands
  {
    name: "Nokia",
    slug: "nokia",
    logo: "https://...",
    models: [
      { name: "G100", modelNumber: "TA-1387", releaseYear: 2022 },
      { name: "G50", modelNumber: "TA-1379", releaseYear: 2021 },
      // ... more models
    ],
  },
];
```

2. Run the seeding script with `--clear`:

```bash
npm run seed:mobile:clear
```

### To manually add brands via UI:

1. Go to `/admin/device-management`
2. Click "Device Types" tab → Ensure "Mobile" device type exists
3. Click "Brands" tab → Select "Mobile" category
4. Click "+ Add Brand" → Fill form and add models
5. Submit!

---

## Error Handling

### "Brands already exist"

```
⚠️  Found 11 existing mobile brands in database
   Use --clear flag to remove existing brands first
```

**Solution:**

```bash
npm run seed:mobile:clear
```

### "Duplicate entry"

Some brands may have duplicate slugs or names.

**Solution:**

```bash
npm run seed:mobile:clear
npm run seed:mobile
```

### MongoDB connection error

Ensure `MONGODB_URI` is set in your `.env.local`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/spares-x
```

---

## Next Steps

1. **Seed the data**: Use any of the three options above
2. **Verify**: Go to `/admin/device-management` → "Brands" tab
3. **Edit if needed**: Add more models, update logos, toggle active status
4. **Use in products**: When creating products as a technician, you'll see all brands and models

---

## API Reference

### POST `/api/admin/seed/mobile-brands`

Seeds all mobile brands and models.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response (201):**

```json
{
  "success": true,
  "message": "Mobile brands and models seeded successfully",
  "brandsCreated": 11,
  "totalModels": 80,
  "brands": [
    {
      "id": "ObjectId",
      "name": "Apple",
      "modelCount": 13
    }
  ]
}
```

**Error (409 - Duplicate):**

```json
{
  "success": false,
  "error": "Duplicate entry - Some brands may already exist",
  "details": "..."
}
```

---

### DELETE `/api/admin/seed/mobile-brands`

Clears all mobile brands from the database.

**Headers:**

```
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Mobile brands deleted successfully",
  "deletedCount": 11
}
```

---

### GET `/api/admin/seed/mobile-brands`

Checks seeding status without authentication.

**Response (200):**

```json
{
  "success": true,
  "message": "Mobile brands status",
  "brandsCount": 11,
  "totalModels": 80,
  "isBrandsSeeded": true,
  "brands": [
    {
      "name": "Apple",
      "modelCount": 13,
      "isActive": true
    }
  ]
}
```

---

## Troubleshooting

| Issue                    | Solution                                |
| ------------------------ | --------------------------------------- |
| Script command not found | Run `npm install` first                 |
| MongoDB connection error | Check `MONGODB_URI` in `.env.local`     |
| Auth token invalid       | Use a valid admin token from login      |
| Brands not appearing     | Refresh `/admin/device-management` page |
| Duplicate key error      | Run with `--clear` flag first           |

---

## Future Enhancements

- [ ] Add seed data for Laptops and Desktops
- [ ] Create admin UI button to trigger seeding
- [ ] Add seed data from external API (GSMArena, etc.)
- [ ] Export current brands as seed data
- [ ] Bulk import from CSV file
