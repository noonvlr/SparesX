import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { Product } from '@/lib/models/Product';
import { verifyJwt } from '@/lib/auth/jwt';

// Admin: Basic analytics counts
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();
  const [userCount, technicianCount, productCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'technician' }),
    Product.countDocuments()
  ]);
  return NextResponse.json({ userCount, technicianCount, productCount }, { status: 200 });
}
