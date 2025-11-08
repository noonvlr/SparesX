// Rate limiting configuration based on environment
export const rateLimitConfig = {
  development: {
    // Very lenient for development
    general: { windowMs: 15 * 60 * 1000, max: 10000 },
    auth: { windowMs: 15 * 60 * 1000, max: 100 },
    signup: { windowMs: 15 * 60 * 1000, max: 50 },
    login: { windowMs: 15 * 60 * 1000, max: 50 },
    messaging: { windowMs: 5 * 60 * 1000, max: 200 },
    uploads: { windowMs: 15 * 60 * 1000, max: 100 },
    passwordReset: { windowMs: 60 * 60 * 1000, max: 10 },
  },
  production: {
    // Production-ready limits
    general: { windowMs: 15 * 60 * 1000, max: 2000 },
    auth: { windowMs: 15 * 60 * 1000, max: 20 },
    signup: { windowMs: 15 * 60 * 1000, max: 10 },
    login: { windowMs: 15 * 60 * 1000, max: 15 },
    messaging: { windowMs: 5 * 60 * 1000, max: 50 },
    uploads: { windowMs: 15 * 60 * 1000, max: 20 },
    passwordReset: { windowMs: 60 * 60 * 1000, max: 3 },
  },
  staging: {
    // Moderate limits for staging
    general: { windowMs: 15 * 60 * 1000, max: 5000 },
    auth: { windowMs: 15 * 60 * 1000, max: 50 },
    signup: { windowMs: 15 * 60 * 1000, max: 25 },
    login: { windowMs: 15 * 60 * 1000, max: 30 },
    messaging: { windowMs: 5 * 60 * 1000, max: 100 },
    uploads: { windowMs: 15 * 60 * 1000, max: 50 },
    passwordReset: { windowMs: 60 * 60 * 1000, max: 5 },
  }
};

export const getRateLimitConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return rateLimitConfig[env as keyof typeof rateLimitConfig] || rateLimitConfig.development;
};

// Messages for different rate limit scenarios
export const rateLimitMessages = {
  general: 'Too many requests from this IP. Please try again later.',
  auth: 'Too many authentication attempts. Please try again in 15 minutes.',
  signup: 'Too many signup attempts. Please try again in 15 minutes.',
  login: 'Too many login attempts. Please try again in 15 minutes.',
  messaging: 'Too many messages sent. Please slow down.',
  uploads: 'Too many file uploads. Please try again later.',
  passwordReset: 'Too many password reset attempts. Please try again in 1 hour.',
};


