"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/clientAuth";

type SuggestPayload = {
  sampleSize: number;
  median: number | null;
  low: number | null;
  high: number | null;
  match: "full" | "brand_part" | "none";
};

type PriceSuggestHintProps = {
  brand?: string;
  partType?: string;
  deviceModel?: string;
  condition?: string;
  onApplyMedian?: (median: number) => void;
};

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

/**
 * Non-blocking asking-price hint for the listing form.
 * Fetches when brand + partType are set; debounced.
 */
export default function PriceSuggestHint({
  brand,
  partType,
  deviceModel,
  condition,
  onApplyMedian,
}: PriceSuggestHintProps) {
  const [data, setData] = useState<SuggestPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const b = brand?.trim();
    const p = partType?.trim();
    if (!b || !p) {
      setData(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ brand: b, partType: p });
      if (deviceModel?.trim()) params.set("deviceModel", deviceModel.trim());
      if (condition?.trim()) params.set("condition", condition.trim());

      void authFetch(`/api/technician/price-suggest?${params}`)
        .then(async (res) => {
          const json = (await res.json().catch(() => null)) as SuggestPayload | null;
          if (cancelled) return;
          if (res.ok && json) setData(json);
          else setData(null);
        })
        .catch(() => {
          if (!cancelled) setData(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [brand, partType, deviceModel, condition]);

  if (!brand?.trim() || !partType?.trim()) return null;

  if (loading && !data) {
    return (
      <p className="mt-2 text-xs text-[var(--muted)]">Checking similar prices…</p>
    );
  }

  if (!data || data.sampleSize < 1 || data.median == null) {
    return (
      <p className="mt-2 text-xs text-[var(--muted)]">
        No similar live listings yet — price from your usual rate.
      </p>
    );
  }

  const range =
    data.low != null && data.high != null && data.low !== data.high
      ? `${formatInr(data.low)}–${formatInr(data.high)}`
      : formatInr(data.median);

  const scope =
    data.match === "full"
      ? "same brand, model, and part"
      : "same brand and part";

  return (
    <div className="mt-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
      <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
        Similar listings ({scope}) usually ask{" "}
        <span className="font-semibold text-[var(--ink)]">{range}</span>
        {" · "}
        median {formatInr(data.median)} ({data.sampleSize} listing
        {data.sampleSize === 1 ? "" : "s"}).
      </p>
      {onApplyMedian ? (
        <button
          type="button"
          onClick={() => onApplyMedian(data.median!)}
          className="mt-1.5 text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
        >
          Use {formatInr(data.median)}
        </button>
      ) : null}
    </div>
  );
}
