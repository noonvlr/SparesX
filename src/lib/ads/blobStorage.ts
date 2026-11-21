import { put, del } from "@vercel/blob";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const BLOB_HOST = ".public.blob.vercel-storage.com";

function useLocalStorage(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return process.env.NODE_ENV === "development" || !token;
}

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
  return (
    url.startsWith("/uploads/") && !url.includes("..") && !url.includes("\\")
  );
}

export function buildAdBlobPathname(params: {
  campaignId: string;
  placementKey: string;
  device: string;
  ext: string;
  buffer: Buffer;
}): string {
  const hash = createHash("sha256")
    .update(params.buffer)
    .digest("hex")
    .slice(0, 12);
  const safeExt = params.ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `ads/${params.campaignId}/${params.placementKey}/${params.device}-${hash}.${safeExt}`;
}

export async function storeAdCreative(params: {
  campaignId: string;
  placementKey: string;
  device: string;
  buffer: Buffer;
  contentType: string;
  ext: string;
}): Promise<{ url: string; blobPathname: string }> {
  const pathname = buildAdBlobPathname(params);
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (useLocalStorage()) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const fileName = pathname.replace(/\//g, "__");
    await fs.writeFile(path.join(uploadsDir, fileName), params.buffer);
    return { url: `/uploads/${fileName}`, blobPathname: pathname };
  }

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const blob = await put(pathname, params.buffer, {
    access: "public",
    addRandomSuffix: false,
    token,
    contentType: params.contentType,
  });
  return { url: blob.url, blobPathname: pathname };
}

export async function deleteAdCreativeStorage(params: {
  url: string;
  blobPathname?: string;
}): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    if (isLocalUploadPath(params.url)) {
      const fileName = path.basename(params.url);
      if (!fileName || fileName === "." || fileName === "..") return;
      await fs.unlink(path.join(process.cwd(), "public", "uploads", fileName));
      return;
    }
    if (isOurBlobUrl(params.url) && token) {
      await del(params.url, { token });
    }
  } catch (err) {
    console.warn("[ads] failed to delete creative", params.url, err);
  }
}

/** Copy blob bytes into a new campaign path (duplicate must not share blobs). */
export async function copyAdCreativeToCampaign(params: {
  sourceUrl: string;
  sourcePathname: string;
  campaignId: string;
  placementKey: string;
  device: string;
  contentType: string;
  ext: string;
}): Promise<{ url: string; blobPathname: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (useLocalStorage() || isLocalUploadPath(params.sourceUrl)) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const srcName = path.basename(params.sourceUrl);
    const buffer = await fs.readFile(path.join(uploadsDir, srcName));
    return storeAdCreative({
      campaignId: params.campaignId,
      placementKey: params.placementKey,
      device: params.device,
      buffer,
      contentType: params.contentType,
      ext: params.ext,
    });
  }

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  // Prefer fetching source and re-putting under the new pathname so we never
  // share blob objects across campaigns.
  const res = await fetch(params.sourceUrl);
  if (!res.ok) {
    throw new Error("Failed to read source creative for duplicate");
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return storeAdCreative({
    campaignId: params.campaignId,
    placementKey: params.placementKey,
    device: params.device,
    buffer,
    contentType: params.contentType,
    ext: params.ext,
  });
}

export function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    default:
      return "bin";
  }
}
