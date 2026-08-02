import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/utils/hash";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";
import {
  parseContactFields,
  validatePassword,
} from "@/lib/validation/userContact";

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const mobile = searchParams.get("mobile");
    const q = searchParams.get("q");
    const role = searchParams.get("role");
    const blocked = searchParams.get("blocked");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { mobile: { $regex: q, $options: "i" } },
      ];
    } else if (mobile) {
      query.mobile = { $regex: mobile, $options: "i" };
    }
    if (role && role !== "all") query.role = role;
    if (blocked === "true") query.isBlocked = true;
    if (blocked === "false") query.isBlocked = { $ne: true };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

/** Admin create technician or admin account */
export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (isAdminError(admin)) return admin;

  try {
    const body = await request.json();
    const { password, role } = body;

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

    if (!password) {
      return NextResponse.json(
        { message: "All required fields must be filled" },
        { status: 400 },
      );
    }

    if (!["technician", "admin"].includes(role || "technician")) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const pwError = validatePassword(password);
    if (pwError) {
      return NextResponse.json({ message: pwError }, { status: 400 });
    }

    await connectDB();
    const existing = await User.findOne({ email: parsed.data.email });
    if (existing) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    }

    const hashed = await hashPassword(String(password));
    const user = await User.create({
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
      role: role || "technician",
      authProvider: "local",
      isBlocked: false,
    });

    const safe = user.toObject();
    delete (safe as { password?: string }).password;

    return NextResponse.json(
      { message: "User created", user: safe },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 },
    );
  }
}
