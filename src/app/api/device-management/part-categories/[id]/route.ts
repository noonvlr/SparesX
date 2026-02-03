import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import Category from "@/lib/models/Category";
import DeviceType from "@/lib/models/DeviceType";
import { verifyJwt } from "@/lib/auth/jwt";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

async function buildUniqueSlug(baseSlug: string, excludeId: string) {
  let slug = baseSlug;
  let counter = 2;
  while (await Category.exists({ slug, _id: { $ne: excludeId } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return slug;
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

    const body = await req.json();
    const { name, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
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

    const nameRegex = new RegExp(`^${escapeRegex(name.trim())}$`, "i");
    const duplicate = await Category.findOne({
      deviceId: existing.deviceId,
      _id: { $ne: id },
      name: nameRegex,
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Parts category already exists for this device" },
        { status: 400 },
      );
    }

    const baseSlug = slugify(name);
    if (!baseSlug) {
      return NextResponse.json(
        { error: "Unable to generate slug from name" },
        { status: 400 },
      );
    }

    const device = await DeviceType.findById(existing.deviceId).lean();
    const deviceSlug = device?.slug || existing.deviceId.toString();
    const scopedBase = slugify(`${deviceSlug}-${baseSlug}`);
    const slug = await buildUniqueSlug(scopedBase, id);

    const updatePayload: Record<string, any> = {
      name: name.trim(),
      slug,
      updatedAt: new Date(),
    };
    if (icon && String(icon).trim()) {
      updatePayload.icon = String(icon).trim();
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      {
        $set: updatePayload,
      },
      { new: true },
    );

    return NextResponse.json({ category: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update part category" },
      { status: 500 },
    );
  }
}
