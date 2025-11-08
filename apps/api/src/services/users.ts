import { prisma } from '../utils/database';
import { createError } from '../middleware/error-handler';

class UserService {
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        address: true,
        city: true,
        state: true,
        district: true,
        pincode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    return user;
  }

  async updateUser(id: string, updateData: any) {
    const { email, ...allowedUpdates } = updateData;

    // Don't allow email updates for now
    if (email) {
      delete allowedUpdates.email;
    }

    const user = await prisma.user.update({
      where: { id },
      data: allowedUpdates,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        address: true,
        city: true,
        state: true,
        district: true,
        pincode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Admin-only methods
  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              products: true,
              ordersAsBuyer: true,
              ordersAsSeller: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteUser(id: string) {
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw createError('Invalid user ID format', 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Don't allow deleting admin users
    if (user.role === 'ADMIN') {
      throw createError('Cannot delete admin users', 403);
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async updateUserRole(id: string, role: string) {
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw createError('Invalid user ID format', 400);
    }

    const validRoles = ['BUYER', 'SELLER', 'DEALER', 'ADMIN'];
    
    if (!validRoles.includes(role)) {
      throw createError('Invalid role', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async getUserProfile(id: string) {
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw createError('Invalid user ID format', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            ordersAsBuyer: true,
            ordersAsSeller: true,
          },
        },
        products: {
          select: {
            id: true,
            title: true,
            price: true,
            condition: true,
            category: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                orders: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        ordersAsBuyer: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                title: true,
                seller: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        ordersAsSeller: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                title: true,
              },
            },
            buyer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    return user;
  }

  async getCurrentUserProfile(id: string) {
    console.log('getCurrentUserProfile called with id:', id);
    
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        address: true,
        city: true,
        state: true,
        district: true,
        pincode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            ordersAsBuyer: true,
            ordersAsSeller: true,
          },
        },
        products: {
          select: {
            id: true,
            title: true,
            price: true,
            condition: true,
            category: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                orders: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        ordersAsBuyer: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                title: true,
                seller: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        ordersAsSeller: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                title: true,
              },
            },
            buyer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      console.log('User not found with id:', id);
      throw createError('User not found', 404);
    }

    console.log('User profile retrieved successfully');
    return user;
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      throw error;
    }
  }

  async updateUserPassword(id: string, newPassword: string) {
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw createError('Invalid user ID format', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async getUserActivity(id: string, page: number = 1, limit: number = 10) {
    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw createError('Invalid user ID format', 400);
    }

    const skip = (page - 1) * limit;

    // Get user's recent activities
    const [products, ordersAsBuyer, ordersAsSeller] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId: id },
        select: {
          id: true,
          title: true,
          price: true,
          createdAt: true,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.order.findMany({
        where: { buyerId: id },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          product: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.order.findMany({
        where: { sellerId: id },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          product: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Combine and sort all activities
    const activities = [
      ...products.map(p => ({
        type: 'product_created',
        id: p.id,
        title: `Created product: ${p.title}`,
        description: `₹${p.price} - ${p.isActive ? 'Active' : 'Inactive'}`,
        createdAt: p.createdAt,
        data: p,
      })),
      ...ordersAsBuyer.map(o => ({
        type: 'order_bought',
        id: o.id,
        title: `Bought: ${o.product.title}`,
        description: `₹${o.totalAmount} - Status: ${o.status}`,
        createdAt: o.createdAt,
        data: o,
      })),
      ...ordersAsSeller.map(o => ({
        type: 'order_sold',
        id: o.id,
        title: `Sold: ${o.product.title}`,
        description: `₹${o.totalAmount} - Status: ${o.status}`,
        createdAt: o.createdAt,
        data: o,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginatedActivities = activities.slice(skip, skip + limit);

    return {
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total: activities.length,
        pages: Math.ceil(activities.length / limit),
      },
    };
  }

  async getCurrentUserActivity(id: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get user's recent activities
    const [products, ordersAsBuyer, ordersAsSeller] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId: id },
        select: {
          id: true,
          title: true,
          price: true,
          createdAt: true,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.order.findMany({
        where: { buyerId: id },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          product: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.order.findMany({
        where: { sellerId: id },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          product: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Combine and sort all activities
    const activities = [
      ...products.map(p => ({
        type: 'product_created',
        id: p.id,
        title: `Created product: ${p.title}`,
        description: `₹${p.price} - ${p.isActive ? 'Active' : 'Inactive'}`,
        createdAt: p.createdAt,
        data: p,
      })),
      ...ordersAsBuyer.map(o => ({
        type: 'order_bought',
        id: o.id,
        title: `Bought: ${o.product.title}`,
        description: `₹${o.totalAmount} - Status: ${o.status}`,
        createdAt: o.createdAt,
        data: o,
      })),
      ...ordersAsSeller.map(o => ({
        type: 'order_sold',
        id: o.id,
        title: `Sold: ${o.product.title}`,
        description: `₹${o.totalAmount} - Status: ${o.status}`,
        createdAt: o.createdAt,
        data: o,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginatedActivities = activities.slice(skip, skip + limit);

    return {
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total: activities.length,
        pages: Math.ceil(activities.length / limit),
      },
    };
  }
}

export const userService = new UserService();





