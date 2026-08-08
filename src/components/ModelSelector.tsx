"use client";

import { useEffect, useMemo, useState } from "react";
import {
  findExactModel,
  getModelSuggestions,
  SuggestableModel,
} from "@/lib/utils/modelSuggest";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authFetch, getAccessToken } from "@/lib/auth/clientAuth";

interface ModelSelectorProps {
  models: SuggestableModel[];
  value: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (model: SuggestableModel) => void;
  brandSlug: string;
  category: string;
  onModelsUpdated?: (models: SuggestableModel[]) => void;
  required?: boolean;
  placeholder?: string;
}

export default function ModelSelector({
  models,
  value,
  searchValue,
  onSearchChange,
  onSelect,
  brandSlug,
  category,
  onModelsUpdated,
  required,
  placeholder = "Search model…",
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exact = useMemo(
    () => findExactModel(searchValue, models),
    [searchValue, models],
  );

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return models.slice(0, 40);
    return models
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.modelNumber || "").toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [models, searchValue]);

  const suggestions = useMemo(
    () => getModelSuggestions(searchValue, models, 5),
    [searchValue, models],
  );

  const canCreateNew =
    searchValue.trim().length >= 2 &&
    !exact &&
    !filtered.some(
      (m) => m.name.toLowerCase() === searchValue.trim().toLowerCase(),
    );

  useEffect(() => {
    setConfirmNew(false);
    setError(null);
  }, [searchValue, brandSlug, category]);

  const createModel = async (name: string) => {
    if (!getAccessToken()) {
      setError("Please login to add a new model.");
      return;
    }
    if (!brandSlug || !category) {
      setError("Select device type and brand first.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await authFetch(`/api/brands/${brandSlug}/models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to create model");
        return;
      }

      const model: SuggestableModel = data.model || { name: name.trim() };
      const nextModels = [...models];
      const exists = nextModels.some(
        (m) => m.name.toLowerCase() === model.name.toLowerCase(),
      );
      if (!exists) nextModels.push(model);
      nextModels.sort((a, b) => a.name.localeCompare(b.name));
      onModelsUpdated?.(nextModels);
      onSelect(model);
      onSearchChange(model.name);
      setOpen(false);
      setConfirmNew(false);
    } catch {
      setError("Failed to create model. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleUseTypedModel = () => {
    if (suggestions.length > 0 && !confirmNew) {
      setConfirmNew(true);
      setOpen(true);
      return;
    }
    createModel(searchValue.trim());
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
        Model {required ? "*" : ""}
      </label>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 220)}
          className="pr-10"
          size="sm"
          required={required}
          autoComplete="off"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--muted)]"
        >
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      {value && (
        <div className="mt-2 inline-block bg-[var(--brand)] text-[var(--primary-foreground)] px-3 py-1 rounded-full text-sm font-semibold">
          ✓ {value}
        </div>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          {filtered.length > 0 && (
            <div>
              {filtered.map((model, idx) => (
                <button
                  key={`${model.name}-${model.modelNumber || ""}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(model);
                    onSearchChange(model.name);
                    setOpen(false);
                    setConfirmNew(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--brand-soft)] active:bg-[var(--brand-muted)] transition font-medium text-[var(--ink-secondary)] border-b border-[var(--border)] last:border-b-0"
                >
                  {model.name}{" "}
                  {model.modelNumber && (
                    <span className="text-[var(--muted)] text-sm">
                      ({model.modelNumber})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && canCreateNew && (
            <div className="border-t border-[var(--warning)]/20 bg-[var(--warning-soft)] p-3 space-y-2">
              <p className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wide">
                Did you mean?
              </p>
              {suggestions.map((model, idx) => (
                <button
                  key={`suggest-${model.name}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(model);
                    onSearchChange(model.name);
                    setOpen(false);
                    setConfirmNew(false);
                  }}
                  className="w-full px-3 py-2 rounded-[var(--radius)] text-left bg-[var(--surface)] border border-[var(--warning)]/30 hover:border-[var(--warning)] hover:bg-[var(--warning-soft)] text-sm font-medium text-[var(--ink)] transition"
                >
                  {model.name}
                  {model.modelNumber ? ` (${model.modelNumber})` : ""}
                </button>
              ))}
            </div>
          )}

          {canCreateNew && (
            <div className="border-t border-[var(--border)] p-3 bg-[var(--surface-2)] space-y-2">
              {!confirmNew ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleUseTypedModel();
                  }}
                  disabled={creating}
                >
                  {suggestions.length > 0
                    ? `Continue with “${searchValue.trim()}”`
                    : `Add “${searchValue.trim()}” as new model`}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--warning)]">
                    Close matches exist. Use a suggested model above, or confirm
                    adding your typed model to the catalog.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      createModel(searchValue.trim());
                    }}
                    disabled={creating}
                    loading={creating}
                  >
                    {creating
                      ? "Saving model..."
                      : `Yes, add “${searchValue.trim()}”`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!filtered.length && !canCreateNew && (
            <div className="px-4 py-3 text-[var(--muted)] text-center text-sm">
              Type at least 2 characters to search or add a model
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}
