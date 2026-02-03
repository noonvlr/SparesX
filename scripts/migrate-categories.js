/**
 * Migration Script: Add deviceId field to existing categories
 * 
 * Purpose: Ensures all existing categories have deviceId field (null = global category)
 * 
 * Run: npm run migrate:categories
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spares-x';

async function migrateCategoriesDeviceId() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const categoriesCollection = db.collection('categories');

    // Count categories without deviceId field
    const categoriesWithoutDeviceId = await categoriesCollection.countDocuments({
      deviceId: { $exists: false }
    });

    if (categoriesWithoutDeviceId === 0) {
      console.log('✅ All categories already have deviceId field');
      return;
    }

    console.log(`📊 Found ${categoriesWithoutDeviceId} categories without deviceId field`);

    // Add deviceId: null to existing categories (makes them global)
    const result = await categoriesCollection.updateMany(
      { deviceId: { $exists: false } },
      { $set: { deviceId: null } }
    );

    console.log(`✅ Updated ${result.modifiedCount} categories with deviceId: null (global)`);

    // Verify migration
    const totalCategories = await categoriesCollection.countDocuments({});
    const globalCategories = await categoriesCollection.countDocuments({ deviceId: null });
    const deviceSpecificCategories = await categoriesCollection.countDocuments({
      deviceId: { $ne: null }
    });

    console.log('\n📊 Migration Summary:');
    console.log(`   Total categories: ${totalCategories}`);
    console.log(`   Global categories (deviceId: null): ${globalCategories}`);
    console.log(`   Device-specific categories: ${deviceSpecificCategories}`);

    console.log('\n📝 Notes:');
    console.log('   - Global categories (deviceId: null) appear for ALL device types');
    console.log('   - To make a category device-specific, update deviceId to ObjectId of DeviceType');
    console.log('   - Example: Update "Mobile Screen" with deviceId of "Mobile" device type');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Migration complete. Database connection closed.');
  }
}

migrateCategoriesDeviceId();
