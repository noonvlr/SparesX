import sharp from "sharp";

const MAX_EDGE = 1600;
const WEBP_QUALITY = 82;

export type OptimizedImage = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

/** Copy into a plain ArrayBuffer-backed Buffer (Blob/fetch reject SharedArrayBuffer). */
function toPlainBuffer(data: Uint8Array): Buffer {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return Buffer.from(copy);
}

/**
 * Auto-orient, resize to fit within MAX_EDGE (no upscale), convert to WebP
 * (GIF kept as GIF to preserve animation).
 */
export async function optimizeUploadImage(
  input: Buffer,
  mime: string,
): Promise<OptimizedImage> {
  // Ensure sharp input is also a plain buffer copy
  const source = Buffer.from(input);

  const normalizedMime = (mime || "").toLowerCase();

  if (normalizedMime === "image/gif") {
    const { data } = await sharp(source, { animated: true })
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .gif()
      .toUint8Array();
    return {
      buffer: toPlainBuffer(data),
      contentType: "image/gif",
      ext: "gif",
    };
  }

  const { data } = await sharp(source)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toUint8Array();

  return {
    buffer: toPlainBuffer(data),
    contentType: "image/webp",
    ext: "webp",
  };
}
