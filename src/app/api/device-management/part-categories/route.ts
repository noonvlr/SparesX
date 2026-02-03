import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import DeviceType from "@/lib/models/DeviceType";
import Category from "@/lib/models/Category";
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

async function buildUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 2;
  while (await Category.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return slug;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    let query: Record<string, any> = { deviceId: { $exists: true } };
    if (deviceId) {
      if (!Types.ObjectId.isValid(deviceId)) {
        return NextResponse.json({ error: "Invalid deviceId" }, { status: 400 });
      }
      query = { deviceId };
    }

    const categories = await Category.find(query)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch part categories" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { deviceId, name, icon } = body;

    if (!deviceId || !name) {
      return NextResponse.json(
        { error: "deviceId and name are required" },
        { status: 400 },
      );
    }

    if (!Types.ObjectId.isValid(deviceId)) {
      return NextResponse.json({ error: "Invalid deviceId" }, { status: 400 });
    }

    await connectDB();

    const deviceExists = await DeviceType.findById(deviceId).lean();
    if (!deviceExists) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 },
      );
    }

    const nameRegex = new RegExp(`^${escapeRegex(name.trim())}$`, "i");
    const existingName = await Category.findOne({
      deviceId,
      name: nameRegex,
    });

    if (existingName) {
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

    const deviceSlug = deviceExists.slug || deviceExists._id.toString();
    const scopedBase = slugify(`${deviceSlug}-${baseSlug}`);
    const slug = await buildUniqueSlug(scopedBase);

    const categoryPayload: Record<string, any> = {
      deviceId,
      name: name.trim(),
      slug,
      isActive: true,
    };
    if (icon && String(icon).trim()) {
      categoryPayload.icon = String(icon).trim();
    }

    const category = await Category.create(categoryPayload);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create part category" },
      { status: 500 },
    );
  }
}
