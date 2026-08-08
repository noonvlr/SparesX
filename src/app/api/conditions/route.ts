import { NextResponse } from "next/server";

export async function GET() {
  try {
    const conditions = [
      { value: "new", label: "New" },
      { value: "used", label: "Used" },
      { value: "refurbished", label: "Refurbished" },
    ];

    return NextResponse.json({ conditions }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch conditions" },
      { status: 500 },
    );
  }
}
