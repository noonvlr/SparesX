"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditProductPage() {
  const { id } = useParams();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    condition: "new",
  });
  const [images, setImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setForm({
            name: data.product.name,
            description: data.product.description,
            price: data.product.price,
            category: data.product.category,
            condition: data.product.condition,
          });
          setExistingImages(data.product.images || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load product");
        setLoading(false);
      });
  }, [id]);

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
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    const finalImages = images.length > 0 ? images : existingImages;
    const res = await fetch(`/api/technician/products/edit/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        images: finalImages,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Product updated successfully!");
      setTimeout(() => router.push("/technician/products"), 1200);
    } else {
      setError(data.message || "Failed to update product");
    }
  }

  if (loading)
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">Loading...</div>
    );

  return (
    <main className="max-w-2xl mx-auto py-8 px-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Edit Product</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200"
      >
        {error && (
          <div className="mb-6 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg font-medium">
            {success}
          </div>
        )}

        <div className="mb-6">
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            Product Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g., iPhone 13 Screen"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            placeholder="Describe the product details..."
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              Price (₹)
            </label>
            <input
              id="price"
              type="number"
              placeholder="0"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              required
              min="0"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              Category
            </label>
            <input
              id="category"
              type="text"
              placeholder="e.g., Display, Battery, Camera"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label
            htmlFor="condition"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            Condition
          </label>
          <select
            id="condition"
            value={form.condition}
            onChange={(e) =>
              setForm((f) => ({ ...f, condition: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          >
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </div>

        {existingImages.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Current Images
            </label>
            <div className="grid grid-cols-3 gap-3">
              {existingImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center"
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

        <div className="mb-8">
          <label
            htmlFor="images"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            {existingImages.length > 0
              ? "Replace Images (Optional)"
              : "Product Images"}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition duration-200 cursor-pointer">
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            <label htmlFor="images" className="cursor-pointer">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-2"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="14" cy="20" r="4" strokeWidth={2} />
                <path
                  d="M40 12l-8 10-6-7-12 14"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-gray-600 font-medium">
                {existingImages.length > 0
                  ? "Click to upload new images"
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {existingImages.length > 0
                  ? "New images will replace existing ones"
                  : "PNG, JPG, GIF up to 10MB (Multiple files supported)"}
              </p>
            </label>
          </div>
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-blue-500 bg-gray-50 flex items-center justify-center">
                    <img
                      src={img}
                      alt={`New ${idx + 1}`}
                      className="w-full h-full object-contain group-hover:opacity-80 transition"
                    />
                  </div>
                  <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/technician/products")}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 border border-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            Update Product
          </button>
        </div>
      </form>
    </main>
  );
}
