import { del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

const BLOB_HOST = ".public.blob.vercel-storage.com";

function isOurBlobUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "public.blob.vercel-storage.com" || host.endsWith(BLOB_HOST)
    );
  } catch {
    return false;
  }
}

function isLocalUploadPath(url: string): boolean {
  return url.startsWith("/uploads/") && !url.includes("..") && !url.includes("\\");
}

/**
 * Best-effort removal of listing image files from Vercel Blob or local /uploads.
 * Never throws — delete APIs should still remove the DB row if storage cleanup fails.
 */
export async function deleteStoredProductImages(
  images: unknown,
): Promise<{ attempted: number; deleted: number }> {
  if (!Array.isArray(images) || images.length === 0) {
    return { attempted: 0, deleted: 0 };
  }

  const urls = [
    ...new Set(
      images
        .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
        .map((u) => u.trim()),
    ),
  ];

  let deleted = 0;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  for (const url of urls) {
    try {
      if (isLocalUploadPath(url)) {
        const fileName = path.basename(url);
        if (!fileName || fileName === "." || fileName === "..") continue;
        await fs.unlink(path.join(uploadsDir, fileName));
        deleted += 1;
        continue;
      }

      if (isOurBlobUrl(url) && token) {
        await del(url, { token });
        deleted += 1;
      }
    } catch (err) {
      console.warn("[images] failed to delete", url, err);
    }
  }

  return { attempted: urls.length, deleted };
}

/** Collect images from product-like docs, then delete storage objects. */
export async function deleteImagesForProducts(
  products: Array<{ images?: unknown } | null | undefined>,
): Promise<void> {
  const all: string[] = [];
  for (const p of products) {
    if (!p || !Array.isArray(p.images)) continue;
    for (const img of p.images) {
      if (typeof img === "string" && img.trim()) all.push(img.trim());
    }
  }
  if (all.length) await deleteStoredProductImages(all);
}
