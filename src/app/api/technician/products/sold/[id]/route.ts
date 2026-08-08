import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product, type SoldVia } from "@/lib/models/Product";
import { verifyJwt } from "@/lib/auth/jwt";

const SOLD_VIA: SoldVia[] = ["sparesx", "other"];

/**
 * Owner marks an approved listing as sold.
 * Body: { soldVia: "sparesx" | "other" }
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
  let body: { soldVia?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const soldVia = body.soldVia as SoldVia | undefined;
  if (!soldVia || !SOLD_VIA.includes(soldVia)) {
    return NextResponse.json(
      {
        message:
          'soldVia is required and must be "sparesx" (sold on SparesX) or "other".',
      },
      { status: 400 },
    );
  }

  await connectDB();

  const product = await Product.findOne({ _id: id, technician: payload.id });
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  if (product.status === "sold") {
    return NextResponse.json(
      {
        message: "Product is already marked as sold",
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

  if (product.status !== "approved") {
    return NextResponse.json(
      { message: "Only approved listings can be marked as sold" },
      { status: 400 },
    );
  }

  product.status = "sold";
  product.soldVia = soldVia;
  product.soldAt = new Date();
  product.featured = false;
  await product.save();

  return NextResponse.json(
    {
      message: "Product marked as sold",
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
