import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceCleanupCategories() {
  try {
    console.log('🧹 Force cleaning all categories...');
    
    // First, set all parentId to null to break the hierarchy
    console.log('🔗 Breaking category hierarchy...');
    await prisma.category.updateMany({
      data: { parentId: null }
    });
    
    // Then delete all categories
    console.log('🗑️ Deleting all categories...');
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`✅ Deleted ${deletedCategories.count} categories`);
    
    console.log('🎉 Force cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during force cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

forceCleanupCategories()
  .then(() => {
    console.log('✅ Force cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Force cleanup script failed:', error);
    process.exit(1);
  });
