"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

/**
 * Sort control for the results toolbar. Writes to the URL so the
 * server-rendered grid stays the single source of truth.
 */
export default function ProductSortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "featured";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "featured") params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    const next = params.toString();
    router.push(next ? `/products?${next}` : "/products");
  }

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
      <span className="whitespace-nowrap">Sort</span>
      <Select
        value={sort}
        onChange={(e) => handleChange(e.target.value)}
        size="sm"
        className="w-auto min-w-[10.5rem]"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
