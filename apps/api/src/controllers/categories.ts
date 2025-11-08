import { Request, Response } from 'express';
import { categoryService } from '../services/categories';
import { asyncHandler } from '../middleware/error-handler';

class CategoryController {
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  });

  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  });

  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const category = await categoryService.updateCategory(id, req.body);

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  });

  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    await categoryService.deleteCategory(id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  });
}

export const categoryController = new CategoryController();





