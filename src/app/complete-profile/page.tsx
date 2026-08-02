"use client";

import { Suspense } from "react";
import CompleteProfileClient from "./CompleteProfileClient";

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </main>
      }
    >
      <CompleteProfileClient />
    </Suspense>
  );
}
