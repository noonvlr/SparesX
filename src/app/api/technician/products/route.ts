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
  const { name, description, price, category, condition, images } = await req.json();
  if (!name || !description || !price || !category || !condition) {
    return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
  }
  await connectDB();
  const product = await Product.create({
    name,
    description,
    price,
    category,
    condition,
    images: images || [],
    technician: payload.id,
  });
  return NextResponse.json({ product }, { status: 201 });
}
