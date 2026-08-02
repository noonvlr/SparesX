"use client";

import { Suspense } from "react";
import { AuthPage } from "@/components/layout";
import { Spinner } from "@/components/ui";
import CompleteProfileClient from "./CompleteProfileClient";

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <AuthPage>
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-[var(--brand)]" />
          </div>
        </AuthPage>
      }
    >
      <CompleteProfileClient />
    </Suspense>
  );
}
