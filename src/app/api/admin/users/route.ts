import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/utils/hash";
import { isAdminError, requireAdmin } from "@/lib/auth/requireAdmin";

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
    const {
      name,
      email,
      password,
      mobile,
      countryCode,
      address,
      pinCode,
      city,
      state,
      whatsappNumber,
      role,
    } = body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      !mobile ||
      !address?.trim() ||
      !pinCode ||
      !city?.trim() ||
      !state?.trim() ||
      !whatsappNumber
    ) {
      return NextResponse.json(
        { message: "All required fields must be filled" },
        { status: 400 },
      );
    }

    if (!["technician", "admin"].includes(role || "technician")) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const cleanMobile = String(mobile).replace(/\D/g, "");
    const cleanWhatsapp = String(whatsappNumber).replace(/\D/g, "");
    const cleanPin = String(pinCode).replace(/\D/g, "");

    if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
      return NextResponse.json(
        { message: "Mobile number must be 10 digits and start with 6-9" },
        { status: 400 },
      );
    }
    if (cleanWhatsapp.length !== 10 || !/^[6-9]/.test(cleanWhatsapp)) {
      return NextResponse.json(
        { message: "WhatsApp number must be 10 digits and start with 6-9" },
        { status: 400 },
      );
    }
    if (cleanPin.length !== 6) {
      return NextResponse.json(
        { message: "PIN code must be 6 digits" },
        { status: 400 },
      );
    }

    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    }

    const hashed = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      mobile: cleanMobile,
      countryCode: countryCode || "+91",
      address: address.trim(),
      pinCode: cleanPin,
      city: city.trim(),
      state: state.trim(),
      whatsappNumber: cleanWhatsapp,
      role: role || "technician",
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
