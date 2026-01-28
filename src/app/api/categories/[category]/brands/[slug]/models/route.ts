import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { CategoryBrand, IModel } from '@/lib/models/CategoryBrand';

// Get models for a specific brand in a category
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  try {
    await connectDB();

    const { category: rawCategory, slug: rawSlug } = await params;
    const category = rawCategory.toLowerCase() as 'mobile' | 'laptop' | 'desktop';
    const brandSlug = rawSlug.toLowerCase();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Validate category
    if (!['mobile', 'laptop', 'desktop'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const brand = await CategoryBrand.findOne({
      category,
      slug: brandSlug,
      isActive: true,
    }).select('name models');

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    let models = brand.models || [];

    if (search) {
      const searchLower = search.toLowerCase();
      models = models.filter(
        (m: IModel) =>
          m.name.toLowerCase().includes(searchLower) ||
          (m.modelNumber && m.modelNumber.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({ models }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
