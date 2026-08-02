import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { verifyJwt } from "@/lib/auth/jwt";
import { reconcilePartCategories } from "@/lib/categories/reconcile";

/**
 * POST — clean duplicate part categories and remap product.partType values.
 * Admin only. Safe to run multiple times.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = verifyJwt(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
