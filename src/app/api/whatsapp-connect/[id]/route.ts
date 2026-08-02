import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";
import { WhatsAppConnect } from "@/lib/models/WhatsAppConnect";

/**
 * PATCH /api/whatsapp-connect/[id]
 * Seller: approve | decline | revoke
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const action = String(body?.action || "").trim();

    const row = await WhatsAppConnect.findById(id);
    if (!row) {
      return NextResponse.json({ message: "Request not found" }, { status: 404 });
    }

    const isSeller = String(row.seller) === auth.id;
    const isRequester = String(row.requester) === auth.id;

    if (action === "approve" || action === "decline") {
      if (!isSeller) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      if (row.status !== "pending") {
        return NextResponse.json(
          { message: "Only pending requests can be answered" },
          { status: 400 },
        );
      }
      row.status = action === "approve" ? "approved" : "declined";
      row.respondedAt = new Date();
      await row.save();

      return NextResponse.json({
        message:
          action === "approve"
            ? "Approved. This user can now contact you on WhatsApp for any listing."
            : "Request declined",
        status: row.status,
      });
    }

    if (action === "revoke") {
      // Seller can revoke an approved unlock
      if (!isSeller || row.status !== "approved") {
        // Requester can cancel their pending request
        if (isRequester && row.status === "pending") {
          row.status = "revoked";
          row.respondedAt = new Date();
          await row.save();
          return NextResponse.json({
            message: "Request cancelled",
            status: "revoked",
          });
        }
        if (!isSeller) {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json(
          { message: "Nothing to revoke" },
          { status: 400 },
        );
      }
      row.status = "revoked";
      row.respondedAt = new Date();
      await row.save();
      return NextResponse.json({
        message: "WhatsApp access revoked for this user",
        status: "revoked",
      });
    }

    return NextResponse.json(
      { message: "Invalid action. Use approve, decline, or revoke." },
      { status: 400 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
