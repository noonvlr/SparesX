import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/models/User';
import { hashPassword } from '@/lib/utils/hash';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }
    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed, role: 'technician' });
    return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
