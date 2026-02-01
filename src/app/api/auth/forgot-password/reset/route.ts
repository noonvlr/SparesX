import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { hashPassword } from '@/lib/utils/hash';
import { sendPasswordResetSuccessEmail } from '@/lib/services/emailService';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
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

    // Verify OTP one more time
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

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== user.passwordResetOTP) {
      return NextResponse.json(
        { message: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Reset password
    user.password = await hashPassword(newPassword);
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpiry = undefined;
    await user.save();

    // Send success notification email (non-blocking)
    sendPasswordResetSuccessEmail({
      recipientEmail: user.email,
      recipientName: user.name || user.email.split('@')[0],
    }).catch((error) => {
      console.error('Failed to send password reset success email:', error);
    });

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
