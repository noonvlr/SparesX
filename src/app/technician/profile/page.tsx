"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TechnicianProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "address" | "contact"
  >("personal");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    state: "",
    countryCode: "",
    pinCode: "",
    whatsappNumber: "",
    profilePicture: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setForm({
            name: data.user.name || "",
            email: data.user.email || "",
            city: data.user.city || "",
            state: data.user.state || "",
            countryCode: data.user.countryCode || "+91",
            pinCode: data.user.pinCode || "",
            whatsappNumber: data.user.whatsappNumber || "",
            profilePicture: data.user.profilePicture || "",
          });
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setForm((f) => ({ ...f, profilePicture: data.url }));
        setSuccess("Profile picture uploaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to upload image");
      }
    } catch (err) {
      setError("Error uploading image");
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    try {
      const res = await fetch("/api/technician/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Profile updated successfully!");
        setProfile(form);
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError("An error occurred while updating your profile");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <section className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
              </div>
            </div>
            <p className="text-gray-600 font-medium text-lg">
              Loading your profile...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <section className="max-w-3xl mx-auto">
        {/* Back Button & Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-xl border border-gray-200 transition hover:shadow-md"
          >
            <svg
              className="w-6 h-6 text-gray-600"
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
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Profile Settings
            </h1>
            <p className="text-gray-600 text-lg mt-1">
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium flex items-center gap-3 animate-slide-down">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium flex items-center gap-3 animate-slide-down">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {!error ? (
            <>
              {/* Profile Picture Section */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>

              {/* Profile Header with Picture */}
              <div className="px-8 pb-8 -mt-16 relative">
                <div className="flex items-end justify-between mb-8">
                  <div className="flex items-end gap-6">
                    <div className="relative group">
                      {form.profilePicture ? (
                        <img
                          src={form.profilePicture}
                          alt={form.name}
                          className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-4 border-white shadow-lg">
                          <svg
                            className="w-16 h-16 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <label
                        htmlFor="profilePicInput"
                        className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition"
                      >
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </label>
                      <input
                        id="profilePicInput"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {form.name || "Your Name"}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {form.email || "email@example.com"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 mb-8">
                  <button
                    onClick={() => setActiveTab("personal")}
                    className={`px-4 py-3 font-semibold border-b-2 transition ${
                      activeTab === "personal"
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-600 border-transparent hover:text-gray-900"
                    }`}
                  >
                    Personal Info
                  </button>
                  <button
                    onClick={() => setActiveTab("address")}
                    className={`px-4 py-3 font-semibold border-b-2 transition ${
                      activeTab === "address"
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-600 border-transparent hover:text-gray-900"
                    }`}
                  >
                    Address
                  </button>
                  <button
                    onClick={() => setActiveTab("contact")}
                    className={`px-4 py-3 font-semibold border-b-2 transition ${
                      activeTab === "contact"
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-600 border-transparent hover:text-gray-900"
                    }`}
                  >
                    Contact
                  </button>
                </div>

                {/* Tab Content */}
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Personal Tab */}
                    {activeTab === "personal" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, name: e.target.value }))
                            }
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, email: e.target.value }))
                            }
                            placeholder="Enter your email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Country Code
                          </label>
                          <input
                            type="text"
                            value={form.countryCode}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                countryCode: e.target.value,
                              }))
                            }
                            placeholder="+91"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* Address Tab */}
                    {activeTab === "address" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, city: e.target.value }))
                            }
                            placeholder="Enter your city"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={form.state}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, state: e.target.value }))
                            }
                            placeholder="Enter your state"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            PIN Code
                          </label>
                          <input
                            type="text"
                            value={form.pinCode}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                pinCode: e.target.value,
                              }))
                            }
                            placeholder="Enter your PIN code"
                            maxLength={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === "contact" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            WhatsApp Number
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={form.countryCode}
                              disabled
                              className="w-20 px-3 py-3 border border-gray-300 rounded-xl bg-gray-100"
                            />
                            <input
                              type="tel"
                              value={form.whatsappNumber}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  whatsappNumber: e.target.value,
                                }))
                              }
                              placeholder="Enter your WhatsApp number"
                              maxLength={10}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Personal Tab */}
                    {activeTab === "personal" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">
                            Full Name
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {form.name || "Not set"}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">
                            Email Address
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {form.email || "Not set"}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">
                            Country Code
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {form.countryCode || "+91"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Address Tab */}
                    {activeTab === "address" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">City</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {form.city || "Not set"}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">State</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {form.state || "Not set"}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">PIN Code</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {form.pinCode || "Not set"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === "contact" && (
                      <div className="grid grid-cols-1 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">
                            WhatsApp Number
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {form.countryCode}{" "}
                            {form.whatsappNumber || "Not set"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 px-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 4v2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please sign in to access your profile.
              </p>
              <a
                href="/login"
                className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition"
              >
                Sign In
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
