import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Product } from '@/lib/models/Product';
import { User } from '@/lib/models/User';
import { verifyJwt } from '@/lib/auth/jwt';

// List own products (GET), Create product (POST)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'technician') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();
  const products = await Product.find({ technician: payload.id });
  return NextResponse.json({ products }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'technician') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  
  const { name, description, price, deviceCategory, brand, deviceModel, modelNumber, partType, condition, images, priceNegotiable } = await req.json();
  
  // Validate required fields (name can be derived from model + partType)
  if (!description || !price || !deviceCategory || !brand || !deviceModel || !partType || !condition) {
    return NextResponse.json({ 
      message: 'All fields are required (description, price, deviceCategory, brand, deviceModel, partType, condition)' 
    }, { status: 400 });
  }
  
  await connectDB();

  const technician = await User.findById(payload.id).select('phoneVerified role');
  if (!technician) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (!technician.phoneVerified) {
    return NextResponse.json(
      {
        code: 'PHONE_UNVERIFIED',
        message: 'Verify your phone number before posting a listing',
      },
      { status: 403 },
    );
  }

  const { formatListingTitle } = await import('@/lib/products/listingTitle');
  const listingName =
    (typeof name === 'string' && name.trim()) ||
    formatListingTitle({ deviceModel, partType, name });
  
  // Generate slug for SEO
  const slug = `${deviceCategory}-${brand}-${deviceModel}-${partType}-${Date.now()}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  const product = await Product.create({
    name: listingName,
    description,
    price,
    deviceCategory,
    brand,
    deviceModel,
    modelNumber: modelNumber || '',
    partType,
    condition,
    priceNegotiable: !!priceNegotiable,
    images: images || [],
    technician: payload.id,
    slug,
  });
  
  return NextResponse.json({ product }, { status: 201 });
}
