import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { createNotification } from "@/lib/notifications/create";
import { formatListingTitle } from "@/lib/products/listingTitle";
import { notifySavedSearchesForProduct } from "@/lib/saved-searches/match";

const MAX_BULK = 50;

/**
 * Bulk approve or reject listings.
 * Body: { ids: string[], action: "approve" | "reject" }
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const body = await req.json();
    const action = body?.action === "reject" ? "reject" : body?.action;
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { message: 'action must be "approve" or "reject"' },
        { status: 400 },
      );
    }

    const rawIds: unknown[] = Array.isArray(body?.ids) ? body.ids : [];
    const validIds = rawIds
      .map((id) => String(id || "").trim())
      .filter((id): id is string => Boolean(id) && mongoose.Types.ObjectId.isValid(id));
    const ids = [...new Set(validIds)].slice(0, MAX_BULK);

    if (ids.length === 0) {
      return NextResponse.json(
        { message: "Select at least one valid product id" },
        { status: 400 },
      );
    }

    await connectDB();
    const nextStatus = action === "approve" ? "approved" : "rejected";
    const products = await Product.find({ _id: { $in: ids } });

    let updated = 0;
    for (const product of products) {
      const previousStatus = product.status;
      if (previousStatus === nextStatus) continue;

      product.status = nextStatus;
      product.soldVia = null;
      product.soldAt = null;
      await product.save();
      updated += 1;

      const sellerId = String(product.technician || "");
      const title = formatListingTitle(product);

      if (sellerId) {
        void createNotification({
          userId: sellerId,
          type: nextStatus === "approved" ? "listing_approved" : "listing_rejected",
          title:
            nextStatus === "approved" ? "Listing approved" : "Listing rejected",
          body: title,
          href: "/technician/products",
          meta: { productId: String(product._id) },
        });
      }

      if (previousStatus !== "approved" && nextStatus === "approved") {
        void notifySavedSearchesForProduct(product.toObject());
      }
    }

    return NextResponse.json(
      {
        message: `Updated ${updated} listing${updated === 1 ? "" : "s"}`,
        updated,
        requested: ids.length,
        status: nextStatus,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Bulk update failed" },
      { status: 500 },
    );
  }
}
