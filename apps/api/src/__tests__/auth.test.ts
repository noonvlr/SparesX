import { authService } from '../services/auth';
import { prisma } from '../utils/database';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedBcrypt.compare as unknown as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    mockedBcrypt.compare.mockReset();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '9876543210',
        role: 'BUYER' as const,
      };

      const mockUser = {
        id: 'user-id',
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: null,
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.signup(userData);

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '9876543210',
        role: 'BUYER' as const,
      };

      const existingUser = {
        id: 'existing-user-id',
        email: userData.email,
        name: 'Existing User',
        role: 'BUYER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.signup(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        id: 'user-id',
        email,
        name: 'Test User',
        role: 'BUYER',
        avatar: null,
        password: 'hashed-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login(email, password);

      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should throw error for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email,
        name: 'Test User',
        role: 'BUYER',
        avatar: null,
        password: 'hashed-password',
      });
      (mockedBcrypt.compare as unknown as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(email, password)).rejects.toThrow(
        'Incorrect password. Please try again or reset your password.'
      );
    });
  });
});





