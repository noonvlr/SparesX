import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { productionRateLimiters } from './middleware/advanced-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { uploadRoutes } from './routes/uploads';
import { userRoutes } from './routes/users';
import { orderRoutes } from './routes/orders';
import { categoryRoutes } from './routes/categories';
import { notificationRoutes } from './routes/notifications';
import navigationRoutes from './routes/navigation';
import { pincodeRoutes } from './routes/pincode';
import { connectDatabase } from './utils/database';
import { connectRedis } from './utils/redis';
import { startQueueProcessor } from './services/queue';
import { chatRouter } from './messaging/routes/chat';
import { messagingUploadRouter } from './messaging/routes/upload';
import { initMessagingSockets } from './messaging/sockets';
import { connectMessagingDatabase, disconnectMessagingDatabase } from './messaging/mongoose';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Use production-ready rate limiters
const limiter = productionRateLimiters.general;
const authLimiter = productionRateLimiters.auth;
const signupLimiter = productionRateLimiters.signup;
const loginLimiter = productionRateLimiters.login;

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rate limit reset endpoint for development
if (process.env.NODE_ENV === 'development') {
  app.post('/api/v1/reset-rate-limit', (req, res) => {
    // Clear rate limit store
    limiter.resetKey(req.ip);
    res.json({
      success: true,
      message: 'Rate limit reset for IP: ' + req.ip,
    });
  });
}

// API routes with specific rate limiting
app.use('/api/v1/auth', authRoutes);

// Apply specific rate limiting to auth routes
app.use('/api/v1/auth/signup', signupLimiter);
app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/uploads', productionRateLimiters.uploads, uploadRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/navigation', navigationRoutes);
app.use('/api/v1/pincode', pincodeRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/upload-url', messagingUploadRouter);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected');

    // Connect to Redis
    await connectRedis();
    console.log('✅ Redis connected');

    // Connect to messaging database (Mongo)
    await connectMessagingDatabase();
    console.log('✅ Messaging database connected');

    // Initialise Socket.IO for messaging
    initMessagingSockets({ server });
    console.log('✅ Messaging sockets initialised');

    // Start queue processor
    startQueueProcessor();
    console.log('✅ Queue processor started');

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulExit(signal: string) {
  console.log(`${signal} received, shutting down gracefully`);
  await disconnectMessagingDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulExit('SIGTERM'));
process.on('SIGINT', () => gracefulExit('SIGINT'));

startServer();