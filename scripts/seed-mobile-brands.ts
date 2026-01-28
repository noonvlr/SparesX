#!/usr/bin/env node

/**
 * Mobile Brands & Models Seeding Script
 * 
 * Usage:
 *   npx ts-node scripts/seed-mobile-brands.ts
 *   npx ts-node scripts/seed-mobile-brands.ts --clear
 */

import mongoose from "mongoose";
import { CategoryBrand } from "../src/lib/models/CategoryBrand";
import { mobileBrandsSeedData } from "../src/lib/seeds/mobile-brands";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://noonvlr_db_user:7ocG84G7JkZ2rBpa@cluster0.5qsci35.mongodb.net/?appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");
  } catch (error) {
    console.error("✗ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

async function clearMobileBrands() {
  try {
    const result = await CategoryBrand.deleteMany({ category: "mobile" });
    console.log(`✓ Cleared ${result.deletedCount} mobile brands from database`);
    return result.deletedCount;
  } catch (error) {
    console.error("✗ Failed to clear mobile brands:", error);
    throw error;
  }
}

async function seedMobileBrands() {
  try {
    const brandsWithCategory = mobileBrandsSeedData.map((brand) => ({
      ...brand,
      category: "mobile" as const,
      isActive: true,
    }));

    const result = await CategoryBrand.insertMany(brandsWithCategory, {
      ordered: false,
    });

    console.log(`\n✓ Successfully seeded mobile brands:`);
    console.log(`  • Brands added: ${result.length}`);
    
    let totalModels = 0;
    result.forEach((brand: any) => {
      totalModels += brand.models.length;
      console.log(`  • ${brand.name}: ${brand.models.length} models`);
    });
    
    console.log(`  • Total models: ${totalModels}`);
    
    return result.length;
  } catch (error: any) {
    if (error.code === 11000) {
      console.error("✗ Duplicate entry detected - brands may already exist");
      console.log("  Run with --clear flag to remove existing brands first");
      throw error;
    }
    console.error("✗ Failed to seed mobile brands:", error.message);
    throw error;
  }
}

async function getStatus() {
  try {
    const count = await CategoryBrand.countDocuments({ category: "mobile" });
    const brands = await CategoryBrand.find({ category: "mobile" })
      .select("name models.length isActive")
      .lean();

    const totalModels = brands.reduce(
      (sum, brand: any) => sum + (brand.models?.length || 0),
      0
    );

    console.log(`\n📊 Database Status:`);
    console.log(`  • Mobile brands: ${count}`);
    console.log(`  • Total models: ${totalModels}`);
    
    if (count > 0) {
      console.log(`\n  Brands in database:`);
      brands.forEach((b: any) => {
        console.log(`  • ${b.name}: ${b.models?.length || 0} models`);
      });
    }
  } catch (error) {
    console.error("✗ Failed to get status:", error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");
  const checkStatus = args.includes("--status");

  try {
    await connectDB();

    if (checkStatus) {
      await getStatus();
    } else {
      // Check if data already exists
      const existingCount = await CategoryBrand.countDocuments({
        category: "mobile",
      });

      if (existingCount > 0 && !shouldClear) {
        console.log(
          `\n⚠️  Found ${existingCount} existing mobile brands in database`
        );
        console.log("   Use --clear flag to remove existing brands first:\n");
        console.log("   npx ts-node scripts/seed-mobile-brands.ts --clear\n");
        process.exit(0);
      }

      if (shouldClear) {
        await clearMobileBrands();
      }

      await seedMobileBrands();
      console.log(
        "\n✅ Seeding complete! You can now manage brands in /admin/device-management\n"
      );
    }

    await mongoose.disconnect();
    console.log("✓ Database connection closed\n");
  } catch (error) {
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
