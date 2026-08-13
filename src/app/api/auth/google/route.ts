import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { signJwt } from "@/lib/auth/jwt";
import { isProfileComplete } from "@/lib/auth/profileComplete";
import { isGoogleAvatarUrl } from "@/lib/ui/imageUrl";
import {
  checkRateLimitAsync,
  clientIpFromRequest,
} from "@/lib/security/authRateLimit";

function getGoogleClientId() {
  return (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  );
}

/** Refresh Google photo when empty or still pointing at Google CDN (never overwrite blob uploads). */
function shouldSyncGooglePicture(
  existing: string | undefined | null,
  next: string,
) {
  if (!next) return false;
  if (!existing) return true;
  return isGoogleAvatarUrl(existing);
}

/** POST /api/auth/google — exchange Google ID token for SparesX session */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromRequest(req);
    const ipLimit = await checkRateLimitAsync({
      key: `google-auth:ip:${ip}`,
      limit: 30,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { message: "Too many Google sign-in attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSec || 60) },
        },
      );
    }

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
    const pictureRaw = payload.picture || "";
    const { sanitizeStoredImageUrl } = await import(
      "@/lib/security/allowedImageUrl"
    );
    const picture =
      sanitizeStoredImageUrl(pictureRaw, { allowGoogleAvatar: true }) || "";

    await connectDB();

    let user = (await User.findOne({ googleId })) || null;

    if (!user) {
      const byEmail = await User.findOne({ email });
      if (byEmail) {
        // Never auto-link Google onto a password account — require explicit
        // link while signed in (POST /api/auth/google/link).
        if (byEmail.password && !byEmail.googleId) {
          return NextResponse.json(
            {
              message:
                "An account with this email already exists. Sign in with your password, then link Google from your profile.",
              code: "PASSWORD_ACCOUNT_EXISTS",
            },
            { status: 409 },
          );
        }
        user = byEmail;
      }
    }

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
      if (!user.emailVerified) {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        dirty = true;
      }
      if (picture && shouldSyncGooglePicture(user.profilePicture, picture)) {
        user.profilePicture = picture;
        dirty = true;
      }
      if (dirty) await user.save();
    }

    const accessToken = signJwt({
      _id: user._id,
      role: user.role,
      sessionVersion: user.sessionVersion || 0,
    });
    const { applyAuthCookies } = await import("@/lib/auth/cookies");
    const res = NextResponse.json(
      {
        role: user.role,
        name: user.name,
        emailVerified: !!user.emailVerified,
        phoneVerified: !!user.phoneVerified,
        hasPassword: Boolean(user.password),
        profileComplete: isProfileComplete(user),
      },
      { status: 200 },
    );
    await applyAuthCookies(res, accessToken, {
      userId: String(user._id),
      userAgent: req.headers.get("user-agent"),
    });
    return res;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { message: "Google Sign-In failed. Please try again." },
      { status: 401 },
    );
  }
}
