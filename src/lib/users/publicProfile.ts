import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { SellerRating } from "@/lib/models/SellerRating";
import { pickTrustFields } from "@/lib/trust";
import type { PublicBadge } from "@/lib/badges/catalog";

export type PublicProfileData = {
  _id: string;
  name: string;
  profilePicture?: string | null;
  city?: string | null;
  state?: string | null;
  about?: string;
  role?: string;
  createdAt?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  kycVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  isTrusted?: boolean;
  trustScore?: number;
  trustLabel?: string;
  averageRating?: number;
  ratingCount?: number;
  badges?: PublicBadge[];
  activeBadgeKeys?: string[];
};

export type PublicProfileListing = {
  _id: string;
  slug?: string;
  name: string;
  price: number;
  images: string[];
  brand?: string;
  partType?: string;
  deviceModel?: string;
  category?: string;
  deviceCategory?: string;
  condition?: string;
  priceNegotiable?: boolean;
};

export type PublicProfileRating = {
  _id: string;
  stars: number;
  behaviour: number;
  response: number;
  comment?: string;
  createdAt: string;
  rater?: { name?: string; city?: string } | null;
};

export type PublicProfileBundle = {
  profile: PublicProfileData;
  listings: PublicProfileListing[];
  ratings: PublicProfileRating[];
  listingCount: number;
};

/**
 * Public profile, approved listings, and visible ratings for one user.
 *
 * Shared by `/api/users/[id]/public` and the server-rendered `/u/[id]` page so
 * crawlers and clients see the same data. Never returns contact/PII fields
 * (email, mobile, whatsapp, address, pinCode, OTPs).
 */
export async function fetchPublicProfile(
  id: string,
  opts: { includeRatings?: boolean; ratingLimit?: number } = {},
): Promise<PublicProfileBundle | null> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  await connectDB();

  const user = await User.findById(id)
    .select(
      "name profilePicture city state role isBlocked createdAt about phoneVerified emailVerified kycVerified businessVerified addressVerified isTrusted trustScore activeBadgeKeys specialBadgeKeys averageRating ratingCount",
    )
    .lean();

  if (!user || user.isBlocked) return null;

  const listingDocs = await Product.find({
    technician: id,
    status: "approved",
  })
    .select(
      "slug name price images brand partType deviceModel category deviceCategory condition priceNegotiable createdAt",
    )
    .sort({ createdAt: -1 })
    .limit(24)
    .lean();

  const listings: PublicProfileListing[] = listingDocs.map(
    (p: Record<string, any>) => ({
      _id: String(p._id),
      slug: p.slug || undefined,
      name: p.name || "",
      price: typeof p.price === "number" ? p.price : 0,
      images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
      brand: p.brand || undefined,
      partType: p.partType || undefined,
      deviceModel: p.deviceModel || undefined,
      category: p.category || undefined,
      deviceCategory: p.deviceCategory || undefined,
      condition: p.condition || undefined,
      priceNegotiable: Boolean(p.priceNegotiable),
    }),
  );

  let ratings: PublicProfileRating[] = [];
  if (opts.includeRatings) {
    const ratingDocs = await SellerRating.find({ seller: id, isHidden: false })
      .sort({ createdAt: -1 })
      .limit(opts.ratingLimit ?? 8)
      .populate("rater", "name city")
      .lean();

    ratings = ratingDocs.map((r: Record<string, any>) => ({
      _id: String(r._id),
      stars: r.stars,
      behaviour: r.behaviour,
      response: r.response,
      comment: r.comment || undefined,
      createdAt: new Date(r.createdAt).toISOString(),
      rater:
        r.rater && typeof r.rater === "object"
          ? { name: r.rater.name, city: r.rater.city }
          : null,
    }));
  }

  const trust = pickTrustFields(user);

  return {
    profile: {
      _id: String(user._id),
      name: user.name,
      profilePicture: user.profilePicture || null,
      city: user.city || null,
      state: user.state || null,
      about: (user as { about?: string }).about || "",
      role: user.role,
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : undefined,
      ...trust,
    },
    listings,
    ratings,
    listingCount: listings.length,
  };
}
