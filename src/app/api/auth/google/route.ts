import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { signJwt } from "@/lib/auth/jwt";
import { isProfileComplete } from "@/lib/auth/profileComplete";

function getGoogleClientId() {
  return (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  );
}

/** POST /api/auth/google — exchange Google ID token for SparesX JWT */
export async function POST(req: NextRequest) {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      return NextResponse.json(
        { message: "Google Sign-In is not configured" },
        { status: 503 },
      );
    }

    const body = await req.json();
    const idToken = String(body?.idToken || "").trim();
    if (!idToken) {
      return NextResponse.json(
        { message: "Google ID token is required" },
        { status: 400 },
      );
    }

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
    const name = (payload.name || email.split("@")[0] || "User").trim();
    const picture = payload.picture || "";

    await connectDB();

    let user =
      (await User.findOne({ googleId })) ||
      (await User.findOne({ email }));

    if (user?.isBlocked) {
      return NextResponse.json(
        { message: "Account blocked" },
        { status: 403 },
      );
    }

    if (!user) {
      user = await User.create({
        name,
        email,
        role: "technician",
        authProvider: "google",
        googleId,
        profilePicture: picture,
        countryCode: "+91",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        mobile: "",
        whatsappNumber: "",
        address: "",
        pinCode: "",
        city: "",
        state: "",
      });
    } else {
      let dirty = false;
      if (!user.googleId) {
        user.googleId = googleId;
        dirty = true;
      }
      if (user.authProvider !== "google" && !user.password) {
        user.authProvider = "google";
        dirty = true;
      }
      // Keep local password accounts as local but allow Google link
      if (!user.emailVerified) {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        dirty = true;
      }
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
        dirty = true;
      }
      if (dirty) await user.save();
    }

    const token = signJwt({ _id: user._id, role: user.role });
    return NextResponse.json(
      {
        token,
        role: user.role,
        name: user.name,
        emailVerified: !!user.emailVerified,
        phoneVerified: !!user.phoneVerified,
        hasPassword: Boolean(user.password),
        profileComplete: isProfileComplete(user),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { message: "Google Sign-In failed. Please try again." },
      { status: 401 },
    );
  }
}
