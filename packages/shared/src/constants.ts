export const PRODUCT_CONDITIONS = ['new', 'used', 'refurbished'] as const;

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export const USER_ROLES = ['buyer', 'seller', 'admin'] as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  maxLimit: 100,
} as const;

export const FILE_UPLOAD = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 10,
} as const;

export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
  },
} as const;

export const CLOUDINARY_CONFIG = {
  folder: 'sparesx',
  transformation: {
    quality: 'auto',
    format: 'auto',
  },
} as const;





