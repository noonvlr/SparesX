import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create categories
  const automotive = await prisma.category.create({
    data: {
      name: 'Automotive',
      slug: 'automotive',
      description: 'Car parts, engines, transmissions, and automotive accessories',
    },
  });

  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Computer components, circuit boards, and electronic parts',
    },
  });

  const mobile = await prisma.category.create({
    data: {
      name: 'Mobile & Gadgets',
      slug: 'mobile',
      description: 'Phone parts, tablets, and mobile accessories',
    },
  });

  const tools = await prisma.category.create({
    data: {
      name: 'Tools & Equipment',
      slug: 'tools',
      description: 'Professional tools and equipment for technicians',
    },
  });

  const categories = [automotive, electronics, mobile, tools];

  console.log('✅ Categories created');

  // Create sample users with hashed passwords
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const seller = await prisma.user.create({
    data: {
      email: 'seller@example.com',
      name: 'Auto Parts Pro',
      phone: '+1 (555) 123-4567',
      password: hashedPassword,
      role: 'SELLER',
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@example.com',
      name: 'John Buyer',
      phone: '+1 (555) 987-6543',
      password: hashedPassword,
      role: 'BUYER',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const users = [seller, buyer, admin];

  console.log('✅ Users created');

  // Create sample products
  const product1 = await prisma.product.create({
    data: {
      title: 'BMW E46 Engine Block - 3.0L M54B30',
      description: 'Used BMW E46 engine block in excellent condition. Removed from a 2003 330i with 120k miles. Engine was running perfectly before removal. No known issues. Perfect for rebuild or replacement.',
      price: 1200,
      condition: 'USED',
      category: 'Automotive',
      brand: 'BMW',
      model: 'E46',
      year: 2003,
      location: 'New York, NY',
      sellerId: users[0].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            publicId: 'bmw-engine-1',
            order: 0,
          },
          {
            url: 'https://images.unsplash.com/photo-1562141961-4b0b0b0b0b0b?w=800',
            publicId: 'bmw-engine-2',
            order: 1,
          },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      title: 'iPhone 12 Pro Display Assembly',
      description: 'Refurbished iPhone 12 Pro display assembly. Includes LCD, digitizer, and front camera. Tested and working perfectly. No dead pixels or touch issues.',
      price: 180,
      condition: 'REFURBISHED',
      category: 'Mobile & Gadgets',
      brand: 'Apple',
      model: 'iPhone 12 Pro',
      year: 2020,
      location: 'Los Angeles, CA',
      sellerId: users[0].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
            publicId: 'iphone-display-1',
            order: 0,
          },
        ],
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      title: 'Dell Laptop Motherboard - Inspiron 15 3000',
      description: 'New Dell laptop motherboard for Inspiron 15 3000 series. Compatible with multiple models. Includes all necessary components and connectors.',
      price: 250,
      condition: 'NEW',
      category: 'Electronics',
      brand: 'Dell',
      model: 'Inspiron 15 3000',
      location: 'Chicago, IL',
      sellerId: users[0].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
            publicId: 'dell-motherboard-1',
            order: 0,
          },
        ],
      },
    },
  });

  const products = [product1, product2, product3];

  console.log('✅ Products created');

  // Create sample order
  await prisma.order.create({
    data: {
      productId: products[1].id,
      buyerId: users[1].id,
      sellerId: users[0].id,
      status: 'PENDING',
      totalAmount: 180,
      shippingAddress: '123 Main St, New York, NY 10001',
      notes: 'Please package carefully for shipping.',
    },
  });

  console.log('✅ Order created');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




