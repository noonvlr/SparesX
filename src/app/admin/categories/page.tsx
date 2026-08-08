"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminPage } from "@/components/layout";
import { Card, Badge, EmptyState, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { authFetch, getAccessToken } from "@/lib/auth/clientAuth";

interface Category {
  _id: string;
  name: string;
  icon: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order: number;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    slug: "",
    description: "",
    isActive: true,
    order: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.push("/login");
      return;
    }
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await authFetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.categories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReconcile() {
    setReconciling(true);
    setError("");
    setSuccess("");
    try {
      const res = await authFetch("/api/admin/categories/reconcile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteInactiveDuplicates: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cleanup failed");
      const r = data.report;
      setSuccess(
        `Cleanup done: remapped ${r.productsRemapped} products, removed ${r.categoriesDeleted} duplicate categories.`,
      );
      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReconciling(false);
    }
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      slug: category.slug,
      description: category.description || "",
      isActive: category.isActive,
      order: category.order,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function handleAddNew() {
    setEditingCategory(null);
    setFormData({
      name: "",
      icon: "📦",
      slug: "",
      description: "",
      isActive: true,
      order: categories.length,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory._id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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
      setShowForm(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await authFetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete category");

      setSuccess("Category deleted successfully");
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <AdminPage title="Manage Categories">
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
          <Spinner size="lg" /> Loading…
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Manage Categories"
        description="Add, edit, or remove categories for the homepage"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleReconcile}
              loading={reconciling}
            >
              Clean duplicates
            </Button>
            <Button onClick={handleAddNew}>+ Add Category</Button>
          </>
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
          <h2 className="text-xl font-bold text-[var(--ink)] mb-6">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Category Name" htmlFor="cat-name" required>
                <Input
                  id="cat-name"
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
                  placeholder="e.g., Mobile Screens"
                />
              </Field>

              <Field label="Icon (Emoji)" htmlFor="cat-icon" required>
                <Input
                  id="cat-icon"
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  required
                  placeholder="📱"
                />
              </Field>

              <Field label="Slug" htmlFor="cat-slug" required>
                <Input
                  id="cat-slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                  placeholder="mobile-screens"
                />
              </Field>

              <Field label="Order" htmlFor="cat-order">
                <Input
                  id="cat-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value),
                    })
                  }
                />
              </Field>
            </div>

            <Field label="Description" htmlFor="cat-desc">
              <Textarea
                id="cat-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Optional description"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              Active (visible on homepage)
            </label>

            <div className="flex gap-3 pt-4">
              <Button type="submit">
                {editingCategory ? "Update Category" : "Create Category"}
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

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            title="No categories yet"
            description='Click "Add Category" to create your first category'
          />
        </Card>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Icon</TH>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Order</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {categories.map((category) => (
              <TR key={category._id}>
                <TD>
                  <span className="text-3xl">{category.icon}</span>
                </TD>
                <TD>
                  <div className="font-semibold text-[var(--ink)]">
                    {category.name}
                  </div>
                  {category.description && (
                    <div className="text-sm text-[var(--muted)] mt-1">
                      {category.description}
                    </div>
                  )}
                </TD>
                <TD>
                  <code className="bg-[var(--surface-3)] px-2 py-1 rounded text-sm">
                    {category.slug}
                  </code>
                </TD>
                <TD className="text-[var(--ink-secondary)]">{category.order}</TD>
                <TD>
                  <Badge tone={category.isActive ? "success" : "neutral"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TD>
                <TD className="text-right space-x-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleDelete(category._id)}
                    className="text-[var(--danger)]"
                  >
                    Delete
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </AdminPage>
  );
}
