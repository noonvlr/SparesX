import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/auth/requireUser";
import { suggestListingPrice } from "@/lib/products/priceSuggest";

/**
 * GET /api/technician/price-suggest?brand=&partType=&deviceModel=&condition=
 * Live asking-price comps for sellers listing a part.
 */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const result = await suggestListingPrice({
      brand: searchParams.get("brand"),
      partType: searchParams.get("partType"),
      deviceModel: searchParams.get("deviceModel"),
      condition: searchParams.get("condition"),
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[price-suggest]", error);
    return NextResponse.json(
      { message: "Could not load price suggestion" },
      { status: 500 },
    );
  }
}
