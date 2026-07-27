import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { User } from "@/lib/models/User";
import { verifyJwt } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const tickets = await SupportRequest.find({ user: payload.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch support requests" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Login required to contact admin" },
        { status: 401 },
      );
    }
    const payload = verifyJwt(authHeader.split(" ")[1]);
    if (!payload?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { type, subject, message } = await req.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { message: "Subject and message are required" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(payload.id).select("name email");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const ticket = await SupportRequest.create({
      user: payload.id,
      name: user.name,
      email: user.email,
      type: type || "issue",
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to submit support request" },
      { status: 500 },
    );
  }
}
