import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";

const FEATURED_SELECT =
  "name price images brand partType condition deviceModel deviceCategory slug status priceNegotiable technician featured createdAt";

export type HomepageFeaturedItem = {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  brand?: string;
  partType?: string;
  condition?: string;
  deviceModel?: string;
  deviceCategory?: string;
  slug?: string;
  status?: string;
  priceNegotiable?: boolean;
  technician?: string;
  featured?: boolean;
};

function mapDoc(p: Record<string, unknown>): HomepageFeaturedItem {
  return {
    _id: String(p._id),
    name: String(p.name || ""),
    price: typeof p.price === "number" ? p.price : 0,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    brand: p.brand ? String(p.brand) : undefined,
    partType: p.partType ? String(p.partType) : undefined,
    condition: p.condition ? String(p.condition) : undefined,
    deviceModel: p.deviceModel ? String(p.deviceModel) : undefined,
    deviceCategory: p.deviceCategory ? String(p.deviceCategory) : undefined,
    slug: p.slug ? String(p.slug) : undefined,
    status: p.status ? String(p.status) : undefined,
    priceNegotiable: Boolean(p.priceNegotiable),
    technician: p.technician ? String(p.technician) : undefined,
    featured: Boolean(p.featured),
  };
}

function hasImage(p: HomepageFeaturedItem) {
  return Array.isArray(p.images) && p.images.some(Boolean);
}

/**
 * Homepage featured slots: admin pins first, then auto-fill from strong
 * approved listings (images preferred, trusted sellers preferred, then newest).
 */
export async function loadHomepageFeatured(
  limit = 6,
): Promise<HomepageFeaturedItem[]> {
  await connectDB();
  const safeLimit = Math.max(1, Math.min(12, limit));

  const pinnedRaw = await Product.find({
    status: "approved",
    featured: true,
  })
    .select(FEATURED_SELECT)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  const pinned = pinnedRaw.map((p) =>
    mapDoc(p as unknown as Record<string, unknown>),
  );
  if (pinned.length >= safeLimit) {
    return pinned.slice(0, safeLimit);
  }

  const pinnedIds = pinned.map((p) => p._id);
  const fillNeed = safeLimit - pinned.length;
  const candidatesRaw = await Product.find({
    status: "approved",
    ...(pinnedIds.length
      ? { _id: { $nin: pinnedIds } }
      : {}),
  })
    .select(FEATURED_SELECT)
    .sort({ createdAt: -1 })
    .limit(Math.max(fillNeed * 6, 24))
    .lean();

  const candidates = candidatesRaw.map((p) =>
    mapDoc(p as unknown as Record<string, unknown>),
  );

  const sellerIds = [
    ...new Set(candidates.map((c) => c.technician).filter(Boolean) as string[]),
  ];
  const trusted = new Set<string>();
  if (sellerIds.length > 0) {
    const sellers = await User.find({
      _id: { $in: sellerIds },
      $or: [{ isTrusted: true }, { kycVerified: true }, { businessVerified: true }],
    })
      .select("_id")
      .lean();
    for (const s of sellers) trusted.add(String(s._id));
  }

  const ranked = [...candidates].sort((a, b) => {
    const imgDelta = Number(hasImage(b)) - Number(hasImage(a));
    if (imgDelta !== 0) return imgDelta;
    const trustDelta =
      Number(trusted.has(b.technician || "")) -
      Number(trusted.has(a.technician || ""));
    if (trustDelta !== 0) return trustDelta;
    return 0; // already newest-first from query; stable enough
  });

  return [...pinned, ...ranked.slice(0, fillNeed)];
}
