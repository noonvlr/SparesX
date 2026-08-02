"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModelSelector from "@/components/ModelSelector";

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
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setAuthChecking(false);
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
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
    const token = localStorage.getItem("token");
    if (!token) {
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

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex items-center justify-center min-h-[280px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="text-center max-w-md mx-auto py-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Login required</h3>
          <p className="text-sm text-gray-600 mb-6">
            Sign in or create an account so we can prefill your contact details and notify sellers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(`/login?next=${encodeURIComponent("/requests?tab=submit")}`)
              }
              className="py-3 rounded-xl bg-[var(--brand)] text-white font-semibold hover:bg-[var(--brand-hover)] transition active:scale-95"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(`/register?next=${encodeURIComponent("/requests?tab=submit")}`)
              }
              className="py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 transition active:scale-95"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 space-y-6 animate-in fade-in duration-300"
    >
      {error && (
        <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium animate-in fade-in">
          {error}
        </div>
      )}
      {message && (
        <div className="p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg font-medium animate-in fade-in">
          {message}
        </div>
      )}

      {/* Contact details (auto-filled) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
            0
          </div>
          <label className="text-sm font-semibold text-gray-800">
            Your contact details
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Full name"
            required
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Email"
            required
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="WhatsApp / phone"
          />
        </div>
        <p className="text-xs text-gray-500">Prefilled from your account — edit if needed.</p>
      </div>

      {/* Step 1: Device Category */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-xs font-bold">
            1
          </div>
          <label className="text-sm font-semibold text-gray-800">
            Select Device Category <span className="text-red-500">*</span>
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
                className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium capitalize text-center flex-shrink-0 min-w-max w-28 active:scale-95 ${
                  form.deviceCategory === cat.value
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-md"
                    : "border-gray-300 bg-white text-gray-700 hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
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
        <div className="p-6 bg-gradient-to-br from-[var(--brand-soft)] via-[var(--brand-soft)] to-teal-50 rounded-lg border-2 border-[var(--brand-muted)] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h3 className="text-sm font-semibold text-blue-900">Choose Brand & Model</h3>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Brand *</label>
            <input
              type="text"
              placeholder="Search brand..."
              value={brandSearch}
              onChange={(e) => {
                setBrandSearch(e.target.value);
                setShowBrandDropdown(true);
              }}
              onFocus={() => setShowBrandDropdown(true)}
              onBlur={() => setTimeout(() => setShowBrandDropdown(false), 300)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
            {form.brand && (
              <div className="mt-2 inline-block bg-[var(--brand-soft)]0 text-white px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                ✓ {form.brand}
              </div>
            )}
            {showBrandDropdown && (
              <div className="absolute z-10 mt-2 w-full max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl animate-in fade-in duration-200">
                {filteredBrands.map((brand) => (
                  <button
                    key={brand._id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleBrandSelect(brand);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-[var(--brand-soft)] font-medium text-gray-700 border-b border-gray-100 last:border-b-0"
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            )}
          </div>

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
        <div className="border-t-2 border-gray-100 pt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Part details</h3>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Part Type *
            </label>
            <input
              type="text"
              placeholder="Search part type (e.g., Screen, Battery)..."
              value={partTypeSearch}
              onChange={(e) => {
                setPartTypeSearch(e.target.value);
                setShowPartTypeDropdown(true);
              }}
              onFocus={() => setShowPartTypeDropdown(true)}
              onBlur={() => setTimeout(() => setShowPartTypeDropdown(false), 300)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
            {form.partType && (
              <div className="mt-2 inline-block bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                ✓ {form.partTypeLabel || form.partType}
              </div>
            )}
            {showPartTypeDropdown && (
              <div className="absolute z-10 mt-2 w-full max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl">
                {filteredPartTypes.map((part) => (
                  <button
                    key={part.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handlePartTypeSelect(part);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-[var(--brand-soft)] font-medium text-gray-700 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                  >
                    <span>{part.icon}</span>
                    <span>{part.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Request Details *
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[140px]"
              placeholder="Describe the part condition needed, urgency, and any notes for sellers."
              required
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          !form.deviceCategory ||
          !form.brand ||
          !form.deviceModel ||
          !form.partType
        }
        className="w-full rounded-lg bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] text-white py-3.5 font-semibold hover:shadow-lg transition disabled:opacity-50 active:scale-[0.99]"
      >
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
