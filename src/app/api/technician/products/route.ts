import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { Product } from '@/lib/models/Product';
import { User } from '@/lib/models/User';
import { isAuthError, requireUser } from '@/lib/auth/requireUser';

// List own products (GET), Create product (POST)
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== 'technician') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();
  const products = await Product.find({ technician: auth.id });
  return NextResponse.json({ products }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== 'technician') {
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

  const technician = await User.findById(auth.id).select('phoneVerified role');
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
  
  // Readable SEO slug: brand-model-parttype-condition (suffixed only on clash)
  const { generateUniqueProductSlug } = await import(
    '@/lib/products/productSlug'
  );
  const slug = await generateUniqueProductSlug({
    brand,
    deviceModel,
    partType,
    condition,
  });

  const { getOrCreateSiteSettings } = await import(
    '@/lib/models/SiteSettings'
  );
  const settings = await getOrCreateSiteSettings();
  const status = settings.requireListingApproval ? 'pending' : 'approved';

  const { resolveCatalogRefs } = await import('@/lib/catalog/resolveRefs');
  const catalogRefs = await resolveCatalogRefs({
    deviceCategory,
    brand,
    partType,
  });

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
    technician: auth.id,
    slug,
    status,
    deviceTypeId: catalogRefs.deviceTypeId || null,
    brandId: catalogRefs.brandId || null,
    partCategoryId: catalogRefs.partCategoryId || null,
  });

  if (status === 'approved') {
    const { notifySavedSearchesForProduct } = await import(
      '@/lib/saved-searches/match'
    );
    void notifySavedSearchesForProduct(product.toObject());
  }
  
  return NextResponse.json({ product }, { status: 201 });
}
