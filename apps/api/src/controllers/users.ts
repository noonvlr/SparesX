import { Request, Response } from 'express';
import { userService } from '../services/users';
import { asyncHandler } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

class UserController {
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await userService.getUserById(req.user!.id);

    res.json({
      success: true,
      data: user,
    });
  });

  getFullProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('Getting full profile for user:', req.user!.id);
    
    try {
      const user = await userService.getCurrentUserProfile(req.user!.id);
      console.log('Profile retrieved successfully');
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Error in getFullProfile:', error);
      throw error;
    }
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updateData = req.body;
    
    const user = await userService.updateUser(req.user!.id, updateData);

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  });

  // Admin-only methods
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await userService.getAllUsers(page, limit, search);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await userService.deleteUser(id);

    res.json({
      success: true,
      message: result.message,
    });
  });

  updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    
    const user = await userService.updateUserRole(id, role);

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully',
    });
  });

  getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    console.log('Getting user profile for ID:', id);
    
    const user = await userService.getUserProfile(id);

    res.json({
      success: true,
      data: user,
    });
  });

  updateUserPassword = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    await userService.updateUserPassword(id, newPassword);

    res.json({
      success: true,
      message: 'User password updated successfully',
    });
  });

  getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const activity = await userService.getUserActivity(id, page, limit);

    res.json({
      success: true,
      data: activity.data,
      pagination: activity.pagination,
    });
  });

  getMyActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const activity = await userService.getCurrentUserActivity(req.user!.id, page, limit);

    res.json({
      success: true,
      data: activity.data,
      pagination: activity.pagination,
    });
  });

  getSellerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    
    // Get user profile with counts and recent products
    const userProfile = await userService.getCurrentUserProfile(userId);
    
    // Calculate dashboard stats
    const stats = {
      totalProducts: userProfile._count.products,
      activeProducts: userProfile.products.filter(p => p.isActive).length,
      totalRevenue: userProfile.ordersAsSeller.reduce((sum, order) => sum + order.totalAmount, 0),
    };

    res.json({
      success: true,
      data: {
        stats,
        recentProducts: userProfile.products,
        recentOrders: userProfile.ordersAsSeller,
      },
    });
  });
}

export const userController = new UserController();





