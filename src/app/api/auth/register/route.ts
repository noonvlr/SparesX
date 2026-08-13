import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/utils/hash";
import { parseContactFields, validatePassword } from "@/lib/validation/userContact";
import {
  checkRateLimitAsync,
  clientIpFromRequest,
} from "@/lib/security/authRateLimit";
import { sanitizeStoredImageUrl } from "@/lib/security/allowedImageUrl";

const GENERIC_TAKEN =
  "Could not create an account with this email. Try logging in or use a different email.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, profilePicture } = body;

    const ip = clientIpFromRequest(req);
    const rate = await checkRateLimitAsync({
      key: `register:${ip}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { message: "Too many registration attempts. Try again later." },
        { status: 429 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { message: "All required fields must be filled" },
        { status: 400 },
      );
    }

    const parsed = parseContactFields(
      {
        name: body.name,
        email: body.email,
        mobile: body.mobile,
        whatsappNumber: body.whatsappNumber,
        pinCode: body.pinCode,
        countryCode: body.countryCode,
        address: body.address,
        city: body.city,
        state: body.state,
      },
      { requireAll: true },
    );

    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const pwError = validatePassword(password);
    if (pwError) {
      return NextResponse.json({ message: pwError }, { status: 400 });
    }

    const pw = String(password);

    await connectDB();
    const existing = await User.findOne({ email: parsed.data.email }).select(
      "_id",
    );
    if (existing) {
      return NextResponse.json({ message: GENERIC_TAKEN }, { status: 409 });
    }

    const safePicture = profilePicture
      ? sanitizeStoredImageUrl(profilePicture, { allowGoogleAvatar: true })
      : "";
    if (profilePicture && !safePicture) {
      return NextResponse.json(
        { message: "Invalid profile picture URL" },
        { status: 400 },
      );
    }

    const hashed = await hashPassword(pw);
    await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
      mobile: parsed.data.mobile,
      countryCode: parsed.data.countryCode || "+91",
      address: parsed.data.address,
      pinCode: parsed.data.pinCode,
      city: parsed.data.city,
      state: parsed.data.state,
      whatsappNumber: parsed.data.whatsappNumber,
      profilePicture: safePicture || "",
      role: "technician",
      authProvider: "local",
    });

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
