import { Router } from 'express';
import { userController } from '../controllers/users';
import { authenticateToken, requireAdmin, requireSeller } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

// Validation rules
const updatePasswordValidation = [
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const userIdValidation = [
  param('id').isMongoId().withMessage('Invalid user ID format'),
];

// User routes
router.get('/profile', authenticateToken, userController.getProfile);
router.get('/profile/full', authenticateToken, userController.getFullProfile);
router.get('/activity', authenticateToken, userController.getMyActivity);
router.get('/dashboard', authenticateToken, requireSeller, userController.getSellerDashboard);
router.put('/profile', authenticateToken, userController.updateProfile);

// Admin-only routes
router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);
router.delete('/:id', authenticateToken, requireAdmin, userIdValidation, validateRequest, userController.deleteUser);
router.put('/:id/role', authenticateToken, requireAdmin, userIdValidation, validateRequest, userController.updateUserRole);
router.get('/:id/profile', authenticateToken, requireAdmin, userIdValidation, validateRequest, userController.getUserProfile);
router.put('/:id/password', authenticateToken, requireAdmin, userIdValidation, updatePasswordValidation, validateRequest, userController.updateUserPassword);
router.get('/:id/activity', authenticateToken, requireAdmin, userIdValidation, validateRequest, userController.getUserActivity);

export { router as userRoutes };





