import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spares-x';

// Define User schema and model inline to avoid import issues
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['technician', 'admin'], required: true },
  mobile: { type: String, required: true, trim: true },
  countryCode: { type: String, required: true, trim: true, default: '+91' },
  address: { type: String, required: true, trim: true },
  pinCode: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  whatsappNumber: { type: String, required: true, trim: true },
  profilePicture: { type: String, trim: true },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  }
}

async function seedAdminUser() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@sparesx.com' });
    
    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new User({
      name: 'Admin User',
      email: 'admin@sparesx.com',
      password: hashedPassword,
      role: 'admin',
      mobile: '+919999999999',
      countryCode: '+91',
      address: 'Admin Office, Tech Park',
      pinCode: '560001',
      city: 'Bangalore',
      state: 'Karnataka',
      whatsappNumber: '+919999999999',
      isBlocked: false,
    });

    await admin.save();
    console.log('✓ Admin user created');
    console.log('  Email: admin@sparesx.com');
    console.log('  Password: admin123');
  } catch (error) {
    console.error('✗ Error seeding admin user:', error);
  }
}

async function seed() {
  try {
    console.log('\n🌱 Starting database seed...\n');
    
    await connectDB();
    await seedAdminUser();

    console.log('\n✅ Database seeding completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
