"use client";

import { Suspense } from "react";
import CompleteProfileClient from "./CompleteProfileClient";

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin" />
        </main>
      }
    >
      <CompleteProfileClient />
    </Suspense>
  );
}
