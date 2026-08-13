import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { getOrCreateSiteSettings } from "@/lib/models/SiteSettings";
import { sanitizeListingImageUrls } from "@/lib/security/allowedImageUrl";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { name, description, price, category, condition, images } =
    await req.json();
  await connectDB();
  const product = await Product.findOne({ _id: id, technician: auth.id });
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  const prev = {
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    condition: product.condition,
  };

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.condition = condition || product.condition;
  if (images !== undefined) {
    product.images = sanitizeListingImageUrls(images);
  }

  const majorChanged =
    prev.name !== product.name ||
    prev.description !== product.description ||
    prev.price !== product.price ||
    prev.category !== product.category ||
    prev.condition !== product.condition;

  if (majorChanged && product.status === "approved") {
    const settings = await getOrCreateSiteSettings();
    if (settings.requireListingApproval) {
      product.status = "pending";
    }
  }

  await product.save();

  if (majorChanged && product.status === "approved") {
    const { notifySavedSearchesForProduct } = await import(
      "@/lib/saved-searches/match"
    );
    void notifySavedSearchesForProduct(product.toObject());
  }

  return NextResponse.json({ product }, { status: 200 });
}
