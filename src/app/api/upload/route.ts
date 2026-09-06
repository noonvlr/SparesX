import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";

const MAX_FILES_AUTH = 10;
const MAX_BYTES_AUTH = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (isAuthError(auth)) return auth;
    const userId = auth.id;

    const { checkRateLimitAsync, clientIpFromRequest } = await import(
      "@/lib/security/authRateLimit"
    );
    const ip = clientIpFromRequest(req);
    const rate = await checkRateLimitAsync({
      key: `upload:${userId}:${ip}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many uploads. Try again later." },
        { status: 429 },
      );
    }

    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 },
      );
    }

    const maxFiles = MAX_FILES_AUTH;
    const maxBytes = MAX_BYTES_AUTH;

    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files per upload` },
        { status: 400 },
      );
    }

    for (const file of files) {
      // Mobile browsers often omit File.type — validate via magic bytes below.
      const mime = (file.type || "").toLowerCase();
      if (mime && !ALLOWED_MIME.has(mime) && !mime.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
          { status: 400 },
        );
      }
      if (mime && !ALLOWED_MIME.has(mime) && mime.startsWith("image/")) {
        return NextResponse.json(
          {
            error:
              "Unsupported image format. Use JPEG, PNG, WebP, or GIF (not HEIC).",
          },
          { status: 400 },
        );
      }
      if (file.size > maxBytes) {
        return NextResponse.json(
          { error: "Each image must be 5MB or smaller" },
          { status: 400 },
        );
      }
    }

    const uploadedUrls: string[] = [];
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const isDevelopment = process.env.NODE_ENV === "development";
    const useLocalStorage = isDevelopment || !token;

    if (!isDevelopment && !token) {
      console.error(
        "[Upload] BLOB_READ_WRITE_TOKEN is missing — uploads cannot persist in production",
      );
      return NextResponse.json(
        {
          error:
            "Image storage is not configured. Please contact support (missing BLOB_READ_WRITE_TOKEN).",
        },
        { status: 503 },
      );
    }

    if (useLocalStorage) {
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (mkdirError) {
        console.error("[Upload] Failed to create uploads directory:", mkdirError);
      }
    }

    const idPart = userId.slice(-6);
    const { sniffImageMime, isHeicLike } = await import(
      "@/lib/images/sniffImage"
    );

    for (const file of files) {
      const ab = await file.arrayBuffer();
      const raw = Buffer.from(new Uint8Array(ab));
      if (isHeicLike(raw)) {
        return NextResponse.json(
          {
            error:
              "HEIC/HEIF photos are not supported. On iPhone: Settings → Camera → Formats → Most Compatible, or export/share as JPEG.",
          },
          { status: 400 },
        );
      }
      const sniffed = sniffImageMime(raw);
      if (!sniffed) {
        return NextResponse.json(
          { error: "File content is not a valid JPEG, PNG, WebP, or GIF image" },
          { status: 400 },
        );
      }

      let optimized: {
        buffer: Buffer;
        contentType: string;
        ext: string;
      };
      try {
        const { optimizeUploadImage } = await import(
          "@/lib/images/optimizeUpload"
        );
        optimized = await optimizeUploadImage(raw, sniffed);
      } catch (optErr) {
        // Never block upload solely because sharp failed to load/process —
        // store the already-validated original bytes.
        console.warn(
          "[Upload] optimize failed, storing original bytes:",
          optErr,
        );
        const ext =
          sniffed === "image/png"
            ? "png"
            : sniffed === "image/gif"
              ? "gif"
              : sniffed === "image/webp"
                ? "webp"
                : "jpg";
        optimized = {
          buffer: raw,
          contentType: sniffed,
          ext,
        };
      }

      const uploadBody = Buffer.from(optimized.buffer);

      const safeName = `${Date.now()}-${idPart}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${optimized.ext}`;

      if (useLocalStorage) {
        const filePath = path.join(uploadsDir, safeName);
        await fs.writeFile(filePath, uploadBody);
        uploadedUrls.push(`/uploads/${safeName}`);
      } else {
        const blob = await put(safeName, uploadBody, {
          access: "public",
          addRandomSuffix: true,
          token,
          contentType: optimized.contentType,
        });
        uploadedUrls.push(blob.url);
      }
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 },
    );
  }
}
