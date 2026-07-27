"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

interface DeviceCategory {
  value: string;
  label: string;
  icon: string;
}

interface Condition {
  value: string;
  label: string;
}

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const [deviceCategories, setDeviceCategories] = useState<DeviceCategory[]>(
    [],
  );
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [partTypes, setPartTypes] = useState<PartType[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedDeviceCategory, setSelectedDeviceCategory] = useState(
    searchParams.get("deviceCategory") || searchParams.get("category") || "",
  );
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get("brand") || "",
  );
  const [selectedBrandSlug, setSelectedBrandSlug] = useState("");
  const [selectedModel, setSelectedModel] = useState(
    searchParams.get("deviceModel") || searchParams.get("model") || "",
  );
  const [selectedPartType, setSelectedPartType] = useState(
    searchParams.get("partType") || "",
  );
  const [selectedCondition, setSelectedCondition] = useState(
    searchParams.get("condition") || "",
  );
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get("minPrice") || "",
    max: searchParams.get("maxPrice") || "",
  });

  // Load static filter options
  useEffect(() => {
    fetch("/api/device-categories")
      .then((res) => res.json())
      .then((data) => setDeviceCategories(data.categories || []))
      .catch(() => {});

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const mappedPartTypes =
          data.categories?.map((cat: any) => ({
            value: cat.slug,
            label: cat.name,
            icon: cat.icon,
          })) || [];
        setPartTypes(mappedPartTypes);
      })
      .catch(() => {});

    fetch("/api/conditions")
      .then((res) => res.json())
      .then((data) => setConditions(data.conditions || []))
      .catch(() => {});
  }, []);

  // Debounce search so typing doesn't spam navigation
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load brands for selected device type (or all brands if none selected)
  useEffect(() => {
    let cancelled = false;
    const url = selectedDeviceCategory
      ? `/api/categories/${selectedDeviceCategory}/brands?includeModels=false`
      : "/api/brands?includeModels=false";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const nextBrands: Brand[] = data.brands || [];
        setBrands(nextBrands);

        setSelectedBrand((currentBrand) => {
          if (!currentBrand) {
            setSelectedBrandSlug("");
            return currentBrand;
          }
          const match = nextBrands.find(
            (b) => b.name.toLowerCase() === currentBrand.toLowerCase(),
          );
          setSelectedBrandSlug(match?.slug || "");
          if (!match) {
            setSelectedModel("");
            return "";
          }
          return currentBrand;
        });
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDeviceCategory]);

  // Load models when brand + device category are known
  useEffect(() => {
    if (!selectedBrandSlug || !selectedDeviceCategory) {
      setModels([]);
      return;
    }

    fetch(
      `/api/categories/${selectedDeviceCategory}/brands/${selectedBrandSlug}/models`,
    )
      .then((res) => res.json())
      .then((data) => setModels(data.models || []))
      .catch(() => setModels([]));
  }, [selectedBrandSlug, selectedDeviceCategory]);

  // Push filter state into the URL (skip first render to avoid wiping URL)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (selectedDeviceCategory)
      params.set("deviceCategory", selectedDeviceCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedModel) params.set("deviceModel", selectedModel);
    if (selectedPartType) params.set("partType", selectedPartType);
    if (selectedCondition) params.set("condition", selectedCondition);
    if (priceRange.min) params.set("minPrice", priceRange.min);
    if (priceRange.max) params.set("maxPrice", priceRange.max);

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.push(next ? `/products?${next}` : "/products");
    }
  }, [
    search,
    selectedDeviceCategory,
    selectedBrand,
    selectedModel,
    selectedPartType,
    selectedCondition,
    priceRange,
    router,
    searchParams,
  ]);

  const activeFilterCount = [
    search,
    selectedDeviceCategory,
    selectedBrand,
    selectedModel,
    selectedPartType,
    selectedCondition,
    priceRange.min,
    priceRange.max,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setSelectedDeviceCategory("");
    setSelectedBrand("");
    setSelectedBrandSlug("");
    setSelectedModel("");
    setSelectedPartType("");
    setSelectedCondition("");
    setPriceRange({ min: "", max: "" });
    setModels([]);
  };

  const handleDeviceCategoryChange = (value: string) => {
    setSelectedDeviceCategory(value);
    setSelectedBrand("");
    setSelectedBrandSlug("");
    setSelectedModel("");
    setModels([]);
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setSelectedModel("");
    const match = brands.find((b) => b.name === value);
    setSelectedBrandSlug(match?.slug || "");
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed bottom-6 left-6 z-50 bg-gradient-to-br from-blue-500 to-blue-700 text-white px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-110 hover:from-blue-600 hover:to-blue-800 transition-all duration-300 flex items-center gap-2 font-semibold animate-in fade-in slide-in-from-bottom-2 ease-out"
        >
          <svg
            className="w-4.5 h-4.5 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {activeFilterCount > 0 && (
            <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold animate-bounce">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`
          fixed lg:static top-0 left-0 h-auto max-h-[calc(100vh)] lg:h-auto w-64 
          bg-white shadow-xl lg:shadow-md border-r border-gray-200 lg:border
          z-50 lg:z-0 transition-transform duration-300 ease-out overflow-y-auto
          lg:rounded-lg lg:border-gray-200 rounded-r-2xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1.5 hover:bg-gray-100 rounded-lg"
              aria-label="Close filters"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Search
            </label>
            <input
              type="search"
              placeholder="Name, brand, model..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-sm text-gray-900 hover:border-gray-400"
            />
          </div>

          {/* Device Type */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Device Type
            </label>
            <select
              value={selectedDeviceCategory}
              onChange={(e) => handleDeviceCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-sm text-gray-900 hover:border-gray-400"
            >
              <option value="">All Devices</option>
              {deviceCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon ? `${cat.icon} ` : ""}
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-sm text-gray-900 hover:border-gray-400"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedBrandSlug || !selectedDeviceCategory}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-sm text-gray-900 hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {!selectedDeviceCategory
                  ? "Select device type first"
                  : !selectedBrand
                    ? "Select brand first"
                    : "All Models"}
              </option>
              {models.map((model) => (
                <option key={`${model.name}-${model.modelNumber || ""}`} value={model.name}>
                  {model.name}
                  {model.modelNumber ? ` (${model.modelNumber})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Part Type */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Part Type
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
              {partTypes.length > 1 && (
                <label className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-blue-50/80 cursor-pointer transition">
                  <input
                    type="radio"
                    name="partType"
                    value=""
                    checked={selectedPartType === ""}
                    onChange={(e) => setSelectedPartType(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">All Types</span>
                </label>
              )}
              {partTypes.map((partType) => (
                <label
                  key={partType.value}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-blue-50/80 cursor-pointer transition"
                >
                  <input
                    type="radio"
                    name="partType"
                    value={partType.value}
                    checked={selectedPartType === partType.value}
                    onChange={(e) => setSelectedPartType(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-base">{partType.icon}</span>
                  <span className="text-sm text-gray-700">
                    {partType.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Condition
            </label>
            <div className="space-y-1">
              <label className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-blue-50/80 cursor-pointer transition">
                <input
                  type="radio"
                  name="condition"
                  value=""
                  checked={selectedCondition === ""}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">All</span>
              </label>
              {conditions.map((condition) => (
                <label
                  key={condition.value}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-blue-50/80 cursor-pointer transition"
                >
                  <input
                    type="radio"
                    name="condition"
                    value={condition.value}
                    checked={selectedCondition === condition.value}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {condition.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, min: e.target.value })
                }
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm placeholder-gray-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: e.target.value })
                }
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm placeholder-gray-500"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="w-full text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200"
              >
                Clear All Filters
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 lg:hidden">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
