import { Request, Response } from 'express';
import { notificationService } from '../services/notifications';
import { asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/database';

class NotificationController {
  getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationService.getUserNotifications(req.user!.id, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    await notificationService.markAsRead(id, req.user!.id);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  });

  markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    await notificationService.markAllAsRead(req.user!.id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  });

  getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);

    res.json({
      success: true,
      data: { count },
    });
  });

  createNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, message, type, userId } = req.body;
    
    const notification = await notificationService.createNotification({
      title,
      message,
      type,
      userId,
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully',
    });
  });

  deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  });
}

export const notificationController = new NotificationController();