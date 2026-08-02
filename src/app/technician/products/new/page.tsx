"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";
import ModelSelector from "@/components/ModelSelector";
import { Button } from "@/components/ui/Button";

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface Model {
  name: string;
  modelNumber?: string;
}

interface PartType {
  value: string;
  label: string;
  icon: string;
}

interface DeviceCategoryOption {
  value: string;
  label: string;
  icon: string;
}

interface Condition {
  value: string;
  label: string;
}

// Constants
const IMAGE_UPLOAD_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const IMAGE_UPLOAD_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;

function isAllowedImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime && IMAGE_UPLOAD_FORMATS.includes(mime)) return true;
  // Some mobile browsers omit MIME — fall back to extension
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    deviceCategory: "",
    brand: "",
    brandSlug: "",
    deviceModel: "",
    modelNumber: "",
    partType: "",
    condition: "new",
    priceNegotiable: false,
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [partTypes, setPartTypes] = useState<PartType[]>([]);
  const [deviceCategories, setDeviceCategories] = useState<
    DeviceCategoryOption[]
  >([]);
  const [conditions, setConditions] = useState<Condition[]>([]);

  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [partTypeSearch, setPartTypeSearch] = useState("");

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showPartTypeDropdown, setShowPartTypeDropdown] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [phoneGate, setPhoneGate] = useState<"checking" | "ok" | "blocked">(
    "checking",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {
    uploadImages,
    uploading: uploadingImages,
    uploadError,
    setUploadError,
  } = useImageUpload();

  // Fetch all static data on mount
  useEffect(() => {
    const checkPhone = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace(`/login?next=${encodeURIComponent("/technician/products/new")}`);
        return;
      }
      try {
        const res = await fetch("/api/auth/verify/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.phoneVerified) {
          setPhoneGate("blocked");
          return;
        }
        setPhoneGate("ok");
      } catch {
        setPhoneGate("blocked");
      }
    };
    void checkPhone();
  }, [router]);

  // Fetch device types + conditions on mount; part types load per device
  useEffect(() => {
    const fetchStaticData = async () => {
      setDataLoading(true);
      try {
        const [categoriesRes, conditionsRes] = await Promise.all([
          fetch("/api/device-categories"),
          fetch("/api/conditions"),
        ]);

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setDeviceCategories(data.categories || []);
        }

        if (conditionsRes.ok) {
          const data = await conditionsRes.json();
          setConditions(data.conditions || []);
          if (data.conditions?.length > 0) {
            setForm((f) => ({ ...f, condition: data.conditions[0].value }));
          }
        }
      } catch (err) {
        setError("Failed to load form options");
      } finally {
        setDataLoading(false);
      }
    };

    fetchStaticData();
  }, []);

  // Part categories for selected device (device-scoped + global fallbacks)
  useEffect(() => {
    if (!form.deviceCategory) {
      setPartTypes([]);
      return;
    }

    let cancelled = false;
    fetch(
      `/api/categories?device=${encodeURIComponent(form.deviceCategory)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const mappedPartTypes =
          data.categories?.map((cat: any) => ({
            value: cat.slug,
            label: cat.name,
            icon: cat.icon,
          })) || [];
        setPartTypes(mappedPartTypes);
        setForm((f) => {
          if (
            f.partType &&
            !mappedPartTypes.some((pt: PartType) => pt.value === f.partType)
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

  // Fetch brands when category is selected
  useEffect(() => {
    if (form.deviceCategory) {
      fetch(`/api/categories/${form.deviceCategory}/brands?includeModels=false`)
        .then((res) => res.json())
        .then((data) => setBrands(data.brands || []))
        .catch(() => setError("Failed to load brands"));
    }
  }, [form.deviceCategory]);

  // Fetch models when brand is selected
  useEffect(() => {
    if (form.brandSlug && form.deviceCategory) {
      fetch(
        `/api/categories/${form.deviceCategory}/brands/${form.brandSlug}/models`,
      )
        .then((res) => res.json())
        .then((data) => setModels(data.models || []))
        .catch(() => setError("Failed to load models"));
    } else {
      setModels([]);
      setForm((f) => ({ ...f, deviceModel: "", modelNumber: "" }));
    }
  }, [form.brandSlug, form.deviceCategory]);

  const handleBrandSelect = useCallback((brand: Brand) => {
    setForm((f) => ({ ...f, brand: brand.name, brandSlug: brand.slug }));
    setBrandSearch(brand.name);
    setShowBrandDropdown(false);
    setModelSearch("");
    setForm((f) => ({ ...f, deviceModel: "", modelNumber: "" }));
  }, []);

  const handleModelSelect = useCallback((model: Model) => {
    setForm((f) => ({
      ...f,
      deviceModel: model.name,
      modelNumber: model.modelNumber || "",
      name: model.name,
    }));
    setModelSearch(model.name);
  }, []);

  const handlePartTypeSelect = useCallback((partType: PartType) => {
    setForm((f) => ({ ...f, partType: partType.value }));
    setPartTypeSearch(partType.label);
    setShowPartTypeDropdown(false);
  }, []);

  const filteredBrands = useCallback(
    () =>
      brands.filter((b) =>
        b.name.toLowerCase().includes(brandSearch.toLowerCase()),
      ),
    [brands, brandSearch],
  )();

  const filteredPartTypes = useCallback(
    () =>
      partTypes.filter((pt) =>
        pt.label.toLowerCase().includes(partTypeSearch.toLowerCase()),
      ),
    [partTypes, partTypeSearch],
  )();

  const validateImage = (file: File): string | null => {
    if (!isAllowedImageFile(file)) {
      return "Only PNG, JPG, and WebP images are allowed";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "Each image must be less than 5MB";
    }
    return null;
  };

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList?.length) return;

      const picked = Array.from(fileList);
      try {
        e.target.value = "";
      } catch {
        // Drag-drop synthetic events may not allow value writes
      }

      setError("");
      setUploadError("");

      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }

      const validFiles: File[] = [];
      for (const file of picked) {
        if (validFiles.length >= remaining) break;
        const reason = validateImage(file);
        if (reason) {
          setError(reason);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      const { urls, error: upErr } = await uploadImages(validFiles);
      if (upErr || urls.length === 0) {
        setError(upErr || "Failed to upload images. Please try again.");
        return;
      }

      setImages((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
    },
    [images.length, uploadImages, setUploadError],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.deviceCategory ||
      !form.brand ||
      !form.deviceModel ||
      !form.partType ||
      !form.name ||
      !form.description ||
      !form.price
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }

    if (uploadingImages) {
      setError("Please wait for image uploads to finish");
      return;
    }

    const uploadedImageUrls = images.filter(
      (url) =>
        url.startsWith("https://") ||
        url.startsWith("http://") ||
        url.startsWith("/uploads/"),
    );

    setLoading(true);

    try {
      const res = await fetch("/api/technician/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          images: uploadedImageUrls,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Product added successfully!");
        setTimeout(() => router.push("/technician/products"), 1200);
      } else if (data.code === "PHONE_UNVERIFIED") {
        setError(data.message || "Verify your phone before posting");
        setTimeout(() => router.push("/verify"), 800);
      } else {
        setError(data.message || "Failed to add product");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (phoneGate === "checking" || dataLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-3 sm:px-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--brand-muted)] border-t-[var(--brand)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted)] font-medium">Loading form options...</p>
        </div>
      </div>
    );
  }

  if (phoneGate === "blocked") {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-semibold text-[var(--ink)] mb-2">
          Verify your phone first
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          You must verify your mobile number before posting a listing.
        </p>
        <Button size="lg" onClick={() => router.push("/verify")}>
          Go to verification
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-1 sm:mb-2 text-[var(--ink)]">
          Add New Product
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-[var(--muted)]">
          List your device parts for sale
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[var(--surface)] p-6 sm:p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--border)] space-y-6"
      >
        {error && (
          <div className="p-4 text-[var(--danger)] bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-[var(--radius)] font-medium animate-in fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 text-[var(--success)] bg-[var(--success-soft)] border border-[var(--success)]/20 rounded-[var(--radius)] font-medium animate-in fade-in">
            {success}
          </div>
        )}

        {/* Step 1: Device Category Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <label className="text-sm font-semibold text-[var(--ink-secondary)]">
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
                      modelNumber: "",
                      partType: "",
                    }));
                  }}
                  className={`px-4 py-3 rounded-[var(--radius)] border-2 transition-all duration-200 font-medium capitalize text-center flex-shrink-0 min-w-max w-28 active:scale-95 ${
                    form.deviceCategory === cat.value
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--brand-hover)] hover:border-[var(--brand-hover)]"
                      : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] shadow-[var(--shadow-sm)]"
                  }`}
                >
                  <div className="text-base mb-1">{cat.icon}</div>
                  <div className="text-xs font-semibold leading-tight">
                    {cat.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Device Details (Brand & Model) */}
        {form.deviceCategory && (
          <div className="relative z-20 p-6 bg-[var(--brand-soft)] rounded-[var(--radius)] border-2 border-[var(--brand-muted)] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h3 className="text-sm font-semibold text-[var(--brand-hover)]">
                Choose Brand & Model
              </h3>
            </div>

            {/* Brand Dropdown */}
            <div className={`relative ${showBrandDropdown ? "z-30" : ""}`}>
              <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                Brand *
              </label>
              <input
                type="text"
                placeholder="Search brand..."
                value={brandSearch}
                onChange={(e) => {
                  setBrandSearch(e.target.value);
                  setShowBrandDropdown(true);
                }}
                onFocus={() => {
                  if (form.brand) {
                    setForm((f) => ({
                      ...f,
                      brand: "",
                      brandSlug: "",
                      deviceModel: "",
                      modelNumber: "",
                    }));
                    setBrandSearch("");
                    setModelSearch("");
                  }
                  setShowBrandDropdown(true);
                }}
                onBlur={() =>
                  setTimeout(() => setShowBrandDropdown(false), 300)
                }
                className="w-full px-3 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition"
                required={!!form.deviceCategory}
                autoComplete="off"
              />
              {form.brand && (
                <div className="mt-2 inline-block bg-[var(--brand)] text-white px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                  ✓ {form.brand}
                </div>
              )}
              {showBrandDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => (
                      <button
                        key={brand._id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleBrandSelect(brand);
                        }}
                        onClick={(e) => e.preventDefault()}
                        className="w-full px-4 py-3 text-left hover:bg-[var(--brand-soft)] active:bg-[var(--brand-muted)] transition font-medium text-[var(--ink-secondary)] border-b border-[var(--border)] last:border-b-0"
                      >
                        {brand.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2.5 text-[var(--muted)] text-center">
                      No brands found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model selector - search existing, suggest close matches, or add new */}
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

        {/* Step 3: Product Details (only show after device is fully selected) */}
        {form.deviceCategory && form.brand && form.deviceModel && (
          <>
            <div className="border-t-2 border-[var(--border)] pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[var(--ink-secondary)] text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <h3 className="text-sm font-semibold text-[var(--ink-secondary)]">
                  Product Details
                </h3>
              </div>

              {/* Product Name (Auto-populated) */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., iPhone 15 Pro Screen"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition"
                  required
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  💡 Auto-populated from model selection
                </p>
              </div>

              {/* Part Type */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                  Part Type *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search part type (e.g., Screen, Battery, Camera)..."
                    value={partTypeSearch}
                    onChange={(e) => {
                      setPartTypeSearch(e.target.value);
                      setShowPartTypeDropdown(true);
                    }}
                    onFocus={() => setShowPartTypeDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowPartTypeDropdown(false), 300)
                    }
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition"
                  />
                  {form.partType && (
                    <div className="mt-2 inline-block bg-[var(--brand-hover)] text-white px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                      ✓{" "}
                      {partTypes.find((p) => p.value === form.partType)?.label}
                    </div>
                  )}
                  {showPartTypeDropdown && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
                      {filteredPartTypes.length > 0 ? (
                        filteredPartTypes.map((partType) => (
                          <button
                            key={partType.value}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handlePartTypeSelect(partType);
                            }}
                            onClick={(e) => e.preventDefault()}
                            className="w-full px-4 py-2.5 text-left hover:bg-[var(--brand-soft)] active:bg-[var(--brand-muted)] transition font-medium text-[var(--ink-secondary)] flex items-center gap-3 border-b border-[var(--border)] last:border-b-0"
                          >
                            <span className="text-lg">{partType.icon}</span>
                            {partType.label}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2.5 text-[var(--muted)] text-center">
                          No part types found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe the product, condition, and any special features..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition resize-none h-32"
                  required
                />
              </div>

              {/* Price & Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition"
                    required
                  />
                  <label className="mt-3 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.priceNegotiable}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          priceNegotiable: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--brand)] focus:ring-[var(--brand)]"
                    />
                    <span className="text-sm text-[var(--ink-secondary)]">
                      Price is negotiable
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Condition *
                  </label>
                  <select
                    value={form.condition}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, condition: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition"
                  >
                    {conditions.map((cond) => (
                      <option key={cond.value} value={cond.value}>
                        {cond.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-3">
                  Product Images (Max {MAX_IMAGES})
                </label>

                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const dt = e.dataTransfer.files;
                    if (!dt?.length) return;
                    handleImageChange({
                      target: {
                        files: dt,
                        value: "",
                      },
                    } as unknown as React.ChangeEvent<HTMLInputElement>);
                  }}
                  className={`relative border-2 border-dashed rounded-[var(--radius)] p-8 transition-all duration-300 cursor-pointer ${
                    dragActive
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[var(--shadow-md)] scale-105"
                      : "border-[var(--border-strong)] bg-[var(--surface-2)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
                  } ${uploadingImages ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={IMAGE_UPLOAD_ACCEPT}
                    onChange={handleImageChange}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <svg
                        className={`w-12 h-12 transition-all duration-300 ${
                          dragActive
                            ? "text-[var(--brand)] scale-110"
                            : "text-[var(--muted)]"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[var(--ink-secondary)]">
                      {dragActive
                        ? "Drop images here"
                        : "Drag images here or click to browse"}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      PNG, JPG, WebP up to 5MB each ({images.length}/
                      {MAX_IMAGES})
                    </p>
                  </div>
                </div>

                {/* Camera and Gallery Buttons for Mobile */}
                <div className="mt-4 flex gap-3 sm:hidden">
                  <input
                    type="file"
                    accept={IMAGE_UPLOAD_ACCEPT}
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                    id="cameraInput"
                  />
                  <label
                    htmlFor="cameraInput"
                    className="flex-1 bg-[var(--brand)] text-white py-2.5 rounded-[var(--radius)] font-semibold hover:bg-[var(--brand-hover)] hover:shadow-[var(--shadow-md)] transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.222A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.222A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Take Photo
                  </label>
                </div>

                {/* Image Preview Grid and Confirmation */}
                {images.length > 0 && (
                  <div className="mt-4 animate-in fade-in zoom-in duration-300">
                    {/* Confirmation Message */}
                    <div className="mb-4 p-3 sm:p-4 bg-[var(--success-soft)] border-l-4 border-[var(--success)] rounded-[var(--radius)]">
                      <p className="text-sm font-semibold text-[var(--success)] flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {images.length} image
                        {images.length !== 1 ? "s" : ""} uploaded
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-[var(--ink-secondary)] mb-3">
                      Uploaded Images ({images.length}/{MAX_IMAGES})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {images.map((image, idx) => (
                        <div
                          key={idx}
                          className="relative group animate-in fade-in zoom-in duration-300"
                        >
                          <div className="aspect-square bg-[var(--surface-3)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
                            <img
                              src={image}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setImages((prev) =>
                                prev.filter((_, i) => i !== idx),
                              );
                            }}
                            className="absolute top-1 right-1 bg-[var(--danger)] hover:bg-red-700 text-white rounded-full p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 shadow-[var(--shadow-md)] hover:scale-110"
                            aria-label="Remove image"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(uploadingImages || uploadError) && (
                  <div className="mt-4 space-y-2">
                    {uploadingImages && (
                      <p className="text-sm text-[var(--brand)] font-semibold">
                        Uploading images…
                      </p>
                    )}
                    {uploadError && (
                      <p className="text-sm text-[var(--danger)] font-medium">
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || uploadingImages}
              size="lg"
              className="w-full mt-2"
            >
              {uploadingImages
                ? "Uploading Images..."
                : loading
                  ? "Adding Product..."
                  : "Add Product"}
            </Button>
          </>
        )}

        {/* Only before step 1 — later tips were overlapping brand/model dropdowns */}
        {!form.deviceCategory && (
          <div className="mt-8 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-center text-[var(--muted)]">
            Select a device category to get started
          </div>
        )}
      </form>
    </div>
  );
}
