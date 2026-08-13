import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { createTechnicianListing } from "@/lib/products/createListing";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const products = await Product.find({ technician: auth.id });
  return NextResponse.json({ products }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      deviceCategory,
      brand,
      deviceModel,
      modelNumber,
      partType,
      condition,
      images,
      priceNegotiable,
    } = body;

    const { checkRateLimitAsync, clientIpFromRequest } = await import(
      "@/lib/security/authRateLimit"
    );
    const ip = clientIpFromRequest(req);
    const rate = await checkRateLimitAsync({
      key: `listing-create:${auth.id}:${ip}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { message: "Too many listings created. Try again later." },
        { status: 429 },
      );
    }

    const result = await createTechnicianListing({
      technicianId: auth.id,
      input: {
        name,
        description,
        price: Number(price),
        deviceCategory,
        brand,
        deviceModel,
        modelNumber,
        partType,
        condition,
        images,
        priceNegotiable,
      },
    });

    return NextResponse.json(
      {
        product: result.product,
        possibleDuplicate: result.possibleDuplicate,
        message: result.possibleDuplicate
          ? "Listing created. Similar listing detected — review for duplicates."
          : undefined,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    const code = (err as { code?: string })?.code;
    if (status >= 500) {
      console.error("[listing-create]", err);
      return NextResponse.json(
        { message: "Failed to create listing" },
        { status: 500 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to create listing";
    return NextResponse.json(
      { message, ...(code ? { code } : {}) },
      { status },
    );
  }
}
