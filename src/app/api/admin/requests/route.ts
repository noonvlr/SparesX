import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "40", 10) || 40),
    );

    const query: Record<string, unknown> = {};
    if (status && status !== "all") query.status = status;
    if (q?.trim()) {
      const rx = { $regex: q.trim(), $options: "i" };
      query.$or = [
        { name: rx },
        { email: rx },
        { phone: rx },
        { category: rx },
        { brand: rx },
        { deviceModel: rx },
        { description: rx },
        { deviceCategory: rx },
      ];
    }

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      requests,
      total,
      counts,
      topCategories,
      topBrands,
      topDevices,
      openLast7,
    ] = await Promise.all([
      RequestModel.find(query)
        .populate("userId", "name email mobile")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RequestModel.countDocuments(query),
      RequestModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      RequestModel.aggregate([
        {
          $match: {
            createdAt: { $gte: since30 },
            category: { $exists: true, $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: { $toLower: { $trim: { input: "$category" } } },
            count: { $sum: 1 },
            label: { $first: "$category" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      RequestModel.aggregate([
        {
          $match: {
            createdAt: { $gte: since30 },
            brand: { $exists: true, $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: { $toLower: { $trim: { input: "$brand" } } },
            count: { $sum: 1 },
            label: { $first: "$brand" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      RequestModel.aggregate([
        {
          $match: {
            createdAt: { $gte: since30 },
            deviceCategory: { $exists: true, $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: { $toLower: { $trim: { input: "$deviceCategory" } } },
            count: { $sum: 1 },
            label: { $first: "$deviceCategory" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      RequestModel.countDocuments({
        status: "open",
        createdAt: { $gte: since7 },
      }),
    ]);

    const statusCounts = { open: 0, fulfilled: 0, closed: 0, all: 0 };
    for (const row of counts) {
      if (row._id in statusCounts) {
        statusCounts[row._id as keyof typeof statusCounts] = row.count;
      }
      statusCounts.all += row.count;
    }

    const mapDemand = (
      rows: { label?: string; _id?: string; count: number }[],
    ) =>
      rows.map((r) => ({
        name: String(r.label || r._id || "").trim() || "Unknown",
        count: r.count,
      }));

    return NextResponse.json({
      requests,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
      statusCounts,
      demand: {
        windowDays: 30,
        openLast7Days: openLast7,
        topCategories: mapDemand(topCategories),
        topBrands: mapDemand(topBrands),
        topDeviceCategories: mapDemand(topDevices),
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
