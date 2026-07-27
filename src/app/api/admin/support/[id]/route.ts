import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { verifyJwt } from "@/lib/auth/jwt";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { status, adminReply } = await req.json();

    await connectDB();
    const ticket = await SupportRequest.findById(id);
    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    if (status) ticket.status = status;
    if (typeof adminReply === "string") ticket.adminReply = adminReply.trim();
    await ticket.save();

    return NextResponse.json({ ticket }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update ticket" },
      { status: 500 },
    );
  }
}
