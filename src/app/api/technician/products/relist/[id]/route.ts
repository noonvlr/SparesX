import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";

/**
 * Owner relists a sold product — back to approved and public browse.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();

  const product = await Product.findOne({ _id: id, technician: auth.id });
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  if (product.status !== "sold") {
    return NextResponse.json(
      { message: "Only sold listings can be relisted" },
      { status: 400 },
    );
  }

  const { getOrCreateSiteSettings } = await import(
    "@/lib/models/SiteSettings"
  );
  const settings = await getOrCreateSiteSettings();
  product.status = settings.requireListingApproval ? "pending" : "approved";
  product.soldVia = null;
  product.soldAt = null;
  await product.save();

  if (product.status === "approved") {
    const { notifySavedSearchesForProduct } = await import(
      "@/lib/saved-searches/match"
    );
    void notifySavedSearchesForProduct(product.toObject());
  }

  return NextResponse.json(
    {
      message:
        product.status === "pending"
          ? "Product submitted for re-approval"
          : "Product relisted",
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
