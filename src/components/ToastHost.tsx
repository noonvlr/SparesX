"use client";

import { useEffect, useState } from "react";

type ToastPayload = {
  message: string;
  type?: "success" | "error" | "info";
};

export function showToast(message: string, type: ToastPayload["type"] = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("sparesx-toast", { detail: { message, type } }),
  );
}

export default function ToastHost() {
  const [toast, setToast] = useState<(ToastPayload & { id: number }) | null>(
    null,
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;
      setToast({ ...detail, id: Date.now() });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener("sparesx-toast", onToast as EventListener);
    return () => {
      window.removeEventListener("sparesx-toast", onToast as EventListener);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  const colors =
    toast.type === "error"
      ? "bg-[var(--danger)]"
      : toast.type === "info"
        ? "bg-[var(--ink)]"
        : "bg-[var(--success)]";

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-4 w-full max-w-sm pointer-events-none">
      <div
        className={`${colors} text-white rounded-xl shadow-xl px-4 py-3 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2`}
        role="status"
      >
        {toast.message}
      </div>
    </div>
  );
}
