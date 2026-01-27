import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { Product } from '@/lib/models/Product';
import { verifyJwt } from '@/lib/auth/jwt';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  try {
    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return NextResponse.json(
        { message: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Delete all products by this user
    await Product.deleteMany({ technicianId: id });

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: 'User and their products deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
