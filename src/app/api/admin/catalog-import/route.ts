import { NextRequest, NextResponse } from "next/server";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { parseCatalogFile } from "@/lib/catalog/mergeCatalog";
import { applyCatalogMerge } from "@/lib/catalog/applyCatalogMerge";

/**
 * POST /api/admin/catalog-import
 * Body: { content: string, filename?: string, dryRun?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (isAdminError(admin)) return admin;

    const body = await req.json();
    const content = String(body?.content || "");
    const filename = String(body?.filename || "upload.csv");
    const dryRun = body?.dryRun !== false && body?.dryRun !== "false";

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Upload content is required" },
        { status: 400 },
      );
    }

    let rows;
    try {
      rows = parseCatalogFile(content, filename);
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || "Failed to parse catalog file" },
        { status: 400 },
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found. Expected category,brand,modelName,..." },
        { status: 400 },
      );
    }

    if (rows.length > 50000) {
      return NextResponse.json(
        { error: "Too many rows (max 50,000). Split the file and retry." },
        { status: 400 },
      );
    }

    const apply = body?.apply === true || body?.dryRun === false;
    const summary = await applyCatalogMerge(rows, { dryRun: !apply });

    return NextResponse.json({
      dryRun: !apply,
      summary,
      sampleRows: rows.slice(0, 8),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Catalog import failed" },
      { status: 500 },
    );
  }
}
