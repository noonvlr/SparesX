import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategories() {
  try {
    console.log('🔍 Checking current categories in database...');
    
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
      }
    });
    
    console.log(`📊 Found ${categories.length} categories:`);
    
    categories.forEach(category => {
      console.log(`   - ${category.name} (${category.slug})`);
      if (category.parent) {
        console.log(`     Parent: ${category.parent.name}`);
      }
      if (category.children.length > 0) {
        console.log(`     Children: ${category.children.map(c => c.name).join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
