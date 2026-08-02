import sharp from "sharp";

const MAX_EDGE = 1600;
const WEBP_QUALITY = 82;

export type OptimizedImage = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

/**
 * Auto-orient, resize to fit within MAX_EDGE (no upscale), convert to WebP
 * (GIF kept as GIF to preserve animation).
 */
export async function optimizeUploadImage(
  input: Buffer,
  mime: string,
): Promise<OptimizedImage> {
  const normalizedMime = (mime || "").toLowerCase();

  if (normalizedMime === "image/gif") {
    const buffer = await sharp(input, { animated: true })
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .gif()
      .toBuffer();
    return { buffer, contentType: "image/gif", ext: "gif" };
  }

  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return { buffer, contentType: "image/webp", ext: "webp" };
}
