import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { verifyJwt } from "@/lib/auth/jwt";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    await connectDB();

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    let userId: string | null = null;
    let isAuthenticated = false;

    if (token) {
      try {
        const decoded = verifyJwt(token);
        userId = decoded?.id || null;
        isAuthenticated = !!userId;
      } catch {
        // continue as public
      }
    }

    const product = await Product.findById(id).populate(
      "technician",
      "name city state whatsappNumber countryCode mobile profilePicture",
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const ownerId =
      typeof product.technician === "object" && product.technician
        ? String((product.technician as any)._id)
        : String(product.technician);

    const isOwner = !!userId && ownerId === userId;

    if (product.status !== "approved" && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const productObj: any = product.toObject();

    // Only expose seller contact details to logged-in users
    if (!isAuthenticated && productObj.technician) {
      productObj.technician = {
        _id: productObj.technician._id,
        name: productObj.technician.name,
        city: productObj.technician.city,
        state: productObj.technician.state,
      };
    }

    // Similar products: same brand / partType / deviceCategory, exclude self
    const similarQuery: Record<string, unknown> = {
      _id: { $ne: product._id },
      status: "approved",
      $or: [
        ...(product.brand
          ? [{ brand: { $regex: `^${escapeRegex(product.brand)}$`, $options: "i" } }]
          : []),
        ...(product.partType ? [{ partType: product.partType }] : []),
        ...(product.deviceCategory
          ? [{ deviceCategory: product.deviceCategory }]
          : []),
        ...(product.deviceModel
          ? [
              {
                deviceModel: {
                  $regex: escapeRegex(product.deviceModel),
                  $options: "i",
                },
              },
            ]
          : []),
      ],
    };

    if ((similarQuery.$or as unknown[]).length === 0) {
      delete similarQuery.$or;
    }

    const similarProducts = await Product.find(similarQuery)
      .select(
        "name price images brand partType category deviceCategory condition deviceModel",
      )
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json(
      {
        product: productObj,
        similarProducts,
        meta: { isOwner, isAuthenticated },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product", details: String(error) },
      { status: 500 },
    );
  }
}
