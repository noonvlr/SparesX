import { AdPlacement } from "@/lib/models/AdPlacement";
import { AD_PLACEMENT_SEEDS } from "@/lib/seeds/ad-placements";

export type SeedPlacementsResult = {
  upserted: number;
  keys: string[];
};

/**
 * Idempotent upsert by `key`. Does not overwrite admin edits to name/dims
 * when `preserveExisting` is true (default for re-runs after launch).
 * First-time insert always uses seed values.
 */
export async function seedAdPlacements(opts?: {
  /** When true (default), only fill missing keys; existing docs untouched. */
  preserveExisting?: boolean;
}): Promise<SeedPlacementsResult> {
  const preserveExisting = opts?.preserveExisting !== false;
  const keys: string[] = [];
  let upserted = 0;

  for (const seed of AD_PLACEMENT_SEEDS) {
    keys.push(seed.key);
    if (preserveExisting) {
      const existing = await AdPlacement.findOne({ key: seed.key })
        .select("_id")
        .lean();
      if (existing) continue;
      await AdPlacement.create(seed);
      upserted += 1;
      continue;
    }

    await AdPlacement.findOneAndUpdate(
      { key: seed.key },
      {
        $set: {
          name: seed.name,
          description: seed.description,
          pageLocation: seed.pageLocation,
          desktop: seed.desktop,
          mobile: seed.mobile,
          supportedDevices: seed.supportedDevices,
          enabled: seed.enabled,
          maxSlots: seed.maxSlots,
          fallbackToHouseAds: seed.fallbackToHouseAds,
        },
        $setOnInsert: { key: seed.key },
      },
      { upsert: true, new: true },
    );
    upserted += 1;
  }

  return { upserted, keys };
}
