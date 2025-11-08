import { Router } from 'express';
import { categoryController } from '../controllers/categories';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

const createCategoryValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('slug').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('parentId').optional().isMongoId(),
];

const updateCategoryValidation = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('slug').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('parentId').optional().isMongoId(),
];

router.get('/', categoryController.getCategories);
router.post('/', authenticateToken, requireAdmin, createCategoryValidation, validateRequest, categoryController.createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategoryValidation, validateRequest, categoryController.updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, categoryController.deleteCategory);

export { router as categoryRoutes };





