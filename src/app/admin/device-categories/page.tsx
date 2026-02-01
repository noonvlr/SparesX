"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type DeviceCategory = "mobile" | "laptop" | "desktop";

interface IModel {
  name: string;
  modelNumber?: string;
  releaseYear?: number;
}

interface CategoryBrand {
  _id: string;
  category: DeviceCategory;
  name: string;
  slug: string;
  logo?: string;
  models: IModel[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDeviceCategoriesPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<CategoryBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<CategoryBrand | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<DeviceCategory>("mobile");
  const [formData, setFormData] = useState({
    category: "mobile" as DeviceCategory,
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categoryEmojis = {
    mobile: "📱",
    laptop: "💻",
    desktop: "🖥️",
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/device-categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch brands");
      const data = await res.json();
      setBrands(data.brands);
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

  function handleEdit(brand: CategoryBrand) {
    setEditingBrand(brand);
    setFormData({
      category: brand.category,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      models: [...brand.models],
      isActive: brand.isActive,
    });
    setSelectedCategory(brand.category);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function handleAddNew() {
    setEditingBrand(null);
    setFormData({
      category: "mobile",
      name: "",
      slug: "",
      logo: "",
      models: [],
      isActive: true,
    });
    setSelectedCategory("mobile");
    setShowForm(true);
    setNewModel({ name: "", modelNumber: "", releaseYear: "" });
    setError("");
    setSuccess("");
  }

  function handleAddModel() {
    if (!newModel.name.trim()) {
      setError("Model name is required");
      return;
    }

    const modelToAdd: IModel = {
      name: newModel.name,
      ...(newModel.modelNumber && { modelNumber: newModel.modelNumber }),
      ...(newModel.releaseYear && {
        releaseYear: parseInt(newModel.releaseYear),
      }),
    };

    setFormData({
      ...formData,
      models: [...formData.models, modelToAdd],
    });

    setNewModel({ name: "", modelNumber: "", releaseYear: "" });
    setError("");
  }

  function handleRemoveModel(index: number) {
    setFormData({
      ...formData,
      models: formData.models.filter((_, i) => i !== index),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Brand name is required");
      return;
    }

    if (!formData.slug.trim()) {
      setError("Slug is required");
      return;
    }

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
        body: JSON.stringify(formData),
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
      setShowForm(false);
      fetchBrands();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this brand? All models will be deleted too.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/device-categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete brand");

      setSuccess("Brand deleted successfully");
      fetchBrands();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const filteredBrands = brands.filter((b) => b.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading device categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Device Categories & Brands
            </h1>
            <p className="text-gray-600">
              Manage device brands and models for mobile, laptop, and desktop
              categories
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg hover:shadow-xl"
          >
            + Add Brand
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">
              {editingBrand ? "Edit Brand" : "Add New Brand"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Device Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Device Category *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["mobile", "laptop", "desktop"] as DeviceCategory[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category: cat });
                          setSelectedCategory(cat);
                        }}
                        className={`p-3 rounded-lg font-semibold transition ${
                          formData.category === cat
                            ? "bg-blue-600 text-white ring-2 ring-blue-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <span className="text-2xl mr-2">
                          {categoryEmojis[cat]}
                        </span>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ),
                  )}
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
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Apple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="apple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) =>
                      setFormData({ ...formData, logo: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Models Section */}
              <div className="border-t pt-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    📱 Device Models
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Add all variants and versions of this{" "}
                    {formData.name || "brand"} device
                  </p>
                </div>

                {/* Add Model Form Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                  <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">➕</span> Add a New Model
                  </h4>

                  <div className="space-y-4">
                    {/* Model Name - Primary field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Model Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={newModel.name}
                        onChange={(e) =>
                          setNewModel({ ...newModel, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-base font-medium"
                        placeholder="e.g., iPhone 15 Pro, Galaxy S24, MacBook Pro 14-inch"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        The exact product name or variant
                      </p>
                    </div>

                    {/* Secondary fields in grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Model Number
                        </label>
                        <input
                          type="text"
                          value={newModel.modelNumber}
                          onChange={(e) =>
                            setNewModel({
                              ...newModel,
                              modelNumber: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          placeholder="e.g., A3108, SM-S911B"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Technical model code (optional)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Release Year
                        </label>
                        <input
                          type="number"
                          value={newModel.releaseYear}
                          onChange={(e) =>
                            setNewModel({
                              ...newModel,
                              releaseYear: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          placeholder={new Date().getFullYear().toString()}
                          min="2000"
                          max={new Date().getFullYear() + 1}
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Year of release
                        </p>
                      </div>
                    </div>

                    {/* Add button - Clear primary action */}
                    <button
                      type="button"
                      onClick={handleAddModel}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-base shadow-md hover:shadow-lg"
                    >
                      <span>✓</span> Add This Model
                    </button>
                  </div>
                </div>

                {/* Models List - Clear visual separation */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-bold text-gray-900 text-base">
                      Added Models
                    </h4>
                    <span className="bg-blue-100 text-blue-800 font-semibold text-sm px-2.5 py-0.5 rounded-full">
                      {formData.models.length}
                    </span>
                  </div>

                  {formData.models.length > 0 ? (
                    <div className="space-y-2">
                      {formData.models.map((model, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between bg-white border-l-4 border-l-blue-500 p-4 rounded-lg border border-gray-200 hover:shadow-md transition group"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-base">
                              {model.name}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {model.modelNumber && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                                  {model.modelNumber}
                                </span>
                              )}
                              {model.releaseYear && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  Released {model.releaseYear}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveModel(index)}
                            className="ml-4 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove this model"
                          >
                            <svg
                              className="w-5 h-5"
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
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500 font-medium">
                        No models added yet
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Add at least one model above to continue
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  {editingBrand ? "Update Brand" : "Create Brand"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex gap-2">
            {(["mobile", "laptop", "desktop"] as DeviceCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl mr-2">{categoryEmojis[cat]}</span>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  <span className="ml-2 text-sm">
                    ({filteredBrands.length})
                  </span>
                </button>
              ),
            )}
          </div>
        </div>

        {/* Brands Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Brand Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Models
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((brand) => (
                    <tr key={brand._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {brand.logo && (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="w-6 h-6 rounded inline mr-2"
                            />
                          )}
                          {brand.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {brand.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                          {brand.models.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            brand.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {brand.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand._id)}
                          className="text-red-600 hover:text-red-800 font-medium transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-5xl mb-4">
                        {categoryEmojis[selectedCategory]}
                      </div>
                      <p className="text-gray-600 font-medium">
                        No brands for {selectedCategory}
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Click "Add Brand" to create your first brand
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
