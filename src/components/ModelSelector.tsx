"use client";

import { useEffect, useMemo, useState } from "react";
import {
  findExactModel,
  getModelSuggestions,
  SuggestableModel,
} from "@/lib/utils/modelSuggest";

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
  placeholder = "Search or type a new model...",
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
    const token = localStorage.getItem("token");
    if (!token) {
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
      const res = await fetch(`/api/brands/${brandSlug}/models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        Model {required ? "*" : ""}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 220)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        required={required}
      />

      {value && (
        <div className="mt-2 inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
          ✓ {value}
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-2 w-full max-h-80 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl animate-in fade-in duration-200">
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
                  className="w-full px-4 py-3 text-left hover:bg-[var(--brand-soft)] active:bg-blue-100 transition font-medium text-gray-700 border-b border-gray-100 last:border-b-0"
                >
                  {model.name}{" "}
                  {model.modelNumber && (
                    <span className="text-gray-500 text-sm">
                      ({model.modelNumber})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && canCreateNew && (
            <div className="border-t border-amber-100 bg-amber-50/80 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
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
                  className="w-full px-3 py-2 rounded-lg text-left bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-sm font-medium text-gray-800 transition"
                >
                  {model.name}
                  {model.modelNumber ? ` (${model.modelNumber})` : ""}
                </button>
              ))}
            </div>
          )}

          {canCreateNew && (
            <div className="border-t border-gray-100 p-3 bg-slate-50 space-y-2">
              {!confirmNew ? (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleUseTypedModel();
                  }}
                  disabled={creating}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-60"
                >
                  {suggestions.length > 0
                    ? `Continue with “${searchValue.trim()}”`
                    : `Add “${searchValue.trim()}” as new model`}
                </button>
              ) : (
                <div className="space-y-2 animate-in fade-in">
                  <p className="text-xs text-amber-800">
                    Close matches exist. Use a suggested model above, or confirm
                    adding your typed model to the catalog.
                  </p>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      createModel(searchValue.trim());
                    }}
                    disabled={creating}
                    className="w-full px-3 py-2.5 rounded-lg bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-hover)] transition disabled:opacity-60"
                  >
                    {creating
                      ? "Saving model..."
                      : `Yes, add “${searchValue.trim()}”`}
                  </button>
                </div>
              )}
            </div>
          )}

          {!filtered.length && !canCreateNew && (
            <div className="px-4 py-3 text-gray-500 text-center text-sm">
              Type at least 2 characters to search or add a model
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 animate-in fade-in">{error}</p>
      )}
    </div>
  );
}
