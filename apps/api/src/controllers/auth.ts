import { Request, Response } from 'express';
import { authService } from '../services/auth';
import { asyncHandler } from '../middleware/error-handler';

class AuthController {
  signup = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, phone, role } = req.body;
    
    const result = await authService.signup({
      email,
      password,
      name,
      phone,
      role: role || 'BUYER',
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'User created successfully',
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }
    
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    await authService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  });
}

export const authController = new AuthController();





