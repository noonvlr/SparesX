import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { sendOTPEmail } from '@/lib/services/emailService';
import crypto from 'crypto';

const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY);

    // Save OTP to user document
    user.passwordResetOTP = otpHash;
    user.passwordResetOTPExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    const emailSent = await sendOTPEmail({
      recipientEmail: user.email,
      recipientName: user.name || user.email.split('@')[0],
      otp,
      expiryMinutes: 10,
    });

    // Even if email fails, we've saved the OTP so the flow can continue
    // In development, OTP will be logged as fallback
    if (!emailSent) {
      console.warn(`[PASSWORD RESET] Email failed for ${email}. OTP: ${otp}`);
    } else {
      console.log(`[PASSWORD RESET] OTP sent to ${email}`);
    }

    return NextResponse.json(
      { 
        message: 'OTP sent to email. Please check your inbox and spam folder.',
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error requesting OTP:', error);
    return NextResponse.json(
      { message: 'Failed to process request' },
      { status: 500 }
    );
  }
}
