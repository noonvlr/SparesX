import { revalidatePath, revalidateTag } from "next/cache";

/** Invalidate homepage / products caches after category mutations. */
export function revalidateCategoryCaches() {
  revalidateTag("categories", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/products");
}
