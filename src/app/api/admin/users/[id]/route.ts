import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findById(id).select(USER_CLIENT_EXCLUDE).lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: sanitizeUserForClient(user, {
        includeHasPassword: false,
      }),
    });
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
  const admin = await requireAdmin(request);
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
      about,
      ...rest
    } = body;

    void password;
    void createdAt;
    void updatedAt;
    void _id;

    /** Whitelist admin-editable fields from residual body (block OTP/secret mass-assignment). */
    const ALLOWED_REST = new Set([
      "profilePicture",
      "isBlocked",
      "isTrusted",
      "phoneVerified",
      "emailVerified",
      "kycVerified",
      "businessVerified",
      "addressVerified",
      "eliteApproved",
      "specialBadgeKeys",
      "revokedBadgeKeys",
      "completedSales",
      "responseRate",
      "complaintRate",
      "averageRating",
      "ratingCount",
      "trustScore",
      "activeBadgeKeys",
    ]);

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest as Record<string, unknown>)) {
      if (ALLOWED_REST.has(key)) updateData[key] = value;
    }

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

    if (about !== undefined) {
      const raw = String(about ?? "");
      if (raw.trim().length > MAX_ABOUT_LENGTH) {
        return NextResponse.json(
          { message: `About must be at most ${MAX_ABOUT_LENGTH} characters` },
          { status: 400 },
        );
      }
      updateData.about = normalizeAbout(about);
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

    // Revoke outstanding JWTs when blocking or changing role
    if (updateData.isBlocked === true || role !== undefined) {
      const current = await User.findById(id).select("sessionVersion role").lean();
      if (current) {
        const roleChanging =
          role !== undefined && String(role) !== String(current.role);
        if (updateData.isBlocked === true || roleChanging) {
          updateData.sessionVersion = (current.sessionVersion || 0) + 1;
          try {
            const { revokeAllRefreshTokensForUser } = await import(
              "@/lib/auth/refreshTokens"
            );
            await revokeAllRefreshTokensForUser(id);
          } catch (err) {
            console.warn("[admin] refresh revoke failed:", err);
          }
        }
      }
    }

    if (typeof updateData.isTrusted === "boolean") {
      if (updateData.isTrusted) {
        updateData.trustedAt = new Date();
      } else {
        updateData.trustedAt = null;
      }
    }

    const VERIFY_FLAGS = [
      "kycVerified",
      "businessVerified",
      "addressVerified",
      "phoneVerified",
      "emailVerified",
      "isTrusted",
      "eliteApproved",
    ] as const;

    const before = await User.findById(id)
      .select([...VERIFY_FLAGS, "sessionVersion", "role"].join(" "))
      .lean();

    if (!before) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
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
    ).select(USER_CLIENT_EXCLUDE);

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { recomputeUserBadges } = await import("@/lib/badges/engine");
    const trust = await recomputeUserBadges(id);
    const fresh = await User.findById(id).select(USER_CLIENT_EXCLUDE);

    const labelFor = (flag: string) => {
      switch (flag) {
        case "kycVerified":
          return "KYC";
        case "businessVerified":
          return "Business verification";
        case "addressVerified":
          return "Address verification";
        case "phoneVerified":
          return "Phone verification";
        case "emailVerified":
          return "Email verification";
        case "isTrusted":
          return "Trusted seller";
        case "eliteApproved":
          return "Elite seller";
        default:
          return flag;
      }
    };

    const changes: string[] = [];
    const beforeFlags = before as unknown as Record<string, unknown>;
    for (const flag of VERIFY_FLAGS) {
      if (typeof updateData[flag] !== "boolean") continue;
      const prev = Boolean(beforeFlags[flag]);
      const next = Boolean(updateData[flag]);
      if (prev === next) continue;
      changes.push(
        next ? `${labelFor(flag)} approved` : `${labelFor(flag)} removed`,
      );
    }

    if (changes.length > 0) {
      const { createNotification } = await import(
        "@/lib/notifications/create"
      );
      void createNotification({
        userId: id,
        type: "verification_update",
        title: "Verification update",
        body: changes.slice(0, 4).join(" · "),
        href: "/technician/profile#verification",
        meta: { changes },
      });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: sanitizeUserForClient(fresh || updatedUser, {
        includeHasPassword: false,
      }),
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
  const admin = await requireAdmin(request);
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
    const products = await Product.find({ technician: id })
      .select("images")
      .lean();
    const deleteResult = await Product.deleteMany({ technician: id });
    if (products.length) {
      const { deleteImagesForProducts } = await import(
        "@/lib/images/deleteProductImages"
      );
      void deleteImagesForProducts(products);
    }

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
