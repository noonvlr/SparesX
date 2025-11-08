import { prisma } from '../utils/database';
import { createError } from '../middleware/error-handler';

interface CreateOrderData {
  productId: string;
  buyerId: string;
  shippingAddress: string;
  notes?: string;
}

class OrderService {
  async getUserOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  async createOrder(data: CreateOrderData) {
    const { productId, buyerId, shippingAddress, notes } = data;

    // Check if product exists and is active
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { seller: true },
    });

    if (!product) {
      throw createError('Product not found or not available', 404);
    }

    // Check if user is not trying to buy their own product
    if (product.sellerId === buyerId) {
      throw createError('Cannot buy your own product', 400);
    }

    // Check if order already exists for this product and buyer
    const existingOrder = await prisma.order.findFirst({
      where: {
        productId,
        buyerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingOrder) {
      throw createError('Order already exists for this product', 400);
    }

    const order = await prisma.order.create({
      data: {
        productId,
        buyerId,
        sellerId: product.sellerId,
        totalAmount: product.price,
        shippingAddress,
        notes,
      },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return order;
  }

  async getOrderById(id: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
      include: {
        product: {
          include: {
            images: {
              orderBy: { order: 'asc' },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    return order;
  }

  async updateOrderStatus(id: string, status: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Only seller can update order status
    if (order.sellerId !== userId) {
      throw createError('Only seller can update order status', 403);
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw createError('Invalid order status', 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  // Admin-only methods
  async getAllOrders(page: number = 1, limit: number = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          product: {
            title: { contains: search, mode: 'insensitive' as const }
          }
        },
        {
          buyer: {
            name: { contains: search, mode: 'insensitive' as const }
          }
        },
        {
          seller: {
            name: { contains: search, mode: 'insensitive' as const }
          }
        }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: {
            include: {
              images: {
                take: 1,
                orderBy: { order: 'asc' },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async adminUpdateOrderStatus(id: string, status: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw createError('Invalid order status', 400);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }
}

export const orderService = new OrderService();





