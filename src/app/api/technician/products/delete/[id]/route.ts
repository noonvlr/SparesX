import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { deleteStoredProductImages } from "@/lib/images/deleteProductImages";

/**
 * Owner removes a listing.
 * Approved live listings are treated as sold (soldVia "other") so marketplace
 * sold/fulfilled stats stay accurate — same outcome as removing stock that moved.
 * Pending / rejected / already-sold rows are hard-deleted.
 */
export async function DELETE(
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

  if (product.status === "approved") {
    product.status = "sold";
    product.soldVia = "other";
    product.soldAt = new Date();
    product.featured = false;
    await product.save();

    try {
      const { trackMarketplaceEvent } = await import("@/lib/analytics/events");
      void trackMarketplaceEvent({
        type: "listing_sold",
        productId: String(product._id),
        brand: product.brand || undefined,
        partType: product.partType || undefined,
        deviceModel: product.deviceModel || undefined,
        city: undefined,
        meta: { soldVia: "other", via: "delete" },
      });
    } catch {
      // analytics optional
    }

    try {
      const { Conversation } = await import("@/lib/models/Conversation");
      const { createNotification } = await import("@/lib/notifications/create");
      const { formatListingTitle } = await import("@/lib/products/listingTitle");
      const { productPath } = await import("@/lib/seo/site");

      const conversations = await Conversation.find({ productId: product._id })
        .select("participants")
        .lean();
      const sellerId = String(auth.id);
      const buyerIds = new Set<string>();
      for (const c of conversations) {
        for (const p of c.participants || []) {
          const pid = String(p);
          if (pid && pid !== sellerId) buyerIds.add(pid);
        }
      }

      const title = formatListingTitle(product);
      const href = productPath(product);
      await Promise.all(
        [...buyerIds].slice(0, 40).map((buyerId) =>
          createNotification({
            userId: buyerId,
            type: "listing_sold",
            title: "Listing no longer available",
            body: `${title} was removed by the seller.`,
            href,
            meta: { productId: String(product._id), via: "delete" },
          }),
        ),
      );
    } catch (err) {
      console.warn("[delete→sold] buyer notify failed:", err);
    }

    return NextResponse.json(
      {
        message: "Listing removed and counted as sold",
        treatedAsSold: true,
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

  const images = product.images;
  await product.deleteOne();
  // Await so Blob/local files are removed before the client refreshes.
  const cleanup = await deleteStoredProductImages(images);
  return NextResponse.json(
    {
      message: "Product deleted",
      treatedAsSold: false,
      imagesRemoved: cleanup.deleted,
    },
    { status: 200 },
  );
}
