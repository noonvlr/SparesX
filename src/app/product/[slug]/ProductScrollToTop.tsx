"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

/**
 * Product soft-navigations often keep the previous scroll offset.
 * Reset to the top whenever the product slug changes (mobile + desktop).
 */
export default function ProductScrollToTop() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  useEffect(() => {
    if (!slug) return;
    const reset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    reset();
    // Next may restore scroll after paint — nudge again on the next frames.
    const id1 = window.requestAnimationFrame(() => {
      reset();
      window.requestAnimationFrame(reset);
    });
    const t = window.setTimeout(reset, 50);
    return () => {
      window.cancelAnimationFrame(id1);
      window.clearTimeout(t);
    };
  }, [slug]);

  return null;
}
