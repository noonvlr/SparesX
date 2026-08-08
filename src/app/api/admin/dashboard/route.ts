import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { Product } from "@/lib/models/Product";
import { RequestModel } from "@/lib/models/Request";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminError(admin)) return admin;

  await connectDB();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [
    userCount,
    technicianCount,
    productCount,
    pendingProducts,
    openRequests,
    unreadSupport,
    blockedUsers,
    conversationCount,
    messageCount,
    listingSeries,
    requestSeries,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "technician" }),
    Product.countDocuments(),
    Product.countDocuments({ status: "pending" }),
    RequestModel.countDocuments({ status: "open" }),
    SupportRequest.countDocuments({ adminUnread: { $ne: false } }),
    User.countDocuments({ isBlocked: true }),
    Conversation.countDocuments(),
    Message.countDocuments(),
    Product.aggregate([
      { $match: { createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          listings: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    RequestModel.aggregate([
      { $match: { createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          requests: { $sum: 1 },
          open: {
            $sum: {
              $cond: [{ $eq: ["$status", "open"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const byDay = new Map<
    string,
    { date: string; listings: number; approved: number; requests: number; open: number }
  >();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, {
      date: key,
      listings: 0,
      approved: 0,
      requests: 0,
      open: 0,
    });
  }
  for (const row of listingSeries) {
    const key = String(row._id);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.listings = row.listings || 0;
      bucket.approved = row.approved || 0;
    }
  }
  for (const row of requestSeries) {
    const key = String(row._id);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.requests = row.requests || 0;
      bucket.open = row.open || 0;
    }
  }

  return NextResponse.json(
    {
      userCount,
      technicianCount,
      productCount,
      pendingProducts,
      openRequests,
      unreadSupport,
      blockedUsers,
      conversationCount,
      messageCount,
      series: Array.from(byDay.values()),
    },
    { status: 200 },
  );
}
