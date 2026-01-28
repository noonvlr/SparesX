"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

type DeviceCategory = "mobile" | "laptop" | "desktop";

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    deviceCategory: "" as DeviceCategory | "",
    brand: "",
    brandSlug: "",
    deviceModel: "",
    modelNumber: "",
    partType: "",
    condition: "new",
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [partTypes, setPartTypes] = useState<PartType[]>([]);

  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [partTypeSearch, setPartTypeSearch] = useState("");

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPartTypeDropdown, setShowPartTypeDropdown] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch part types on mount
  useEffect(() => {
    fetch("/api/part-types")
      .then((res) => res.json())
      .then((data) => setPartTypes(data.partTypes || []))
      .catch(() => setError("Failed to load part types"));
  }, []);

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
      name: model.name, // Auto-populate name field
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
      const fileArray = Array.from(files);
      const readers = fileArray.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then((results) => setImages(results));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.deviceCategory ||
      !form.brand ||
      !form.deviceModel ||
      !form.partType
    ) {
      setError("Please select all required categories");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }

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
          images,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Product added successfully!");
        setTimeout(() => router.push("/technician/products"), 1200);
      } else {
        setError(data.message || "Failed to add product");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          Add New Product
        </h1>
        <p className="text-gray-600">List your device parts for sale</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 space-y-6"
      >
        {error && (
          <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg font-medium">
            {success}
          </div>
        )}

        {/* Step 1: Device Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Step 1: Select Device Category *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["mobile", "laptop", "desktop"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    deviceCategory: cat as DeviceCategory,
                    brand: "",
                    brandSlug: "",
                    deviceModel: "",
                    modelNumber: "",
                  }))
                }
                className={`p-4 rounded-lg border-2 transition font-medium capitalize text-center ${
                  form.deviceCategory === cat
                    ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-300"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                }`}
              >
                {cat === "mobile" && "📱"} {cat === "laptop" && "💻"}{" "}
                {cat === "desktop" && "🖥️"}
                <div className="text-sm capitalize">{cat}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Device Details (Brand & Model) */}
        {form.deviceCategory && (
          <div className="p-6 bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300 space-y-4">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
              Step 2: Choose Brand & Model
            </h3>

            {/* Brand Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                  if (!form.brand) {
                    setBrandSearch("");
                  }
                  setShowBrandDropdown(true);
                }}
                onBlur={() =>
                  setTimeout(() => setShowBrandDropdown(false), 200)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required={!!form.deviceCategory}
              />
              {form.brand && (
                <div className="mt-2 inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ✓ {form.brand}
                </div>
              )}
              {showBrandDropdown && (
                <div className="absolute z-10 mt-2 w-full max-h-80 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand._id}
                      type="button"
                      onClick={() => handleBrandSelect(brand)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition font-medium text-gray-700 border-b border-gray-100 last:border-b-0"
                    >
                      {brand.name}
                    </button>
                  ))}
                  {filteredBrands.length === 0 && (
                    <div className="px-4 py-2.5 text-gray-500 text-center">
                      No brands found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model Dropdown - Only show when brand is selected */}
            {form.brand && (
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                    setTimeout(() => setShowModelDropdown(false), 200)
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required={!!form.brand}
                />
                {form.deviceModel && (
                  <div className="mt-2 inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ {form.deviceModel}
                  </div>
                )}
                {showModelDropdown && (
                  <div className="absolute z-10 mt-2 w-full max-h-80 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl">
                    {filteredModels.map((model, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleModelSelect(model)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition font-medium text-gray-700 border-b border-gray-100 last:border-b-0"
                      >
                        {model.name}{" "}
                        {model.modelNumber && (
                          <span className="text-gray-500 text-sm">
                            ({model.modelNumber})
                          </span>
                        )}
                      </button>
                    ))}
                    {filteredModels.length === 0 && (
                      <div className="px-4 py-2.5 text-gray-500 text-center">
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
            <div className="border-t-2 border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">
                Step 3: Product Details
              </h3>

              {/* Product Name (Auto-populated) */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., iPhone 15 Pro Screen"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Auto-populated from model selection
                </p>
              </div>

              {/* Part Type BEFORE Description */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  {form.partType && (
                    <div className="mt-2 inline-block bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ✓{" "}
                      {partTypes.find((p) => p.value === form.partType)?.label}
                    </div>
                  )}
                  {showPartTypeDropdown && (
                    <div className="absolute z-10 mt-2 w-full max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                      {filteredPartTypes.map((partType) => (
                        <button
                          key={partType.value}
                          type="button"
                          onClick={() => handlePartTypeSelect(partType)}
                          className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition font-medium text-gray-700 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-xl">{partType.icon}</span>
                          {partType.label}
                        </button>
                      ))}
                      {filteredPartTypes.length === 0 && (
                        <div className="px-4 py-2.5 text-gray-500 text-center">
                          No part types found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe the product, condition, and any special features..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none h-32"
                  required
                />
              </div>

              {/* Price & Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Condition *
                  </label>
                  <select
                    value={form.condition}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, condition: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Product Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {images.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {images.length} image(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 mt-2"
            >
              {loading ? "Adding Product..." : "Add Product"}
            </button>
          </>
        )}

        {/* Helper text when not fully configured */}
        {(!form.deviceCategory || !form.brand || !form.deviceModel) && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
            {!form.deviceCategory &&
              "👈 Select a device category to get started"}
            {form.deviceCategory &&
              !form.brand &&
              "👈 Choose a brand for your device"}
            {form.deviceCategory &&
              form.brand &&
              !form.deviceModel &&
              "👈 Select a model to continue"}
          </div>
        )}
      </form>
    </div>
  );
}
