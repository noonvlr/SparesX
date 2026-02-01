import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

// Dynamic imports for better TypeScript compatibility in scripts
async function seedDeviceTypes() {
  try {
    const { connectDB } = await import('../src/lib/db/connect');
    const DeviceType = await import('../src/lib/models/DeviceType');

    const defaultDeviceTypes = [
      {
        name: 'Mobile Phone',
        slug: 'mobile',
        emoji: '📱',
        description: 'Mobile phones and smartphones',
        order: 1,
      },
      {
        name: 'Laptop',
        slug: 'laptop',
        emoji: '💻',
        description: 'Laptops and notebooks',
        order: 2,
      },
      {
        name: 'Desktop',
        slug: 'desktop',
        emoji: '🖥️',
        description: 'Desktop computers',
        order: 3,
      },
      {
        name: 'TV',
        slug: 'tv',
        emoji: '📺',
        description: 'Television sets',
        order: 4,
      },
    ];

    await connectDB();
    console.log('✅ Connected to database');

    // Clear existing device types
    await DeviceType.default.deleteMany({});
    console.log('🗑️  Cleared existing device types');

    // Insert default device types
    const createdDeviceTypes = await DeviceType.default.insertMany(defaultDeviceTypes);
    console.log(`✅ Successfully seeded ${createdDeviceTypes.length} device types`);

    // List all device types
    const allDeviceTypes = await DeviceType.default.find().sort({ order: 1 });
    console.log('\n📱 Seeded Device Types:');
    allDeviceTypes.forEach((dt: any) => {
      console.log(`   ${dt.emoji} ${dt.name} (${dt.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding device types:', error);
    process.exit(1);
  }
}

seedDeviceTypes();
