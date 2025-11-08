import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');

    // Delete all existing data in the correct order (respecting foreign key constraints)
    
    // 1. Delete listing images first (they reference products)
    console.log('🗑️ Deleting listing images...');
    const deletedImages = await prisma.listingImage.deleteMany({});
    console.log(`✅ Deleted ${deletedImages.count} listing images`);

    // 2. Delete orders (they reference users and products)
    console.log('🗑️ Deleting orders...');
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.count} orders`);

    // 3. Delete notifications (they reference users)
    console.log('🗑️ Deleting notifications...');
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.count} notifications`);

    // 4. Delete products (they reference users)
    console.log('🗑️ Deleting products...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.count} products`);

    // 5. Delete categories (child categories first, then parent categories)
    console.log('🗑️ Deleting child categories...');
    const deletedChildCategories = await prisma.category.deleteMany({
      where: { parentId: { not: null } }
    });
    console.log(`✅ Deleted ${deletedChildCategories.count} child categories`);
    
    console.log('🗑️ Deleting parent categories...');
    const deletedParentCategories = await prisma.category.deleteMany({
      where: { parentId: null }
    });
    console.log(`✅ Deleted ${deletedParentCategories.count} parent categories`);

    // 6. Delete users (except admin users)
    console.log('🗑️ Deleting non-admin users...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    });
    console.log(`✅ Deleted ${deletedUsers.count} non-admin users`);

    console.log('🎉 Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Listing Images: ${deletedImages.count}`);
    console.log(`   - Orders: ${deletedOrders.count}`);
    console.log(`   - Notifications: ${deletedNotifications.count}`);
    console.log(`   - Products: ${deletedProducts.count}`);
    console.log(`   - Child Categories: ${deletedChildCategories.count}`);
    console.log(`   - Parent Categories: ${deletedParentCategories.count}`);
    console.log(`   - Non-admin Users: ${deletedUsers.count}`);

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    console.log('✅ Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });
