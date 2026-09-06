import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import {
  createTechnicianListing,
  normalizeCondition,
  parseListingsCsv,
} from "@/lib/products/createListing";
import {
  checkRateLimitAsync,
  clientIpFromRequest,
} from "@/lib/security/authRateLimit";

const MAX_BULK_ROWS = 50;

/**
 * POST — CSV or JSON rows bulk create
 * PATCH — bulk price update / mark sold / archive (delete soft via sold? use delete status)
 *
 * Body POST:
 *   { csv: "brand,deviceModel,..." }
 *   or { rows: [{ brand, deviceModel, partType, deviceCategory, condition, price, description, ... }] }
 *
 * Body PATCH:
 *   { action: "price" | "sold" | "delete", ids: string[], price?: number, soldVia?: "sparesx"|"other" }
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const ip = clientIpFromRequest(req);
  const rate = await checkRateLimitAsync({
    key: `listing-bulk:${auth.id}:${ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Too many bulk imports. Try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    let rawRows: Array<Record<string, string>> = [];

    if (typeof body?.csv === "string" && body.csv.trim()) {
      const parsed = parseListingsCsv(body.csv);
      if (parsed.errors.length) {
        return NextResponse.json(
          { message: "Invalid CSV", errors: parsed.errors },
          { status: 400 },
        );
      }
      rawRows = parsed.rows;
    } else if (Array.isArray(body?.rows)) {
      rawRows = body.rows.map((r: Record<string, unknown>) => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(r || {})) {
          out[String(k).toLowerCase().replace(/[_\s-]/g, "")] = String(
            v ?? "",
          ).trim();
        }
        return out;
      });
    } else {
      return NextResponse.json(
        {
          message:
            "Provide csv text or rows[]. Columns: brand, deviceModel, partType, deviceCategory, condition, price, description (optional modelNumber, priceNegotiable)",
        },
        { status: 400 },
      );
    }

    if (rawRows.length === 0) {
      return NextResponse.json({ message: "No rows to import" }, { status: 400 });
    }
    if (rawRows.length > MAX_BULK_ROWS) {
      return NextResponse.json(
        { message: `Maximum ${MAX_BULK_ROWS} rows per import` },
        { status: 400 },
      );
    }

    const created: Array<{ id: string; possibleDuplicate: boolean }> = [];
    const failures: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const condition = normalizeCondition(row.condition || "");
      const price = Number(row.price);
      if (!condition || !Number.isFinite(price)) {
        failures.push({
          row: i + 1,
          message: "Invalid condition or price",
        });
        continue;
      }
      try {
        const result = await createTechnicianListing({
          technicianId: auth.id,
          input: {
            brand: row.brand,
            deviceModel: row.devicemodel || row.model,
            partType: row.parttype,
            deviceCategory: row.devicecategory || "mobile",
            condition,
            price,
            description:
              row.description ||
              `${row.brand} ${row.devicemodel || ""} ${row.parttype}`.trim(),
            modelNumber: row.modelnumber || "",
            priceNegotiable:
              row.pricenegotiable === "1" ||
              row.pricenegotiable === "true" ||
              row.negotiable === "1",
          },
        });
        created.push({
          id: String(result.product._id),
          possibleDuplicate: result.possibleDuplicate,
        });
      } catch (err: unknown) {
        failures.push({
          row: i + 1,
          message: err instanceof Error ? err.message : "Failed",
        });
      }
    }

    return NextResponse.json(
      {
        message: `Imported ${created.length} listing(s)`,
        created,
        failures,
        createdCount: created.length,
        failedCount: failures.length,
      },
      { status: created.length ? 201 : 400 },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Bulk import failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const action = String(body?.action || "").trim();
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id: unknown) => String(id)).filter(Boolean)
      : [];
    if (!ids.length || ids.length > MAX_BULK_ROWS) {
      return NextResponse.json(
        { message: `Provide 1–${MAX_BULK_ROWS} ids` },
        { status: 400 },
      );
    }
    const oids = ids
      .filter((id: string) => Types.ObjectId.isValid(id))
      .map((id: string) => new Types.ObjectId(id));

    await connectDB();
    const filter = { _id: { $in: oids }, technician: auth.id };

    if (action === "price") {
      const price = Number(body?.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ message: "Valid price required" }, { status: 400 });
      }
      const result = await Product.updateMany(filter, { $set: { price } });
      return NextResponse.json({
        message: "Prices updated",
        modified: result.modifiedCount,
      });
    }

    if (action === "sold") {
      const soldVia = body?.soldVia === "other" ? "other" : "sparesx";
      const result = await Product.updateMany(
        { ...filter, status: "approved" },
        {
          $set: {
            status: "sold",
            soldVia,
            soldAt: new Date(),
            featured: false,
          },
        },
      );
      if (soldVia === "sparesx" && result.modifiedCount > 0) {
        const { User } = await import("@/lib/models/User");
        await User.findByIdAndUpdate(auth.id, {
          $inc: { completedSales: result.modifiedCount },
        });
        try {
          const { recomputeUserBadges } = await import("@/lib/badges/engine");
          void recomputeUserBadges(auth.id);
        } catch {
          // ignore
        }
      }
      try {
        const { revalidateListingCaches } = await import(
          "@/lib/products/revalidateListings"
        );
        revalidateListingCaches();
      } catch {
        // cache optional
      }
      return NextResponse.json({
        message: "Marked sold",
        modified: result.modifiedCount,
      });
    }

    if (action === "delete") {
      const toDelete = await Product.find({
        ...filter,
        status: { $in: ["pending", "rejected", "sold"] },
      })
        .select("images")
        .lean();
      const result = await Product.deleteMany({
        ...filter,
        status: { $in: ["pending", "rejected", "sold"] },
      });
      if (toDelete.length) {
        const { deleteImagesForProducts } = await import(
          "@/lib/images/deleteProductImages"
        );
        void deleteImagesForProducts(toDelete);
      }
      return NextResponse.json({
        message: "Deleted",
        deleted: result.deletedCount,
      });
    }

    return NextResponse.json(
      { message: 'action must be "price", "sold", or "delete"' },
      { status: 400 },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Bulk update failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
