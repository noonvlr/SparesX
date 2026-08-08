import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { reconcilePartCategories } from "@/lib/categories/reconcile";

/**
 * POST — clean duplicate part categories and remap product.partType values.
 * Admin only. Safe to run multiple times.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: admin.status });
    }

    await connectDB();

    let deleteInactiveDuplicates = true;
    try {
      const body = await req.json();
      if (typeof body?.deleteInactiveDuplicates === "boolean") {
        deleteInactiveDuplicates = body.deleteInactiveDuplicates;
      }
    } catch {
      // empty body is fine
    }

    const report = await reconcilePartCategories({ deleteInactiveDuplicates });

    return NextResponse.json(
      {
        message: "Categories reconciled",
        report,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reconcile categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
