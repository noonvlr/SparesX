import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import DeviceType from "@/lib/models/DeviceType";

export async function GET() {
  try {
    await connectDB();
    
    const deviceTypes = await DeviceType.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });
    
    const categories = deviceTypes.map((dt) => ({
      value: dt.slug,
      label: dt.name,
      icon: dt.emoji,
    }));

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch device categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch device categories" },
      { status: 500 }
    );
  }
}
