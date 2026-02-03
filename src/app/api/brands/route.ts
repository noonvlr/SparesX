import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { CategoryBrand } from "@/lib/models/CategoryBrand";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeModels = searchParams.get("includeModels") !== "false";

    await connectDB();

    const brands = await CategoryBrand.find({ isActive: true })
      .select(includeModels ? "name slug logo models" : "name slug logo")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ brands }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
