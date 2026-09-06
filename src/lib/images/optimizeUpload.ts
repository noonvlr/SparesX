import sharp from "sharp";

const MAX_EDGE = 1600;
const WEBP_QUALITY = 82;
const JPEG_QUALITY = 85;

export type OptimizedImage = {
  buffer: Buffer;
  contentType: string;
  ext: string;
};

function toPlainBuffer(data: Uint8Array | Buffer): Buffer {
  if (Buffer.isBuffer(data)) {
    return Buffer.from(data);
  }
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return Buffer.from(copy);
}

function mimeToOutput(
  mime: string,
): { contentType: string; ext: string } {
  switch ((mime || "").toLowerCase()) {
    case "image/png":
      return { contentType: "image/png", ext: "png" };
    case "image/gif":
      return { contentType: "image/gif", ext: "gif" };
    case "image/webp":
      return { contentType: "image/webp", ext: "webp" };
    default:
      return { contentType: "image/jpeg", ext: "jpg" };
  }
}

async function runPipeline(
  source: Buffer,
  opts: { animated?: boolean; webp?: boolean; gif?: boolean },
): Promise<OptimizedImage> {
  let pipeline = sharp(source, {
    failOn: "truncated",
    // Prefer constructor auto-orient (sharp 0.33+) over bare .rotate().
    autoOrient: true,
    animated: Boolean(opts.animated),
  }).resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (opts.gif) {
    pipeline = pipeline.gif();
    const data = await pipeline.toBuffer();
    return {
      buffer: toPlainBuffer(data),
      contentType: "image/gif",
      ext: "gif",
    };
  }

  if (opts.webp) {
    pipeline = pipeline.webp({ quality: WEBP_QUALITY });
    const data = await pipeline.toBuffer();
    return {
      buffer: toPlainBuffer(data),
      contentType: "image/webp",
      ext: "webp",
    };
  }

  pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  const data = await pipeline.toBuffer();
  return {
    buffer: toPlainBuffer(data),
    contentType: "image/jpeg",
    ext: "jpg",
  };
}

/**
 * Auto-orient, resize, re-encode. Falls back through several sharp pipelines,
 * then stores the original validated bytes if processing still fails
 * (common when native sharp binaries are missing in a bad deploy).
 */
export async function optimizeUploadImage(
  input: Buffer,
  mime: string,
): Promise<OptimizedImage> {
  const source = Buffer.from(input);
  const normalizedMime = (mime || "").toLowerCase();
  const passthrough = (): OptimizedImage => {
    const out = mimeToOutput(normalizedMime);
    return { buffer: source, ...out };
  };

  if (normalizedMime === "image/gif") {
    try {
      return await runPipeline(source, { animated: true, gif: true });
    } catch (err) {
      console.warn("[optimize] gif pipeline failed, storing original:", err);
      return passthrough();
    }
  }

  const attempts: Array<() => Promise<OptimizedImage>> = [
    () => runPipeline(source, { webp: true }),
    () => runPipeline(source, { webp: false }),
  ];

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      console.warn("[optimize] pipeline attempt failed:", err);
    }
  }

  console.warn(
    "[optimize] all sharp pipelines failed — storing original image bytes",
  );
  return passthrough();
}
