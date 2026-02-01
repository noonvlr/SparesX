import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";

// GET single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH update user (excluding mandatory fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json();

    // Remove mandatory fields that cannot be edited
    const { email, password, role, createdAt, updatedAt, _id, ...updateData } =
      body;

    // Validate mobile number if provided
    if (updateData.mobile) {
      const cleanMobile = updateData.mobile.replace(/\D/g, "");
      if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
        return NextResponse.json(
          { message: "Mobile number must be 10 digits and start with 6-9" },
          { status: 400 }
        );
      }
      updateData.mobile = cleanMobile;
    }

    // Validate PIN code if provided
    if (updateData.pinCode) {
      const cleanPinCode = updateData.pinCode.replace(/\D/g, "");
      if (cleanPinCode.length !== 6) {
        return NextResponse.json(
          { message: "PIN code must be 6 digits" },
          { status: 400 }
        );
      }
      updateData.pinCode = cleanPinCode;
    }

    // Validate WhatsApp number if provided
    if (updateData.whatsappNumber) {
      const cleanWhatsapp = updateData.whatsappNumber.replace(/\D/g, "");
      if (cleanWhatsapp.length !== 10 || !/^[6-9]/.test(cleanWhatsapp)) {
        return NextResponse.json(
          { message: "WhatsApp number must be 10 digits and start with 6-9" },
          { status: 400 }
        );
      }
      updateData.whatsappNumber = cleanWhatsapp;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { verifyJwt } = await import("@/lib/auth/jwt");
    const payload = verifyJwt(token);

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Don't allow deleting admin users
    if (user.role === "admin") {
      return NextResponse.json(
        { message: "Cannot delete admin users" },
        { status: 403 }
      );
    }

    // Delete all products by this user
    const { Product } = await import("@/lib/models/Product");
    const deleteResult = await Product.deleteMany({ technician: id });

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: `User and ${deleteResult.deletedCount} product(s) deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
