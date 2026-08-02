import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";
import { SavedItem, MAX_SAVED_ITEMS } from "@/lib/models/SavedItem";
import { Product } from "@/lib/models/Product";

const PRODUCT_SELECT =
  "name price images brand partType category deviceCategory condition priceNegotiable status slug createdAt";

export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get("count") === "1";

    if (countOnly) {
      const total = await SavedItem.countDocuments({ userId: auth.id });
      return NextResponse.json({ total }, { status: 200 });
    }

    const rows = await SavedItem.find({ userId: auth.id })
      .sort({ createdAt: -1 })
      .lean();

    const productIds = rows.map((r) => r.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } })
      .select(PRODUCT_SELECT)
      .lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const items = rows.map((row) => {
      const productId = String(row.productId);
      const product = byId.get(productId);
      if (!product) {
        return {
          _id: String(row._id),
          productId,
          savedAt: row.createdAt,
          available: false,
          product: null,
        };
      }
      return {
        _id: String(row._id),
        productId,
        savedAt: row.createdAt,
        available: product.status === "approved",
        product: {
          _id: productId,
          name: product.name,
          price: product.price,
          images: product.images || [],
          brand: product.brand,
          partType: product.partType,
          category: product.category,
          deviceCategory: product.deviceCategory,
          condition: product.condition,
          priceNegotiable: product.priceNegotiable,
          status: product.status,
          slug: product.slug,
        },
      };
    });

    return NextResponse.json(
      { items, total: items.length },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const body = await req.json();
    const productId = String(body?.productId || "").trim();

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Valid productId is required" },
        { status: 400 },
      );
    }

    const product = await Product.findById(productId).select("status");
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }
    if (product.status !== "approved") {
      return NextResponse.json(
        { message: "Only approved listings can be saved" },
        { status: 400 },
      );
    }

    const existing = await SavedItem.findOne({
      userId: auth.id,
      productId,
    }).lean();

    if (existing) {
      return NextResponse.json(
        { message: "Already saved", saved: true, itemId: String(existing._id) },
        { status: 200 },
      );
    }

    const count = await SavedItem.countDocuments({ userId: auth.id });
    if (count >= MAX_SAVED_ITEMS) {
      return NextResponse.json(
        {
          message: `You can save up to ${MAX_SAVED_ITEMS} items. Remove some to add more.`,
        },
        { status: 400 },
      );
    }

    const item = await SavedItem.create({
      userId: auth.id,
      productId,
    });

    return NextResponse.json(
      {
        message: "Saved for later",
        saved: true,
        itemId: String(item._id),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    // Race on unique index
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { message: "Already saved", saved: true },
        { status: 200 },
      );
    }
    return errorResponse(error);
  }
}
