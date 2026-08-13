import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { SupportRequest } from "@/lib/models/SupportRequest";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { ensureCaseNumber } from "@/lib/support/caseNumber";
import { serializePublicCase } from "@/lib/support/serialize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser(req);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Case not found" }, { status: 404 });
    }

    await connectDB();
    const ticket = await SupportRequest.findOne({
      _id: id,
      user: auth.id,
    }).lean();

    if (!ticket) {
      return NextResponse.json({ message: "Case not found" }, { status: 404 });
    }

    await ensureCaseNumber(ticket);
    return NextResponse.json(
      { ticket: serializePublicCase(ticket) },
      { status: 200 },
    );
  } catch (error) {
    console.error("[support/:id]", error);
    return NextResponse.json(
      { message: "Failed to load support case" },
      { status: 500 },
    );
  }
}
