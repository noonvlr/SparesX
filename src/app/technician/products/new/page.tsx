"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";

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

interface Condition {
  value: string;
  label: string;
}

// Constants
const IMAGE_UPLOAD_FORMATS = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;

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
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPartTypeDropdown, setShowPartTypeDropdown] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {
    uploadImages,
    uploading: uploadingImages,
    uploadError,
  } = useImageUpload();

  // Fetch all static data on mount
  useEffect(() => {
    const fetchStaticData = async () => {
      setDataLoading(true);
      try {
        const [partsRes, categoriesRes, conditionsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/device-categories"),
          fetch("/api/conditions"),
        ]);

        if (partsRes.ok) {
          const data = await partsRes.json();
          // Map categories to partTypes format for backward compatibility
          const mappedPartTypes =
            data.categories?.map((cat: any) => ({
              value: cat.slug,
              label: cat.name,
              icon: cat.icon,
            })) || [];
          setPartTypes(mappedPartTypes);
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setDeviceCategories(data.categories || []);
        }

        if (conditionsRes.ok) {
          const data = await conditionsRes.json();
          setConditions(data.conditions || []);
          // Set first condition as default if available
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
    setShowModelDropdown(false);
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

  const filteredModels = useCallback(
    () =>
      models.filter(
        (m) =>
          m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
          (m.modelNumber &&
            m.modelNumber.toLowerCase().includes(modelSearch.toLowerCase())),
      ),
    [models, modelSearch],
  )();

  const filteredPartTypes = useCallback(
    () =>
      partTypes.filter((pt) =>
        pt.label.toLowerCase().includes(partTypeSearch.toLowerCase()),
      ),
    [partTypes, partTypeSearch],
  )();

  const validateImage = (file: File): boolean => {
    if (!IMAGE_UPLOAD_FORMATS.includes(file.type)) {
      setError("Only PNG, JPG, and WebP images are allowed");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be less than 5MB");
      return false;
    }
    return true;
  };

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const validFiles: File[] = [];
        const newImagePreviews: string[] = [];

        Array.from(files).forEach((file) => {
          if (
            validateImage(file) &&
            imageFiles.length + validFiles.length < MAX_IMAGES
          ) {
            validFiles.push(file);
          }
        });

        if (validFiles.length === 0) return;

        let loadedCount = 0;
        validFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              newImagePreviews.push(event.target.result as string);
              loadedCount++;
              if (loadedCount === validFiles.length) {
                setImageFiles((prev) => [...prev, ...validFiles]);
                setImages((prev) => [...prev, ...newImagePreviews]);
              }
            }
          };
          reader.readAsDataURL(file);
        });
      }
    },
    [imageFiles.length],
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

    setLoading(true);

    try {
      let uploadedImageUrls = images;
      if (imageFiles.length > 0) {
        const urls = await uploadImages(imageFiles);
        if (uploadError) {
          setError(uploadError);
          setLoading(false);
          return;
        }
        uploadedImageUrls = urls;
      }

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
      } else {
        setError(data.message || "Failed to add product");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (dataLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-3 sm:px-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 text-gray-900">
          Add New Product
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600">
          List your device parts for sale
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 space-y-6"
      >
        {error && (
          <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium animate-in fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg font-medium animate-in fade-in">
            {success}
          </div>
        )}

        {/* Step 1: Device Category Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
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
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      deviceCategory: cat.value,
                      brand: "",
                      brandSlug: "",
                      deviceModel: "",
                      modelNumber: "",
                    }))
                  }
                  className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium capitalize text-center flex-shrink-0 min-w-max w-28 active:scale-95 ${
                    form.deviceCategory === cat.value
                      ? "border-blue-600 bg-blue-600 text-white shadow-md hover:shadow-lg hover:border-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 shadow-sm hover:shadow-md"
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
          <div className="p-6 bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h3 className="text-sm font-semibold text-blue-900">
                Choose Brand & Model
              </h3>
            </div>

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
                  } else {
                    setBrandSearch("");
                  }
                  setShowBrandDropdown(true);
                }}
                onBlur={() =>
                  setTimeout(() => setShowBrandDropdown(false), 300)
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required={!!form.deviceCategory}
              />
              {form.brand && (
                <div className="mt-2 inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                  ✓ {form.brand}
                </div>
              )}
              {showBrandDropdown && (
                <div className="absolute z-10 mt-2 w-full max-h-80 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl animate-in fade-in duration-200">
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
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 active:bg-blue-100 transition font-medium text-gray-700 border-b border-gray-100 last:border-b-0"
                      >
                        {brand.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2.5 text-gray-500 text-center">
                      No brands found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model Dropdown - Only show when brand is selected */}
            {form.brand && (
              <div className="relative animate-in fade-in duration-200">
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
                    setTimeout(() => setShowModelDropdown(false), 300)
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required={!!form.brand}
                />
                {form.deviceModel && (
                  <div className="mt-2 inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                    ✓ {form.deviceModel}
                  </div>
                )}
                {showModelDropdown && (
                  <div className="absolute z-10 mt-2 w-full max-h-80 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-xl animate-in fade-in duration-200">
                    {filteredModels.length > 0 ? (
                      filteredModels.map((model, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleModelSelect(model);
                          }}
                          onClick={(e) => e.preventDefault()}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 active:bg-blue-100 transition font-medium text-gray-700 border-b border-gray-100 last:border-b-0"
                        >
                          {model.name}{" "}
                          {model.modelNumber && (
                            <span className="text-gray-500 text-sm">
                              ({model.modelNumber})
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
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
            <div className="border-t-2 border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Product Details
                </h3>
              </div>

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

              {/* Part Type */}
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
                    onBlur={() =>
                      setTimeout(() => setShowPartTypeDropdown(false), 300)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  {form.partType && (
                    <div className="mt-2 inline-block bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-in fade-in zoom-in">
                      ✓{" "}
                      {partTypes.find((p) => p.value === form.partType)?.label}
                    </div>
                  )}
                  {showPartTypeDropdown && (
                    <div className="absolute z-10 mt-2 w-full max-h-64 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg animate-in fade-in duration-200">
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
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 active:bg-blue-100 transition font-medium text-gray-700 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                          >
                            <span className="text-lg">{partType.icon}</span>
                            {partType.label}
                          </button>
                        ))
                      ) : (
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
                <label className="block text-sm font-semibold text-gray-800 mb-3">
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
                    const files = Array.from(e.dataTransfer.files).filter(
                      (file) => IMAGE_UPLOAD_FORMATS.includes(file.type),
                    );
                    if (files.length > 0) {
                      handleImageChange({
                        target: { files: files as unknown as FileList },
                      } as unknown as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 cursor-pointer ${
                    dragActive
                      ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                  } ${uploadingImages ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={IMAGE_UPLOAD_FORMATS.join(",")}
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
                            ? "text-blue-500 scale-110"
                            : "text-gray-400"
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
                    <p className="text-sm font-semibold text-gray-700">
                      {dragActive
                        ? "Drop images here"
                        : "Drag images here or click to browse"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WebP up to 5MB each ({images.length}/
                      {MAX_IMAGES})
                    </p>
                  </div>
                </div>

                {/* Camera and Gallery Buttons for Mobile */}
                <div className="mt-4 flex gap-3 sm:hidden">
                  <input
                    type="file"
                    accept={IMAGE_UPLOAD_FORMATS.join(",")}
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                    id="cameraInput"
                  />
                  <label
                    htmlFor="cameraInput"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2"
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
                    <div className="mb-4 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                      <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
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
                        {imageFiles.length} image
                        {imageFiles.length !== 1 ? "s" : ""} selected and ready
                        to upload
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Uploaded Images ({images.length}/{MAX_IMAGES})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {images.map((image, idx) => (
                        <div
                          key={idx}
                          className="relative group animate-in fade-in zoom-in duration-300"
                        >
                          <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-md">
                            <img
                              src={image}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setImages(images.filter((_, i) => i !== idx));
                              setImageFiles(
                                imageFiles.filter((_, i) => i !== idx),
                              );
                            }}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
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

                {uploadingImages && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-blue-600 font-semibold">
                      🔄 Uploading images...
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full animate-pulse"
                        style={{
                          width: "100%",
                          animation: "pulse 2s infinite",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {uploadingImages
                ? "Uploading Images..."
                : loading
                  ? "Adding Product..."
                  : "Add Product"}
            </button>
          </>
        )}

        {/* Helper text when not fully configured */}
        {(!form.deviceCategory || !form.brand || !form.deviceModel) && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600 animate-in fade-in">
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
