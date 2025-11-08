import { Router } from 'express';
import { notificationController } from '../controllers/notifications';
import { notificationService } from '../services/notifications';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

const createNotificationValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('message').trim().isLength({ min: 1, max: 1000 }),
  body('type').isIn(['info', 'success', 'warning', 'error']),
  body('userId').isMongoId(),
];

const markAsReadValidation = [
  param('id').isMongoId(),
];

// Get user's notifications
router.get('/', authenticateToken, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', authenticateToken, markAsReadValidation, validateRequest, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', authenticateToken, markAsReadValidation, validateRequest, notificationController.deleteNotification);

// Create notification (admin only)
router.post('/', authenticateToken, requireAdmin, createNotificationValidation, validateRequest, notificationController.createNotification);

// Test endpoint to create notification for current user (for testing)
router.post('/test', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const notification = await notificationService.createNotification({
      title: 'Test Notification',
      message: 'This is a test notification created at ' + new Date().toISOString(),
      type: 'info',
      userId,
    });
    
    res.json({
      success: true,
      data: notification,
      message: 'Test notification created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as notificationRoutes };
