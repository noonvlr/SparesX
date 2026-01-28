// Seed script to populate default categories
const mongoose = require("mongoose");

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
    name: "Mobile Screens",
    icon: "📱",
    slug: "screen",
    description: "LCD, OLED, and AMOLED displays for all mobile brands",
    isActive: true,
    order: 1,
  },
  {
    name: "Batteries",
    icon: "🔋",
    slug: "battery",
    description: "High-capacity replacement batteries",
    isActive: true,
    order: 2,
  },
  {
    name: "Charging Ports",
    icon: "🔌",
    slug: "charging-port",
    description: "USB-C, Micro USB, and Lightning ports",
    isActive: true,
    order: 3,
  },
  {
    name: "Cameras",
    icon: "📷",
    slug: "camera",
    description: "Front and rear camera modules",
    isActive: true,
    order: 4,
  },
  {
    name: "Motherboards",
    icon: "🖥️",
    slug: "motherboard",
    description: "Logic boards and mainboards",
    isActive: true,
    order: 5,
  },
  {
    name: "Tools & Equipment",
    icon: "🔧",
    slug: "tools",
    description: "Repair tools and equipment for technicians",
    isActive: true,
    order: 6,
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

    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`${existingCount} categories already exist. Skipping seed.`);
      process.exit(0);
    }

    // Insert default categories
    await Category.insertMany(defaultCategories);
    console.log(`✅ Successfully seeded ${defaultCategories.length} categories`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
}

seedCategories();
