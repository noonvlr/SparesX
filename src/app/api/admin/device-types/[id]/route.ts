import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import DeviceType from "@/lib/models/DeviceType";
import mongoose from "mongoose";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid device type ID" }, { status: 400 });
    }

    const body = await req.json();

    await connectDB();

    // Check if slug is already taken by another device type
    if (body.slug) {
      const existing = await DeviceType.findOne({
        _id: { $ne: id },
        slug: body.slug,
      });

      if (existing) {
        return NextResponse.json(
          { error: "Slug already taken" },
          { status: 400 }
        );
      }
    }

    const deviceType = await DeviceType.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          emoji: body.emoji,
          slug: body.slug,
          description: body.description || "",
          isActive: body.isActive !== false,
          order: body.order || 0,
        },
      },
      { new: true }
    );

    if (!deviceType) {
      return NextResponse.json(
        { error: "Device type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        deviceType,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating device type:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update device type",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid device type ID" }, { status: 400 });
    }

    await connectDB();

    const deviceType = await DeviceType.findByIdAndDelete(id);

    if (!deviceType) {
      return NextResponse.json(
        { error: "Device type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Device type deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting device type:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete device type",
      },
      { status: 500 }
    );
  }
}
