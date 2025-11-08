import { prisma } from '../utils/database';
import { createError } from '../middleware/error-handler';

class CategoryService {
  async getCategories() {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  async createCategory(data: any) {
    const { name, slug, description, parentId } = data;

    // Check if category with same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name },
          { slug },
        ],
      },
    });

    if (existingCategory) {
      throw createError('Category with this name or slug already exists', 409);
    }

    // Check if parent category exists (if provided)
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw createError('Parent category not found', 404);
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return category;
  }

  async updateCategory(id: string, updateData: any) {
    const { name, slug, description, parentId } = updateData;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw createError('Category not found', 404);
    }

    // Check if another category with same name or slug already exists
    if (name || slug) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(name ? [{ name }] : []),
                ...(slug ? [{ slug }] : []),
              ],
            },
          ],
        },
      });

      if (duplicateCategory) {
        throw createError('Category with this name or slug already exists', 409);
      }
    }

    // Check if parent category exists (if provided)
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw createError('Parent category not found', 404);
      }

      // Prevent circular reference
      if (parentId === id) {
        throw createError('Category cannot be its own parent', 400);
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return category;
  }

  async deleteCategory(id: string) {
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      throw createError('Category not found', 404);
    }

    // Check if category has children
    if (category.children.length > 0) {
      throw createError('Cannot delete category with subcategories', 400);
    }

    // Check if category is being used by products
    const productsCount = await prisma.product.count({
      where: { category: category.name },
    });

    if (productsCount > 0) {
      throw createError('Cannot delete category that is being used by products', 400);
    }

    await prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryService = new CategoryService();





