import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Return hardcoded conditions for now
    // In future, these could be stored in database if needed for more dynamic control
    const conditions = [
      {
        value: "new",
        label: "New",
      },
      {
        value: "used",
        label: "Used",
      },
    ];

    return NextResponse.json({
      conditions,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch conditions",
        success: false,
      },
      { status: 500 }
    );
  }
}
