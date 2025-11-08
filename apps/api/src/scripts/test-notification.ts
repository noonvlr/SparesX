import { prisma } from '../utils/database';

async function testNotification() {
  try {
    console.log('Testing notification creation...');

    // Get a user to create notification for
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }

    console.log(`Creating test notification for user: ${user.name} (${user.email})`);

    // Create a test notification
    const notification = await prisma.notification.create({
      data: {
        title: 'Test Notification',
        message: 'This is a test notification to verify the notification system is working correctly.',
        type: 'INFO',
        userId: user.id,
      },
    });

    console.log('Test notification created:', notification);
    console.log('Notification ID:', notification.id);
  } catch (error) {
    console.error('Error creating test notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotification();
