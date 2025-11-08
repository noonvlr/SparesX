import { prisma } from '../utils/database';

async function seedNotifications() {
  try {
    console.log('Seeding notifications...');

    // Get a user to create notifications for
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }

    // Create sample notifications
    const notifications = [
      {
        title: 'Welcome to SparesX!',
        message: 'Thank you for joining our platform. Start browsing for spare parts or list your own items.',
        type: 'SUCCESS' as const,
        userId: user.id,
      },
      {
        title: 'New Message Received',
        message: 'You have received a new message about your product listing.',
        type: 'INFO' as const,
        userId: user.id,
      },
      {
        title: 'Order Status Update',
        message: 'Your order #12345 has been confirmed and is being prepared for shipment.',
        type: 'SUCCESS' as const,
        userId: user.id,
      },
      {
        title: 'Payment Reminder',
        message: 'Please complete your payment for order #12345 to avoid cancellation.',
        type: 'WARNING' as const,
        userId: user.id,
      },
      {
        title: 'Product Listing Expired',
        message: 'Your product listing "Car Engine Parts" has expired. Would you like to renew it?',
        type: 'WARNING' as const,
        userId: user.id,
      },
    ];

    // Create notifications
    for (const notificationData of notifications) {
      await prisma.notification.create({
        data: notificationData,
      });
    }

    console.log(`Created ${notifications.length} sample notifications for user: ${user.name}`);
    console.log('Notification seeding completed!');
  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications();
