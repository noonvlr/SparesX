"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Button } from "@/components/ui/Button";

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface Model {
  name: string;
  modelNumber: string;
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

export default function EditProductPage() {
  const params = useParams();
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
    condition: "new" as "new" | "used",
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [partTypes, setPartTypes] = useState<PartType[]>([]);
  const [deviceCategories, setDeviceCategories] = useState<
    DeviceCategoryOption[]
  >([]);

  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [partTypeSearch, setPartTypeSearch] = useState("");

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPartTypeDropdown, setShowPartTypeDropdown] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const {
    uploadImages,
    uploading: uploadingImages,
    uploadError,
  } = useImageUpload();

  useEffect(() => {
    // Get ID directly from params (Next.js 16 provides it synchronously in client components)
    const productId = params?.id as string;

    if (!productId) {
      console.log("[Edit] No product ID in URL");
      setError("Product ID not found");
      setLoading(false);
      return;
    }

    console.log("[Edit] Product ID from URL:", productId);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Fetch from technician's products endpoint
    console.log("[Edit] Fetching from /api/technician/products");
    fetch("/api/technician/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log("[Edit] Got products list, status:", res.status);
        if (!res.ok) throw new Error(`Failed with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("[Edit] Products received:", data.products?.length);
        const product = data.products?.find((p: any) => p._id === productId);

        if (!product) {
          console.log("[Edit] Product not found in list");
          setError("Product not found");
          setLoading(false);
          return;
        }

        console.log("[Edit] Found product:", product);
        setForm({
          name: product.name || "",
          description: product.description || "",
          price: product.price?.toString() || "",
          deviceCategory: product.deviceCategory || "",
          brand: product.brand || "",
          brandSlug: product.brand?.toLowerCase().replace(/\s+/g, "-") || "",
          deviceModel: product.deviceModel || "",
          modelNumber: product.modelNumber || "",
          partType: product.partType || "",
          condition: product.condition || "new",
        });
        setBrandSearch(product.brand || "");
        setModelSearch(product.deviceModel || "");
        setPartTypeSearch(product.partType || "");
        setExistingImages(product.images || []);
        console.log("[Edit] Form populated successfully");
        setLoading(false);
      })
      .catch((error) => {
        console.error("[Edit] Error:", error);
        setError("Failed to load product: " + error.message);
        setLoading(false);
      });
  }, [params]);

  // Fetch device types on mount
  useEffect(() => {
    fetch("/api/device-categories")
      .then((res) => res.json())
      .then((data) => setDeviceCategories(data.categories || []))
      .catch(() => setError("Failed to load device types"));
  }, []);

  // Fetch part types for selected device
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
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load part types");
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
    }
  }, [form.brandSlug, form.deviceCategory]);

  function handleBrandSelect(brand: Brand) {
    setForm((f) => ({ ...f, brand: brand.name, brandSlug: brand.slug }));
    setBrandSearch(brand.name);
    setShowBrandDropdown(false);
  }

  function handleModelSelect(model: Model) {
    setForm((f) => ({
      ...f,
      deviceModel: model.name,
      modelNumber: model.modelNumber || "",
      name: model.name,
    }));
    setModelSearch(model.name);
    setShowModelDropdown(false);
  }

  function handlePartTypeSelect(partType: PartType) {
    setForm((f) => ({ ...f, partType: partType.value }));
    setPartTypeSearch(partType.label);
    setShowPartTypeDropdown(false);
  }

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      (m.modelNumber &&
        m.modelNumber.toLowerCase().includes(modelSearch.toLowerCase())),
  );

  const filteredPartTypes = partTypes.filter((pt) =>
    pt.label.toLowerCase().includes(partTypeSearch.toLowerCase()),
  );

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      setImageFiles(Array.from(files));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const productId = params?.id as string;

    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }

    try {
      // Upload new images if any
      let uploadedImageUrls = existingImages;
      if (imageFiles.length > 0) {
        const { urls, error: upErr } = await uploadImages(imageFiles);
        if (upErr || urls.length === 0) {
          setError(upErr || "Failed to upload images");
          return;
        }
        uploadedImageUrls = [...existingImages, ...urls];
      }

      const res = await fetch(`/api/technician/products/edit/${productId}`, {
        method: "PUT",
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
        setSuccess("Product updated successfully!");
        setTimeout(() => router.push("/technician/products"), 1200);
      } else {
        setError(data.message || "Failed to update product");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  }

  if (loading)
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center text-[var(--muted)]">
        Loading...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2 text-[var(--ink)]">
            Edit Product
          </h1>
          <p className="text-[var(--muted)]">Update your device parts listing</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center px-4 py-2.5 text-[var(--ink-secondary)] bg-[var(--surface-3)] hover:bg-[var(--border)] rounded-[var(--radius)] transition-colors duration-200 font-medium"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[var(--surface)] p-6 sm:p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--border)] space-y-6"
      >
        {error && (
          <div className="p-4 text-[var(--danger)] bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-[var(--radius)] font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 text-[var(--success)] bg-[var(--success-soft)] border border-[var(--success)]/20 rounded-[var(--radius)] font-medium">
            {success}
          </div>
        )}

        {/* Step 1: Device Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-3">
            Step 1: Device Category *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(deviceCategories.length > 0
              ? deviceCategories
              : [
                  {
                    value: form.deviceCategory,
                    label: form.deviceCategory,
                    icon: "📱",
                  },
                ].filter((c) => c.value)
            ).map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    deviceCategory: cat.value,
                    ...(f.deviceCategory !== cat.value
                      ? {
                          brand: "",
                          brandSlug: "",
                          deviceModel: "",
                          modelNumber: "",
                          partType: "",
                        }
                      : {}),
                  }))
                }
                className={`p-4 rounded-[var(--radius)] border-2 transition font-medium capitalize text-center ${
                  form.deviceCategory === cat.value
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-hover)] ring-2 ring-[var(--brand-muted)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-secondary)] hover:border-[var(--brand-muted)]"
                }`}
              >
                <div className="text-lg mb-1">{cat.icon}</div>
                <div className="text-sm capitalize">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Device Details (Brand & Model) */}
        {form.deviceCategory && (
          <div className="p-6 bg-[var(--brand-soft)] rounded-[var(--radius)] border-2 border-[var(--brand-muted)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--brand-hover)] uppercase tracking-wide">
              Step 2: Choose Brand & Model
            </h3>

            {/* Brand Dropdown */}
            <div className="relative">
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
                    // Reset brand selection when clicking again
                    setForm((f) => ({
                      ...f,
                      brand: "",
                      brandSlug: "",
                      deviceModel: "",
                      modelNumber: "",
                    }));
                    setBrandSearch("");
                    setModelSearch("");
                  } else {
                    setBrandSearch("");
                  }
                  setShowBrandDropdown(true);
                }}
                onBlur={() =>
                  setTimeout(() => setShowBrandDropdown(false), 300)
                }
                className="w-full px-3 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition"
                required={!!form.deviceCategory}
              />
              {form.brand && (
                <div className="mt-2 inline-block bg-[var(--brand)] text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ✓ {form.brand}
                </div>
              )}
              {showBrandDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
                  {filteredBrands.map((brand) => (
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
                  ))}
                  {filteredBrands.length === 0 && (
                    <div className="px-4 py-2.5 text-[var(--muted)] text-center">
                      No brands found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model Dropdown - Only show when brand is selected */}
            {form.brand && (
              <div className="relative">
                <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  placeholder="Search model..."
                  value={modelSearch}
                  onChange={(e) => {
                    setModelSearch(e.target.value);
                    setShowModelDropdown(true);
                  }}
                  onFocus={() => {
                    if (!form.deviceModel) {
                      setModelSearch("");
                    }
                    setShowModelDropdown(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowModelDropdown(false), 300)
                  }
                  className="w-full px-3 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition"
                  required={!!form.brand}
                />
                {form.deviceModel && (
                  <div className="mt-2 inline-block bg-[var(--success)] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ {form.deviceModel}
                  </div>
                )}
                {showModelDropdown && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
                    {filteredModels.map((model, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleModelSelect(model);
                        }}
                        onClick={(e) => e.preventDefault()}
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
                    {filteredModels.length === 0 && (
                      <div className="px-4 py-2.5 text-[var(--muted)] text-center">
                        No models found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Product Details (only show after device is fully selected) */}
        {form.deviceCategory && form.brand && form.deviceModel && (
          <>
            <div className="border-t-2 border-[var(--border)] pt-6">
              <h3 className="text-sm font-bold text-[var(--ink-secondary)] uppercase tracking-wide mb-4">
                Step 3: Product Details
              </h3>

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

              {/* Part Type BEFORE Description */}
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
                    <div className="mt-2 inline-block bg-[var(--brand-hover)] text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ✓{" "}
                      {partTypes.find((p) => p.value === form.partType)?.label}
                    </div>
                  )}
                  {showPartTypeDropdown && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
                      {filteredPartTypes.map((partType) => (
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
                          <span className="text-xl">{partType.icon}</span>
                          {partType.label}
                        </button>
                      ))}
                      {filteredPartTypes.length === 0 && (
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
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Condition *
                  </label>
                  <select
                    value={form.condition}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        condition: e.target.value as "new" | "used",
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                  </select>
                </div>
              </div>

              {/* Current Images */}
              {existingImages.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-3">
                    Current Images
                  </label>
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                    {existingImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-full aspect-square rounded-[var(--radius)] overflow-hidden border-2 border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center"
                      >
                        <img
                          src={img}
                          alt={`Current ${idx + 1}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                  {existingImages.length > 0
                    ? "Add More Images (Optional)"
                    : "Product Images"}
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingImages}
                  className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition disabled:bg-[var(--surface-3)]"
                />
                {imageFiles.length > 0 && (
                  <p className="text-sm text-[var(--success)] mt-2">
                    ✓ {imageFiles.length} new image(s) selected
                  </p>
                )}
                {uploadingImages && (
                  <p className="text-sm text-[var(--brand)] mt-2">
                    🔄 Uploading images...
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-[var(--border)]">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => router.push("/technician/products")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={uploadingImages}
              >
                {uploadingImages ? "Uploading..." : "Update Product"}
              </Button>
            </div>
          </>
        )}

        {!form.deviceCategory && (
          <div className="mt-8 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius)] text-center text-[var(--muted)]">
            Select a device category to get started
          </div>
        )}
      </form>
    </div>
  );
}
