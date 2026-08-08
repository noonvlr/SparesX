import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import DeviceType from "@/lib/models/DeviceType";
import Category from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidateCategoryCaches } from "@/lib/categories/revalidate";
import { normalizeCategoryName } from "@/lib/categories/normalize";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: admin.status });
  }

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
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: admin.status });
  }

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

    // Retire legacy global categories with the same display name and remap products
    const nameKey = normalizeCategoryName(category.name);
    const globalDupes = await Category.find({
      _id: { $ne: category._id },
      $or: [{ deviceId: null }, { deviceId: { $exists: false } }],
      isActive: true,
    })
      .select("_id name slug")
      .lean();

    const toRetire = globalDupes.filter(
      (g) => normalizeCategoryName(g.name) === nameKey,
    );

    for (const dup of toRetire) {
      await Product.updateMany(
        { partType: { $in: [dup.slug, dup.name] } },
        { $set: { partType: category.slug } },
      );
      await Category.updateOne(
        { _id: dup._id },
        { $set: { isActive: false } },
      );
    }

    revalidateCategoryCaches();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create part category" },
      { status: 500 },
    );
  }
}
