"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { CatalogMergeSummary } from "@/lib/catalog/mergeCatalog";
import { authFetch } from "@/lib/auth/clientAuth";

interface CatalogImportPanelProps {
  onImported?: () => void;
}

export default function CatalogImportPanel({
  onImported,
}: CatalogImportPanelProps) {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState<CatalogMergeSummary | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onFileChange(file: File | null) {
    setError("");
    setSummary(null);
    if (!file) {
      setFilename("");
      setContent("");
      return;
    }
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result || ""));
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  }

  async function runImport(apply: boolean) {
    setError("");
    setBusy(true);
    try {
      const res = await authFetch("/api/admin/catalog-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          filename,
          dryRun: !apply,
          apply,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }
      setSummary(data.summary);
      setDryRun(data.dryRun !== false);
      if (apply) {
        onImported?.();
      }
    } catch (err: any) {
      setError(err.message || "Import failed");
      setSummary(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card padding="lg" className="mt-6">
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-lg font-semibold text-[var(--ink)]">
          Bulk catalog import
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Upload CSV or JSON to add/update brands and models. Existing models
          are never deleted. Optional columns:{" "}
          <code className="text-xs">modelNumber</code>,{" "}
          <code className="text-xs">releaseYear</code>.
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3 mb-4 text-xs text-[var(--ink-secondary)] font-mono whitespace-pre-wrap">
        {`category,brand,modelName,modelNumber,releaseYear
mobile,Samsung,Galaxy S24 Ultra,SM-S928B,2024
laptop,Apple,MacBook Air 13 M2,MLY33,2022`}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="file"
          accept=".csv,.json,text/csv,application/json"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="block w-full max-w-md text-sm text-[var(--ink-secondary)] file:mr-3 file:rounded-[var(--radius)] file:border-0 file:bg-[var(--brand)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--primary-foreground)]"
        />
        {filename ? (
          <span className="text-sm text-[var(--muted)]">{filename}</span>
        ) : null}
      </div>

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          type="button"
          variant="secondary"
          disabled={!content || busy}
          loading={busy}
          onClick={() => runImport(false)}
        >
          Preview (dry run)
        </Button>
        <Button
          type="button"
          disabled={!content || busy}
          loading={busy}
          onClick={() => runImport(true)}
        >
          Apply merge
        </Button>
      </div>

      {summary ? (
        <div className="rounded-[var(--radius)] border border-[var(--border)] p-4 space-y-2">
          <p className="text-sm font-medium text-[var(--ink)]">
            {dryRun ? "Preview summary" : "Applied summary"}
          </p>
          <ul className="text-sm text-[var(--ink-secondary)] space-y-1 list-none p-0">
            <li>Rows: {summary.rows}</li>
            <li>Brands touched: {summary.brandsTouched}</li>
            <li>Brands created: {summary.brandsCreated}</li>
            <li>Models added: {summary.modelsAdded}</li>
            <li>Models updated: {summary.modelsUpdated}</li>
            <li>Models unchanged: {summary.modelsUnchanged}</li>
          </ul>
          {summary.errors.length > 0 ? (
            <Alert tone="warning" className="mt-2">
              {summary.errors.slice(0, 5).join(" · ")}
              {summary.errors.length > 5
                ? ` (+${summary.errors.length - 5} more)`
                : ""}
            </Alert>
          ) : null}
          {summary.byBrand.length > 0 ? (
            <div className="mt-3 max-h-48 overflow-y-auto text-xs text-[var(--muted)] space-y-1">
              {summary.byBrand.slice(0, 40).map((b) => (
                <div key={`${b.category}-${b.brand}`}>
                  [{b.category}] {b.brand}: +{b.modelsAdded} ~{b.modelsUpdated}
                  {b.brandCreated ? " (new)" : ""}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
