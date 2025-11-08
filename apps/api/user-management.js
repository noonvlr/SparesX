const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manageUser() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    const email = args[1];
    const role = args[2];

    if (!command || !email) {
      console.log(`
🔧 User Management Script

Usage:
  node user-management.js <command> <email> [role]

Commands:
  list                    - List all users
  promote <email> <role>  - Promote user to role (BUYER/SELLER/ADMIN)
  demote <email>          - Demote user to BUYER
  delete <email>          - Delete user
  info <email>            - Show user info

Examples:
  node user-management.js list
  node user-management.js promote john@example.com ADMIN
  node user-management.js demote john@example.com
  node user-management.js info john@example.com
      `);
      return;
    }

    switch (command) {
      case 'list':
        await listUsers();
        break;
      case 'promote':
        if (!role) {
          console.log('❌ Please specify a role (BUYER/SELLER/ADMIN)');
          return;
        }
        await promoteUser(email, role);
        break;
      case 'demote':
        await promoteUser(email, 'BUYER');
        break;
      case 'delete':
        await deleteUser(email);
        break;
      case 'info':
        await showUserInfo(email);
        break;
      default:
        console.log('❌ Unknown command. Use "list" to see available commands.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function listUsers() {
  console.log('📋 All Users:');
  console.log('─'.repeat(80));
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          products: true,
          ordersAsBuyer: true,
          ordersAsSeller: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role} | Products: ${user._count.products} | Orders: ${user._count.ordersAsBuyer + user._count.ordersAsSeller}`);
    console.log(`   Joined: ${user.createdAt.toLocaleDateString()}`);
    console.log('');
  });
}

async function promoteUser(email, role) {
  const validRoles = ['BUYER', 'SELLER', 'ADMIN'];
  
  if (!validRoles.includes(role)) {
    console.log('❌ Invalid role. Must be one of: BUYER, SELLER, ADMIN');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log(`📋 Current user info:`, user);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role },
    select: { id: true, email: true, name: true, role: true }
  });

  console.log(`✅ User ${user.name} promoted to ${role}:`, updatedUser);
}

async function deleteUser(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  if (user.role === 'ADMIN') {
    console.log('❌ Cannot delete admin users');
    return;
  }

  console.log(`📋 User to delete:`, user);
  
  // In a real scenario, you might want to add confirmation
  await prisma.user.delete({
    where: { email }
  });

  console.log(`✅ User ${user.name} deleted successfully`);
}

async function showUserInfo(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          products: true,
          ordersAsBuyer: true,
          ordersAsSeller: true,
          sentMessages: true,
          receivedMessages: true,
        }
      }
    }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('👤 User Information:');
  console.log('─'.repeat(50));
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Phone: ${user.phone || 'Not provided'}`);
  console.log(`Role: ${user.role}`);
  console.log(`Joined: ${user.createdAt.toLocaleDateString()}`);
  console.log(`Last Updated: ${user.updatedAt.toLocaleDateString()}`);
  console.log('');
  console.log('📊 Activity:');
  console.log(`Products: ${user._count.products}`);
  console.log(`Orders (as buyer): ${user._count.ordersAsBuyer}`);
  console.log(`Orders (as seller): ${user._count.ordersAsSeller}`);
  console.log(`Messages sent: ${user._count.sentMessages}`);
  console.log(`Messages received: ${user._count.receivedMessages}`);
}

manageUser();
