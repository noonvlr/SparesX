import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { verifyJwt } from '@/lib/auth/jwt';

// Admin: Block technician
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  const user = await User.findOneAndUpdate({ _id: id, role: 'technician' }, { isBlocked: true }, { new: true });
  if (!user) {
    return NextResponse.json({ message: 'Technician not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Technician blocked' }, { status: 200 });
}
