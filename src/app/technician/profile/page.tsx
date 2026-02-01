"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cropper from "react-easy-crop";
import type { Area } from "@/lib/utils/cropImage";
import { getCroppedImage } from "@/lib/utils/cropImage";

export default function TechnicianProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Country codes with flags
  const countryCodes = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+82", country: "South Korea", flag: "🇰🇷" },
  ];
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    countryCode: "+91",
    pinCode: "",
    whatsappNumber: "",
    profilePicture: "",
  });
  const [initialForm, setInitialForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    countryCode: "+91",
    pinCode: "",
    whatsappNumber: "",
    profilePicture: "",
  });

  const hasFormChanges = (current: typeof form, initial: typeof initialForm) =>
    (Object.keys(initial) as Array<keyof typeof initial>).some(
      (key) => current[key] !== initial[key],
    );

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
          const nextForm = {
            name: data.user.name || "",
            email: data.user.email || "",
            address: data.user.address || "",
            city: data.user.city || "",
            state: data.user.state || "",
            countryCode: data.user.countryCode || "+91",
            pinCode: data.user.pinCode || "",
            whatsappNumber: data.user.whatsappNumber || "",
            profilePicture: data.user.profilePicture || "",
          };
          setProfile(data.user);
          setForm(nextForm);
          setInitialForm(nextForm);
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  }

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropCancel = () => {
    setCropOpen(false);
    setCropImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setError("");
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      // Simulate progress for cropping
      setUploadProgress(20);

      const croppedBlob = await getCroppedImage(
        cropImageSrc,
        croppedAreaPixels,
      );

      setUploadProgress(40);

      const formData = new FormData();
      formData.append(
        "files",
        new File([croppedBlob], `profile-${Date.now()}.jpg`, {
          type: "image/jpeg",
        }),
      );

      setUploadProgress(60);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      const data = await response.json();

      if (response.ok && data.urls?.[0]) {
        setForm((prev) => ({
          ...prev,
          profilePicture: data.urls[0],
        }));
        setUploadProgress(100);
        setCropOpen(false);
        setCropImageSrc(null);
        setSuccess("Profile picture uploaded successfully!");
        setTimeout(() => {
          setSuccess("");
          setUploadProgress(0);
        }, 2000);
      } else {
        setError(data.error || "Failed to upload image");
        setUploadProgress(0);
      }
    } catch (error) {
      setError("Failed to crop or upload image");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setTimeout(() => setError(""), 4000);
      return;
    }
    if (!hasFormChanges(form, initialForm)) {
      setError("No changes to save");
      setTimeout(() => setError(""), 3000);
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
        setInitialForm(form);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
        setTimeout(() => setError(""), 4000);
      }
    } catch (err) {
      setError("An error occurred while updating your profile");
      setTimeout(() => setError(""), 4000);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 text-center w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium text-base sm:text-lg">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg
              className="w-6 h-6 text-gray-900"
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
          <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
          <div className="w-10"></div>
        </div>

        <form onSubmit={handleUpdate} className="pb-24">
          {/* Profile Picture */}
          <div className="flex justify-center py-8">
            <div className="relative group">
              {form.profilePicture ? (
                <img
                  src={form.profilePicture}
                  alt={form.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
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
                className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition shadow-lg"
              >
                <svg
                  className="w-5 h-5 text-white"
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
          </div>

          {/* Detail Information Section */}
          <div className="px-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Detail Information
            </h2>

            {/* Name Input */}
            <div className="mb-6">
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Full Name"
                className="w-full px-0 py-3 text-base text-gray-900 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-indigo-600 transition"
                required
              />
            </div>

            {/* Email Input */}
            <div className="mb-6">
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="Email Address"
                className="w-full px-0 py-3 text-base text-gray-900 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-indigo-600 transition"
                required
              />
            </div>

            {/* Address Input */}
            <div className="mb-6">
              <textarea
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Address"
                rows={2}
                className="w-full px-0 py-3 text-base text-gray-900 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-indigo-600 transition resize-none"
              />
            </div>

            {/* WhatsApp Number */}
            <div className="mb-6 flex items-center gap-0 border-b border-gray-200 focus-within:border-indigo-600 transition">
              <select
                value={form.countryCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, countryCode: e.target.value }))
                }
                className="pl-0 pr-2 py-3 text-base text-gray-900 bg-transparent border-0 focus:outline-none cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundPosition: "right center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "16px",
                  paddingRight: "24px",
                }}
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={form.whatsappNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whatsappNumber: e.target.value }))
                }
                placeholder="WhatsApp Number"
                className="flex-1 pl-3 py-3 text-base text-gray-900 bg-transparent border-0 focus:outline-none"
                maxLength={15}
              />
            </div>

            {/* City */}
            <div className="mb-6">
              <input
                type="text"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="City"
                className="w-full px-0 py-3 text-base text-gray-900 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            {/* State */}
            <div className="mb-6">
              <input
                type="text"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
                placeholder="State"
                className="w-full px-0 py-3 text-base text-gray-900 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            {/* PIN Code */}
            <div className="mb-6">
              <input
                type="text"
                value={form.pinCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pinCode: e.target.value }))
                }
                placeholder="PIN Code"
                maxLength={6}
                className="w-full px-0 py-3 text-base text-gray-900 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 mt-8 mb-6 flex items-center justify-center gap-3">
            <button
              type="submit"
              className="px-12 py-3 bg-indigo-600 text-white text-base font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-10 py-3 bg-gray-100 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Go Back
            </button>
          </div>

          {(error || success) && (
            <div className="px-4 mb-8 flex justify-center">
              <div
                className={`w-full max-w-md px-4 py-3 rounded-lg text-sm font-medium text-center border ${
                  success
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {success || error}
              </div>
            </div>
          )}
        </form>

        {/* Image Cropper Modal */}
        {cropOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  Crop Profile Picture
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Adjust the image to your liking
                </p>
              </div>

              {/* Cropper Area */}
              <div className="relative h-80 bg-gray-100">
                {cropImageSrc && (
                  <Cropper
                    image={cropImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                )}
              </div>

              {/* Zoom Slider */}
              <div className="px-6 py-4 border-b border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Upload Progress */}
              {uploading && uploadProgress > 0 && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Uploading...
                    </span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="px-6 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
