import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  // Automotive
  {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car parts, engines, transmissions, and automotive accessories',
    children: [
      { name: 'Engine Parts', slug: 'engine-parts', description: 'Engine components and parts' },
      { name: 'Transmission', slug: 'transmission', description: 'Transmission systems and parts' },
      { name: 'Brake System', slug: 'brake-system', description: 'Brake components and systems' },
      { name: 'Suspension', slug: 'suspension', description: 'Suspension parts and components' },
      { name: 'Electrical', slug: 'automotive-electrical', description: 'Automotive electrical components' },
    ]
  },
  
  // Electronics
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic components, devices, and accessories',
    children: [
      { name: 'Mobile & Gadgets', slug: 'mobile-gadgets', description: 'Mobile phones, tablets, and gadgets' },
      { name: 'Computer Parts', slug: 'computer-parts', description: 'Computer components and parts' },
      { name: 'Audio & Video', slug: 'audio-video', description: 'Audio and video equipment' },
      { name: 'Gaming', slug: 'gaming', description: 'Gaming consoles and accessories' },
      { name: 'Home Appliances', slug: 'home-appliances', description: 'Home electronic appliances' },
    ]
  },
  
  // Industrial
  {
    name: 'Industrial',
    slug: 'industrial',
    description: 'Industrial equipment, machinery, and components',
    children: [
      { name: 'Machinery', slug: 'machinery', description: 'Industrial machinery and equipment' },
      { name: 'Tools', slug: 'industrial-tools', description: 'Industrial tools and equipment' },
      { name: 'Safety Equipment', slug: 'safety-equipment', description: 'Industrial safety equipment' },
      { name: 'Pneumatics', slug: 'pneumatics', description: 'Pneumatic systems and components' },
      { name: 'Hydraulics', slug: 'hydraulics', description: 'Hydraulic systems and components' },
    ]
  },
  
  // Medical
  {
    name: 'Medical',
    slug: 'medical',
    description: 'Medical equipment, devices, and supplies',
    children: [
      { name: 'Diagnostic Equipment', slug: 'diagnostic-equipment', description: 'Medical diagnostic devices' },
      { name: 'Surgical Instruments', slug: 'surgical-instruments', description: 'Surgical tools and instruments' },
      { name: 'Patient Care', slug: 'patient-care', description: 'Patient care equipment' },
      { name: 'Laboratory', slug: 'laboratory', description: 'Laboratory equipment and supplies' },
      { name: 'Rehabilitation', slug: 'rehabilitation', description: 'Rehabilitation equipment' },
    ]
  },
  
  // Construction
  {
    name: 'Construction',
    slug: 'construction',
    description: 'Construction equipment, tools, and materials',
    children: [
      { name: 'Heavy Equipment', slug: 'heavy-equipment', description: 'Construction heavy machinery' },
      { name: 'Power Tools', slug: 'power-tools', description: 'Construction power tools' },
      { name: 'Building Materials', slug: 'building-materials', description: 'Construction materials' },
      { name: 'Safety Gear', slug: 'construction-safety', description: 'Construction safety equipment' },
      { name: 'Plumbing', slug: 'plumbing', description: 'Plumbing equipment and parts' },
    ]
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Starting category seeding...');

    for (const categoryData of categories) {
      const { children, ...parentData } = categoryData;
      
      // Create parent category
      const parentCategory = await prisma.category.upsert({
        where: { slug: parentData.slug },
        update: parentData,
        create: parentData,
      });
      
      console.log(`✅ Created/Updated parent category: ${parentCategory.name}`);
      
      // Create child categories
      for (const childData of children) {
        const childCategory = await prisma.category.upsert({
          where: { slug: childData.slug },
          update: {
            ...childData,
            parentId: parentCategory.id,
          },
          create: {
            ...childData,
            parentId: parentCategory.id,
          },
        });
        
        console.log(`   ✅ Created/Updated child category: ${childCategory.name}`);
      }
    }

    console.log('🎉 Category seeding completed successfully!');
    
    // Display summary
    const totalCategories = await prisma.category.count();
    const parentCategories = await prisma.category.count({
      where: { parentId: null }
    });
    const childCategories = await prisma.category.count({
      where: { parentId: { not: null } }
    });
    
    console.log('📊 Category Summary:');
    console.log(`   - Total Categories: ${totalCategories}`);
    console.log(`   - Parent Categories: ${parentCategories}`);
    console.log(`   - Child Categories: ${childCategories}`);

  } catch (error) {
    console.error('❌ Error during category seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedCategories()
  .then(() => {
    console.log('✅ Category seeding script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Category seeding script failed:', error);
    process.exit(1);
  });
