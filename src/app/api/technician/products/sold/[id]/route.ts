import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product, type SoldVia } from "@/lib/models/Product";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";

const SOLD_VIA: SoldVia[] = ["sparesx", "other"];

/**
 * Owner marks an approved listing as sold.
 * Body: { soldVia: "sparesx" | "other" }
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

  const product = await Product.findOne({ _id: id, technician: auth.id });
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

  try {
    const { revalidateListingCaches } = await import(
      "@/lib/products/revalidateListings"
    );
    revalidateListingCaches(product);
  } catch {
    // cache optional
  }

  try {
    const { recordLifetimeSoldListing } = await import(
      "@/lib/analytics/lifetimeSold"
    );
    void recordLifetimeSoldListing(1);
  } catch {
    // counter optional
  }

  // Closed-loop trust: SparesX-attributed sales bump completedSales + badges.
  if (soldVia === "sparesx") {
    try {
      const { User } = await import("@/lib/models/User");
      await User.findByIdAndUpdate(auth.id, {
        $inc: { completedSales: 1 },
      });
      const { recomputeUserBadges } = await import("@/lib/badges/engine");
      void recomputeUserBadges(auth.id);
    } catch (err) {
      console.warn("[sold] completedSales bump failed:", err);
    }
  }

  try {
    const { trackMarketplaceEvent } = await import("@/lib/analytics/events");
    void trackMarketplaceEvent({
      type: "listing_sold",
      productId: String(product._id),
      brand: product.brand || undefined,
      partType: product.partType || undefined,
      deviceModel: product.deviceModel || undefined,
      city: undefined,
      meta: { soldVia },
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
          title: "Listing marked sold",
          body: `${title} is no longer available.`,
          href,
          meta: { productId: String(product._id) },
        }),
      ),
    );
  } catch (err) {
    console.warn("[sold] buyer notify failed:", err);
  }

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
