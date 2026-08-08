import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { verifyJwt } from "@/lib/auth/jwt";

const MAX_FILES_AUTH = 10;
const MAX_BYTES_AUTH = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionForMime(mime: string) {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function optionalUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyJwt(authHeader.split(" ")[1]);
  return payload?.id || null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = optionalUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Login required to upload files" },
        { status: 401 },
      );
    }

    const { checkRateLimit, clientIpFromRequest } = await import(
      "@/lib/security/authRateLimit"
    );
    const ip = clientIpFromRequest(req);
    const rate = checkRateLimit({
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
      const mime = (file.type || "").toLowerCase();
      if (!ALLOWED_MIME.has(mime)) {
        return NextResponse.json(
          { error: "Only JPEG, PNG, WebP, or GIF images are allowed" },
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

    if (useLocalStorage) {
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (mkdirError) {
        console.error("[Upload] Failed to create uploads directory:", mkdirError);
      }
    }

    const idPart = userId ? userId.slice(-6) : "anon";

    for (const file of files) {
      // Copy bytes into a plain Buffer — File.arrayBuffer() can be SharedArrayBuffer
      const ab = await file.arrayBuffer();
      const raw = Buffer.from(new Uint8Array(ab));
      let optimized;
      try {
        const { optimizeUploadImage } = await import(
          "@/lib/images/optimizeUpload"
        );
        optimized = await optimizeUploadImage(raw, file.type);
      } catch (optErr) {
        console.warn("[Upload] optimize failed, storing original:", optErr);
        optimized = {
          buffer: raw,
          contentType: file.type || "image/jpeg",
          ext: extensionForMime((file.type || "").toLowerCase()),
        };
      }

      // Final copy for Blob/fetch (rejects SharedArrayBuffer-backed views)
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
    const message =
      error instanceof Error ? error.message : "Failed to upload images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
