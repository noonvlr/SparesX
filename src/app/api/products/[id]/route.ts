import { NextRequest, NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth/getOptionalUser";
import { loadPublicProduct } from "@/lib/products/loadPublicProduct";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;

    const auth = await getOptionalUser(req);
    const result = await loadPublicProduct(id, auth);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    // product_view is recorded once from the PDP RSC page body — not here —
    // so metadata + page SSR + client refetch do not multi-count.

    return NextResponse.json(
      {
        product: result.product,
        similarProducts: result.similarProducts,
        meta: result.meta,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
