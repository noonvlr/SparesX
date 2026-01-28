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
    console.error("Error fetching user:", error);
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
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}
