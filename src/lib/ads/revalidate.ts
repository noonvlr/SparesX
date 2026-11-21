import { revalidateTag } from "next/cache";
import { PROMO_ALL_TAG, promoPlacementTag } from "@/lib/ads/eligibility";

/** Invalidate promo eligibility caches after admin mutations. */
export function revalidatePromoCaches(placementKeys?: string[]) {
  revalidateTag(PROMO_ALL_TAG, { expire: 0 });
  if (placementKeys?.length) {
    for (const key of [...new Set(placementKeys)]) {
      revalidateTag(promoPlacementTag(key), { expire: 0 });
    }
  }
}
