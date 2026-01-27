import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { verifyJwt } from '@/lib/auth/jwt';

// Get technician profile
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'technician') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();
  const user = await User.findById(payload.id).select('-password');
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ user }, { status: 200 });
}

// Update technician profile
export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'technician') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { name, email } = await req.json();
  await connectDB();
  const user = await User.findById(payload.id);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (name) user.name = name;
  if (email) user.email = email;
  await user.save();
  return NextResponse.json({ message: 'Profile updated', user: { name: user.name, email: user.email } }, { status: 200 });
}
