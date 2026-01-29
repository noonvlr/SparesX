import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Product } from '@/lib/models/Product';
import { verifyJwt } from '@/lib/auth/jwt';

// Get product detail - public for approved, authenticated users can see their own
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await connectDB();
    
    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    console.log(`[API] Fetching product with ID: ${id}`);
    
    // Get authorization header for owner check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let userId: string | null = null;
    
    if (token) {
      try {
        const decoded = verifyJwt(token);
        userId = decoded?.id || null;
        console.log(`[API] User authenticated: ${userId}`);
      } catch (e) {
        console.log(`[API] Token verification failed`);
        // Token invalid, continue as public user
      }
    }
    
    const product = await Product.findById(id);
    
    console.log(`[API] Product found:`, !!product);
    console.log(`[API] Product status:`, product?.status);
    console.log(`[API] Product technician:`, product?.technician);
    console.log(`[API] User ID:`, userId);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // If not approved and user is not the owner, deny access
    if (product.status !== 'approved' && product.technician?.toString() !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    console.log(`[API] Returning product`);
    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product', details: String(error) }, { status: 500 });
  }
}
