import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { CategoryBrand } from '@/lib/models/CategoryBrand';

// Get all brands for a specific category (with optional search)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    await connectDB();

    const { category: rawCategory } = await params;
    const category = rawCategory.toLowerCase() as 'mobile' | 'laptop' | 'desktop';
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const includeModels = searchParams.get('includeModels') !== 'false';

    // Validate category
    if (!['mobile', 'laptop', 'desktop'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const query: any = { category, isActive: true };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const brands = await CategoryBrand.find(query)
      .select(includeModels ? 'name slug logo models' : 'name slug logo')
      .sort({ name: 1 });

    return NextResponse.json({ brands }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
