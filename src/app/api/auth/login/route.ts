import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { comparePassword } from "@/lib/utils/hash";
import { signJwt } from "@/lib/auth/jwt";
import { isProfileComplete } from "@/lib/auth/profileComplete";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });

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
