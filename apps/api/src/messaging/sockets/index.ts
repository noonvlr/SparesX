import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { logMessagingEvent } from '../logger';
import { AuthenticatedHandshake, SocketAuthError, extractToken, verifyToken } from './auth';

interface InitMessagingOptions {
  server: http.Server;
  redisUrl?: string;
  corsOrigin?: string | string[];
  jwtSecret?: string;
}

export interface MessagingSocketData {
  userId: string;
  email?: string;
}

export function initMessagingSockets({
  server,
  redisUrl = process.env.REDIS_URL,
  corsOrigin = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS || '*',
  jwtSecret = process.env.JWT_SECRET,
}: InitMessagingOptions): Server {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required to initialise messaging sockets');
  }

  const io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  if (redisUrl) {
    const pubClient = new Redis(redisUrl, { lazyConnect: true });
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.use((socket, next) => {
    try {
      const handshake = socket.handshake as AuthenticatedHandshake;
      const token = extractToken(handshake);
      if (!token) {
        throw new SocketAuthError('Missing authentication token');
      }
      const payload = verifyToken(token, jwtSecret);
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      logMessagingEvent('socket.authenticated', { userId: payload.userId });
      next();
    } catch (error) {
      const message = error instanceof SocketAuthError ? error.message : 'Authentication failed';
      logMessagingEvent('socket.authentication_error', { message });
      next(new Error(message));
    }
  });

  io.on('connection', (socket) => {
    logMessagingEvent('socket.connected', { userId: socket.data.userId });

    socket.on('join:chat', ({ chatId }: { chatId?: string }) => {
      if (!chatId) {
        socket.emit('error', { message: 'chatId is required' });
        return;
      }

      socket.join(chatId);
      socket.emit('joined:chat', { chatId });
      logMessagingEvent('socket.joined_chat', { userId: socket.data.userId, chatId });
    });

    socket.on('message:send', (payload: { chatId?: string; localId?: string; type?: string; text?: string }) => {
      if (!payload?.chatId) {
        socket.emit('error', { message: 'chatId is required' });
        return;
      }

      const message = {
        chatId: payload.chatId,
        localId: payload.localId || `local-${Date.now()}`,
        type: payload.type || 'text',
        text: payload.text,
        senderId: socket.data.userId,
        status: 'sent' as const,
        createdAt: new Date().toISOString(),
      };

      io.to(payload.chatId).emit('message:receive', message);
      logMessagingEvent('socket.message_sent', { userId: socket.data.userId, chatId: payload.chatId });
    });
  });

  return io;
}
