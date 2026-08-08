import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { verifyJwt } from "@/lib/auth/jwt";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { name, description, price, category, condition, images } =
    await req.json();
  await connectDB();
  const product = await Product.findOne({ _id: id, technician: payload.id });
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
  product.images = images || product.images;
  await product.save();

  const majorChanged =
    product.status === "approved" &&
    (prev.name !== product.name ||
      prev.description !== product.description ||
      prev.price !== product.price ||
      prev.category !== product.category ||
      prev.condition !== product.condition);

  if (majorChanged) {
    const { notifySavedSearchesForProduct } = await import(
      "@/lib/saved-searches/match"
    );
    void notifySavedSearchesForProduct(product.toObject());
  }

  return NextResponse.json({ product }, { status: 200 });
}
