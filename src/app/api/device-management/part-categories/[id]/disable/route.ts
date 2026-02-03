import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Category from "@/lib/models/Category";
import { verifyJwt } from "@/lib/auth/jwt";

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyJwt(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    await connectDB();

    const existing = await Category.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Parts category not found" },
        { status: 404 },
      );
    }

    if (!existing.deviceId) {
      return NextResponse.json(
        { error: "This category is not device-scoped" },
        { status: 400 },
      );
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: { isActive: false, updatedAt: new Date() } },
      { new: true },
    );

    return NextResponse.json({ category: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to disable part category" },
      { status: 500 },
    );
  }
}
