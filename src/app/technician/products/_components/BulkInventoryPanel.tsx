"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { showToast } from "@/components/ToastHost";
import { authFetch } from "@/lib/auth/clientAuth";

const SAMPLE_CSV = `brand,deviceModel,partType,deviceCategory,condition,price,description,modelNumber
Samsung,S24 Ultra,camera,mobile,new,4500,Original rear camera module,SM-S928
Apple,iPhone 13,display,mobile,used,3200,Used OLED display tested,A2633`;

type Props = {
  onImported: () => void;
};

export default function BulkInventoryPanel({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [busy, setBusy] = useState(false);

  const importCsv = async () => {
    setBusy(true);
    try {
      const res = await authFetch("/api/technician/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Import failed", "error");
        return;
      }
      showToast(
        `Imported ${data.createdCount || 0} listing(s)${
          data.failedCount ? `, ${data.failedCount} failed` : ""
        }`,
      );
      setOpen(false);
      onImported();
    } catch {
      showToast("Import failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Bulk CSV import
      </Button>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Bulk inventory import"
      >
        <p className="text-sm text-[var(--muted)] mb-3">
          Up to 50 rows. Required columns: brand, deviceModel, partType,
          deviceCategory, condition, price, description. Optional: modelNumber,
          priceNegotiable.
        </p>
        <textarea
          className="w-full min-h-[220px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 text-xs font-mono text-[var(--ink)]"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          spellCheck={false}
        />
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => setCsv(SAMPLE_CSV)}
          >
            Reset sample
          </Button>
          <Button type="button" disabled={busy} onClick={() => void importCsv()}>
            {busy ? "Importing…" : "Import listings"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
