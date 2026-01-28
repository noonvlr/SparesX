#!/usr/bin/env node
/**
 * Migration script to remove base64 images from products
 * This clears all images from MongoDB since we're now using Vercel Blob
 * Usage: node scripts/remove-images-from-db.js
 */

const mongoose = require("mongoose");

async function removeImagesFromDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("❌ Error: MONGODB_URI environment variable not set");
      process.exit(1);
    }

    console.log("🔄 Connecting to MongoDB...");
    const conn = await mongoose.connect(uri);

    const dbName = conn.connection.db.databaseName;
    console.log(`✓ Connected to database: "${dbName}"\n`);

    const productsCollection = conn.connection.db.collection("products");

    // Check current state
    console.log("📊 Analyzing products...");
    const totalProducts = await productsCollection.countDocuments({});
    const productsWithImages = await productsCollection.countDocuments({
      images: { $exists: true, $ne: [] },
    });

    console.log(`  Total products: ${totalProducts}`);
    console.log(`  Products with images: ${productsWithImages}`);

    if (productsWithImages === 0) {
      console.log("\n✓ No images to remove!");
      await conn.disconnect();
      return;
    }

    // Sample image size info
    const sampleProduct = await productsCollection.findOne({
      images: { $exists: true, $ne: [] },
    });

    if (sampleProduct && sampleProduct.images && sampleProduct.images.length > 0) {
      const imageSize = JSON.stringify(sampleProduct.images).length;
      const totalEstimatedSize = (imageSize / 1024).toFixed(2);
      console.log(`  Average image storage per product: ~${totalEstimatedSize}KB`);
      console.log(
        `  Estimated total storage: ~${((imageSize / 1024) * productsWithImages).toFixed(2)}KB\n`
      );
    }

    // Confirm deletion
    console.log("⚠️  This will remove all images from the database.");
    console.log("   Images will be re-uploaded using Vercel Blob.\n");

    // Perform deletion
    console.log("🗑️  Removing images from products...");
    const result = await productsCollection.updateMany(
      { images: { $exists: true } },
      { $set: { images: [] } }
    );

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`  Documents matched: ${result.matchedCount}`);
    console.log(`  Documents modified: ${result.modifiedCount}`);

    // Verify
    const productsWithImagesAfter = await productsCollection.countDocuments({
      images: { $exists: true, $ne: [] },
    });
    console.log(
      `  Products with images after migration: ${productsWithImagesAfter}`
    );

    console.log(
      "\n💡 Next steps:"
    );
    console.log(
      "   1. Technicians need to re-upload images for their products"
    );
    console.log("   2. Images will be stored on Vercel Blob instead of MongoDB");
    console.log("   3. Database size will be significantly reduced\n");

    await conn.disconnect();
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);
    process.exit(1);
  }
}

removeImagesFromDB();
