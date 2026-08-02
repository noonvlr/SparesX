"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

interface IModel {
  name: string;
  modelNumber?: string;
  releaseYear?: number;
}

interface DeviceTypeOption {
  _id: string;
  name: string;
  slug: string;
  emoji: string;
  isActive: boolean;
}

interface CategoryBrand {
  _id: string;
  category: string; // Changed from hardcoded DeviceCategory type
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
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<CategoryBrand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [formData, setFormData] = useState({
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchDeviceTypes();
    fetchBrands();
  }, []);

  async function fetchDeviceTypes() {
    try {
      const res = await fetch("/api/admin/device-types");
      if (!res.ok) throw new Error("Failed to fetch device types");
      const data = await res.json();
      setDeviceTypes(data.deviceTypes || []);
      // Set first device type as default if available
      if (data.deviceTypes?.length > 0) {
        setSelectedCategory(data.deviceTypes[0].slug);
        setFormData((prev) => ({
          ...prev,
          category: data.deviceTypes[0].slug,
        }));
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

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

  function getDeviceTypeEmoji(slug: string): string {
    return deviceTypes.find((dt) => dt.slug === slug)?.emoji || "❓";
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
    const defaultCategory = deviceTypes.length > 0 ? deviceTypes[0].slug : "";
    setFormData({
      category: defaultCategory,
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
      <AdminPage title="Device Categories & Brands">
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
          <Spinner size="lg" /> Loading device categories...
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Device Categories & Brands"
        description="Manage device brands and models for mobile, laptop, and desktop categories"
        actions={
          <Button onClick={handleAddNew}>+ Add Brand</Button>
        }
      />

        {error && (
          <Alert tone="danger" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert tone="success" className="mb-6">
            {success}
          </Alert>
        )}

        {showForm && (
          <Card padding="lg" className="mb-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingBrand ? "Edit Brand" : "Add New Brand"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Device Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-3">
                  Device Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {deviceTypes.map((dt) => (
                    <button
                      key={dt.slug}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category: dt.slug });
                        setSelectedCategory(dt.slug);
                      }}
                      className={`p-3 rounded-lg font-semibold transition ${
                        formData.category === dt.slug
                          ? "bg-[var(--brand)] text-white ring-2 ring-[var(--brand-muted)]"
                          : "bg-[var(--surface-3)] text-[var(--ink-secondary)] hover:bg-[var(--surface-3)]"
                      }`}
                    >
                      <span className="text-2xl mr-2">{dt.emoji}</span>
                      {dt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
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
                    className="w-full px-4 py-2 border border-[var(--border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    placeholder="e.g., Apple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-[var(--border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    placeholder="apple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) =>
                      setFormData({ ...formData, logo: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[var(--border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
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
                      className="w-5 h-5 text-[var(--brand)] border-[var(--border-strong)] rounded focus:ring-[var(--brand)]"
                    />
                    <span className="text-sm font-medium text-[var(--ink-secondary)]">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Models Section */}
              <div className="border-t pt-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[var(--ink)] mb-2">
                    📱 Device Models
                  </h3>
                  <p className="text-[var(--ink-secondary)] text-sm">
                    Add all variants and versions of this{" "}
                    {formData.name || "brand"} device
                  </p>
                </div>

                {/* Add Model Form Card */}
                <div className="bg-[var(--brand-soft)] border-2 border-[var(--brand-muted)] rounded-xl p-6 mb-6">
                  <h4 className="text-sm font-bold text-[var(--brand-hover)] mb-4 flex items-center gap-2">
                    <span className="text-lg">➕</span> Add a New Model
                  </h4>

                  <div className="space-y-4">
                    {/* Model Name - Primary field */}
                    <div>
                      <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                        Model Name <span className="text-[var(--danger)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={newModel.name}
                        onChange={(e) =>
                          setNewModel({ ...newModel, name: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border-2 border-[var(--border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] focus:outline-none text-base font-medium"
                        placeholder="e.g., iPhone 15 Pro, Galaxy S24, MacBook Pro 14-inch"
                      />
                      <p className="text-xs text-[var(--ink-secondary)] mt-1">
                        The exact product name or variant
                      </p>
                    </div>

                    {/* Secondary fields in grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
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
                          className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent text-base"
                          placeholder="e.g., A3108, SM-S911B"
                        />
                        <p className="text-xs text-[var(--ink-secondary)] mt-1">
                          Technical model code (optional)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
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
                          className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent text-base"
                          placeholder={new Date().getFullYear().toString()}
                          min="2000"
                          max={new Date().getFullYear() + 1}
                        />
                        <p className="text-xs text-[var(--ink-secondary)] mt-1">
                          Year of release
                        </p>
                      </div>
                    </div>

                    {/* Add button - Clear primary action */}
                    <button
                      type="button"
                      onClick={handleAddModel}
                      className="w-full bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-hover)] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-base shadow-md hover:shadow-lg"
                    >
                      <span>✓</span> Add This Model
                    </button>
                  </div>
                </div>

                {/* Models List - Clear visual separation */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-bold text-[var(--ink)] text-base">
                      Added Models
                    </h4>
                    <span className="bg-[var(--brand-muted)] text-[var(--brand-hover)] font-semibold text-sm px-2.5 py-0.5 rounded-full">
                      {formData.models.length}
                    </span>
                  </div>

                  {formData.models.length > 0 ? (
                    <div className="space-y-2">
                      {formData.models.map((model, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between bg-[var(--surface)] border-l-4 border-l-[var(--brand)] p-4 rounded-lg border border-[var(--border)] hover:shadow-md transition group"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--ink)] text-base">
                              {model.name}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {model.modelNumber && (
                                <span className="text-xs bg-[var(--surface-3)] text-[var(--ink-secondary)] px-2 py-1 rounded font-mono">
                                  {model.modelNumber}
                                </span>
                              )}
                              {model.releaseYear && (
                                <span className="text-xs bg-[var(--surface-3)] text-[var(--ink-secondary)] px-2 py-1 rounded">
                                  Released {model.releaseYear}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveModel(index)}
                            className="ml-4 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] p-2 rounded transition opacity-0 group-hover:opacity-100 focus:opacity-100"
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
                    <div className="text-center py-8 bg-[var(--surface-2)] rounded-lg border-2 border-dashed border-[var(--border-strong)]">
                      <p className="text-[var(--muted)] font-medium">
                        No models added yet
                      </p>
                      <p className="text-[var(--muted)] text-sm mt-1">
                        Add at least one model above to continue
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit">
                  {editingBrand ? "Update Brand" : "Create Brand"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}
        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {deviceTypes.map((dt) => {
              const categoryBrands = brands.filter(
                (b) => b.category === dt.slug,
              );
              return (
                <button
                  key={dt.slug}
                  onClick={() => setSelectedCategory(dt.slug)}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    selectedCategory === dt.slug
                      ? "bg-[var(--brand)] text-white shadow-lg"
                      : "bg-[var(--surface)] text-[var(--ink-secondary)] border border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <span className="text-xl mr-2">{dt.emoji}</span>
                  {dt.name}
                  <span className="ml-2 text-sm">
                    ({categoryBrands.length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brands Table */}
        <div className="bg-[var(--surface)] rounded-xl shadow-lg overflow-hidden border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">
                    Brand Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">
                    Models
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)]">
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((brand) => (
                    <tr key={brand._id} className="hover:bg-[var(--surface-2)] transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[var(--ink)]">
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
                        <code className="bg-[var(--surface-3)] px-2 py-1 rounded text-sm">
                          {brand.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--brand-muted)] text-[var(--brand-hover)] font-semibold text-sm">
                          {brand.models.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            brand.isActive
                              ? "bg-[var(--success-soft)] text-[var(--success)]"
                              : "bg-[var(--surface-3)] text-[var(--ink)]"
                          }`}
                        >
                          {brand.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="text-[var(--brand)] hover:text-[var(--brand-hover)] font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(brand._id)}
                          className="text-[var(--danger)] hover:text-[var(--danger)] font-medium transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-[var(--muted)] text-5xl mb-4">
                        {getDeviceTypeEmoji(selectedCategory)}
                      </div>
                      <p className="text-[var(--ink-secondary)] font-medium">
                        No brands for this category
                      </p>
                      <p className="text-[var(--muted)] text-sm mt-2">
                        Click "Add Brand" to create your first brand
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </AdminPage>
  );
}
