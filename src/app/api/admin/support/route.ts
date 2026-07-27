import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";
import { verifyJwt } from "@/lib/auth/jwt";

void User;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status && status !== "all") query.status = status;

    const tickets = await SupportRequest.find(query)
      .populate("user", "name email profilePicture role")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch support tickets" },
      { status: 500 },
    );
  }
}
