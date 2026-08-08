import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyJwt } from "@/lib/auth/jwt";
import { fetchPublicProfile } from "@/lib/users/publicProfile";

/**
 * Public profile — never returns contact/PII fields
 * (email, mobile, whatsapp, address, pinCode, OTPs).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
    }

    const bundle = await fetchPublicProfile(id);
    if (!bundle) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let viewerId: string | null = null;
    const { getTokenFromRequest } = await import(
      "@/lib/auth/getTokenFromRequest"
    );
    const token = getTokenFromRequest(req);
    if (token) {
      const payload = verifyJwt(token);
      if (payload?.id) viewerId = payload.id;
    }

    return NextResponse.json(
      {
        profile: bundle.profile,
        listings: bundle.listings,
        meta: {
          isOwnProfile: viewerId === bundle.profile._id,
          listingCount: bundle.listingCount,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to load profile" },
      { status: 500 },
    );
  }
}
