import { Router } from 'express';
import { productController } from '../controllers/products';
import { authenticateToken, requireSeller, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// Validation rules
const createProductValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1, max: 2000 }),
  body('price').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Price must be a valid number greater than or equal to 0');
    }
    return true;
  }),
  body('condition').isIn(['NEW', 'USED', 'REFURBISHED']),
  body('category').trim().isLength({ min: 1 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('model').optional().trim().isLength({ max: 100 }),
  body('year').optional().custom((value) => {
    if (value === undefined || value === null || value === '') {
      return true; // Optional field
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 1900 || num > new Date().getFullYear() + 1) {
      throw new Error('Year must be a valid integer between 1900 and ' + (new Date().getFullYear() + 1));
    }
    return true;
  }),
  body('location').trim().isLength({ min: 1, max: 100 }),
  body('quantity').custom((value) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) {
      throw new Error('Quantity must be a valid integer greater than or equal to 1');
    }
    return true;
  }),
  body('images').isArray({ min: 1, max: 10 }),
  body('images.*').custom((value) => {
    // Allow both URLs and data URLs (base64)
    const isUrl = /^https?:\/\/.+/.test(value);
    const isDataUrl = /^data:image\/[a-zA-Z]*;base64,/.test(value);
    
    if (!isUrl && !isDataUrl) {
      throw new Error('Each image must be a valid URL or data URL');
    }
    return true;
  }),
];

const updateProductValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }),
  body('price').optional().custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Price must be a valid number greater than or equal to 0');
    }
    return true;
  }),
  body('condition').optional().isIn(['NEW', 'USED', 'REFURBISHED']),
  body('category').optional().trim().isLength({ min: 1 }),
  body('brand').optional().trim().isLength({ max: 100 }),
  body('model').optional().trim().isLength({ max: 100 }),
  body('year').optional().custom((value) => {
    if (value === undefined || value === null || value === '') {
      return true; // Optional field
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 1900 || num > new Date().getFullYear() + 1) {
      throw new Error('Year must be a valid integer between 1900 and ' + (new Date().getFullYear() + 1));
    }
    return true;
  }),
  body('location').optional().trim().isLength({ min: 1, max: 100 }),
  body('quantity').optional().custom((value) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) {
      throw new Error('Quantity must be a valid integer greater than or equal to 1');
    }
    return true;
  }),
  body('images').optional().isArray({ min: 1, max: 10 }),
  body('images.*').optional().custom((value) => {
    // Allow both URLs and data URLs (base64)
    const isUrl = /^https?:\/\/.+/.test(value);
    const isDataUrl = /^data:image\/[a-zA-Z]*;base64,/.test(value);
    
    if (!isUrl && !isDataUrl) {
      throw new Error('Each image must be a valid URL or data URL');
    }
    return true;
  }),
  body('isActive').optional().isBoolean(),
];

const productFiltersValidation = [
  query('search').optional().trim().isLength({ max: 100 }),
  query('category').optional().trim().isLength({ max: 100 }),
  query('condition').optional().isIn(['NEW', 'USED', 'REFURBISHED']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('location').optional().trim().isLength({ max: 100 }),
  query('brand').optional().trim().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

// Routes
router.get('/', productFiltersValidation, validateRequest, productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/', authenticateToken, requireSeller, createProductValidation, validateRequest, productController.createProduct);
router.put('/:id', authenticateToken, requireSeller, updateProductValidation, validateRequest, productController.updateProduct);
router.delete('/:id', authenticateToken, requireSeller, productController.deleteProduct);

// Admin-only routes
router.get('/admin/all', authenticateToken, requireAdmin, productController.getAllProducts);
router.put('/admin/:id', authenticateToken, requireAdmin, updateProductValidation, validateRequest, productController.adminUpdateProduct);
router.delete('/admin/:id', authenticateToken, requireAdmin, productController.adminDeleteProduct);

export { router as productRoutes };





