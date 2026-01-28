#!/usr/bin/env node

/**
 * Mobile Brands Database Inspector
 * 
 * Connects to MongoDB Atlas and displays all mobile brands and models
 * 
 * Usage:
 *   npx ts-node scripts/inspect-mobile-brands.ts
 */

import mongoose from "mongoose";

// Your connection string
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://noonvlr_db_user:7ocG84G7JkZ2rBpa@cluster0.5qsci35.mongodb.net/?appName=Cluster0";

// Define the CategoryBrand schema for inspection
const ModelSchema = new mongoose.Schema(
  {
    name: String,
    modelNumber: String,
    releaseYear: Number,
  },
  { _id: false }
);

const CategoryBrandSchema = new mongoose.Schema({
  category: String,
  name: String,
  slug: String,
  logo: String,
  models: [ModelSchema],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
});

const CategoryBrand = mongoose.model("CategoryBrand", CategoryBrandSchema);

async function inspectDatabase() {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...\n");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected successfully!\n");

    // Get mobile brands
    const mobileBrands = await CategoryBrand.find({ category: "mobile" }).lean();

    console.log("📊 MOBILE BRANDS AND MODELS DATABASE INSPECTION\n");
    console.log(`Total Mobile Brands: ${mobileBrands.length}`);

    if (mobileBrands.length === 0) {
      console.log("\n⚠️  No mobile brands found in database!");
      console.log(
        "Run 'npm run seed:mobile' to populate with sample data.\n"
      );
    } else {
      let totalModels = 0;

      mobileBrands.forEach((brand: any, index: number) => {
        const modelCount = brand.models?.length || 0;
        totalModels += modelCount;

        console.log(`\n${index + 1}. ${brand.name.toUpperCase()}`);
        console.log(`   └─ Slug: ${brand.slug}`);
        console.log(`   └─ Status: ${brand.isActive ? "Active" : "Inactive"}`);
        console.log(`   └─ Models: ${modelCount}`);

        if (brand.logo) {
          console.log(
            `   └─ Logo: ${brand.logo.substring(0, 50)}${brand.logo.length > 50 ? "..." : ""}`
          );
        }

        if (brand.models && brand.models.length > 0) {
          console.log(`   └─ Device Models:`);
          brand.models.slice(0, 5).forEach((model: any, idx: number) => {
            const isLast =
              idx === brand.models.length - 1 ||
              idx === 4;
            const prefix = isLast && brand.models.length > 5 ? "   │  └─" : "   │  ├─";
            console.log(`${prefix} ${model.name}`);
            if (model.modelNumber) {
              console.log(`${prefix}   └─ Model #: ${model.modelNumber}`);
            }
            if (model.releaseYear) {
              console.log(`${prefix}   └─ Year: ${model.releaseYear}`);
            }
          });

          if (brand.models.length > 5) {
            console.log(
              `   │  └─ ... and ${brand.models.length - 5} more models`
            );
          }
        }
      });

      console.log(`\n${"=".repeat(60)}`);
      console.log(`SUMMARY:`);
      console.log(`  • Total Brands: ${mobileBrands.length}`);
      console.log(`  • Total Models: ${totalModels}`);
      console.log(`${"=".repeat(60)}\n`);

      // Show brand statistics
      console.log("BRAND STATISTICS:");
      mobileBrands.forEach((brand: any) => {
        console.log(
          `  • ${brand.name.padEnd(15)} → ${brand.models?.length || 0} models`
        );
      });

      // Export as JSON for further processing
      console.log(`\n📁 Raw Data (JSON Format):`);
      console.log("─".repeat(60));
      mobileBrands.forEach((brand: any) => {
        console.log(JSON.stringify(brand, null, 2));
        console.log("─".repeat(60));
      });
    }

    // Also check for other device categories
    const allCategories = await CategoryBrand.find({})
      .select("category")
      .distinct("category");

    if (allCategories.length > 1) {
      console.log(`\n📱 OTHER DEVICE CATEGORIES IN DATABASE:`);
      for (const category of allCategories) {
        if (category !== "mobile") {
          const count = await CategoryBrand.countDocuments({ category });
          console.log(`  • ${category}: ${count} brands`);
        }
      }
    }

    await mongoose.disconnect();
    console.log("\n✓ Database connection closed\n");
  } catch (error: any) {
    console.error("\n✗ Error connecting to database:");
    console.error(`  ${error.message}\n`);
    process.exit(1);
  }
}

inspectDatabase();
