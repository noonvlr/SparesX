import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!token) {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const filename = `${Date.now()}-${file.name}`;
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

      if (token) {
        const blob = await put(safeName, buffer, {
          access: "public",
          addRandomSuffix: true,
          token,
        });
        uploadedUrls.push(blob.url);
      } else {
        const filePath = path.join(uploadsDir, safeName);
        await fs.writeFile(filePath, Buffer.from(buffer));
        uploadedUrls.push(`/uploads/${safeName}`);
      }
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload images" },
      { status: 500 }
    );
  }
}
