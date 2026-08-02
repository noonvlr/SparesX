import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { verifyJwt } from "@/lib/auth/jwt";

const MAX_FILES_AUTH = 8;
const MAX_FILES_ANON = 1;
const MAX_BYTES_AUTH = 5 * 1024 * 1024;
const MAX_BYTES_ANON = 2 * 1024 * 1024;
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
    const authenticated = !!userId;

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

    const maxFiles = authenticated ? MAX_FILES_AUTH : MAX_FILES_ANON;
    const maxBytes = authenticated ? MAX_BYTES_AUTH : MAX_BYTES_ANON;

    if (files.length > maxFiles) {
      return NextResponse.json(
        {
          error: authenticated
            ? `Maximum ${maxFiles} files per upload`
            : "Login required to upload multiple files",
        },
        { status: authenticated ? 400 : 401 },
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
          {
            error: authenticated
              ? "Each image must be 5MB or smaller"
              : "Image must be 2MB or smaller before login",
          },
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
      const raw = Buffer.from(await file.arrayBuffer());
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

      const safeName = `${Date.now()}-${idPart}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${optimized.ext}`;

      if (useLocalStorage) {
        const filePath = path.join(uploadsDir, safeName);
        await fs.writeFile(filePath, optimized.buffer);
        uploadedUrls.push(`/uploads/${safeName}`);
      } else {
        const blob = await put(safeName, optimized.buffer, {
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
