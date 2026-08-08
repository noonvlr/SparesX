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
 * Bulk approve, reject, or clear duplicate flags.
 * Body: { ids: string[], action: "approve" | "reject" | "clear_duplicate" }
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const body = await req.json();
    const action = String(body?.action || "").trim();
    if (
      action !== "approve" &&
      action !== "reject" &&
      action !== "clear_duplicate"
    ) {
      return NextResponse.json(
        {
          message:
            'action must be "approve", "reject", or "clear_duplicate"',
        },
        { status: 400 },
      );
    }

    const rawIds: unknown[] = Array.isArray(body?.ids) ? body.ids : [];
    const validIds = rawIds
      .map((id) => String(id || "").trim())
      .filter(
        (id): id is string =>
          Boolean(id) && mongoose.Types.ObjectId.isValid(id),
      );
    const ids = [...new Set(validIds)].slice(0, MAX_BULK);

    if (ids.length === 0) {
      return NextResponse.json(
        { message: "Select at least one valid product id" },
        { status: 400 },
      );
    }

    await connectDB();

    if (action === "clear_duplicate") {
      const result = await Product.updateMany(
        { _id: { $in: ids } },
        { $pull: { tags: "possible_duplicate" } },
      );
      return NextResponse.json(
        {
          message: `Cleared duplicate flag on ${result.modifiedCount} listing(s)`,
          updated: result.modifiedCount,
          requested: ids.length,
        },
        { status: 200 },
      );
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";
    const products = await Product.find({ _id: { $in: ids } });
    const sellerIds = [
      ...new Set(
        products.map((p) => String(p.technician || "")).filter(Boolean),
      ),
    ];
    const { User } = await import("@/lib/models/User");
    const sellers = await User.find({ _id: { $in: sellerIds } })
      .select("name email")
      .lean();
    const sellerMap = new Map(sellers.map((s) => [String(s._id), s]));
    const { absoluteUrl } = await import("@/lib/seo/site");
    const { sendListingModerationEmail } = await import(
      "@/lib/services/emailService"
    );

    let updated = 0;
    for (const product of products) {
      const previousStatus = product.status;
      if (previousStatus === nextStatus) continue;

      product.status = nextStatus;
      product.soldVia = null;
      product.soldAt = null;
      if (action === "approve") {
        product.tags = (product.tags || []).filter(
          (t) => t !== "possible_duplicate",
        );
      }
      await product.save();
      updated += 1;

      const sellerId = String(product.technician || "");
      const title = formatListingTitle(product);
      const seller = sellerMap.get(sellerId);

      if (sellerId) {
        void createNotification({
          userId: sellerId,
          type:
            nextStatus === "approved" ? "listing_approved" : "listing_rejected",
          title:
            nextStatus === "approved"
              ? "Listing approved"
              : "Listing rejected",
          body: title,
          href: "/technician/products",
          meta: { productId: String(product._id) },
        });
      }

      if (seller?.email) {
        void sendListingModerationEmail({
          recipientEmail: seller.email,
          recipientName: seller.name || "Seller",
          listingTitle: title,
          status: nextStatus,
          href: absoluteUrl("/technician/products"),
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
