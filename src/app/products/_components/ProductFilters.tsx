"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Card";
import { showToast } from "@/components/ToastHost";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";
import PromoSlot from "@/components/promo/PromoSlot";

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

const SELLER_TYPES = [
  { value: "trusted", label: "Trusted sellers" },
  { value: "kyc", label: "KYC verified" },
  { value: "business", label: "Business verified" },
  { value: "phone", label: "Phone verified" },
  { value: "elite", label: "Elite sellers" },
] as const;

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

const RECENT_SEARCHES_KEY = "sparesx:recentSearches";
const MAX_RECENT_SEARCHES = 6;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  if (typeof window === "undefined") return;
  const trimmed = term.trim();
  if (!trimmed) return;
  const existing = loadRecentSearches().filter(
    (s) => s.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

const fieldLabelClasses =
  "block text-xs font-semibold text-[var(--ink-secondary)] mb-2 uppercase tracking-wide";

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Floating/sticky search bar with a client-only autocomplete dropdown built
 * from the currently loaded product names plus recent local searches.
 * Manages only the `search` query param, merging with whatever other
 * params `ProductFilters` currently owns.
 */
export function ProductSearchBar({
  productNames = [],
}: {
  productNames?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const urlSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [search, setSearch] = useState(urlSearch);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Keep input in sync when browser Back/Forward changes the URL
  useEffect(() => {
    setSearchInput(urlSearch);
    setSearch(urlSearch);
  }, [urlSearch]);

  // Debounce so typing doesn't spam navigation
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Push only the `search` param, preserving whatever else is in the URL
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    params.delete("page");

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.push(next ? `/products?${next}` : "/products");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: push only when debounced search changes
  }, [search]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return [];
    const uniqueNames = Array.from(new Set(productNames.filter(Boolean)));
    return uniqueNames
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [searchInput, productNames]);

  const matchingRecent = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    return recentSearches
      .filter((term) => !query || term.toLowerCase().includes(query))
      .slice(0, query ? 3 : MAX_RECENT_SEARCHES);
  }, [recentSearches, searchInput]);

  const commitSearch = (term: string) => {
    setSearchInput(term);
    setSearch(term.trim());
    if (term.trim()) {
      saveRecentSearch(term);
      setRecentSearches(loadRecentSearches());
    }
    setShowSuggestions(false);
  };

  const clearRecent = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
    setRecentSearches([]);
  };

  const flatOptions = useMemo(() => {
    const recent = matchingRecent.map((term) => ({
      kind: "recent" as const,
      value: term,
    }));
    const products = suggestions.map((name) => ({
      kind: "product" as const,
      value: name,
    }));
    return [...recent, ...products];
  }, [matchingRecent, suggestions]);

  const hasDropdownContent = flatOptions.length > 0;

  return (
    <div
      ref={containerRef}
      className="sticky top-[calc(var(--nav-h)+8px)] z-30 md:top-4"
    >
      <div className="relative">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            type="search"
            inputMode="search"
            role="combobox"
            aria-expanded={showSuggestions && hasDropdownContent}
            aria-autocomplete="list"
            aria-controls="product-search-listbox"
            placeholder="Search by name, brand, or model…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setHighlightIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && flatOptions.length) {
                e.preventDefault();
                setShowSuggestions(true);
                setHighlightIndex((i) =>
                  i < flatOptions.length - 1 ? i + 1 : 0,
                );
                return;
              }
              if (e.key === "ArrowUp" && flatOptions.length) {
                e.preventDefault();
                setHighlightIndex((i) =>
                  i > 0 ? i - 1 : flatOptions.length - 1,
                );
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                if (highlightIndex >= 0 && flatOptions[highlightIndex]) {
                  commitSearch(flatOptions[highlightIndex].value);
                } else {
                  commitSearch(searchInput);
                }
                return;
              }
              if (e.key === "Escape") {
                setShowSuggestions(false);
                setHighlightIndex(-1);
              }
            }}
            className="h-auto rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--surface)] py-3 pl-12 pr-10 shadow-[var(--shadow-md)]"
          />
          {searchInput ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => commitSearch("")}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 shrink-0 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>

        {showSuggestions && hasDropdownContent ? (
          <div
            id="product-search-listbox"
            role="listbox"
            className="glass absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]"
          >
            {matchingRecent.length > 0 ? (
              <div className="px-2 pt-2.5">
                <div className="flex items-center justify-between px-2 pb-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Recent
                  </p>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-[11px] font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                  >
                    Clear
                  </button>
                </div>
                {matchingRecent.map((term) => {
                  const idx = flatOptions.findIndex(
                    (o) => o.kind === "recent" && o.value === term,
                  );
                  const active = idx === highlightIndex;
                  return (
                    <button
                      key={`recent-${term}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => commitSearch(term)}
                      className={`flex w-full items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-2 text-left text-sm transition-colors ${
                        active
                          ? "bg-[var(--brand-soft)] text-[var(--brand-hover)]"
                          : "text-[var(--ink-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-hover)]"
                      }`}
                    >
                      <IconClock className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                      <span className="truncate">{term}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {suggestions.length > 0 ? (
              <div className="px-2 pb-2.5 pt-1.5">
                <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Products
                </p>
                {suggestions.map((name) => {
                  const idx = flatOptions.findIndex(
                    (o) => o.kind === "product" && o.value === name,
                  );
                  const active = idx === highlightIndex;
                  return (
                    <button
                      key={`suggestion-${name}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => commitSearch(name)}
                      className={`flex w-full items-center gap-2.5 rounded-[var(--radius)] px-2.5 py-2 text-left text-sm transition-colors ${
                        active
                          ? "bg-[var(--brand-soft)] text-[var(--brand-hover)]"
                          : "text-[var(--ink-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-hover)]"
                      }`}
                    >
                      <IconSearch className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
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
  const [modelsLoading, setModelsLoading] = useState(false);
  const [partTypes, setPartTypes] = useState<PartType[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
  const [debouncedPrice, setDebouncedPrice] = useState(priceRange);
  const [selectedCity, setSelectedCity] = useState(
    searchParams.get("city") || "",
  );
  const [includeNearby, setIncludeNearby] = useState(
    searchParams.get("nearby") === "1" || searchParams.get("nearby") === "true",
  );
  const [selectedSellerType, setSelectedSellerType] = useState(
    searchParams.get("sellerType") || "",
  );
  const [selectedSort, setSelectedSort] = useState(
    searchParams.get("sort") || "featured",
  );
  const [negotiableOnly, setNegotiableOnly] = useState(
    searchParams.get("negotiable") === "1" ||
      searchParams.get("negotiable") === "true",
  );
  const [savingSearch, setSavingSearch] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const syncingFromUrl = useRef(false);
  const lastPushedUrl = useRef<string | null>(null);

  // Debounce price so each digit does not navigate
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPrice(priceRange), 400);
    return () => clearTimeout(timer);
  }, [priceRange]);

  // Sync filter fields when URL changes from Back/Forward (not our own pushes)
  const urlKey = searchParams.toString();
  useEffect(() => {
    if (lastPushedUrl.current === urlKey) return;

    syncingFromUrl.current = true;
    setSelectedDeviceCategory(
      searchParams.get("deviceCategory") || searchParams.get("category") || "",
    );
    setSelectedBrand(searchParams.get("brand") || "");
    setSelectedModel(
      searchParams.get("deviceModel") || searchParams.get("model") || "",
    );
    setSelectedPartType(searchParams.get("partType") || "");
    setSelectedCondition(searchParams.get("condition") || "");
    const nextPrice = {
      min: searchParams.get("minPrice") || "",
      max: searchParams.get("maxPrice") || "",
    };
    setPriceRange(nextPrice);
    setDebouncedPrice(nextPrice);
    setSelectedCity(searchParams.get("city") || "");
    setIncludeNearby(
      searchParams.get("nearby") === "1" ||
        searchParams.get("nearby") === "true",
    );
    setSelectedSellerType(searchParams.get("sellerType") || "");
    setSelectedSort(searchParams.get("sort") || "featured");
    setNegotiableOnly(
      searchParams.get("negotiable") === "1" ||
        searchParams.get("negotiable") === "true",
    );
    queueMicrotask(() => {
      syncingFromUrl.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  // Load device types + conditions + cities on mount
  useEffect(() => {
    fetch("/api/device-categories")
      .then((res) => res.json())
      .then((data) => setDeviceCategories(data.categories || []))
      .catch(() => {});

    fetch("/api/conditions")
      .then((res) => res.json())
      .then((data) => setConditions(data.conditions || []))
      .catch(() => {});

    fetch("/api/cities")
      .then((res) => res.json())
      .then((data) => setCities(data.cities || []))
      .catch(() => {});
  }, []);

  // Part categories: all when no device, device-scoped (+ global) when selected
  useEffect(() => {
    let cancelled = false;
    const url = selectedDeviceCategory
      ? `/api/categories?device=${encodeURIComponent(selectedDeviceCategory)}`
      : "/api/categories";

    fetch(url)
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
        setSelectedPartType((current) => {
          if (
            current &&
            !mappedPartTypes.some((pt: PartType) => pt.value === current)
          ) {
            return "";
          }
          return current;
        });
      })
      .catch(() => {
        if (!cancelled) setPartTypes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDeviceCategory]);

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

  // Load models whenever a brand is selected
  useEffect(() => {
    if (!selectedBrandSlug) {
      setModels([]);
      setModelsLoading(false);
      return;
    }

    let cancelled = false;
    setModelsLoading(true);
    setModels([]);

    const params = new URLSearchParams();
    if (selectedDeviceCategory) {
      params.set("category", selectedDeviceCategory);
    }
    const query = params.toString();
    const url = `/api/brands/${selectedBrandSlug}/models${query ? `?${query}` : ""}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setModels(data.models || []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBrandSlug, selectedDeviceCategory]);

  // Push filter state into the URL (skip first render to avoid wiping URL).
  // Preserves `search`, which is owned by ProductSearchBar.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (syncingFromUrl.current) return;

    const searchValue = searchParams.get("search");
    const limitValue = searchParams.get("limit");
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);

    if (selectedDeviceCategory)
      params.set("deviceCategory", selectedDeviceCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedModel) params.set("deviceModel", selectedModel);
    if (selectedPartType) params.set("partType", selectedPartType);
    if (selectedCondition) params.set("condition", selectedCondition);
    if (debouncedPrice.min) params.set("minPrice", debouncedPrice.min);
    if (debouncedPrice.max) params.set("maxPrice", debouncedPrice.max);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedCity && includeNearby) params.set("nearby", "1");
    if (selectedSellerType) params.set("sellerType", selectedSellerType);
    if (selectedSort && selectedSort !== "featured")
      params.set("sort", selectedSort);
    if (negotiableOnly) params.set("negotiable", "1");
    // Preserve supported limit; page intentionally resets when filters change.
    if (limitValue) params.set("limit", limitValue);

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      lastPushedUrl.current = next;
      router.push(next ? `/products?${next}` : "/products");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedDeviceCategory,
    selectedBrand,
    selectedModel,
    selectedPartType,
    selectedCondition,
    debouncedPrice,
    selectedCity,
    includeNearby,
    selectedSellerType,
    selectedSort,
    negotiableOnly,
  ]);

  const activeFilterCount = [
    selectedDeviceCategory,
    selectedBrand,
    selectedModel,
    selectedPartType,
    selectedCondition,
    priceRange.min,
    priceRange.max,
    selectedCity,
    selectedSellerType,
    selectedSort !== "featured" ? selectedSort : "",
    negotiableOnly ? "1" : "",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedDeviceCategory("");
    setSelectedBrand("");
    setSelectedBrandSlug("");
    setSelectedModel("");
    setSelectedPartType("");
    setSelectedCondition("");
    setPriceRange({ min: "", max: "" });
    setSelectedCity("");
    setIncludeNearby(false);
    setSelectedSellerType("");
    setSelectedSort("featured");
    setNegotiableOnly(false);
    setModels([]);
  };

  const saveCurrentSearch = async () => {
    if (!isLoggedInClient()) {
      showToast("Log in to save this search", "error");
      router.push(
        `/login?next=${encodeURIComponent(
          `/products?${searchParams.toString()}`,
        )}`,
      );
      return;
    }

    const filters = {
      search: searchParams.get("search") || undefined,
      deviceCategory: selectedDeviceCategory || undefined,
      brand: selectedBrand || undefined,
      deviceModel: selectedModel || undefined,
      partType: selectedPartType || undefined,
      condition: selectedCondition || undefined,
      minPrice: priceRange.min || undefined,
      maxPrice: priceRange.max || undefined,
      city: selectedCity || undefined,
      nearby: selectedCity && includeNearby ? true : undefined,
      sellerType: selectedSellerType || undefined,
      negotiable: negotiableOnly ? "1" : undefined,
    };

    const hasCriteria = Object.values(filters).some(Boolean);
    if (!hasCriteria) {
      showToast("Add at least one filter first", "error");
      return;
    }

    setSavingSearch(true);
    try {
      const res = await authFetch("/api/saved-searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Could not save search", "error");
        return;
      }
      showToast(data.message || "Search saved");
    } catch {
      showToast("Could not save search", "error");
    } finally {
      setSavingSearch(false);
    }
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
    if (!value) {
      setSelectedBrandSlug("");
      setModels([]);
      return;
    }
    const match = brands.find((b) => b.name === value);
    setSelectedBrandSlug(match?.slug || "");
  };

  // Render as a function (not a nested component) so React does not remount
  // inputs on every keystroke and steal focus from price fields.
  const renderFilterFields = (radioScope: string) => (
    <div className="space-y-5">
      <div>
        <label className={fieldLabelClasses}>Device type</label>
        <Select
          value={selectedDeviceCategory}
          onChange={(e) => handleDeviceCategoryChange(e.target.value)}
        >
          <option value="">All devices</option>
          {deviceCategories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.icon ? `${cat.icon} ` : ""}
              {cat.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className={fieldLabelClasses}>Brand</label>
        <Select
          value={selectedBrand}
          onChange={(e) => handleBrandChange(e.target.value)}
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand._id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className={fieldLabelClasses}>Model</label>
        <Select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!selectedBrandSlug}
        >
          <option value="">
            {!selectedBrand
              ? "Select brand first"
              : modelsLoading
                ? "Loading models…"
                : models.length === 0
                  ? "No models found"
                  : "All models"}
          </option>
          {models.map((model) => (
            <option
              key={`${model.name}-${model.modelNumber || ""}`}
              value={model.name}
            >
              {model.name}
              {model.modelNumber ? ` (${model.modelNumber})` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className={fieldLabelClasses}>Part type</label>
        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
          {partTypes.length > 1 && (
            <label className="flex items-center gap-2.5 p-1.5 rounded-[var(--radius)] hover:bg-[var(--brand-soft)] cursor-pointer transition-colors">
              <input
                type="radio"
                name={`partType-${radioScope}`}
                value=""
                checked={selectedPartType === ""}
                onChange={(e) => setSelectedPartType(e.target.value)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              <span className="text-sm text-[var(--ink-secondary)]">All types</span>
            </label>
          )}
          {partTypes.map((partType) => (
            <label
              key={partType.value}
              className="flex items-center gap-2.5 p-1.5 rounded-[var(--radius)] hover:bg-[var(--brand-soft)] cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name={`partType-${radioScope}`}
                value={partType.value}
                checked={selectedPartType === partType.value}
                onChange={(e) => setSelectedPartType(e.target.value)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              <span className="text-base">{partType.icon}</span>
              <span className="text-sm text-[var(--ink-secondary)]">
                {partType.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={fieldLabelClasses}>Condition</label>
        <div className="space-y-0.5">
          <label className="flex items-center gap-2.5 p-1.5 rounded-[var(--radius)] hover:bg-[var(--brand-soft)] cursor-pointer transition-colors">
            <input
              type="radio"
              name={`condition-${radioScope}`}
              value=""
              checked={selectedCondition === ""}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            <span className="text-sm font-medium text-[var(--ink-secondary)]">All</span>
          </label>
          {conditions.map((condition) => (
            <label
              key={condition.value}
              className="flex items-center gap-2.5 p-1.5 rounded-[var(--radius)] hover:bg-[var(--brand-soft)] cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name={`condition-${radioScope}`}
                value={condition.value}
                checked={selectedCondition === condition.value}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              <span className="text-sm text-[var(--ink-secondary)]">
                {condition.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={fieldLabelClasses}>Price range (₹)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange({ ...priceRange, min: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: e.target.value })
            }
          />
        </div>
        <label className="mt-2 flex items-center gap-2.5 p-1.5 rounded-[var(--radius)] hover:bg-[var(--brand-soft)] cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={negotiableOnly}
            onChange={(e) => setNegotiableOnly(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          <span className="text-sm text-[var(--ink-secondary)]">
            Negotiable price only
          </span>
        </label>
      </div>

      <div>
        <label className={fieldLabelClasses}>City</label>
        <Select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        {selectedCity ? (
          <label className="mt-2 flex items-center gap-2.5 p-1.5 rounded-[var(--radius)] hover:bg-[var(--brand-soft)] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={includeNearby}
              onChange={(e) => setIncludeNearby(e.target.checked)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            <span className="text-sm text-[var(--ink-secondary)]">
              Include nearby cities
            </span>
          </label>
        ) : (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Leave empty to browse all India. If you&apos;re signed in with a
            profile city, same-city listings are ranked first.
          </p>
        )}
      </div>

      <div>
        <label className={fieldLabelClasses}>Seller type</label>
        <Select
          value={selectedSellerType}
          onChange={(e) => setSelectedSellerType(e.target.value)}
        >
          <option value="">All sellers</option>
          {SELLER_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className={fieldLabelClasses}>Sort by</label>
        <Select
          value={selectedSort}
          onChange={(e) => setSelectedSort(e.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {(activeFilterCount > 0 || searchParams.get("search")) && (
        <div className="pt-4 border-t border-[var(--border)] space-y-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={savingSearch}
            onClick={() => void saveCurrentSearch()}
          >
            Save this search
          </Button>
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-[var(--brand)] hover:text-[var(--brand-hover)]"
              onClick={clearAllFilters}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block space-y-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)] mb-5">
            <IconFilter className="h-4 w-4 text-[var(--brand)]" />
            Refine search
          </h2>
          {renderFilterFields("desktop")}
        </div>
        <PromoSlot placement="sidebar_ad" />
      </div>

      {/* Mobile floating trigger */}
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-[calc(var(--bottom-nav-h)+16px)] right-4 z-40 rounded-full px-4 py-3 shadow-[var(--shadow-lg)]"
      >
        <IconFilter className="h-4.5 w-4.5" />
        Refine
        {activeFilterCount > 0 && (
          <Badge className="border-0 bg-[var(--ink-inverse)]/25 text-[var(--ink-inverse)]">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Mobile filter sheet */}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Refine search">
        {renderFilterFields("mobile")}
        <div className="pt-5 mt-5 border-t border-[var(--border)]">
          <Button type="button" className="w-full" onClick={() => setIsOpen(false)}>
            Show results
          </Button>
        </div>
      </Modal>
    </>
  );
}
