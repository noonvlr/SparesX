import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import DeviceType from "@/lib/models/DeviceType";
import Category from "@/lib/models/Category";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    let deviceTypes = await DeviceType.find({})
      .sort({ order: 1, createdAt: 1 })
      .lean();

    if (!deviceTypes || deviceTypes.length === 0) {
      const categories = await Category.find({})
        .sort({ order: 1, name: 1 })
        .lean();

      deviceTypes = categories.map((category) => ({
        _id: category._id,
        name: category.name,
        emoji: category.icon || "📦",
        slug: category.slug,
        description: category.description || "",
        isActive: category.isActive ?? true,
        order: category.order ?? 0,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }));
    }

    return NextResponse.json(
      {
        success: true,
        deviceTypes,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch device types",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin token (basic check - in production use proper JWT verification)
    const body = await req.json();

    await connectDB();

    // Check if device type already exists
    const existing = await DeviceType.findOne({
      $or: [{ name: body.name }, { slug: body.slug }],
    });

    if (existing) {
      return NextResponse.json(
        { error: "Device type with this name or slug already exists" },
        { status: 400 }
      );
    }

    const deviceType = new DeviceType({
      name: body.name,
      emoji: body.emoji,
      slug: body.slug,
      description: body.description || "",
      isActive: body.isActive !== false,
      order: body.order || 0,
    });

    await deviceType.save();

    return NextResponse.json(
      {
        success: true,
        deviceType,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create device type",
      },
      { status: 500 }
    );
  }
}
