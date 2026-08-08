import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

void User;

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const featured = searchParams.get("featured");
    const tag = searchParams.get("tag")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const query: Record<string, unknown> = {};
    if (status && status !== "all") query.status = status;
    if (featured === "true") query.featured = true;
    if (featured === "false") query.featured = { $ne: true };
    if (tag) query.tags = tag;
    if (q?.trim()) {
      const rx = { $regex: q.trim(), $options: "i" };
      query.$or = [
        { name: rx },
        { brand: rx },
        { deviceModel: rx },
        { partType: rx },
        { deviceCategory: rx },
      ];
    }

    const [products, total, counts, duplicateCount] = await Promise.all([
      Product.find(query)
        .populate("technician", "name email mobile")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
      Product.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Product.countDocuments({ tags: "possible_duplicate" }),
    ]);

    const statusCounts = { pending: 0, approved: 0, rejected: 0, all: 0 };
    for (const row of counts) {
      if (row._id in statusCounts) {
        statusCounts[row._id as keyof typeof statusCounts] = row.count;
      }
      statusCounts.all += row.count;
    }

    return NextResponse.json(
      {
        products,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        statusCounts,
        duplicateCount,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
