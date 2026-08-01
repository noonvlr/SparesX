import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { verifyJwt } from '@/lib/auth/jwt';

// Get technician profile
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'technician') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();
  const user = await User.findById(payload.id).select('-password');
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ user }, { status: 200 });
}

// Update technician profile
export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'technician') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  await connectDB();
  const user = await User.findById(payload.id);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  
  // Update allowed fields
  if (body.name) user.name = body.name;
  if (body.email) {
    const nextEmail = String(body.email).toLowerCase().trim();
    if (nextEmail && nextEmail !== user.email) {
      user.email = nextEmail;
      user.emailVerified = false;
      user.emailVerifiedAt = undefined;
      user.emailVerifyOTP = undefined;
      user.emailVerifyOTPExpiry = undefined;
    }
  }
  if (body.mobile !== undefined) {
    const nextMobile = String(body.mobile).replace(/\D/g, '');
    if (nextMobile && nextMobile !== user.mobile) {
      user.mobile = nextMobile;
      user.phoneVerified = false;
      user.phoneVerifiedAt = undefined;
      user.phoneVerifyOTP = undefined;
      user.phoneVerifyOTPExpiry = undefined;
    }
  }
  if (body.address !== undefined) user.address = body.address;
  if (body.city !== undefined) user.city = body.city;
  if (body.state !== undefined) user.state = body.state;
  if (body.pinCode !== undefined) user.pinCode = body.pinCode;
  if (body.countryCode !== undefined) {
    const nextCc = String(body.countryCode).trim() || '+91';
    if (nextCc !== user.countryCode) {
      user.countryCode = nextCc;
      user.phoneVerified = false;
      user.phoneVerifiedAt = undefined;
      user.phoneVerifyOTP = undefined;
      user.phoneVerifyOTPExpiry = undefined;
    }
  }
  if (body.whatsappNumber !== undefined) user.whatsappNumber = body.whatsappNumber;
  if (body.profilePicture !== undefined) user.profilePicture = body.profilePicture;
  
  await user.save();
  
  const updatedUser = await User.findById(payload.id).select('-password');
  return NextResponse.json({ message: 'Profile updated', user: updatedUser }, { status: 200 });
}
