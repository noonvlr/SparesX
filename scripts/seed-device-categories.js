const mongoose = require('mongoose');

const categoryBrandSchema = new mongoose.Schema({
  category: { type: String, enum: ['mobile', 'laptop', 'desktop'], required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  logo: String,
  models: [{
    name: String,
    modelNumber: String,
    releaseYear: Number,
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CategoryBrand = mongoose.model('CategoryBrand', categoryBrandSchema);

const categoryBrandsData = [
  {
    category: 'mobile',
    name: 'Apple',
    slug: 'apple',
    models: [
      { name: 'iPhone 15 Pro Max', modelNumber: 'A3108', releaseYear: 2023 },
      { name: 'iPhone 15 Pro', modelNumber: 'A3104', releaseYear: 2023 },
      { name: 'iPhone 15', modelNumber: 'A3101', releaseYear: 2023 },
      { name: 'iPhone 14 Pro Max', modelNumber: 'A2894', releaseYear: 2022 },
      { name: 'iPhone 14 Pro', modelNumber: 'A2895', releaseYear: 2022 },
    ]
  },
  {
    category: 'mobile',
    name: 'Samsung',
    slug: 'samsung',
    models: [
      { name: 'Galaxy S24 Ultra', modelNumber: 'SM-S928', releaseYear: 2024 },
      { name: 'Galaxy S24+', modelNumber: 'SM-S926', releaseYear: 2024 },
      { name: 'Galaxy S24', modelNumber: 'SM-S921', releaseYear: 2024 },
      { name: 'Galaxy S23 Ultra', modelNumber: 'SM-S918', releaseYear: 2023 },
      { name: 'Galaxy S23', modelNumber: 'SM-S911', releaseYear: 2023 },
    ]
  },
  {
    category: 'mobile',
    name: 'Google',
    slug: 'google',
    models: [
      { name: 'Pixel 8 Pro', modelNumber: 'husky', releaseYear: 2023 },
      { name: 'Pixel 8', modelNumber: 'shiba', releaseYear: 2023 },
      { name: 'Pixel 7 Pro', modelNumber: 'cheetah', releaseYear: 2022 },
    ]
  },
  {
    category: 'mobile',
    name: 'Xiaomi',
    slug: 'xiaomi',
    models: [
      { name: '13 Ultra', modelNumber: '2211132C', releaseYear: 2023 },
      { name: '13T Pro', modelNumber: '2210132G', releaseYear: 2023 },
      { name: '12 Pro', modelNumber: '2106118C', releaseYear: 2021 },
    ]
  },
  {
    category: 'mobile',
    name: 'OnePlus',
    slug: 'oneplus',
    models: [
      { name: '12', modelNumber: 'CPH2459', releaseYear: 2024 },
      { name: '11T Pro', modelNumber: 'CPH2399', releaseYear: 2022 },
      { name: '11', modelNumber: 'CPH2389', releaseYear: 2022 },
    ]
  },
  {
    category: 'mobile',
    name: 'Motorola',
    slug: 'motorola',
    models: [
      { name: 'Edge 50 Pro', modelNumber: 'XT2341', releaseYear: 2024 },
      { name: 'Razr 40 Ultra', modelNumber: 'XT2401', releaseYear: 2023 },
      { name: 'Edge 40', modelNumber: 'XT2239', releaseYear: 2023 },
    ]
  },
  {
    category: 'mobile',
    name: 'Vivo',
    slug: 'vivo',
    models: [
      { name: 'X100 Ultra', modelNumber: 'V2296A', releaseYear: 2024 },
      { name: 'X90 Pro+', modelNumber: 'V2241A', releaseYear: 2023 },
      { name: 'X90', modelNumber: 'V2233A', releaseYear: 2023 },
    ]
  },
  {
    category: 'laptop',
    name: 'Apple',
    slug: 'apple-laptop',
    models: [
      { name: 'MacBook Pro 16"', modelNumber: 'A2941', releaseYear: 2023 },
      { name: 'MacBook Pro 14"', modelNumber: 'A2779', releaseYear: 2023 },
      { name: 'MacBook Air M2', modelNumber: 'A2681', releaseYear: 2022 },
      { name: 'MacBook Air M1', modelNumber: 'A2337', releaseYear: 2020 },
    ]
  },
  {
    category: 'laptop',
    name: 'Dell',
    slug: 'dell',
    models: [
      { name: 'XPS 15', modelNumber: '9530', releaseYear: 2023 },
      { name: 'XPS 13', modelNumber: '9340', releaseYear: 2023 },
      { name: 'Inspiron 15', modelNumber: '3520', releaseYear: 2023 },
    ]
  },
  {
    category: 'laptop',
    name: 'HP',
    slug: 'hp',
    models: [
      { name: 'Spectre x360', modelNumber: '16-aa0013dx', releaseYear: 2023 },
      { name: 'Pavilion 15', modelNumber: '15-eh', releaseYear: 2023 },
      { name: 'Elite Dragonfly', modelNumber: 'G3', releaseYear: 2023 },
    ]
  },
  {
    category: 'laptop',
    name: 'Lenovo',
    slug: 'lenovo',
    models: [
      { name: 'ThinkPad X1 Carbon', modelNumber: 'Gen12', releaseYear: 2024 },
      { name: 'ThinkPad T14s', modelNumber: 'Gen4', releaseYear: 2023 },
      { name: 'IdeaPad Pro 5', modelNumber: '16IMH9', releaseYear: 2024 },
    ]
  },
  {
    category: 'laptop',
    name: 'ASUS',
    slug: 'asus',
    models: [
      { name: 'Vivobook 16', modelNumber: 'X1605ZA', releaseYear: 2023 },
      { name: 'ROG Zephyrus G14', modelNumber: 'GU604', releaseYear: 2023 },
      { name: 'TUF Gaming A15', modelNumber: 'FA506', releaseYear: 2023 },
    ]
  },
  {
    category: 'laptop',
    name: 'MSI',
    slug: 'msi',
    models: [
      { name: 'Raider GE68 HX', modelNumber: '13VG', releaseYear: 2023 },
      { name: 'Modern 15', modelNumber: 'B13MV', releaseYear: 2023 },
      { name: 'Stealth 17 Studio', modelNumber: 'A13VG', releaseYear: 2023 },
    ]
  },
  {
    category: 'desktop',
    name: 'Apple',
    slug: 'apple-desktop',
    models: [
      { name: 'Mac Studio', modelNumber: 'A2348', releaseYear: 2023 },
      { name: 'iMac 27"', modelNumber: 'A2438', releaseYear: 2022 },
      { name: 'Mac mini M2', modelNumber: 'A2348', releaseYear: 2023 },
    ]
  },
  {
    category: 'desktop',
    name: 'Dell',
    slug: 'dell-desktop',
    models: [
      { name: 'OptiPlex 5000', modelNumber: '5090', releaseYear: 2023 },
      { name: 'Inspiron 24', modelNumber: '3420', releaseYear: 2023 },
      { name: 'Precision 3000', modelNumber: '3680', releaseYear: 2023 },
    ]
  },
  {
    category: 'desktop',
    name: 'HP',
    slug: 'hp-desktop',
    models: [
      { name: 'EliteDesk 800', modelNumber: 'G9', releaseYear: 2023 },
      { name: 'Pavilion 27', modelNumber: '27-d', releaseYear: 2023 },
      { name: 'All-in-One 24', modelNumber: 'f', releaseYear: 2023 },
    ]
  },
  {
    category: 'desktop',
    name: 'Lenovo',
    slug: 'lenovo-desktop',
    models: [
      { name: 'ThinkCentre M90', modelNumber: 'Gen5', releaseYear: 2023 },
      { name: 'IdeaCentre AIO 27', modelNumber: 'F0FV', releaseYear: 2023 },
      { name: 'Legion Tower', modelNumber: '7i', releaseYear: 2023 },
    ]
  },
  {
    category: 'desktop',
    name: 'ASUS',
    slug: 'asus-desktop',
    models: [
      { name: 'VivoPC X1', modelNumber: 'M010BC', releaseYear: 2023 },
      { name: 'ROG Strix GT', modelNumber: '35DXS', releaseYear: 2023 },
      { name: 'Pro A580', modelNumber: 'A580', releaseYear: 2023 },
    ]
  },
];

async function seedCategoryBrands() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sparesx';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await CategoryBrand.deleteMany({});
    console.log('Cleared existing category brands');

    // Insert new data
    const result = await CategoryBrand.insertMany(categoryBrandsData);
    console.log(`✅ Successfully seeded ${result.length} category brands`);

    // Log summary
    const mobile = await CategoryBrand.countDocuments({ category: 'mobile' });
    const laptop = await CategoryBrand.countDocuments({ category: 'laptop' });
    const desktop = await CategoryBrand.countDocuments({ category: 'desktop' });
    console.log(`📱 Mobile: ${mobile} brands`);
    console.log(`💻 Laptop: ${laptop} brands`);
    console.log(`🖥️ Desktop: ${desktop} brands`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedCategoryBrands();
