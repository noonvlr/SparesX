import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { hashPassword } from '@/lib/utils/hash';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, mobile, countryCode, address, pinCode, city, state, whatsappNumber, profilePicture } = await req.json();
    
    // Validation
    if (!name || !email || !password || !mobile || !address || !pinCode || !city || !state || !whatsappNumber) {
      return NextResponse.json({ message: 'All required fields must be filled' }, { status: 400 });
    }

    // Validate mobile number (Indian format: 10 digits)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile.replace(/\D/g, ''))) {
      return NextResponse.json({ message: 'Invalid mobile number' }, { status: 400 });
    }

    // Validate whatsapp number (Indian format: 10 digits)
    const whatsappRegex = /^[6-9]\d{9}$/;
    if (!whatsappRegex.test(whatsappNumber.replace(/\D/g, ''))) {
      return NextResponse.json({ message: 'Invalid WhatsApp number' }, { status: 400 });
    }

    // Validate pincode (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pinCode.trim())) {
      return NextResponse.json({ message: 'PIN code must be 6 digits' }, { status: 400 });
    }

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashed,
      mobile: mobile.replace(/\D/g, ''),
      countryCode: countryCode || '+91',
      address: address.trim(),
      pinCode: pinCode.trim(),
      city: city.trim(),
      state: state.trim(),
      whatsappNumber: whatsappNumber.replace(/\D/g, ''),
      profilePicture: profilePicture || '',
      role: 'technician',
    });

    return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
