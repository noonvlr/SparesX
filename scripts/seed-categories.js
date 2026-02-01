// Seed script to populate default categories
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load environment variables from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  });
}

const categorySchema = new mongoose.Schema({
  name: String,
  icon: String,
  slug: String,
  description: String,
  isActive: Boolean,
  order: Number,
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

const defaultCategories = [
  {
    name: "Screen/Display",
    icon: "📱",
    slug: "screen",
    description: "LCD, OLED, and AMOLED displays for all devices",
    isActive: true,
    order: 1,
  },
  {
    name: "Battery",
    icon: "🔋",
    slug: "battery",
    description: "High-capacity replacement batteries",
    isActive: true,
    order: 2,
  },
  {
    name: "Charging Port",
    icon: "🔌",
    slug: "charging-port",
    description: "USB-C, Micro USB, and Lightning ports",
    isActive: true,
    order: 3,
  },
  {
    name: "Camera",
    icon: "📷",
    slug: "camera",
    description: "Front and rear camera modules",
    isActive: true,
    order: 4,
  },
  {
    name: "Motherboard",
    icon: "🖥️",
    slug: "motherboard",
    description: "Logic boards and mainboards",
    isActive: true,
    order: 5,
  },
  {
    name: "Back Panel",
    icon: "📲",
    slug: "back-panel",
    description: "Device back covers and panels",
    isActive: true,
    order: 6,
  },
  {
    name: "Speaker",
    icon: "🔊",
    slug: "speaker",
    description: "Audio speakers and sound modules",
    isActive: true,
    order: 7,
  },
  {
    name: "Microphone",
    icon: "🎤",
    slug: "microphone",
    description: "Microphone components",
    isActive: true,
    order: 8,
  },
  {
    name: "SIM Tray",
    icon: "💳",
    slug: "sim-tray",
    description: "SIM card trays and holders",
    isActive: true,
    order: 9,
  },
  {
    name: "Buttons",
    icon: "🔘",
    slug: "buttons",
    description: "Power, volume, and other physical buttons",
    isActive: true,
    order: 10,
  },
  {
    name: "Flex Cable",
    icon: "🔗",
    slug: "flex-cable",
    description: "Internal flex cables and connectors",
    isActive: true,
    order: 11,
  },
  {
    name: "Antenna",
    icon: "📡",
    slug: "antenna",
    description: "Signal antennas and modules",
    isActive: true,
    order: 12,
  },
  {
    name: "Vibration Motor",
    icon: "📳",
    slug: "vibration-motor",
    description: "Haptic feedback motors",
    isActive: true,
    order: 13,
  },
  {
    name: "Earpiece",
    icon: "👂",
    slug: "earpiece",
    description: "Earpiece speakers",
    isActive: true,
    order: 14,
  },
  {
    name: "Proximity Sensor",
    icon: "🔍",
    slug: "proximity-sensor",
    description: "Proximity and ambient light sensors",
    isActive: true,
    order: 15,
  },
  {
    name: "Tools & Equipment",
    icon: "🔧",
    slug: "tools",
    description: "Repair tools and equipment for technicians",
    isActive: true,
    order: 16,
  },
  {
    name: "Other Parts",
    icon: "📦",
    slug: "other",
    description: "Miscellaneous spare parts",
    isActive: true,
    order: 17,
  },
];

async function seedCategories() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Insert or update categories (upsert)
    let created = 0;
    let updated = 0;
    
    for (const cat of defaultCategories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (existing) {
        await Category.updateOne({ slug: cat.slug }, { $set: cat });
        updated++;
        console.log(`  ✓ Updated: ${cat.name}`);
      } else {
        await Category.create(cat);
        created++;
        console.log(`  + Created: ${cat.name}`);
      }
    }
    
    console.log(`\n✅ Seeding complete: ${created} created, ${updated} updated`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
}

seedCategories();
