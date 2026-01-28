import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { MobileBrand } from '@/lib/models/MobileBrand';

// Get models for a specific brand
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');

    await connectDB();

    const brand = await MobileBrand.findOne({ slug, isActive: true });
    
    if (!brand) {
      return NextResponse.json(
        { message: 'Brand not found' },
        { status: 404 }
      );
    }

    let models = brand.models;

    // Filter models by search query
    if (search) {
      const searchLower = search.toLowerCase();
      models = models.filter(
        (model) =>
          model.name.toLowerCase().includes(searchLower) ||
          model.modelNumber.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ 
      brand: brand.name,
      slug: brand.slug,
      models 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { message: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
