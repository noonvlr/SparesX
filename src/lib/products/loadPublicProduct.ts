import { cache } from "react";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import type { AuthUser } from "@/lib/auth/requireUser";

// Ensure User schema is registered for technician populate
void User;

const TECHNICIAN_FIELDS =
  "name city state whatsappNumber countryCode mobile profilePicture phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys role createdAt averageRating ratingCount responseRate chatInboundOpportunities";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type PublicProductSimilarItem = {
  _id: string;
  slug?: string;
  name: string;
  price: number;
  images: string[];
  brand?: string;
  partType?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
  deviceModel?: string;
  technician?: string;
};

export type PublicProductPayload = {
  product: Record<string, unknown>;
  similarProducts: PublicProductSimilarItem[];
  meta: { isOwner: boolean; isAuthenticated: boolean };
};

export type LoadPublicProductResult =
  | ({ ok: true } & PublicProductPayload)
  | {
      ok: false;
      status: 403 | 404 | 500;
      error: string;
    };

/**
 * Soft session resolution for Server Components (cookies()), mirroring
 * getOptionalUser() DB checks without requiring a NextRequest.
 */
export async function getOptionalViewerFromCookies(): Promise<AuthUser | null> {
  try {
    const { cookies } = await import("next/headers");
    const { SESSION_COOKIE } = await import("@/lib/auth/cookieNames");
    const { verifyJwt } = await import("@/lib/auth/jwt");
    const token = (await cookies()).get(SESSION_COOKIE)?.value?.trim();
    if (!token) return null;
    const payload = verifyJwt(token);
    if (!payload?.id) return null;

    await connectDB();
    const user = await User.findById(payload.id)
      .select("isBlocked role sessionVersion")
      .lean();
    if (!user || user.isBlocked) return null;

    const currentSv =
      typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
    if (payload.sv !== currentSv) return null;

    return { id: String(user._id), role: String(user.role) };
  } catch {
    return null;
  }
}

/**
 * Shared public product loader for PDP + GET /api/products/[id].
 * Viewer must be passed explicitly (API: getOptionalUser; RSC: cookies helper).
 */
export async function loadPublicProduct(
  identifier: string,
  viewer: AuthUser | null,
): Promise<LoadPublicProductResult> {
  try {
    await connectDB();

    const id = String(identifier || "").trim();
    if (!id) {
      return { ok: false, status: 404, error: "Product not found" };
    }

    const userId = viewer?.id || null;
    const isAuthenticated = !!userId;

    const product = Types.ObjectId.isValid(id)
      ? await Product.findById(id).populate("technician", TECHNICIAN_FIELDS)
      : await Product.findOne({ slug: id }).populate(
          "technician",
          TECHNICIAN_FIELDS,
        );

    if (!product) {
      return { ok: false, status: 404, error: "Product not found" };
    }

    const ownerId =
      typeof product.technician === "object" && product.technician
        ? String((product.technician as { _id?: unknown })._id)
        : String(product.technician);

    const isOwner = !!userId && ownerId === userId;

    if (product.status !== "approved" && product.status !== "sold" && !isOwner) {
      return { ok: false, status: 403, error: "Access denied" };
    }

    const productObj = product.toObject() as unknown as Record<string, unknown>;

    // Attach public trust badges; never expose WhatsApp/mobile unless owner
    // or WhatsApp is unlocked between viewer and seller (per user pair).
    if (productObj.technician && typeof productObj.technician === "object") {
      const { pickTrustFields } = await import("@/lib/trust");
      const tech = productObj.technician as Record<string, unknown>;
      const trust = pickTrustFields(tech);

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
          countryCode: tech.countryCode as string | undefined,
          whatsappNumber: tech.whatsappNumber as string | undefined,
          mobile: tech.mobile as string | undefined,
          productName: String(productObj.name || ""),
          sellerName: String(tech.name || ""),
        });
        const digits = String(tech.whatsappNumber || tech.mobile || "");
        const techOut = productObj.technician as Record<string, unknown>;
        techOut.whatsappUrl = waUrl;
        techOut.maskedNumber = maskPhone(
          tech.countryCode as string | undefined,
          digits,
        );
        techOut.countryCode = tech.countryCode;
        // Owner may still need raw digits for their own listing management
        if (isOwner) {
          techOut.whatsappNumber = tech.whatsappNumber;
          techOut.mobile = tech.mobile;
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
          ? [
              {
                brand: {
                  $regex: `^${escapeRegex(product.brand)}$`,
                  $options: "i",
                },
              },
            ]
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

    return {
      ok: true,
      product: productObj,
      similarProducts: similarProducts.map((p) => ({
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
    };
  } catch (error) {
    console.error("Error loading public product:", error);
    return { ok: false, status: 500, error: "Failed to fetch product" };
  }
}

/**
 * Per-request memoization for PDP generateMetadata + page body.
 * Resolves the optional cookie session once and loads the product in-process.
 */
export const loadPublicProductForPage = cache(
  async (identifier: string): Promise<LoadPublicProductResult> => {
    const viewer = await getOptionalViewerFromCookies();
    return loadPublicProduct(identifier, viewer);
  },
);
