import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Product } from '@/lib/models/Product';
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
  
  const { name, description, price, deviceCategory, brand, deviceModel, modelNumber, partType, condition, images } = await req.json();
  
  // Validate required fields
  if (!name || !description || !price || !deviceCategory || !brand || !deviceModel || !partType || !condition) {
    return NextResponse.json({ 
      message: 'All fields are required (name, description, price, deviceCategory, brand, deviceModel, partType, condition)' 
    }, { status: 400 });
  }
  
  await connectDB();
  
  // Generate slug for SEO
  const slug = `${deviceCategory}-${brand}-${deviceModel}-${partType}-${Date.now()}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  const product = await Product.create({
    name,
    description,
    price,
    deviceCategory,
    brand,
    deviceModel,
    modelNumber: modelNumber || '',
    partType,
    condition,
    images: images || [],
    technician: payload.id,
    slug,
  });
  
  return NextResponse.json({ product }, { status: 201 });
}
