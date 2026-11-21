import sharp from "sharp";
import { sniffImageMime, isHeicLike } from "@/lib/images/sniffImage";
import { checkCreativeDimensions } from "@/lib/ads/dimensions";
import type { AdSizeSpec } from "@/lib/models/AdPlacement";

export const AD_CREATIVE_MAX_BYTES = 2 * 1024 * 1024;

export type ValidatedCreativeUpload =
  | {
      ok: true;
      buffer: Buffer;
      mime: "image/jpeg" | "image/png" | "image/webp";
      width: number;
      height: number;
      bytes: number;
      scale: 1 | 2;
    }
  | { ok: false; message: string };

export async function validateCreativeUpload(params: {
  buffer: Buffer;
  required: AdSizeSpec;
  label: string;
}): Promise<ValidatedCreativeUpload> {
  const { buffer, required, label } = params;

  if (buffer.byteLength === 0) {
    return { ok: false, message: "Empty file" };
  }
  if (buffer.byteLength > AD_CREATIVE_MAX_BYTES) {
    return {
      ok: false,
      message: `Each creative must be 2 MB or smaller. You uploaded ${(buffer.byteLength / (1024 * 1024)).toFixed(2)} MB.`,
    };
  }

  if (isHeicLike(buffer)) {
    return {
      ok: false,
      message: "HEIC/HEIF is not supported. Export as JPEG, PNG, or WebP.",
    };
  }

  const sniffed = sniffImageMime(buffer);
  if (
    !sniffed ||
    (sniffed !== "image/jpeg" &&
      sniffed !== "image/png" &&
      sniffed !== "image/webp")
  ) {
    // SVG / fake extension / GIF etc.
    if (buffer.slice(0, 200).toString("utf8").includes("<svg")) {
      return { ok: false, message: "SVG images are not allowed" };
    }
    return {
      ok: false,
      message: "File must be a valid JPEG, PNG, or WebP image (detected from file contents, not extension)",
    };
  }
  const mime = sniffed;

  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(buffer, { failOn: "truncated" }).metadata();
    width = meta.width || 0;
    height = meta.height || 0;
  } catch {
    return { ok: false, message: "Could not decode image dimensions" };
  }

  if (!width || !height) {
    return { ok: false, message: "Could not read image dimensions" };
  }

  const dim = checkCreativeDimensions(
    { width, height },
    required,
    label,
  );
  if (!dim.ok) return dim;

  return {
    ok: true,
    buffer,
    mime,
    width,
    height,
    bytes: buffer.byteLength,
    scale: dim.scale,
  };
}
