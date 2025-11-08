import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { createError } from '../middleware/error-handler';
import { cache } from '../utils/redis';

interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'BUYER' | 'SELLER' | 'DEALER';
  address?: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  country?: string;
}

interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async signup(data: SignupData) {
    const { email, password, name, phone, role, address, city, state, district, pincode, country } = data;

    // Validate phone number format
    if (!phone) {
      throw createError('Phone number is required', 400);
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw createError('Please enter a valid 10-digit Indian mobile number', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        role,
        password: hashedPassword,
        address,
        city,
        state,
        district,
        pincode,
        country,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    return {
      user,
      ...tokens,
    };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    // Validate input
    if (!email || !password) {
      throw createError('Email and password are required.', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw createError('No account found with this email address. Please check your email or sign up for a new account.', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError('Incorrect password. Please try again or reset your password.', 401);
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || undefined,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Check if refresh token exists in cache
      const cachedToken = await cache.get(`refresh_token:${decoded.userId}`);
      if (!cachedToken || cachedToken !== refreshToken) {
        throw createError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId);

      return tokens;
    } catch (error) {
      throw createError('Invalid refresh token', 401);
    }
  }

  async logout(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Remove refresh token from cache
      await cache.del(`refresh_token:${decoded.userId}`);
    } catch (error) {
      // Ignore errors during logout
    }
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Store refresh token in cache
    cache.set(`refresh_token:${userId}`, refreshToken, 7 * 24 * 60 * 60); // 7 days

    return {
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();




