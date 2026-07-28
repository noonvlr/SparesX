import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { RequestModel } from "@/lib/models/Request";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";

function isOwner(doc: { userId?: unknown }, userId: string) {
  return String(doc.userId || "") === String(userId);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const { id } = await params;
    await connectDB();
    const requestDoc = await RequestModel.findById(id).lean();
    if (!requestDoc) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    const isAdmin = user.role === "admin";
    if (!isAdmin && !isOwner(requestDoc as any, user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ request: requestDoc }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const requestDoc = await RequestModel.findById(id);
    if (!requestDoc) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    const isAdmin = user.role === "admin";
    if (!isAdmin && !isOwner(requestDoc, user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (body.status) {
      if (!["open", "fulfilled", "closed"].includes(body.status)) {
        return NextResponse.json({ message: "Invalid status" }, { status: 400 });
      }
      requestDoc.status = body.status;
    }

    if (typeof body.description === "string") {
      const description = body.description.trim().slice(0, 4000);
      if (!description) {
        return NextResponse.json(
          { message: "Description cannot be empty" },
          { status: 400 },
        );
      }
      requestDoc.description = description;
    }
    if (typeof body.category === "string") {
      requestDoc.category = body.category.trim().slice(0, 120);
    }
    if (typeof body.deviceCategory === "string") {
      requestDoc.deviceCategory = body.deviceCategory.trim().slice(0, 120);
    }
    if (typeof body.brand === "string") {
      requestDoc.brand = body.brand.trim().slice(0, 120);
    }
    if (typeof body.deviceModel === "string") {
      requestDoc.deviceModel = body.deviceModel.trim().slice(0, 120);
    }
    if (typeof body.phone === "string") {
      requestDoc.phone = body.phone.trim().slice(0, 30);
    }

    await requestDoc.save();
    return NextResponse.json({ request: requestDoc }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = requireUser(req);
  if (isAuthError(user)) return user;

  try {
    const { id } = await params;
    await connectDB();
    const requestDoc = await RequestModel.findById(id);
    if (!requestDoc) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    const isAdmin = user.role === "admin";
    if (!isAdmin && !isOwner(requestDoc, user.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await requestDoc.deleteOne();
    return NextResponse.json({ message: "Request deleted" }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
