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
  createdAt?: string;
  technician?: string;
  featured?: boolean;
};

function hasImage(p: HomepageFeaturedItem) {
  return Array.isArray(p.images) && p.images.some(Boolean);
}

/**
 * Pure slot merge: admin pins first, then quality-ranked auto-fill.
 */
export function mergeFeaturedSlots(
  pinned: HomepageFeaturedItem[],
  candidates: HomepageFeaturedItem[],
  trustedSellerIds: Set<string>,
  limit = 6,
): HomepageFeaturedItem[] {
  const safeLimit = Math.max(1, Math.min(12, limit));
  const pins = pinned.slice(0, safeLimit);
  if (pins.length >= safeLimit) return pins;

  const pinnedIds = new Set(pins.map((p) => p._id));
  const fillNeed = safeLimit - pins.length;
  const ranked = candidates
    .filter((c) => !pinnedIds.has(c._id))
    .sort((a, b) => {
      const imgDelta = Number(hasImage(b)) - Number(hasImage(a));
      if (imgDelta !== 0) return imgDelta;
      const trustDelta =
        Number(trustedSellerIds.has(b.technician || "")) -
        Number(trustedSellerIds.has(a.technician || ""));
      if (trustDelta !== 0) return trustDelta;
      return 0;
    });

  return [...pins, ...ranked.slice(0, fillNeed)];
}
