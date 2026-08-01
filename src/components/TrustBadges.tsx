"use client";

import type { PublicTrustInfo } from "@/lib/trust";

type Size = "sm" | "md";

/**
 * Shows verification / trust badges for a user.
 * Hierarchy: Trusted (admin) > Phone verified > Email verified.
 */
export default function TrustBadges({
  phoneVerified,
  emailVerified,
  isTrusted,
  size = "sm",
  className = "",
}: PublicTrustInfo & { size?: Size; className?: string }) {
  const pills: { key: string; label: string; className: string }[] = [];

  if (isTrusted) {
    pills.push({
      key: "trusted",
      label: "Trusted seller",
      className:
        "bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-100",
    });
  }

  if (phoneVerified) {
    pills.push({
      key: "phone",
      label: "Phone verified",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    });
  }

  if (emailVerified) {
    pills.push({
      key: "email",
      label: "Email verified",
      className: "bg-sky-50 text-sky-800 border-sky-200",
    });
  }

  if (!pills.length) return null;

  const text = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1 ${className}`}
      title={pills.map((p) => p.label).join(" · ")}
    >
      {pills.map((p) => (
        <span
          key={p.key}
          className={`inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide ${text} ${p.className}`}
        >
          {p.key === "trusted" && (
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2l2.39 4.84L18 7.27l-3.9 3.8.92 5.36L10 14.9l-4.98 2.53.92-5.36L2 7.27l5.61-.43L10 2z" />
            </svg>
          )}
          {(p.key === "phone" || p.key === "email") && (
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {p.label}
        </span>
      ))}
    </span>
  );
}
