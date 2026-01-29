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

    // Get all products by this user before deleting
    const products = await Product.find({ technician: id });

    // Note: Images are stored as base64 data URLs in the database, not as files
    // They are automatically removed when products are deleted from the database

    // Delete all products by this user
    const deleteResult = await Product.deleteMany({ technician: id });

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: `User and ${deleteResult.deletedCount} product(s) deleted successfully`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
