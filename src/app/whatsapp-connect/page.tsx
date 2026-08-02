"use client";

import { Suspense } from "react";
import WhatsAppConnectClient from "./WhatsAppConnectClient";

export default function WhatsAppConnectPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[50vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </main>
      }
    >
      <WhatsAppConnectClient />
    </Suspense>
  );
}
