import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Category from "@/lib/models/Category";

// GET public categories (active only)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const categories = await Category.find({
      isActive: true,
      $or: [{ deviceId: { $exists: false } }, { deviceId: null }],
    })
      .sort({ order: 1, name: 1 })
      .select("name icon slug description order");

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
