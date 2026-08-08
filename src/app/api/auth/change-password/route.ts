import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { errorResponse, isAuthError, requireUser } from "@/lib/auth/requireUser";
import { comparePassword, hashPassword } from "@/lib/utils/hash";
import { validatePassword } from "@/lib/validation/userContact";

/** POST /api/auth/change-password — set or change own password */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    if (!newPassword) {
      return NextResponse.json(
        { message: "New password is required" },
        { status: 400 },
      );
    }

    const pwError = validatePassword(newPassword);
    if (pwError) {
      return NextResponse.json({ message: pwError }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(auth.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Google / passwordless accounts: first-time set (no current password)
    if (!user.password) {
      user.password = await hashPassword(newPassword);
      user.sessionVersion = (user.sessionVersion || 0) + 1;
      await user.save();
      const { signJwt } = await import("@/lib/auth/jwt");
      const { applySessionCookie } = await import("@/lib/auth/cookies");
      const token = signJwt({
        _id: user._id,
        role: user.role,
        sessionVersion: user.sessionVersion,
      });
      const res = NextResponse.json(
        {
          message: "Password set successfully. You can now also sign in with email.",
          hasPassword: true,
          token,
        },
        { status: 200 },
      );
      applySessionCookie(res, token);
      return res;
    }

    if (!currentPassword) {
      return NextResponse.json(
        { message: "Current password is required" },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: "New password must be different from current password" },
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
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save();

    const { signJwt } = await import("@/lib/auth/jwt");
    const { applySessionCookie } = await import("@/lib/auth/cookies");
    const token = signJwt({
      _id: user._id,
      role: user.role,
      sessionVersion: user.sessionVersion,
    });

    const res = NextResponse.json(
      {
        message: "Password updated successfully",
        hasPassword: true,
        token,
      },
      { status: 200 },
    );
    applySessionCookie(res, token);
    return res;
  } catch (error) {
    return errorResponse(error);
  }
}
