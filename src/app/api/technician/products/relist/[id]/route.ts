import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { verifyJwt } from "@/lib/auth/jwt";

/**
 * Owner relists a sold product — back to approved and public browse.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyJwt(authHeader.split(" ")[1]);
  if (!payload || payload.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();

  const product = await Product.findOne({ _id: id, technician: payload.id });
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  if (product.status !== "sold") {
    return NextResponse.json(
      { message: "Only sold listings can be relisted" },
      { status: 400 },
    );
  }

  product.status = "approved";
  product.soldVia = null;
  product.soldAt = null;
  await product.save();

  return NextResponse.json(
    {
      message: "Product relisted",
      product: {
        _id: String(product._id),
        status: product.status,
        soldVia: product.soldVia,
        soldAt: product.soldAt,
      },
    },
    { status: 200 },
  );
}
