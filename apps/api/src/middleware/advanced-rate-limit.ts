import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { getRateLimitConfig, rateLimitMessages } from '../config/rate-limit';

// Advanced rate limiting for production scale
export const createAdvancedRateLimit = (options: {
  windowMs: number;
  maxPerIP: number;
  maxPerUser?: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.maxPerIP,
    message: {
      success: false,
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip),
    // Custom handler for better error messages
    handler: (req: Request, res: Response) => {
      const retryAfter = Math.ceil(options.windowMs / 1000);
      res.status(429).json({
        success: false,
        error: options.message,
        retryAfter,
        timestamp: new Date().toISOString()
      });
    },
    // Skip rate limiting in development
    skip: (req: Request) => {
      return process.env.NODE_ENV === 'development';
    }
  });
};

// Environment-aware rate limiters
export const productionRateLimiters = (() => {
  const config = getRateLimitConfig();
  
  return {
    // General API requests
    general: createAdvancedRateLimit({
      windowMs: config.general.windowMs,
      maxPerIP: config.general.max,
      message: rateLimitMessages.general,
    }),

    // Authentication attempts
    auth: createAdvancedRateLimit({
      windowMs: config.auth.windowMs,
      maxPerIP: config.auth.max,
      message: rateLimitMessages.auth,
      skipSuccessfulRequests: true,
    }),

    // Signup attempts
    signup: createAdvancedRateLimit({
      windowMs: config.signup.windowMs,
      maxPerIP: config.signup.max,
      message: rateLimitMessages.signup,
      skipSuccessfulRequests: true,
    }),

    // Login attempts
    login: createAdvancedRateLimit({
      windowMs: config.login.windowMs,
      maxPerIP: config.login.max,
      message: rateLimitMessages.login,
      skipSuccessfulRequests: true,
    }),

    // Message sending
    messaging: createAdvancedRateLimit({
      windowMs: config.messaging.windowMs,
      maxPerIP: config.messaging.max,
      message: rateLimitMessages.messaging,
      skipSuccessfulRequests: true,
    }),

    // File uploads
    uploads: createAdvancedRateLimit({
      windowMs: config.uploads.windowMs,
      maxPerIP: config.uploads.max,
      message: rateLimitMessages.uploads,
    }),

    // Password reset
    passwordReset: createAdvancedRateLimit({
      windowMs: config.passwordReset.windowMs,
      maxPerIP: config.passwordReset.max,
      message: rateLimitMessages.passwordReset,
    }),
  };
})();

// User-based rate limiting (for authenticated users)
export const createUserBasedRateLimit = (options: {
  windowMs: number;
  maxPerUser: number;
  message: string;
}) => {
  return createAdvancedRateLimit({
    ...options,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : req.ip;
    },
    maxPerIP: options.maxPerUser,
  });
};
