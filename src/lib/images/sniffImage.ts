/**
 * Detect image type from magic bytes. Returns null if not a supported image.
 */
export function sniffImageMime(
  input: Buffer | Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" | "image/gif" | null {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: GIF87a / GIF89a
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return "image/gif";
  }

  // WEBP: RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/** True for HEIC/HEIF (common iPhone camera format — not accepted for upload). */
export function isHeicLike(input: Buffer | Uint8Array): boolean {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buf.length < 12) return false;
  // ISO BMFF: ....ftypXXXX
  if (
    buf[4] !== 0x66 ||
    buf[5] !== 0x74 ||
    buf[6] !== 0x79 ||
    buf[7] !== 0x70
  ) {
    return false;
  }
  const brand = buf.slice(8, 12).toString("ascii").toLowerCase();
  return (
    brand === "heic" ||
    brand === "heif" ||
    brand === "mif1" ||
    brand === "msf1" ||
    brand === "hevx"
  );
}
