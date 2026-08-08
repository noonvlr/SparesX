import { NextRequest, NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/send";

export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json(
      { enabled: false, message: "Web push not configured" },
      { status: 200 },
    );
  }
  return NextResponse.json({ enabled: true, publicKey: key }, { status: 200 });
}
