const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sparesx';

// Define the model inline
const ModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  modelNumber: { type: String, required: true },
  releaseYear: { type: Number },
});

const MobileBrandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true },
  logo: { type: String },
  models: [ModelSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const MobileBrand = mongoose.models.MobileBrand || mongoose.model('MobileBrand', MobileBrandSchema);

// Curated list of top mobile brands with popular models
const mobileBrands = [
  {
    name: 'Apple',
    slug: 'apple',
    models: [
      { name: 'iPhone 15 Pro Max', modelNumber: 'A3108' },
      { name: 'iPhone 15 Pro', modelNumber: 'A3102' },
      { name: 'iPhone 15 Plus', modelNumber: 'A3093' },
      { name: 'iPhone 15', modelNumber: 'A3089' },
      { name: 'iPhone 14 Pro Max', modelNumber: 'A2651' },
      { name: 'iPhone 14 Pro', modelNumber: 'A2650' },
      { name: 'iPhone 14 Plus', modelNumber: 'A2632' },
      { name: 'iPhone 14', modelNumber: 'A2649' },
      { name: 'iPhone 13 Pro Max', modelNumber: 'A2484' },
      { name: 'iPhone 13 Pro', modelNumber: 'A2483' },
      { name: 'iPhone 13', modelNumber: 'A2482' },
      { name: 'iPhone 13 mini', modelNumber: 'A2481' },
      { name: 'iPhone 12 Pro Max', modelNumber: 'A2342' },
      { name: 'iPhone 12 Pro', modelNumber: 'A2341' },
      { name: 'iPhone 12', modelNumber: 'A2172' },
      { name: 'iPhone 11 Pro Max', modelNumber: 'A2161' },
      { name: 'iPhone 11 Pro', modelNumber: 'A2160' },
      { name: 'iPhone 11', modelNumber: 'A2111' },
    ]
  },
  {
    name: 'Samsung',
    slug: 'samsung',
    models: [
      { name: 'Galaxy S24 Ultra', modelNumber: 'SM-S928' },
      { name: 'Galaxy S24+', modelNumber: 'SM-S926' },
      { name: 'Galaxy S24', modelNumber: 'SM-S921' },
      { name: 'Galaxy S23 Ultra', modelNumber: 'SM-S918' },
      { name: 'Galaxy S23+', modelNumber: 'SM-S916' },
      { name: 'Galaxy S23', modelNumber: 'SM-S911' },
      { name: 'Galaxy S22 Ultra', modelNumber: 'SM-S908' },
      { name: 'Galaxy S22+', modelNumber: 'SM-S906' },
      { name: 'Galaxy S22', modelNumber: 'SM-S901' },
      { name: 'Galaxy Z Fold 5', modelNumber: 'SM-F946' },
      { name: 'Galaxy Z Flip 5', modelNumber: 'SM-F731' },
      { name: 'Galaxy A54', modelNumber: 'SM-A546' },
      { name: 'Galaxy A34', modelNumber: 'SM-A346' },
      { name: 'Galaxy A14', modelNumber: 'SM-A145' },
    ]
  },
  {
    name: 'Xiaomi',
    slug: 'xiaomi',
    models: [
      { name: 'Xiaomi 14 Pro', modelNumber: '2401CPN6C' },
      { name: 'Xiaomi 14', modelNumber: '2401CPN5C' },
      { name: 'Xiaomi 13 Pro', modelNumber: '2210132C' },
      { name: 'Xiaomi 13', modelNumber: '2211133C' },
      { name: 'Redmi Note 13 Pro+', modelNumber: '23124RN87C' },
      { name: 'Redmi Note 13 Pro', modelNumber: '23124RN86C' },
      { name: 'Redmi Note 13', modelNumber: '23124RN4BI' },
      { name: 'Redmi Note 12 Pro', modelNumber: '22101316C' },
      { name: 'POCO X6 Pro', modelNumber: '23113RKC6C' },
      { name: 'POCO F5', modelNumber: '23049PCD8G' },
    ]
  },
  {
    name: 'OnePlus',
    slug: 'oneplus',
    models: [
      { name: 'OnePlus 12', modelNumber: 'CPH2581' },
      { name: 'OnePlus 11', modelNumber: 'CPH2449' },
      { name: 'OnePlus 10 Pro', modelNumber: 'NE2213' },
      { name: 'OnePlus 10T', modelNumber: 'CPH2413' },
      { name: 'OnePlus Nord 3', modelNumber: 'CPH2493' },
      { name: 'OnePlus Nord CE 3', modelNumber: 'CPH2491' },
    ]
  },
  {
    name: 'Oppo',
    slug: 'oppo',
    models: [
      { name: 'Oppo Find X7 Ultra', modelNumber: 'PHZ110' },
      { name: 'Oppo Find X6 Pro', modelNumber: 'PHM110' },
      { name: 'Oppo Reno 11 Pro', modelNumber: 'CPH2607' },
      { name: 'Oppo Reno 10 Pro+', modelNumber: 'CPH2525' },
      { name: 'Oppo A79 5G', modelNumber: 'CPH2557' },
    ]
  },
  {
    name: 'Vivo',
    slug: 'vivo',
    models: [
      { name: 'Vivo X100 Pro', modelNumber: 'V2309' },
      { name: 'Vivo X90 Pro', modelNumber: 'V2242' },
      { name: 'Vivo V30 Pro', modelNumber: 'V2322' },
      { name: 'Vivo V29 Pro', modelNumber: 'V2250' },
      { name: 'Vivo Y100', modelNumber: 'V2318' },
    ]
  },
  {
    name: 'Realme',
    slug: 'realme',
    models: [
      { name: 'Realme 12 Pro+', modelNumber: 'RMX3840' },
      { name: 'Realme 12 Pro', modelNumber: 'RMX3841' },
      { name: 'Realme 11 Pro+', modelNumber: 'RMX3741' },
      { name: 'Realme GT 5 Pro', modelNumber: 'RMX3851' },
      { name: 'Realme Narzo 70 Pro', modelNumber: 'RMX3999' },
    ]
  },
  {
    name: 'Google',
    slug: 'google',
    models: [
      { name: 'Pixel 8 Pro', modelNumber: 'GE3P9' },
      { name: 'Pixel 8', modelNumber: 'GKV4X' },
      { name: 'Pixel 7 Pro', modelNumber: 'GP4BC' },
      { name: 'Pixel 7', modelNumber: 'GVU6C' },
      { name: 'Pixel 6 Pro', modelNumber: 'G8VOU' },
    ]
  },
  {
    name: 'Motorola',
    slug: 'motorola',
    models: [
      { name: 'Moto Edge 50 Pro', modelNumber: 'XT2401' },
      { name: 'Moto G84', modelNumber: 'XT2347' },
      { name: 'Moto G54', modelNumber: 'XT2343' },
      { name: 'Razr 40 Ultra', modelNumber: 'XT2321' },
    ]
  },
  {
    name: 'Nokia',
    slug: 'nokia',
    models: [
      { name: 'Nokia XR21', modelNumber: 'TA-1476' },
      { name: 'Nokia G60', modelNumber: 'TA-1476' },
      { name: 'Nokia G42', modelNumber: 'TA-1452' },
    ]
  },
  {
    name: 'Nothing',
    slug: 'nothing',
    models: [
      { name: 'Nothing Phone (2)', modelNumber: 'A065' },
      { name: 'Nothing Phone (1)', modelNumber: 'A063' },
    ]
  },
  {
    name: 'Huawei',
    slug: 'huawei',
    models: [
      { name: 'Huawei Mate 60 Pro', modelNumber: 'ALN-AL00' },
      { name: 'Huawei P60 Pro', modelNumber: 'ALN-AL10' },
      { name: 'Huawei Nova 11 Pro', modelNumber: 'GOA-AL00' },
    ]
  },
  {
    name: 'Honor',
    slug: 'honor',
    models: [
      { name: 'Honor Magic 6 Pro', modelNumber: 'BVL-N19' },
      { name: 'Honor 90 Pro', modelNumber: 'REA-AN00' },
      { name: 'Honor X9b', modelNumber: 'ALI-NX1' },
    ]
  },
  {
    name: 'Asus',
    slug: 'asus',
    models: [
      { name: 'ROG Phone 8 Pro', modelNumber: 'AI2401' },
      { name: 'Zenfone 10', modelNumber: 'AI2302' },
    ]
  },
  {
    name: 'Sony',
    slug: 'sony',
    models: [
      { name: 'Xperia 1 V', modelNumber: 'XQ-DQ72' },
      { name: 'Xperia 5 V', modelNumber: 'XQ-DE54' },
    ]
  }
];

async function seedMobileBrands() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing brands
    await MobileBrand.deleteMany({});
    console.log('Cleared existing mobile brands');

    // Insert new brands
    const inserted = await MobileBrand.insertMany(mobileBrands);
    console.log(`✅ Successfully seeded ${inserted.length} mobile brands with ${inserted.reduce((acc, brand) => acc + brand.models.length, 0)} total models`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding mobile brands:', error);
    process.exit(1);
  }
}

seedMobileBrands();
