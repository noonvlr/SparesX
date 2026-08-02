import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";
import { comparePassword, hashPassword } from "@/lib/utils/hash";
import { validatePassword } from "@/lib/validation/userContact";

/** POST /api/auth/change-password — authenticated user changes own password */
export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current and new password are required" },
        { status: 400 },
      );
    }

    const pwError = validatePassword(newPassword);
    if (pwError) {
      return NextResponse.json({ message: pwError }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: "New password must be different from current password" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(auth.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        {
          message:
            "This account uses Google Sign-In and has no password yet. Use Google to sign in, or contact support to set a password.",
        },
        { status: 400 },
      );
    }

    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 },
      );
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
