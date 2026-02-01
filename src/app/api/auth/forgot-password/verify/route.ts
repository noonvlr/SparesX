import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if OTP exists and is not expired
    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return NextResponse.json(
        { message: 'No OTP requested for this email' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.passwordResetOTPExpiry)) {
      return NextResponse.json(
        { message: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== user.passwordResetOTP) {
      return NextResponse.json(
        { message: 'Invalid OTP' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'OTP verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
