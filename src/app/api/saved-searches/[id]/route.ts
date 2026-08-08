import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { SavedSearch } from "@/lib/models/SavedSearch";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDB();
    const deleted = await SavedSearch.findOneAndDelete({
      _id: id,
      userId: auth.id,
    });
    if (!deleted) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Removed" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to remove saved search" },
      { status: 500 },
    );
  }
}
