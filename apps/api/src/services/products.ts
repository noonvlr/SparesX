import { prisma } from '../utils/database';
import { createError } from '../middleware/error-handler';
import { cache } from '../utils/redis';

interface ProductFilters {
  search?: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  brand?: string;
  page: number;
  limit: number;
}

interface CreateProductData {
  title: string;
  description: string;
  price: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  category: string;
  brand?: string;
  model?: string;
  year?: number;
  location: string;
  quantity: number;
  images: string[];
  sellerId: string;
}

class ProductService {
  async getProducts(filters: ProductFilters) {
    const { page, limit, ...searchFilters } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (searchFilters.search) {
      where.OR = [
        { title: { contains: searchFilters.search, mode: 'insensitive' } },
        { description: { contains: searchFilters.search, mode: 'insensitive' } },
        { brand: { contains: searchFilters.search, mode: 'insensitive' } },
        { model: { contains: searchFilters.search, mode: 'insensitive' } },
      ];
    }

    if (searchFilters.category) {
      where.category = searchFilters.category;
    }

    if (searchFilters.condition) {
      where.condition = searchFilters.condition;
    }

    if (searchFilters.minPrice || searchFilters.maxPrice) {
      where.price = {};
      if (searchFilters.minPrice) {
        where.price.gte = searchFilters.minPrice;
      }
      if (searchFilters.maxPrice) {
        where.price.lte = searchFilters.maxPrice;
      }
    }

    if (searchFilters.location) {
      where.location = { contains: searchFilters.location, mode: 'insensitive' };
    }

    if (searchFilters.brand) {
      where.brand = { contains: searchFilters.brand, mode: 'insensitive' };
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw createError('Product not found', 404);
    }

    return product;
  }

  async createProduct(data: CreateProductData) {
    const { images, ...productData } = data;

    // Convert string values to numbers for Prisma
    const processedData = {
      ...productData,
      price: parseFloat(productData.price.toString()),
      quantity: parseInt(productData.quantity.toString()),
      year: productData.year ? parseInt(productData.year.toString()) : null,
    };

    // Create product with images in a transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: processedData,
      });

      // Create image records
      const imageRecords = images.map((url, index) => ({
        url,
        publicId: `product_${newProduct.id}_${index}`, // In real app, extract from Cloudinary URL
        productId: newProduct.id,
        order: index,
      }));

      await tx.listingImage.createMany({
        data: imageRecords,
      });

      return newProduct;
    });

    // Clear cache
    await cache.del('products:*');

    return await this.getProductById(product.id);
  }

  async updateProduct(id: string, updateData: any, sellerId: string) {
    // Check if product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: { id, sellerId },
    });

    if (!existingProduct) {
      throw createError('Product not found or access denied', 404);
    }

    const { images, ...productUpdateData } = updateData;

    // Convert string values to numbers for Prisma
    const processedUpdateData = { ...productUpdateData };
    if (processedUpdateData.price !== undefined) {
      processedUpdateData.price = parseFloat(processedUpdateData.price.toString());
    }
    if (processedUpdateData.quantity !== undefined) {
      processedUpdateData.quantity = parseInt(processedUpdateData.quantity.toString());
    }
    if (processedUpdateData.year !== undefined && processedUpdateData.year !== null && processedUpdateData.year !== '') {
      processedUpdateData.year = parseInt(processedUpdateData.year.toString());
    } else if (processedUpdateData.year === '') {
      processedUpdateData.year = null;
    }

    // Update product
    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: processedUpdateData,
      });

      // Update images if provided
      if (images) {
        // Delete existing images
        await tx.listingImage.deleteMany({
          where: { productId: id },
        });

        // Create new image records
        const imageRecords = images.map((url: string, index: number) => ({
          url,
          publicId: `product_${id}_${index}`,
          productId: id,
          order: index,
        }));

        await tx.listingImage.createMany({
          data: imageRecords,
        });
      }

      return updatedProduct;
    });

    // Clear cache
    await cache.del('products:*');
    await cache.del(`product:${id}`);

    return await this.getProductById(product.id);
  }

  async deleteProduct(id: string, sellerId: string) {
    // Check if product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: { id, sellerId },
    });

    if (!existingProduct) {
      throw createError('Product not found or access denied', 404);
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Clear cache
    await cache.del('products:*');
    await cache.del(`product:${id}`);
  }

  // Admin-only methods
  async getAllProducts(filters: ProductFilters & { isActive?: boolean }) {
    const { page, limit, isActive, ...searchFilters } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply search filters
    if (searchFilters.search) {
      where.OR = [
        { title: { contains: searchFilters.search, mode: 'insensitive' as const } },
        { description: { contains: searchFilters.search, mode: 'insensitive' as const } },
        { brand: { contains: searchFilters.search, mode: 'insensitive' as const } },
        { model: { contains: searchFilters.search, mode: 'insensitive' as const } },
      ];
    }

    if (searchFilters.category) {
      where.category = searchFilters.category;
    }

    if (searchFilters.condition) {
      where.condition = searchFilters.condition;
    }

    if (searchFilters.location) {
      where.location = { contains: searchFilters.location, mode: 'insensitive' as const };
    }

    if (searchFilters.brand) {
      where.brand = { contains: searchFilters.brand, mode: 'insensitive' as const };
    }

    if (searchFilters.minPrice || searchFilters.maxPrice) {
      where.price = {};
      if (searchFilters.minPrice) {
        where.price.gte = searchFilters.minPrice;
      }
      if (searchFilters.maxPrice) {
        where.price.lte = searchFilters.maxPrice;
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          images: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async adminUpdateProduct(id: string, updateData: any) {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw createError('Product not found', 404);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    // Clear cache
    await cache.del(`product:${id}`);
    await cache.del('products:*');

    return updatedProduct;
  }

  async adminDeleteProduct(id: string) {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw createError('Product not found', 404);
    }

    // Hard delete for admin
    await prisma.product.delete({
      where: { id },
    });

    // Clear cache
    await cache.del(`product:${id}`);
    await cache.del('products:*');
  }
}

export const productService = new ProductService();





