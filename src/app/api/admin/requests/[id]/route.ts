import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const requestDoc = await RequestModel.findById(id);
    if (!requestDoc) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    if (body.status) {
      if (!["open", "fulfilled", "closed"].includes(body.status)) {
        return NextResponse.json({ message: "Invalid status" }, { status: 400 });
      }
      requestDoc.status = body.status;
    }

    if (typeof body.description === "string") {
      requestDoc.description = body.description.trim();
    }
    if (typeof body.category === "string") {
      requestDoc.category = body.category.trim();
    }
    if (typeof body.deviceCategory === "string") {
      requestDoc.deviceCategory = body.deviceCategory.trim();
    }
    if (typeof body.brand === "string") {
      requestDoc.brand = body.brand.trim();
    }
    if (typeof body.deviceModel === "string") {
      requestDoc.deviceModel = body.deviceModel.trim();
    }
    if (typeof body.phone === "string") {
      requestDoc.phone = body.phone.trim();
    }

    await requestDoc.save();
    return NextResponse.json({ request: requestDoc }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = requireAdmin(req);
  if (isAdminError(admin)) return admin;

  try {
    const { id } = await params;
    await connectDB();
    const deleted = await RequestModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Request deleted" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete request" },
      { status: 500 },
    );
  }
}
