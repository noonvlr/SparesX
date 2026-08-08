import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import {
  normalizeEmail,
  normalizeAbout,
  MAX_ABOUT_LENGTH,
  parseContactFields,
} from "@/lib/validation/userContact";
import {
  sanitizeUserForClient,
  USER_CLIENT_EXCLUDE,
} from "@/lib/auth/publicUser";

// Get technician profile
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const user = await User.findById(auth.id).select(USER_CLIENT_EXCLUDE);
  if (!user || user.isBlocked) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  return NextResponse.json(
    { user: sanitizeUserForClient(user) },
    { status: 200 },
  );
}

// Update technician profile
export async function PUT(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;
  if (auth.role !== "technician") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  await connectDB();
  const user = await User.findById(auth.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const contactInput = {
    name: body.name,
    email: body.email,
    mobile: body.mobile,
    whatsappNumber: body.whatsappNumber,
    pinCode: body.pinCode,
    countryCode: body.countryCode,
    address: body.address,
    city: body.city,
    state: body.state,
  };

  const presentKeys = (
    Object.keys(contactInput) as (keyof typeof contactInput)[]
  ).filter((k) => body[k] !== undefined);

  if (presentKeys.length > 0) {
    const parsed = parseContactFields(contactInput, {
      fieldsPresent: presentKeys,
    });
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    if (parsed.data.name !== undefined) user.name = parsed.data.name;

    if (parsed.data.email !== undefined) {
      const nextEmail = normalizeEmail(parsed.data.email);
      if (nextEmail !== user.email) {
        const existing = await User.findOne({
          email: nextEmail,
          _id: { $ne: user._id },
        }).select("_id");
        if (existing) {
          return NextResponse.json(
            { message: "Email already registered" },
            { status: 409 },
          );
        }
        user.email = nextEmail;
        user.emailVerified = false;
        user.emailVerifiedAt = undefined;
        user.emailVerifyOTP = undefined;
        user.emailVerifyOTPExpiry = undefined;
      }
    }

    if (parsed.data.mobile !== undefined) {
      if (parsed.data.mobile !== user.mobile) {
        user.mobile = parsed.data.mobile;
        user.phoneVerified = false;
        user.phoneVerifiedAt = undefined;
        user.phoneVerifyOTP = undefined;
        user.phoneVerifyOTPExpiry = undefined;
      }
    }

    if (parsed.data.countryCode !== undefined) {
      const nextCc = parsed.data.countryCode;
      if (nextCc !== user.countryCode) {
        user.countryCode = nextCc;
        user.phoneVerified = false;
        user.phoneVerifiedAt = undefined;
        user.phoneVerifyOTP = undefined;
        user.phoneVerifyOTPExpiry = undefined;
      }
    }

    if (parsed.data.address !== undefined) user.address = parsed.data.address;
    if (parsed.data.city !== undefined) user.city = parsed.data.city;
    if (parsed.data.state !== undefined) user.state = parsed.data.state;
    if (parsed.data.pinCode !== undefined) user.pinCode = parsed.data.pinCode;
    if (parsed.data.whatsappNumber !== undefined) {
      user.whatsappNumber = parsed.data.whatsappNumber;
    }
  }

  if (body.profilePicture !== undefined) {
    user.profilePicture = String(body.profilePicture || "");
  }

  if (body.about !== undefined) {
    const raw = String(body.about ?? "");
    if (raw.trim().length > MAX_ABOUT_LENGTH) {
      return NextResponse.json(
        { message: `About must be at most ${MAX_ABOUT_LENGTH} characters` },
        { status: 400 },
      );
    }
    user.about = normalizeAbout(body.about);
  }

  await user.save();

  const updatedUser = await User.findById(auth.id).select(USER_CLIENT_EXCLUDE);
  return NextResponse.json(
    {
      message: "Profile updated",
      user: updatedUser ? sanitizeUserForClient(updatedUser) : null,
    },
    { status: 200 },
  );
}
