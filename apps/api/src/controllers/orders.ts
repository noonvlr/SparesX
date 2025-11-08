import { Request, Response } from 'express';
import { orderService } from '../services/orders';
import { asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

class OrderController {
  getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orders = await orderService.getUserOrders(req.user!.id);

    res.json({
      success: true,
      data: orders,
    });
  });

  createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orderData = {
      ...req.body,
      buyerId: req.user!.id,
    };
    
    const order = await orderService.createOrder(orderData);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  });

  getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const order = await orderService.getOrderById(id, req.user!.id);

    res.json({
      success: true,
      data: order,
    });
  });

  updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await orderService.updateOrderStatus(id, status, req.user!.id);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
    });
  });

  // Admin-only methods
  getAllOrders = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = await orderService.getAllOrders(page, limit, status, search);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  adminUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await orderService.adminUpdateOrderStatus(id, status);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully',
    });
  });

  getOrderStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await orderService.getOrderStats();

    res.json({
      success: true,
      data: stats,
    });
  });
}

export const orderController = new OrderController();





