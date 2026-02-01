import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import Category from '@/lib/models/Category';

// DEPRECATED: Use /api/categories instead
// This endpoint is kept for backward compatibility but now uses the unified Category collection
export async function GET() {
  try {
    await connectDB();

    // Fetch from unified categories collection
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('name icon slug')
      .lean();

    // Format to match legacy partTypes structure for backward compatibility
    const formattedPartTypes = categories.map((cat) => ({
      value: cat.slug,
      label: cat.name,
      icon: cat.icon,
    }));

    return NextResponse.json(
      { partTypes: formattedPartTypes },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch part types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch part types' },
      { status: 500 }
    );
  }
}
