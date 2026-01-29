import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Product } from '@/lib/models/Product';

// Public: List products with search, filters, pagination
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    
    // New filter parameters
    const brand = searchParams.get('brand');
    const partType = searchParams.get('partType');
    const condition = searchParams.get('condition');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '0');
    const search = searchParams.get('search');
    
    // Legacy support
    const category = searchParams.get('category');

    const query: any = { status: 'approved' };
    
    // Apply new filters
    if (brand) query.brand = brand;
    if (partType) query.partType = partType;
    if (condition) query.condition = condition;
    if (minPrice) query.price = { ...query.price, $gte: minPrice };
    if (maxPrice) query.price = { ...query.price, $lte: maxPrice };
    if (search) query.name = { $regex: search, $options: 'i' };
    
    // Legacy category support
    if (category) query.category = category;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { products: [], total: 0, page: 1, pages: 0, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
