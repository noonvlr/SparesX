import { revalidatePath } from "next/cache";
import { productPath } from "@/lib/seo/site";

/**
 * Invalidate public listing surfaces after status changes (sold / relist / delete).
 * Home uses ISR (`revalidate = 60`); without this, router.refresh() can resurrect
 * a sold card from the cached homepage payload.
 */
export function revalidateListingCaches(product?: {
  _id?: unknown;
  slug?: string | null;
}) {
  try {
    revalidatePath("/");
    revalidatePath("/products");
    if (product && (product.slug || product._id)) {
      revalidatePath(
        productPath({
          _id: product._id ? String(product._id) : undefined,
          slug: product.slug || undefined,
        }),
      );
    }
  } catch (err) {
    console.warn("[revalidateListingCaches]", err);
  }
}
