import { Router } from 'express';
import { orderController } from '../controllers/orders';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

const createOrderValidation = [
  body('productId').isMongoId(),
  body('shippingAddress').trim().isLength({ min: 1, max: 500 }),
  body('notes').optional().trim().isLength({ max: 500 }),
];

router.get('/', authenticateToken, orderController.getOrders);
router.post('/', authenticateToken, createOrderValidation, validateRequest, orderController.createOrder);
router.get('/:id', authenticateToken, orderController.getOrder);
router.put('/:id/status', authenticateToken, orderController.updateOrderStatus);

// Admin-only routes
router.get('/admin/all', authenticateToken, requireAdmin, orderController.getAllOrders);
router.put('/admin/:id/status', authenticateToken, requireAdmin, orderController.adminUpdateOrderStatus);
router.get('/admin/stats', authenticateToken, requireAdmin, orderController.getOrderStats);

export { router as orderRoutes };





