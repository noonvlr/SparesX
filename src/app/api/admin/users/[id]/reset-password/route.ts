import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { verifyJwt } from '@/lib/auth/jwt';
import { sendOTPEmail } from '@/lib/services/emailService';
import crypto from 'crypto';

const OTP_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours for admin reset

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyJwt(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
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
      expiryMinutes: 24 * 60, // 24 hours
    });

    // Log the result
    if (!emailSent) {
      console.warn(`[ADMIN PASSWORD RESET] Email failed for ${user.email}. OTP: ${otp}`);
    } else {
      console.log(`[ADMIN PASSWORD RESET] OTP sent to ${user.email}`);
    }

    return NextResponse.json(
      { 
        message: 'Password reset OTP sent to user email',
        // For development only - remove in production
        _dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
      },
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
