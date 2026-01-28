import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";

export async function GET() {
  await connectDB();
  const sellers = await User.find({ role: "technician", isBlocked: false })
    .select("name createdAt")
    .sort({ createdAt: -1 })
    .limit(24);

  return NextResponse.json({ sellers }, { status: 200 });
}
