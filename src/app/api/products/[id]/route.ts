import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { verifyJwt } from "@/lib/auth/jwt";

// Ensure User schema is registered for technician populate
void User;

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

    const { getTokenFromRequest } = await import(
      "@/lib/auth/getTokenFromRequest"
    );
    const token = getTokenFromRequest(req);
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

    const TECHNICIAN_FIELDS =
      "name city state whatsappNumber countryCode mobile profilePicture phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys role createdAt averageRating ratingCount";

    // `id` may be a Mongo _id or an SEO slug, so both URL forms resolve.
    const product = Types.ObjectId.isValid(id)
      ? await Product.findById(id).populate("technician", TECHNICIAN_FIELDS)
      : await Product.findOne({ slug: id }).populate(
          "technician",
          TECHNICIAN_FIELDS,
        );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const ownerId =
      typeof product.technician === "object" && product.technician
        ? String((product.technician as any)._id)
        : String(product.technician);

    const isOwner = !!userId && ownerId === userId;

    if (product.status !== "approved" && product.status !== "sold" && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const productObj: any = product.toObject();

    // Attach public trust badges; never expose WhatsApp/mobile unless owner
    // or WhatsApp is unlocked between viewer and seller (per user pair).
    if (productObj.technician && typeof productObj.technician === "object") {
      const { pickTrustFields } = await import("@/lib/trust");
      const trust = pickTrustFields(productObj.technician);
      const tech = productObj.technician;

      let whatsappUnlocked = isOwner;
      if (isAuthenticated && userId && !isOwner) {
        const { isWhatsAppUnlocked } = await import("@/lib/whatsapp/connect");
        whatsappUnlocked = await isWhatsAppUnlocked(userId, ownerId);
      }

      productObj.technician = {
        _id: tech._id,
        name: tech.name,
        city: tech.city,
        state: tech.state,
        profilePicture: tech.profilePicture,
        ...trust,
      };

      if (whatsappUnlocked) {
        const {
          buildWaMeLink,
          maskPhone,
        } = await import("@/lib/whatsapp/connect");
        const waUrl = buildWaMeLink({
          countryCode: tech.countryCode,
          whatsappNumber: tech.whatsappNumber,
          mobile: tech.mobile,
          productName: productObj.name,
          sellerName: tech.name,
        });
        const digits = tech.whatsappNumber || tech.mobile || "";
        productObj.technician.whatsappUrl = waUrl;
        productObj.technician.maskedNumber = maskPhone(
          tech.countryCode,
          digits,
        );
        productObj.technician.countryCode = tech.countryCode;
        // Owner may still need raw digits for their own listing management
        if (isOwner) {
          productObj.technician.whatsappNumber = tech.whatsappNumber;
          productObj.technician.mobile = tech.mobile;
        }
      }

      productObj.whatsappUnlocked = whatsappUnlocked && !isOwner;
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
        "slug name price images brand partType category deviceCategory condition deviceModel technician",
      )
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json(
      {
        product: productObj,
        similarProducts: similarProducts.map((p: Record<string, any>) => ({
          _id: String(p._id),
          slug: p.slug || undefined,
          name: p.name,
          price: p.price,
          images: p.images || [],
          brand: p.brand,
          partType: p.partType,
          category: p.category,
          deviceCategory: p.deviceCategory,
          condition: p.condition,
          deviceModel: p.deviceModel,
          technician: p.technician ? String(p.technician) : undefined,
        })),
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
