import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { sanitizeListingImageUrls } from "@/lib/security/allowedImageUrl";

void User;

const EDITABLE = [
  "name",
  "description",
  "price",
  "deviceCategory",
  "brand",
  "deviceModel",
  "modelNumber",
  "partType",
  "condition",
  "priceNegotiable",
  "images",
  "status",
  "featured",
  "tags",
] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    await connectDB();
    const product = await Product.findById(id)
      .populate("technician", "name email mobile whatsappNumber")
      .lean();
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const previousStatus = product.status;

    for (const key of EDITABLE) {
      if (body[key] === undefined) continue;
      if (key === "price") {
        const n = Number(body.price);
        if (Number.isNaN(n) || n < 0) {
          return NextResponse.json({ message: "Invalid price" }, { status: 400 });
        }
        product.price = n;
      } else if (key === "status") {
        if (!["pending", "approved", "rejected"].includes(body.status)) {
          return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }
        product.status = body.status;
        // Approving / rejecting a previously sold listing must clear sold fields
        if (body.status === "approved" || body.status === "rejected") {
          product.soldVia = null;
          product.soldAt = null;
        }
      } else if (key === "condition") {
        if (!["new", "used", "refurbished"].includes(body.condition)) {
          return NextResponse.json(
            { message: "Invalid condition" },
            { status: 400 },
          );
        }
        product.condition = body.condition;
      } else if (key === "priceNegotiable" || key === "featured") {
        (product as any)[key] = Boolean(body[key]);
      } else if (key === "images") {
        product.images = sanitizeListingImageUrls(body.images);
      } else if (key === "tags") {
        (product as any)[key] = Array.isArray(body[key]) ? body[key] : product[key];
      } else {
        (product as any)[key] = body[key];
      }
    }

    await product.save();
    await product.populate("technician", "name email mobile");

    if (previousStatus !== "approved" && product.status === "approved") {
      const { notifySavedSearchesForProduct } = await import(
        "@/lib/saved-searches/match"
      );
      void notifySavedSearchesForProduct(product.toObject());
    }

    const sellerId = String(product.technician?._id || product.technician || "");
    if (
      sellerId &&
      previousStatus !== product.status &&
      (product.status === "approved" || product.status === "rejected")
    ) {
      const { createNotification } = await import(
        "@/lib/notifications/create"
      );
      const { formatListingTitle } = await import(
        "@/lib/products/listingTitle"
      );
      const { absoluteUrl } = await import("@/lib/seo/site");
      const { sendListingModerationEmail } = await import(
        "@/lib/services/emailService"
      );
      const title = formatListingTitle(product);
      const tech =
        product.technician && typeof product.technician === "object"
          ? (product.technician as { name?: string; email?: string })
          : null;
      if (product.status === "approved") {
        void createNotification({
          userId: sellerId,
          type: "listing_approved",
          title: "Listing approved",
          body: title,
          href: "/technician/products",
          meta: { productId: String(product._id) },
        });
      } else {
        void createNotification({
          userId: sellerId,
          type: "listing_rejected",
          title: "Listing rejected",
          body: title,
          href: "/technician/products",
          meta: { productId: String(product._id) },
        });
      }
      if (tech?.email) {
        void sendListingModerationEmail({
          recipientEmail: tech.email,
          recipientName: tech.name || "Seller",
          listingTitle: title,
          status: product.status,
          href: absoluteUrl("/technician/products"),
        });
      }
    }

    return NextResponse.json(
      { message: "Product updated", product },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    await connectDB();
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    const { deleteStoredProductImages } = await import(
      "@/lib/images/deleteProductImages"
    );
    await deleteStoredProductImages(product.images);
    return NextResponse.json(
      { message: "Product deleted" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to delete product" },
      { status: 500 },
    );
  }
}
