import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { comparePassword } from "@/lib/utils/hash";
import { signJwt } from "@/lib/auth/jwt";
import { isProfileComplete } from "@/lib/auth/profileComplete";
import {
  checkRateLimit,
  clientIpFromRequest,
} from "@/lib/security/authRateLimit";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 },
      );
    }

    const normalized = String(email).toLowerCase().trim();
    const ip = clientIpFromRequest(req);
    const ipLimit = checkRateLimit({
      key: `login:ip:${ip}`,
      limit: 30,
      windowMs: 15 * 60 * 1000,
    });
    const emailLimit = checkRateLimit({
      key: `login:email:${normalized}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.ok || !emailLimit.ok) {
      const retry = Math.max(
        !ipLimit.ok ? ipLimit.retryAfterSec : 0,
        !emailLimit.ok ? emailLimit.retryAfterSec : 0,
      );
      return NextResponse.json(
        { message: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retry || 60) },
        },
      );
    }

    await connectDB();
    const user = await User.findOne({ email: normalized });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { message: "Account blocked" },
        { status: 403 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          message:
            "This account uses Google Sign-In. Please continue with Google.",
        },
        { status: 400 },
      );
    }

    const valid = await comparePassword(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const token = signJwt({ _id: user._id, role: user.role });
    return NextResponse.json(
      {
        token,
        role: user.role,
        name: user.name,
        emailVerified: !!user.emailVerified,
        phoneVerified: !!user.phoneVerified,
        profileComplete: isProfileComplete(user),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
