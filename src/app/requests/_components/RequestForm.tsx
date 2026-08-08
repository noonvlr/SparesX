"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ModelSelector from "@/components/ModelSelector";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { LoadingState } from "@/components/feedback";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface Model {
  name: string;
  modelNumber?: string;
}

interface Option {
  value: string;
  label: string;
  icon?: string;
}

export default function RequestForm({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillSeeded = useRef(false);
  const pendingModel = useRef<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    deviceCategory: "",
    brand: "",
    brandSlug: "",
    deviceModel: "",
    partType: "",
    partTypeLabel: "",
    description: "",
  });

  const [deviceCategories, setDeviceCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [partTypes, setPartTypes] = useState<Option[]>([]);

  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [partTypeSearch, setPartTypeSearch] = useState("");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showPartTypeDropdown, setShowPartTypeDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedInClient()) {
      setIsAuthenticated(false);
      setAuthChecking(false);
      return;
    }

    authFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setIsAuthenticated(true);
          setForm((f) => ({
            ...f,
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.whatsappNumber || data.user.mobile || "",
          }));
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setDataLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/device-categories").then((r) => r.json()),
    ])
      .then(([deviceData]) => {
        setDeviceCategories(deviceData.categories || []);
      })
      .catch(() => setError("Failed to load form options"))
      .finally(() => setDataLoading(false));
  }, [isAuthenticated]);

  // Prefill from zero-result / demand deep links (?brand=&deviceModel=&partType=&q=)
  useEffect(() => {
    if (dataLoading || prefillSeeded.current || deviceCategories.length === 0) {
      return;
    }
    const brand = searchParams.get("brand")?.trim() || "";
    const deviceModel = searchParams.get("deviceModel")?.trim() || "";
    const partType = searchParams.get("partType")?.trim() || "";
    const deviceCategory = searchParams.get("deviceCategory")?.trim() || "";
    const q = searchParams.get("q")?.trim() || searchParams.get("search")?.trim() || "";
    prefillSeeded.current = true;
    if (!brand && !deviceModel && !partType && !deviceCategory && !q) return;

    const matchedDevice = deviceCategories.find(
      (c) =>
        c.value.toLowerCase() === deviceCategory.toLowerCase() ||
        c.label.toLowerCase() === deviceCategory.toLowerCase(),
    );
    if (matchedDevice) {
      setForm((f) => ({ ...f, deviceCategory: matchedDevice.value }));
    }
    if (brand) {
      setBrandSearch(brand);
      setForm((f) => ({ ...f, brand }));
    }
    if (partType) {
      setPartTypeSearch(partType);
      setForm((f) => ({
        ...f,
        partType,
        partTypeLabel: partType,
      }));
    }
    if (deviceModel) pendingModel.current = deviceModel;
    if (q && !brand && !partType) {
      setForm((f) => ({
        ...f,
        description: f.description || `Looking for: ${q}`,
      }));
    }
  }, [dataLoading, deviceCategories, searchParams]);

  useEffect(() => {
    if (!brandSearch || brands.length === 0 || form.brandSlug) return;
    const match = brands.find(
      (b) => b.name.toLowerCase() === brandSearch.toLowerCase(),
    );
    if (match) {
      setForm((f) => ({
        ...f,
        brand: match.name,
        brandSlug: match.slug,
      }));
    }
  }, [brands, brandSearch, form.brandSlug]);

  useEffect(() => {
    if (!form.brandSlug || !pendingModel.current || models.length === 0) return;
    const wanted = pendingModel.current;
    const match = models.find(
      (m) => m.name.toLowerCase() === wanted.toLowerCase(),
    );
    setForm((f) => ({
      ...f,
      deviceModel: match?.name || wanted,
    }));
    setModelSearch(match?.name || wanted);
    pendingModel.current = null;
  }, [models, form.brandSlug]);

  useEffect(() => {
    if (!form.partType || partTypes.length === 0) return;
    const match = partTypes.find(
      (p) =>
        p.value.toLowerCase() === form.partType.toLowerCase() ||
        (p.label || "").toLowerCase() === form.partType.toLowerCase(),
    );
    if (match) {
      setForm((f) => ({
        ...f,
        partType: match.value,
        partTypeLabel: match.label || match.value,
      }));
      setPartTypeSearch(match.label || match.value);
    }
  }, [partTypes, form.partType]);

  useEffect(() => {
    if (!form.deviceCategory) {
      setPartTypes([]);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/categories?device=${encodeURIComponent(form.deviceCategory)}`,
    )
      .then((r) => r.json())
      .then((partData) => {
        if (cancelled) return;
        const mapped = (partData.categories || []).map((cat: any) => ({
          value: cat.slug,
          label: cat.name,
          icon: cat.icon,
        }));
        setPartTypes(mapped);
        setForm((f) => {
          if (
            f.partType &&
            !mapped.some((p: { value: string }) => p.value === f.partType)
          ) {
            setPartTypeSearch("");
            return { ...f, partType: "" };
          }
          return f;
        });
      })
      .catch(() => {
        if (!cancelled) setPartTypes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.deviceCategory]);

  useEffect(() => {
    if (!form.deviceCategory) {
      setBrands([]);
      return;
    }
    fetch(`/api/categories/${form.deviceCategory}/brands?includeModels=false`)
      .then((r) => r.json())
      .then((data) => setBrands(data.brands || []))
      .catch(() => setBrands([]));
  }, [form.deviceCategory]);

  useEffect(() => {
    if (!form.brandSlug || !form.deviceCategory) {
      setModels([]);
      return;
    }
    fetch(
      `/api/brands/${form.brandSlug}/models?category=${form.deviceCategory}`,
    )
      .then((r) => r.json())
      .then((data) => setModels(data.models || []))
      .catch(() => setModels([]));
  }, [form.brandSlug, form.deviceCategory]);

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );
  const filteredPartTypes = partTypes.filter((p) =>
    p.label.toLowerCase().includes(partTypeSearch.toLowerCase()),
  );

  const handleBrandSelect = useCallback((brand: Brand) => {
    setForm((f) => ({
      ...f,
      brand: brand.name,
      brandSlug: brand.slug,
      deviceModel: "",
    }));
    setBrandSearch(brand.name);
    setShowBrandDropdown(false);
    setModelSearch("");
  }, []);

  const handleModelSelect = useCallback((model: Model) => {
    setForm((f) => ({ ...f, deviceModel: model.name }));
    setModelSearch(model.name);
  }, []);

  const handlePartTypeSelect = useCallback((part: Option) => {
    setForm((f) => ({
      ...f,
      partType: part.value,
      partTypeLabel: part.label,
    }));
    setPartTypeSearch(part.label);
    setShowPartTypeDropdown(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedInClient()) {
      setError("Please login to submit a request.");
      return;
    }

    if (!form.deviceCategory || !form.brand || !form.deviceModel || !form.partType) {
      setError("Please complete device category, brand, model, and part type.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    const res = await authFetch("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        category: form.partTypeLabel || form.partType,
        deviceCategory: form.deviceCategory,
        brand: form.brand,
        deviceModel: form.deviceModel,
        description: form.description,
      }),
    });

    if (res.ok) {
      setMessage("Request submitted. Sellers will reach out if they can help.");
      setForm((f) => ({
        ...f,
        deviceCategory: "",
        brand: "",
        brandSlug: "",
        deviceModel: "",
        partType: "",
        partTypeLabel: "",
        description: "",
      }));
      setBrandSearch("");
      setModelSearch("");
      setPartTypeSearch("");
      onSubmitted?.();
    } else {
      const data = await res.json();
      setError(data.message || "Failed to submit request.");
    }

    setLoading(false);
  }

  if (authChecking || (isAuthenticated && dataLoading)) {
    return (
      <Card padding="lg" className="min-h-[280px] flex items-center justify-center">
        <LoadingState label="Loading…" />
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card padding="lg" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="text-center max-w-md mx-auto py-6">
          <div className="w-14 h-14 rounded-[var(--radius-lg)] bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[var(--ink)] mb-2">Login required</h3>
          <p className="text-sm text-[var(--muted)] mb-6">
            Sign in or create an account so we can prefill your contact details and notify sellers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent("/requests?tab=submit")}`)
              }
            >
              Login
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() =>
                router.push(`/register?next=${encodeURIComponent("/requests?tab=submit")}`)
              }
            >
              Sign up
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert tone="danger">{error}</Alert>
        )}
        {message && (
          <Alert tone="success">{message}</Alert>
        )}

        {/* Contact details (auto-filled) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--ink-secondary)] text-[var(--ink-inverse)] flex items-center justify-center text-xs font-bold">
              0
            </div>
            <span className="text-sm font-semibold text-[var(--ink)]">
              Your contact details
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field htmlFor="req-name">
              <Input
                id="req-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                required
                className="bg-[var(--surface-2)]"
              />
            </Field>
            <Field htmlFor="req-email">
              <Input
                id="req-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                required
                className="bg-[var(--surface-2)]"
              />
            </Field>
            <Field htmlFor="req-phone">
              <Input
                id="req-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="WhatsApp / phone"
                className="bg-[var(--surface-2)]"
              />
            </Field>
          </div>
          <p className="text-xs text-[var(--muted)]">Prefilled from your account — edit if needed.</p>
        </div>

        {/* Step 1: Device Category */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-[var(--ink-inverse)] flex items-center justify-center text-xs font-bold">
              1
            </div>
            <label className="text-sm font-semibold text-[var(--ink)]">
              Select Device Category <span className="text-[var(--danger)]">*</span>
            </label>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-min pb-1">
              {deviceCategories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setPartTypeSearch("");
                    setForm((f) => ({
                      ...f,
                      deviceCategory: cat.value,
                      brand: "",
                      brandSlug: "",
                      deviceModel: "",
                      partType: "",
                    }));
                  }}
                  className={`px-4 py-3 rounded-[var(--radius)] border-2 transition-all duration-200 font-medium capitalize text-center flex-shrink-0 min-w-max w-28 active:scale-95 ${
                    form.deviceCategory === cat.value
                      ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--ink-inverse)] shadow-[var(--shadow-sm)]"
                      : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
                  }`}
                >
                  <div className="text-base mb-1">{cat.icon}</div>
                  <div className="text-xs font-semibold leading-tight">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Brand & Model */}
        {form.deviceCategory && (
          <div className="p-6 bg-[var(--brand-soft)] rounded-[var(--radius)] border-2 border-[var(--brand-muted)] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-[var(--ink-inverse)] flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h3 className="text-sm font-semibold text-[var(--brand-hover)]">Choose Brand & Model</h3>
            </div>

            <Field label="Brand *" className="relative">
              <Input
                type="text"
                placeholder="Search brand..."
                value={brandSearch}
                onChange={(e) => {
                  setBrandSearch(e.target.value);
                  setShowBrandDropdown(true);
                }}
                onFocus={() => setShowBrandDropdown(true)}
                onBlur={() => setTimeout(() => setShowBrandDropdown(false), 300)}
                required
              />
              {form.brand && (
                <div className="mt-2 inline-block bg-[var(--brand)] text-[var(--ink-inverse)] px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                  ✓ {form.brand}
                </div>
              )}
              {showBrandDropdown && (
                <div className="absolute z-10 mt-2 w-full max-h-64 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-dropdown)] animate-in fade-in duration-200">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand._id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleBrandSelect(brand);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[var(--brand-soft)] font-medium text-[var(--ink-secondary)] border-b border-[var(--border)] last:border-b-0"
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            {form.brand && (
              <div className="animate-in fade-in duration-200">
                <ModelSelector
                  models={models}
                  value={form.deviceModel}
                  searchValue={modelSearch}
                  onSearchChange={setModelSearch}
                  onSelect={handleModelSelect}
                  brandSlug={form.brandSlug}
                  category={form.deviceCategory}
                  onModelsUpdated={setModels}
                  required
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Part + description */}
        {form.deviceCategory && form.brand && form.deviceModel && (
          <div className="border-t-2 border-[var(--border)] pt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--ink-secondary)] text-[var(--ink-inverse)] flex items-center justify-center text-xs font-bold">
                3
              </div>
              <h3 className="text-sm font-semibold text-[var(--ink)]">Part details</h3>
            </div>

            <Field label="Part Type *" className="relative">
              <Input
                type="text"
                placeholder="Search part type (e.g., Screen, Battery)..."
                value={partTypeSearch}
                onChange={(e) => {
                  setPartTypeSearch(e.target.value);
                  setShowPartTypeDropdown(true);
                }}
                onFocus={() => setShowPartTypeDropdown(true)}
                onBlur={() => setTimeout(() => setShowPartTypeDropdown(false), 300)}
                required
              />
              {form.partType && (
                <div className="mt-2 inline-block bg-[var(--brand-hover)] text-[var(--ink-inverse)] px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                  ✓ {form.partTypeLabel || form.partType}
                </div>
              )}
              {showPartTypeDropdown && (
                <div className="absolute z-10 mt-2 w-full max-h-64 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-dropdown)]">
                  {filteredPartTypes.map((part) => (
                    <button
                      key={part.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handlePartTypeSelect(part);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[var(--brand-soft)] font-medium text-[var(--ink-secondary)] border-b border-[var(--border)] last:border-b-0 flex items-center gap-2"
                    >
                      <span>{part.icon}</span>
                      <span>{part.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Request Details *" htmlFor="req-desc" required>
              <Textarea
                id="req-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="min-h-[140px]"
                placeholder="Describe the part condition needed, urgency, and any notes for sellers."
                required
              />
            </Field>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={
            loading ||
            !form.deviceCategory ||
            !form.brand ||
            !form.deviceModel ||
            !form.partType
          }
        >
          {loading ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </Card>
  );
}
