import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from './jwt';

export function requireAuth(roles: string[] = []) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    if (roles.length && !roles.includes(payload.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    (req as any).user = payload;
    return null; // Continue to handler
  };
}
