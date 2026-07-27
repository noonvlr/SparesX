import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";
import { User } from "@/lib/models/User";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

void User;

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

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

    const [requests, counts] = await Promise.all([
      RequestModel.find(query)
        .populate("userId", "name email mobile")
        .sort({ createdAt: -1 })
        .lean(),
      RequestModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = { open: 0, fulfilled: 0, closed: 0, all: 0 };
    for (const row of counts) {
      if (row._id in statusCounts) {
        statusCounts[row._id as keyof typeof statusCounts] = row.count;
      }
      statusCounts.all += row.count;
    }

    return NextResponse.json({ requests, statusCounts }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
