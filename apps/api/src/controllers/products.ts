import { Request, Response } from 'express';
import { productService } from '../services/products';
import { asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

class ProductController {
  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      search: req.query.search as string,
      category: req.query.category as string,
      condition: req.query.condition as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      location: req.query.location as string,
      brand: req.query.brand as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const result = await productService.getProducts(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const product = await productService.getProductById(id);

    res.json({
      success: true,
      data: product,
    });
  });

  createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('Received product data:', req.body);
    
    const productData = {
      ...req.body,
      sellerId: req.user!.id,
    };
    
    console.log('Processed product data:', productData);
    
    const product = await productService.createProduct(productData);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  });

  updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const product = await productService.updateProduct(id, updateData, req.user!.id);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  });

  deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    await productService.deleteProduct(id, req.user!.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  });

  // Admin-only methods
  getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      search: req.query.search as string,
      category: req.query.category as string,
      condition: req.query.condition as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      location: req.query.location as string,
      brand: req.query.brand as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const result = await productService.getAllProducts(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  adminUpdateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const product = await productService.adminUpdateProduct(id, updateData);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  });

  adminDeleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    await productService.adminDeleteProduct(id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  });
}

export const productController = new ProductController();





