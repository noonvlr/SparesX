import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  role: z.enum(['buyer', 'seller', 'admin']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['buyer', 'seller']).default('buyer'),
});

export const productSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  condition: z.enum(['new', 'used', 'refurbished']),
  category: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  location: z.string().min(1),
  sellerId: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().positive().max(1000000),
  condition: z.enum(['new', 'used', 'refurbished']),
  category: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  location: z.string().min(1).max(100),
  images: z.array(z.string().url()).min(1).max(10),
});

export const updateProductSchema = createProductSchema.partial();

export const messageSchema = z.object({
  id: z.string(),
  content: z.string().min(1).max(1000),
  senderId: z.string(),
  receiverId: z.string(),
  productId: z.string().optional(),
  createdAt: z.date(),
  readAt: z.date().optional(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  receiverId: z.string(),
  productId: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.string(),
  productId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  totalAmount: z.number().positive(),
  shippingAddress: z.string().min(1),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createOrderSchema = z.object({
  productId: z.string(),
  shippingAddress: z.string().min(1).max(500),
  notes: z.string().max(500).optional(),
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const productFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  condition: z.enum(['new', 'used', 'refurbished']).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  location: z.string().optional(),
  brand: z.string().optional(),
  ...paginationSchema.shape,
});

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['buyer', 'seller']).default('buyer'),
});





