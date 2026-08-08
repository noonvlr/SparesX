"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { SoldVia } from "@/lib/models/Product";

type MarkSoldModalProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSold: (soldVia: SoldVia) => void;
};

/**
 * Asks where the deal closed before marking a listing sold.
 * SparesX vs elsewhere — both remove the listing from public browse.
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

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in again to mark this listing sold.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/technician/products/sold/${productId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={loading || !soldVia}
            loading={loading}
          >
            Confirm sold
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--ink-secondary)]">
          Where did you sell{" "}
          <span className="font-semibold text-[var(--ink)]">{productName}</span>?
          This removes it from public browse so buyers stop contacting you.
        </p>

        <fieldset className="space-y-2">
          <legend className="sr-only">Where was this sold?</legend>
          {(
            [
              {
                value: "sparesx" as const,
                label: "Sold on SparesX",
                hint: "Buyer found this listing here",
              },
              {
                value: "other" as const,
                label: "Sold elsewhere",
                hint: "WhatsApp, walk-in, another site, etc.",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border px-3 py-3 transition-colors ${
                soldVia === option.value
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--border)] hover:border-[var(--brand-muted)]"
              }`}
            >
              <input
                type="radio"
                name="soldVia"
                value={option.value}
                checked={soldVia === option.value}
                onChange={() => {
                  setSoldVia(option.value);
                  setError("");
                }}
                className="mt-1 h-4 w-4 accent-[var(--brand)]"
              />
              <span>
                <span className="block text-sm font-semibold text-[var(--ink)]">
                  {option.label}
                </span>
                <span className="block text-xs text-[var(--muted)]">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
