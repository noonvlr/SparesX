import { Handshake } from 'socket.io/dist/socket';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface MessagingAuthPayload {
  userId: string;
  email?: string;
}

export interface AuthenticatedHandshake extends Handshake {
  auth: Handshake['auth'] & { token?: string };
}

export class SocketAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SocketAuthError';
  }
}

export function extractToken(handshake: AuthenticatedHandshake): string | undefined {
  if (handshake.auth && typeof handshake.auth.token === 'string') {
    return handshake.auth.token;
  }

  const header = handshake.headers?.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.substring('Bearer '.length);
  }

  return undefined;
}

export function verifyToken(token: string, secret: string): MessagingAuthPayload {
  const decoded = jwt.verify(token, secret) as JwtPayload & { userId?: string; id?: string; sub?: string };
  const userId = decoded.userId || decoded.id || (typeof decoded.sub === 'string' ? decoded.sub : undefined);

  if (!userId) {
    throw new SocketAuthError('Token missing user identifier');
  }

  return {
    userId,
    email: typeof decoded.email === 'string' ? decoded.email : undefined,
  };
}
