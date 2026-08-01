import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { verifyJwt } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
  await connectDB();
  const user = await User.findById(payload.id).select('-password');
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  // Lazily compute badge snapshot for accounts that predate the badge system
  if (
    (!user.activeBadgeKeys || user.activeBadgeKeys.length === 0) &&
    (user.phoneVerified || user.emailVerified || user.isTrusted || user.role === 'admin')
  ) {
    const { recomputeUserBadges } = await import('@/lib/badges/engine');
    await recomputeUserBadges(String(user._id));
    const refreshed = await User.findById(payload.id).select('-password');
    if (refreshed) {
      const { pickTrustFields } = await import('@/lib/trust');
      return NextResponse.json(
        { user: { ...refreshed.toObject(), ...pickTrustFields(refreshed) } },
        { status: 200 },
      );
    }
  }

  const { pickTrustFields } = await import('@/lib/trust');
  return NextResponse.json(
    { user: { ...user.toObject(), ...pickTrustFields(user) } },
    { status: 200 },
  );
}
