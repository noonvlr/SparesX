import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import {
  normalizeEmail,
  parseContactFields,
} from "@/lib/validation/userContact";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();

    const {
      password,
      createdAt,
      updatedAt,
      _id,
      role,
      email,
      name,
      mobile,
      whatsappNumber,
      pinCode,
      countryCode,
      address,
      city,
      state,
      ...rest
    } = body;

    void password;
    void createdAt;
    void updatedAt;
    void _id;

    const updateData: Record<string, unknown> = { ...rest };

    const contactInput = {
      name,
      email,
      mobile,
      whatsappNumber,
      pinCode,
      countryCode,
      address,
      city,
      state,
    };

    const presentKeys = (
      Object.keys(contactInput) as (keyof typeof contactInput)[]
    ).filter((k) => contactInput[k] !== undefined);

    if (presentKeys.length > 0) {
      const parsed = parseContactFields(contactInput, {
        fieldsPresent: presentKeys,
      });
      if (!parsed.ok) {
        return NextResponse.json({ message: parsed.message }, { status: 400 });
      }
      Object.assign(updateData, parsed.data);
    }

    // Email uniqueness + clear verification when changed
    if (typeof updateData.email === "string") {
      const nextEmail = normalizeEmail(updateData.email);
      const existing = await User.findOne({
        email: nextEmail,
        _id: { $ne: id },
      }).select("_id");
      if (existing) {
        return NextResponse.json(
          { message: "Email already registered" },
          { status: 409 },
        );
      }

      const current = await User.findById(id).select("email emailVerified");
      if (current && nextEmail !== current.email) {
        updateData.email = nextEmail;
        updateData.emailVerified = false;
        updateData.emailVerifiedAt = null;
        updateData.emailVerifyOTP = null;
        updateData.emailVerifyOTPExpiry = null;
      } else {
        updateData.email = nextEmail;
      }
    }

    // Clear phone verification when mobile or countryCode changes
    if (updateData.mobile !== undefined || updateData.countryCode !== undefined) {
      const current = await User.findById(id).select("mobile countryCode");
      if (current) {
        const mobileChanged =
          updateData.mobile !== undefined &&
          String(updateData.mobile) !== String(current.mobile);
        const ccChanged =
          updateData.countryCode !== undefined &&
          String(updateData.countryCode) !== String(current.countryCode || "+91");
        if (mobileChanged || ccChanged) {
          updateData.phoneVerified = false;
          updateData.phoneVerifiedAt = null;
          updateData.phoneVerifyOTP = null;
          updateData.phoneVerifyOTPExpiry = null;
        }
      }
    }

    // Allow role change (but not demoting yourself)
    if (role !== undefined) {
      if (!["technician", "admin"].includes(role)) {
        return NextResponse.json({ message: "Invalid role" }, { status: 400 });
      }
      if (id === admin.id && role !== "admin") {
        return NextResponse.json(
          { message: "Cannot demote your own admin account" },
          { status: 403 },
        );
      }
      updateData.role = role;
    }

    // Prevent blocking yourself
    if (updateData.isBlocked === true && id === admin.id) {
      return NextResponse.json(
        { message: "Cannot block your own account" },
        { status: 403 },
      );
    }

    if (typeof updateData.isTrusted === "boolean") {
      if (updateData.isTrusted) {
        updateData.trustedAt = new Date();
      } else {
        updateData.trustedAt = null;
      }
    }

    // Verification timestamps
    for (const [flag, at] of [
      ["kycVerified", "kycVerifiedAt"],
      ["businessVerified", "businessVerifiedAt"],
      ["addressVerified", "addressVerifiedAt"],
      ["phoneVerified", "phoneVerifiedAt"],
      ["emailVerified", "emailVerifiedAt"],
    ] as const) {
      if (typeof updateData[flag] === "boolean") {
        updateData[at] = updateData[flag] ? new Date() : null;
      }
    }

    if (Array.isArray(updateData.specialBadgeKeys)) {
      const allowed = new Set([
        "official_store",
        "verified_technician",
        "moderator",
        "founding_member",
      ]);
      updateData.specialBadgeKeys = (
        updateData.specialBadgeKeys as string[]
      ).filter((k) => allowed.has(k));
    }

    if (Array.isArray(updateData.revokedBadgeKeys)) {
      const allowed = new Set(["founding_member"]);
      updateData.revokedBadgeKeys = (
        updateData.revokedBadgeKeys as string[]
      ).filter((k) => allowed.has(k));
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { recomputeUserBadges } = await import("@/lib/badges/engine");
    const trust = await recomputeUserBadges(id);
    const fresh = await User.findById(id).select("-password");

    return NextResponse.json({
      message: "User updated successfully",
      user: fresh || updatedUser,
      trust,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 403 },
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { message: "Cannot delete admin users" },
        { status: 403 },
      );
    }

    const { Product } = await import("@/lib/models/Product");
    const deleteResult = await Product.deleteMany({ technician: id });

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: `User and ${deleteResult.deletedCount} product(s) deleted successfully`,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 },
    );
  }
}
