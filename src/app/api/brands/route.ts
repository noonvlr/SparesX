import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { MobileBrand } from '@/lib/models/MobileBrand';

// Get all mobile brands (with optional search)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const includeModels = searchParams.get('includeModels') !== 'false';

    await connectDB();

    let query: any = { isActive: true };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const brands = await MobileBrand.find(query)
      .select(includeModels ? 'name slug models' : 'name slug')
      .sort({ name: 1 });

    return NextResponse.json({ brands }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
