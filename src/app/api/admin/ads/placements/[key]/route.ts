import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import { AdPlacement } from "@/lib/models/AdPlacement";
import { serializePlacement } from "@/lib/ads/serialize";

const EDITABLE = new Set([
  "name",
  "description",
  "pageLocation",
  "desktop",
  "mobile",
  "supportedDevices",
  "enabled",
  "maxSlots",
  "fallbackToHouseAds",
]);

function isSize(value: unknown): value is { width: number; height: number } {
  if (!value || typeof value !== "object") return false;
  const v = value as { width?: unknown; height?: unknown };
  return (
    typeof v.width === "number" &&
    typeof v.height === "number" &&
    Number.isFinite(v.width) &&
    Number.isFinite(v.height) &&
    v.width >= 1 &&
    v.height >= 1
  );
}

type Ctx = { params: Promise<{ key: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { key } = await ctx.params;
    await connectDB();
    const doc = await AdPlacement.findOne({ key }).lean();
    if (!doc) {
      return NextResponse.json({ message: "Placement not found" }, { status: 404 });
    }
    return NextResponse.json({ placement: serializePlacement(doc) });
  } catch (error) {
    console.error("[admin/ads/placements/[key] GET]", error);
    return NextResponse.json(
      { message: "Failed to load placement" },
      { status: 500 },
    );
  }
}

/** PATCH — edit mutable fields. `key` is immutable. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { key } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(body as Record<string, unknown>)) {
      if (!EDITABLE.has(field)) continue;

      if (field === "name" || field === "description" || field === "pageLocation") {
        if (typeof value !== "string") {
          return NextResponse.json(
            { message: `Invalid ${field}` },
            { status: 400 },
          );
        }
        updates[field] = value.trim();
        continue;
      }

      if (field === "enabled" || field === "fallbackToHouseAds") {
        if (typeof value !== "boolean") {
          return NextResponse.json(
            { message: `Invalid ${field}` },
            { status: 400 },
          );
        }
        updates[field] = value;
        continue;
      }

      if (field === "maxSlots") {
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 10) {
          return NextResponse.json(
            { message: "maxSlots must be an integer 1–10" },
            { status: 400 },
          );
        }
        updates.maxSlots = n;
        continue;
      }

      if (field === "desktop") {
        if (!isSize(value)) {
          return NextResponse.json(
            { message: "Invalid desktop size" },
            { status: 400 },
          );
        }
        updates.desktop = {
          width: Math.round(value.width),
          height: Math.round(value.height),
        };
        continue;
      }

      if (field === "mobile") {
        if (value === null) {
          updates.mobile = null;
          continue;
        }
        if (!isSize(value)) {
          return NextResponse.json(
            { message: "Invalid mobile size" },
            { status: 400 },
          );
        }
        updates.mobile = {
          width: Math.round(value.width),
          height: Math.round(value.height),
        };
        continue;
      }

      if (field === "supportedDevices") {
        if (!Array.isArray(value) || value.length === 0) {
          return NextResponse.json(
            { message: "supportedDevices must be a non-empty array" },
            { status: 400 },
          );
        }
        const devices = value.map(String);
        if (devices.some((d) => d !== "desktop" && d !== "mobile")) {
          return NextResponse.json(
            { message: "supportedDevices must be desktop and/or mobile" },
            { status: 400 },
          );
        }
        updates.supportedDevices = [...new Set(devices)];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
    }

    await connectDB();
    const doc = await AdPlacement.findOneAndUpdate(
      { key },
      { $set: updates },
      { new: true },
    ).lean();

    if (!doc) {
      return NextResponse.json({ message: "Placement not found" }, { status: 404 });
    }

    return NextResponse.json({ placement: serializePlacement(doc) });
  } catch (error) {
    console.error("[admin/ads/placements/[key] PATCH]", error);
    return NextResponse.json(
      { message: "Failed to update placement" },
      { status: 500 },
    );
  }
}
