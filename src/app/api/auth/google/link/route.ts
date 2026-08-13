import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { isGoogleAvatarUrl } from "@/lib/ui/imageUrl";

function getGoogleClientId() {
  return (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  );
}

function shouldSyncGooglePicture(
  existing: string | undefined | null,
  next: string,
) {
  if (!next) return false;
  if (!existing) return true;
  return isGoogleAvatarUrl(existing);
}

/**
 * POST /api/auth/google/link — link Google to the signed-in account.
 * Email on the Google token must match the current user.
 */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  const clientId = getGoogleClientId();
  if (!clientId) {
    return NextResponse.json(
      { message: "Google Sign-In is not configured" },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const idToken = String(body?.idToken || "").trim();
  if (!idToken) {
    return NextResponse.json(
      { message: "Google ID token is required" },
      { status: 400 },
    );
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return NextResponse.json(
        { message: "Invalid Google token" },
        { status: 401 },
      );
    }
    if (payload.email_verified === false) {
      return NextResponse.json(
        { message: "Google email is not verified" },
        { status: 400 },
      );
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();

    await connectDB();
    const user = await User.findById(auth.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.email.toLowerCase() !== email) {
      return NextResponse.json(
        {
          message:
            "Google account email must match your SparesX email. Sign in with that Google account.",
        },
        { status: 400 },
      );
    }

    if (user.googleId && user.googleId !== googleId) {
      return NextResponse.json(
        { message: "This account is already linked to a different Google ID" },
        { status: 409 },
      );
    }

    const taken = await User.findOne({
      googleId,
      _id: { $ne: user._id },
    }).select("_id");
    if (taken) {
      return NextResponse.json(
        { message: "This Google account is already linked elsewhere" },
        { status: 409 },
      );
    }

    user.googleId = googleId;
    if (!user.emailVerified) {
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
    }
    if (payload.picture && shouldSyncGooglePicture(user.profilePicture, payload.picture)) {
      user.profilePicture = payload.picture;
    }
    await user.save();

    return NextResponse.json(
      {
        ok: true,
        message: "Google account linked",
        googleLinked: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Google link error:", error);
    return NextResponse.json(
      { message: "Could not link Google account" },
      { status: 400 },
    );
  }
}
