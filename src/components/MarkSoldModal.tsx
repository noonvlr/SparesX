"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { SoldVia } from "@/lib/models/Product";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";
import { cn } from "@/lib/ui/cn";

type MarkSoldModalProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSold: (soldVia: SoldVia) => void;
};

const OPTIONS: {
  value: SoldVia;
  label: string;
  hint: string;
  accent: string;
}[] = [
  {
    value: "sparesx",
    label: "Sold on SparesX",
    hint: "Buyer found this listing here",
    accent: "brand",
  },
  {
    value: "other",
    label: "Sold elsewhere",
    hint: "WhatsApp, walk-in, another site…",
    accent: "neutral",
  },
];

/**
 * Asks where the deal closed before marking a listing sold.
 * Solid elevated surface — no glass transparency.
 */
export default function MarkSoldModal({
  open,
  onClose,
  productId,
  productName,
  onSold,
}: MarkSoldModalProps) {
  const [soldVia, setSoldVia] = useState<SoldVia | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!soldVia) {
      setError("Please choose where this part was sold.");
      return;
    }

    if (!isLoggedInClient()) {
      setError("Please log in again to mark this listing sold.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`/api/technician/products/sold/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ soldVia }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Could not mark as sold. Try again.");
        return;
      }
      onSold(soldVia);
      setSoldVia("");
      onClose();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setError("");
    setSoldVia("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Mark as sold"
      surface="solid"
      className="sm:max-w-md"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={loading || !soldVia}
            loading={loading}
            className="w-full sm:w-auto"
          >
            Confirm sold
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Listing
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-[var(--ink)] line-clamp-2">
            {productName}
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm text-[var(--ink-secondary)]">
            Where did you sell this part? It will leave public browse so buyers
            stop messaging you about it.
          </p>

          <fieldset className="grid gap-2.5 sm:grid-cols-2">
            <legend className="sr-only">Where was this sold?</legend>
            {OPTIONS.map((option) => {
              const selected = soldVia === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-1 rounded-[var(--radius-lg)] border-2 px-3.5 py-3.5 transition-colors",
                    selected
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[var(--shadow-sm)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand-muted)]",
                  )}
                >
                  <input
                    type="radio"
                    name="soldVia"
                    value={option.value}
                    checked={selected}
                    onChange={() => {
                      setSoldVia(option.value);
                      setError("");
                    }}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      {option.label}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                        selected
                          ? "border-[var(--brand)] bg-[var(--brand)]"
                          : "border-[var(--border-strong)] bg-[var(--surface)]",
                      )}
                    >
                      {selected ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-inverse)]" />
                      ) : null}
                    </span>
                  </span>
                  <span className="text-xs leading-relaxed text-[var(--muted)]">
                    {option.hint}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>

        {error ? (
          <p
            className="rounded-[var(--radius)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
