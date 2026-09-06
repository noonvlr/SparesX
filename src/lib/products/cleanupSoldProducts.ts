import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { deleteStoredProductImages } from "@/lib/images/deleteProductImages";

/** Sold listings older than this are hard-deleted (DB + stored images). */
export const SOLD_PRODUCT_RETENTION_DAYS = 7;

export type CleanupSoldResult = {
  scanned: number;
  deleted: number;
  imagesRemoved: number;
  cutoff: string;
};

/**
 * Permanently remove sold products whose soldAt is older than retention.
 * Falls back to updatedAt when soldAt is missing (legacy rows).
 */
export async function cleanupExpiredSoldProducts(options?: {
  limit?: number;
}): Promise<CleanupSoldResult> {
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  const cutoff = new Date(
    Date.now() - SOLD_PRODUCT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  await connectDB();

  const candidates = await Product.find({
    status: "sold",
    $or: [
      { soldAt: { $lte: cutoff } },
      { soldAt: null, updatedAt: { $lte: cutoff } },
      { soldAt: { $exists: false }, updatedAt: { $lte: cutoff } },
    ],
  })
    .select("_id images")
    .limit(limit)
    .lean();

  let deleted = 0;
  let imagesRemoved = 0;

  for (const product of candidates) {
    const images = product.images;
    await Product.deleteOne({ _id: product._id });
    deleted += 1;
    const cleanup = await deleteStoredProductImages(images);
    imagesRemoved += cleanup.deleted;
  }

  return {
    scanned: candidates.length,
    deleted,
    imagesRemoved,
    cutoff: cutoff.toISOString(),
  };
}
