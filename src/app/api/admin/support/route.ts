import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import {
  SUPPORT_PRIORITY_SET,
  SUPPORT_STATUS_SET,
  SUPPORT_TARGET_SET,
  SUPPORT_TYPE_SET,
  escapeRegex,
} from "@/lib/support/constants";
import { ensureCaseNumber } from "@/lib/support/caseNumber";
import { serializeAdminListItem } from "@/lib/support/serialize";

void User;

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (isAdminError(admin)) return admin;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const targetType = searchParams.get("targetType");
    const reason = searchParams.get("reason");
    const priority = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");
    const q = (searchParams.get("q") || "").trim().slice(0, 120);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sort = searchParams.get("sort") || "unresolved";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "40", 10) || 40),
    );

    const query: Record<string, unknown> = {};
    if (status === "unread") {
      query.adminUnread = { $ne: false };
    } else if (status && status !== "all" && SUPPORT_STATUS_SET.has(status)) {
      query.status = status;
    }
    if (type && type !== "all" && SUPPORT_TYPE_SET.has(type)) {
      query.type = type;
    }
    if (targetType && targetType !== "all" && SUPPORT_TARGET_SET.has(targetType)) {
      query.targetType = targetType;
    }
    if (reason && reason !== "all") {
      query.reason = reason.slice(0, 80);
    }
    if (priority && priority !== "all" && SUPPORT_PRIORITY_SET.has(priority)) {
      query.priority = priority;
    }
    if (assignedTo === "unassigned") {
      query.assignedTo = { $exists: false };
    } else if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      query.assignedTo = assignedTo;
    }

    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) createdAt.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) createdAt.$lte = d;
      }
      if (Object.keys(createdAt).length) query.createdAt = createdAt;
    }

    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      const or: Record<string, unknown>[] = [
        { caseNumber: rx },
        { email: rx },
        { name: rx },
        { subject: rx },
        { "productSnapshot.productTitle": rx },
        { "productSnapshot.productId": rx },
        { "reportedUserSnapshot.name": rx },
        { "reportedUserSnapshot.userId": rx },
      ];
      if (mongoose.Types.ObjectId.isValid(q)) {
        or.push({ _id: q });
        or.push({ user: q });
        or.push({ product: q });
        or.push({ reportedUser: q });
      }
      query.$or = or;
    }

    let sortSpec: Record<string, 1 | -1> = { adminUnread: -1, createdAt: -1 };
    if (sort === "oldest") sortSpec = { createdAt: 1 };
    else if (sort === "newest") sortSpec = { createdAt: -1 };
    else if (sort === "priority") sortSpec = { priority: -1, createdAt: -1 };
    else if (sort === "updated") sortSpec = { updatedAt: -1 };
    else if (sort === "unresolved") {
      // Open / in progress first, then unread, then newest
      sortSpec = { status: 1, adminUnread: -1, createdAt: -1 };
    }

    const todayStart = startOfUtcDay();
    const [
      tickets,
      total,
      unreadCount,
      openCount,
      reviewCount,
      highPriorityCount,
      resolvedToday,
    ] = await Promise.all([
      SupportRequest.find(query)
        .populate("user", "name email profilePicture role isBlocked")
        .populate("reportedUser", "name email mobile isBlocked")
        .populate("product", "name status slug")
        .populate("assignedTo", "name email")
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SupportRequest.countDocuments(query),
      SupportRequest.countDocuments({ adminUnread: { $ne: false } }),
      SupportRequest.countDocuments({ status: "open" }),
      SupportRequest.countDocuments({ status: "in_progress" }),
      SupportRequest.countDocuments({
        priority: "high",
        status: { $in: ["open", "in_progress", "waiting_user"] },
      }),
      SupportRequest.countDocuments({
        status: "resolved",
        updatedAt: { $gte: todayStart },
      }),
    ]);

    for (const ticket of tickets) {
      await ensureCaseNumber(ticket);
    }

    return NextResponse.json(
      {
        tickets: tickets.map((t) => serializeAdminListItem(t)),
        unreadCount,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
        stats: {
          open: openCount,
          underReview: reviewCount,
          highPriority: highPriorityCount,
          resolvedToday,
          unread: unreadCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[admin/support GET]", error);
    return NextResponse.json(
      { message: "Failed to fetch support tickets" },
      { status: 500 },
    );
  }
}
