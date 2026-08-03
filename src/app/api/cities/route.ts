import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";

/** Distinct seller cities for browse refine filters. */
export async function GET() {
  try {
    await connectDB();
    const cities = await User.distinct("city", {
      role: "technician",
      isBlocked: false,
      city: { $nin: [null, ""] },
    });

    const sorted = (cities as string[])
      .map((c) => String(c).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return NextResponse.json({ cities: sorted }, { status: 200 });
  } catch {
    return NextResponse.json({ cities: [] }, { status: 500 });
  }
}
