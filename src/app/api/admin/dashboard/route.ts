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
  const admin = requireAdmin(req);
  if (isAdminError(admin)) return admin;

  await connectDB();
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
  ]);

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
    },
    { status: 200 },
  );
}
