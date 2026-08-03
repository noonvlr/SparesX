"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/** Clean homepage search — submits to /products?search= */
export default function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      router.push("/products");
      return;
    }
    router.push(`/products?search=${encodeURIComponent(term)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-xl flex gap-2"
      role="search"
    >
      <Input
        type="search"
        name="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search parts, brands, models…"
        aria-label="Search spare parts"
        className="flex-1 bg-[var(--surface)] shadow-[var(--shadow-sm)]"
      />
      <Button type="submit" size="md" className="shrink-0 px-5">
        Search
      </Button>
    </form>
  );
}
