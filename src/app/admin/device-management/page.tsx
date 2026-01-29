"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Tab types
type TabType = "categories" | "brands" | "types";

// Interfaces
interface Category {
  _id: string;
  name: string;
  icon: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order: number;
}

interface IModel {
  name: string;
  modelNumber?: string;
  releaseYear?: number;
}

interface DeviceTypeData {
  _id: string;
  name: string;
  emoji: string;
  slug: string;
  description: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryBrand {
  _id: string;
  category: string;
  name: string;
  slug: string;
  logo?: string;
  models: IModel[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDeviceManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  const [loading, setLoading] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    icon: "",
    slug: "",
    description: "",
    isActive: true,
    order: 0,
  });

  // Device Types state
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeData[]>([]);
  const [showDeviceTypeForm, setShowDeviceTypeForm] = useState(false);
  const [editingDeviceType, setEditingDeviceType] =
    useState<DeviceTypeData | null>(null);
  const [deviceTypeFormData, setDeviceTypeFormData] = useState({
    name: "",
    emoji: "",
    slug: "",
    description: "",
    isActive: true,
    order: 0,
  });

  // Brands state
  const [brands, setBrands] = useState<CategoryBrand[]>([]);
  const [selectedBrandCategory, setSelectedBrandCategory] =
    useState<string>("");
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<CategoryBrand | null>(null);
  const [brandFormData, setBrandFormData] = useState({
    category: "",
    name: "",
    slug: "",
    logo: "",
    models: [] as IModel[],
    isActive: true,
  });
  const [newModel, setNewModel] = useState({
    name: "",
    modelNumber: "",
    releaseYear: "",
  });

  // Common state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, []);

  // Auto-dismiss success and error messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function fetchData() {
    try {
      const token = localStorage.getItem("token");
      const [categoriesRes, brandsRes, typesRes] = await Promise.all([
        fetch("/api/admin/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/device-categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/device-types", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      let nextBrands: CategoryBrand[] = [];
      let nextDeviceTypes: DeviceTypeData[] = [];

      if (brandsRes.ok) {
        const data = await brandsRes.json();
        nextBrands = data.brands || [];
        setBrands(nextBrands);
      }

      if (typesRes.ok) {
        const data = await typesRes.json();
        nextDeviceTypes = data.deviceTypes || [];
        setDeviceTypes(nextDeviceTypes);
      }

      // Ensure a valid brand category selection
      if (nextDeviceTypes.length > 0) {
        setSelectedBrandCategory(nextDeviceTypes[0].slug);
      } else if (nextBrands.length > 0) {
        setSelectedBrandCategory(nextBrands[0].category);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // ==================== CATEGORIES HANDLERS ====================
  function handleEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      icon: category.icon,
      slug: category.slug,
      description: category.description || "",
      isActive: category.isActive,
      order: category.order,
    });
    setShowCategoryForm(true);
    setError("");
    setSuccess("");
  }

  function handleAddNewCategory() {
    setEditingCategory(null);
    setCategoryFormData({
      name: "",
      icon: "📦",
      slug: "",
      description: "",
      isActive: true,
      order: categories.length,
    });
    setShowCategoryForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmitCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory._id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryFormData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save category");
      }

      setSuccess(
        editingCategory
          ? "Category updated successfully"
          : "Category created successfully",
      );
      setShowCategoryForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete category");

      setSuccess("Category deleted successfully");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // ==================== DEVICE TYPES HANDLERS ====================
  function handleEditDeviceType(type: DeviceTypeData) {
    setEditingDeviceType(type);
    const formData = {
      name: type.name,
      emoji: type.emoji,
      slug: type.slug,
      description: type.description,
      isActive: type.isActive,
      order: type.order,
    };
    setDeviceTypeFormData(formData);
    setShowDeviceTypeForm(true);
    setError("");
    setSuccess("");
  }

  function handleAddNewDeviceType() {
    setEditingDeviceType(null);
    setDeviceTypeFormData({
      name: "",
      emoji: "📱",
      slug: "",
      description: "",
      isActive: true,
      order: deviceTypes.length,
    });
    setShowDeviceTypeForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmitDeviceType(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const url = editingDeviceType
        ? `/api/admin/device-types/${editingDeviceType._id}`
        : "/api/admin/device-types";
      const method = editingDeviceType ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deviceTypeFormData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save device type");
      }

      setSuccess(
        editingDeviceType
          ? "Device type updated successfully"
          : "Device type created successfully",
      );
      setShowDeviceTypeForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteDeviceType(id: string) {
    if (!confirm("Are you sure you want to delete this device type?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/device-types/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete device type");

      setSuccess("Device type deleted successfully");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // ==================== BRANDS HANDLERS ====================
  function handleEditBrand(brand: CategoryBrand) {
    setEditingBrand(brand);
    const formData = {
      category: brand.category,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      models: Array.isArray(brand.models) ? [...brand.models] : [],
      isActive: brand.isActive,
    };
    setBrandFormData(formData);
    setSelectedBrandCategory(brand.category);
    setShowBrandForm(true);
    setError("");
    setSuccess("");
  }

  function handleAddNewBrand() {
    setEditingBrand(null);
    setBrandFormData({
      category: selectedBrandCategory,
      name: "",
      slug: "",
      logo: "",
      models: [],
      isActive: true,
    });
    setShowBrandForm(true);
    setError("");
    setSuccess("");
  }

  function addModel() {
    if (newModel.name.trim()) {
      const model: IModel = {
        name: newModel.name,
        modelNumber: newModel.modelNumber || undefined,
        releaseYear: newModel.releaseYear
          ? parseInt(newModel.releaseYear)
          : undefined,
      };
      setBrandFormData({
        ...brandFormData,
        models: [...brandFormData.models, model],
      });
      setNewModel({ name: "", modelNumber: "", releaseYear: "" });
    }
  }

  function removeModel(index: number) {
    setBrandFormData({
      ...brandFormData,
      models: brandFormData.models.filter((_, i) => i !== index),
    });
  }

  async function handleSubmitBrand(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const url = editingBrand
        ? `/api/admin/device-categories/${editingBrand._id}`
        : "/api/admin/device-categories";
      const method = editingBrand ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(brandFormData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save brand");
      }

      setSuccess(
        editingBrand
          ? "Brand updated successfully"
          : "Brand created successfully",
      );
      setShowBrandForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteBrand(id: string) {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/device-categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete brand");

      setSuccess("Brand deleted successfully");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
          <p className="text-xl text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredBrands = selectedBrandCategory
    ? brands.filter((b) => b.category === selectedBrandCategory)
    : brands;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Device Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage categories, device brands, and device types in one place
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg shadow-md flex items-center justify-between">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => setError("")}
              className="ml-4 text-red-500 hover:text-red-700 font-bold text-xl"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg shadow-md flex items-center justify-between">
            <p className="text-green-700 font-medium">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="ml-4 text-green-500 hover:text-green-700 font-bold text-xl"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="grid grid-cols-3 gap-0">
            {/* Categories Tab */}
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-4 px-4 md:px-6 font-semibold text-center border-b-4 transition-all duration-200 ${
                activeTab === "categories"
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-b-blue-600 text-blue-700"
                  : "border-b-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl md:text-base">📦</span>
              <span className="hidden sm:inline ml-2">Categories</span>
            </button>

            {/* Brands Tab */}
            <button
              onClick={() => setActiveTab("brands")}
              className={`py-4 px-4 md:px-6 font-semibold text-center border-b-4 transition-all duration-200 ${
                activeTab === "brands"
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-b-blue-600 text-blue-700"
                  : "border-b-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl md:text-base">🏢</span>
              <span className="hidden sm:inline ml-2">Brands</span>
            </button>

            {/* Device Types Tab */}
            <button
              onClick={() => setActiveTab("types")}
              className={`py-4 px-4 md:px-6 font-semibold text-center border-b-4 transition-all duration-200 ${
                activeTab === "types"
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-b-blue-600 text-blue-700"
                  : "border-b-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl md:text-base">🎯</span>
              <span className="hidden sm:inline ml-2">Types</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}

        {/* ==================== CATEGORIES TAB ==================== */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Product Categories
              </h2>
              <button
                onClick={handleAddNewCategory}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg font-semibold transition"
              >
                + Add Category
              </button>
            </div>

            {showCategoryForm && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h3 className="text-2xl font-bold mb-6">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
                <form onSubmit={handleSubmitCategory} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        value={categoryFormData.name}
                        onChange={(e) => {
                          setCategoryFormData({
                            ...categoryFormData,
                            name: e.target.value,
                            slug: generateSlug(e.target.value),
                          });
                        }}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Mobile Screens"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Icon (Emoji) *
                      </label>
                      <input
                        type="text"
                        value={categoryFormData.icon}
                        onChange={(e) =>
                          setCategoryFormData({
                            ...categoryFormData,
                            icon: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="📱"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={categoryFormData.slug}
                        onChange={(e) =>
                          setCategoryFormData({
                            ...categoryFormData,
                            slug: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="mobile-screens"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Order
                      </label>
                      <input
                        type="number"
                        value={categoryFormData.order}
                        onChange={(e) =>
                          setCategoryFormData({
                            ...categoryFormData,
                            order: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={categoryFormData.isActive}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          isActive: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-sm font-medium text-gray-700"
                    >
                      Active (visible on homepage)
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:shadow-lg font-semibold transition"
                    >
                      {editingCategory ? "Update Category" : "Create Category"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{category.icon}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Slug: {category.slug}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        category.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {categories.length === 0 && !showCategoryForm && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-600 font-medium">
                  No categories yet. Create your first one!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================== BRANDS TAB ==================== */}
        {activeTab === "brands" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Device Brands
              </h2>
              <button
                onClick={handleAddNewBrand}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg font-semibold transition w-full md:w-auto"
              >
                + Add Brand
              </button>
            </div>

            {/* Brand Category Filters */}
            <div className="flex gap-2 flex-wrap">
              {deviceTypes.map((type) => {
                const count = brands.filter(
                  (b) => b.category === type.slug,
                ).length;
                return (
                  <button
                    key={type._id}
                    onClick={() => setSelectedBrandCategory(type.slug)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      selectedBrandCategory === type.slug
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                        : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {type.emoji} {type.name} ({count})
                  </button>
                );
              })}
            </div>

            {showBrandForm && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h3 className="text-2xl font-bold mb-6">
                  {editingBrand ? "Edit Brand" : "Add New Brand"}
                </h3>

                <form onSubmit={handleSubmitBrand} className="space-y-6">
                  {/* Device Category Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Device Category *
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {deviceTypes.map((type) => (
                        <button
                          key={type._id}
                          type="button"
                          onClick={() =>
                            setBrandFormData({
                              ...brandFormData,
                              category: type.slug,
                            })
                          }
                          className={`px-4 py-2 rounded-lg font-semibold transition ${
                            brandFormData.category === type.slug
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {type.emoji} {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Brand Name *
                      </label>
                      <input
                        type="text"
                        value={brandFormData.name}
                        onChange={(e) => {
                          setBrandFormData({
                            ...brandFormData,
                            name: e.target.value,
                            slug: generateSlug(e.target.value),
                          });
                        }}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Apple"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={brandFormData.slug}
                        onChange={(e) =>
                          setBrandFormData({
                            ...brandFormData,
                            slug: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="apple"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Logo URL
                      </label>
                      <input
                        type="text"
                        value={brandFormData.logo}
                        onChange={(e) =>
                          setBrandFormData({
                            ...brandFormData,
                            logo: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <input
                        type="checkbox"
                        id="brandActive"
                        checked={brandFormData.isActive}
                        onChange={(e) =>
                          setBrandFormData({
                            ...brandFormData,
                            isActive: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="brandActive"
                        className="text-sm font-medium text-gray-700"
                      >
                        Active
                      </label>
                    </div>
                  </div>

                  {/* Models Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Device Models
                    </h4>
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={newModel.name}
                          onChange={(e) =>
                            setNewModel({ ...newModel, name: e.target.value })
                          }
                          placeholder="Model Name (e.g., iPhone 15)"
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={newModel.modelNumber}
                          onChange={(e) =>
                            setNewModel({
                              ...newModel,
                              modelNumber: e.target.value,
                            })
                          }
                          placeholder="Model Number (optional)"
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          value={newModel.releaseYear}
                          onChange={(e) =>
                            setNewModel({
                              ...newModel,
                              releaseYear: e.target.value,
                            })
                          }
                          placeholder="Release Year (optional)"
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addModel}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg font-semibold transition"
                      >
                        + Add Model
                      </button>
                    </div>

                    {/* Models List */}
                    {brandFormData.models.length > 0 && (
                      <div className="space-y-2">
                        {brandFormData.models.map((model, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {model.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {model.modelNumber && `#${model.modelNumber}`}
                                {model.releaseYear && ` • ${model.releaseYear}`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeModel(idx)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:shadow-lg font-semibold transition"
                    >
                      {editingBrand ? "Update Brand" : "Create Brand"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBrandForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Brands Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Brand Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Slug
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Models
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrands.map((brand) => (
                      <tr
                        key={brand._id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {brand.name}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {brand.slug}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {brand.models.length} models
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              brand.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {brand.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => handleEditBrand(brand)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(brand._id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredBrands.length === 0 && !showBrandForm && (
                <div className="text-center py-12">
                  <p className="text-gray-600 font-medium">
                    No brands for this device type yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== DEVICE TYPES TAB ==================== */}
        {activeTab === "types" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Device Types</h2>
              <button
                onClick={handleAddNewDeviceType}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg font-semibold transition w-full md:w-auto"
              >
                + Add Device Type
              </button>
            </div>

            {showDeviceTypeForm && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h3 className="text-2xl font-bold mb-6">
                  {editingDeviceType
                    ? "Edit Device Type"
                    : "Add New Device Type"}
                </h3>

                <form onSubmit={handleSubmitDeviceType} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Device Type Name *
                      </label>
                      <input
                        type="text"
                        value={deviceTypeFormData.name}
                        onChange={(e) => {
                          setDeviceTypeFormData({
                            ...deviceTypeFormData,
                            name: e.target.value,
                            slug: generateSlug(e.target.value),
                          });
                        }}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Mobile"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Emoji *
                      </label>
                      <input
                        type="text"
                        value={deviceTypeFormData.emoji}
                        onChange={(e) =>
                          setDeviceTypeFormData({
                            ...deviceTypeFormData,
                            emoji: e.target.value,
                          })
                        }
                        required
                        maxLength={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="📱"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={deviceTypeFormData.slug}
                        onChange={(e) =>
                          setDeviceTypeFormData({
                            ...deviceTypeFormData,
                            slug: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="mobile"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Order
                      </label>
                      <input
                        type="number"
                        value={deviceTypeFormData.order}
                        onChange={(e) =>
                          setDeviceTypeFormData({
                            ...deviceTypeFormData,
                            order: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={deviceTypeFormData.description}
                      onChange={(e) =>
                        setDeviceTypeFormData({
                          ...deviceTypeFormData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Smartphones and mobile devices"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="typeIsActive"
                      checked={deviceTypeFormData.isActive}
                      onChange={(e) =>
                        setDeviceTypeFormData({
                          ...deviceTypeFormData,
                          isActive: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="typeIsActive"
                      className="text-sm font-medium text-gray-700"
                    >
                      Active (visible in marketplace)
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:shadow-lg font-semibold transition"
                    >
                      {editingDeviceType
                        ? "Update Device Type"
                        : "Create Device Type"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeviceTypeForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Device Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deviceTypes.map((type) => {
                const brandCount = brands.filter(
                  (b) => b.category === type.slug,
                ).length;
                const modelCount = brands
                  .filter((b) => b.category === type.slug)
                  .reduce((sum, b) => sum + b.models.length, 0);

                return (
                  <div
                    key={type._id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl">{type.emoji}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditDeviceType(type)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteDeviceType(type._id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {type.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {type.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Brands:</span>
                        <span className="font-bold text-blue-600">
                          {brandCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Models:</span>
                        <span className="font-bold text-indigo-600">
                          {modelCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                      <span
                        className={`flex-1 px-3 py-1 rounded-full text-xs font-semibold text-center ${
                          type.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {type.isActive ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => {
                          setActiveTab("brands");
                          setSelectedBrandCategory(type.slug);
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 py-2 rounded-lg hover:shadow-md font-semibold transition text-sm"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {deviceTypes.length === 0 && !showDeviceTypeForm && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-600 font-medium">
                  No device types yet. Create your first one!
                </p>
              </div>
            )}

            {/* Summary Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Platform Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                  <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">
                    Device Types
                  </p>
                  <p className="text-4xl font-bold text-blue-900 mt-2">
                    {deviceTypes.length}
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
                  <p className="text-sm text-purple-700 font-semibold uppercase tracking-wide">
                    Total Brands
                  </p>
                  <p className="text-4xl font-bold text-purple-900 mt-2">
                    {brands.length}
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
                  <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">
                    Total Models
                  </p>
                  <p className="text-4xl font-bold text-green-900 mt-2">
                    {brands.reduce((sum, b) => sum + b.models.length, 0)}
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100">
                  <p className="text-sm text-orange-700 font-semibold uppercase tracking-wide">
                    Categories
                  </p>
                  <p className="text-4xl font-bold text-orange-900 mt-2">
                    {categories.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
