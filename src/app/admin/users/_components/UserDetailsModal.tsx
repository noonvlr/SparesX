"use client";
import { useState, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "@/lib/utils/cropImage";
import { getCroppedImage } from "@/lib/utils/cropImage";
import type { AdminUser } from "@/app/admin/users/_components/types";
import TrustBadges from "@/components/TrustBadges";
import { FOUNDING_MEMBER_UNTIL } from "@/lib/badges/catalog";
import StarRatingDisplay from "@/components/StarRatingDisplay";

interface UserDetailsModalProps {
  user: AdminUser;
  onClose: () => void;
  onUpdate: (user: AdminUser) => void;
}

export default function UserDetailsModal({
  user,
  onClose,
  onUpdate,
}: UserDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    countryCode: user.countryCode,
    address: user.address,
    pinCode: user.pinCode,
    city: user.city,
    state: user.state,
    whatsappNumber: user.whatsappNumber,
    about: user.about || "",
    profilePicture: user.profilePicture || "",
    isBlocked: user.isBlocked,
    isTrusted: !!user.isTrusted,
    phoneVerified: !!user.phoneVerified,
    emailVerified: !!user.emailVerified,
    kycVerified: !!user.kycVerified,
    businessVerified: !!user.businessVerified,
    addressVerified: !!user.addressVerified,
    eliteApproved: !!user.eliteApproved,
    special_official_store: (user.specialBadgeKeys || []).includes(
      "official_store",
    ),
    special_verified_technician: (user.specialBadgeKeys || []).includes(
      "verified_technician",
    ),
    special_moderator: (user.specialBadgeKeys || []).includes("moderator"),
    special_founding_member:
      !(user.revokedBadgeKeys || []).includes("founding_member") &&
      ((user.specialBadgeKeys || []).includes("founding_member") ||
        (user.activeBadgeKeys || []).includes("founding_member") ||
        (!!user.createdAt &&
          new Date(user.createdAt) <= FOUNDING_MEMBER_UNTIL)),
    completedSales: user.completedSales ?? 0,
    responseRate: user.responseRate ?? 0,
    complaintRate: user.complaintRate ?? 0,
    role: user.role,
  });
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  const loadRatings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setRatingsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}/ratings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setRatings(data.ratings || []);
    } catch {
      setRatings([]);
    } finally {
      setRatingsLoading(false);
    }
  };

  useEffect(() => {
    void loadRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropCancel = () => {
    setCropOpen(false);
    setCropImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setUploadingImage(true);
    setError("");

    try {
      const croppedBlob = await getCroppedImage(
        cropImageSrc,
        croppedAreaPixels,
      );
      const formData = new FormData();
      formData.append(
        "files",
        new File([croppedBlob], `profile-${Date.now()}.jpg`, {
          type: "image/jpeg",
        }),
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.urls?.[0]) {
        setEditData((prev) => ({
          ...prev,
          profilePicture: data.urls[0],
        }));
        setSuccess("Image uploaded successfully");
        setTimeout(() => setSuccess(""), 2000);
        setCropOpen(false);
        setCropImageSrc(null);
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch (error) {
      setError("Failed to crop or upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      const {
        special_official_store,
        special_verified_technician,
        special_moderator,
        special_founding_member,
        completedSales,
        responseRate,
        complaintRate,
        ...rest
      } = editData;
      const specialBadgeKeys = [
        special_official_store ? "official_store" : null,
        special_verified_technician ? "verified_technician" : null,
        special_moderator ? "moderator" : null,
        special_founding_member ? "founding_member" : null,
      ].filter(Boolean);

      // Unchecking Founding Member revokes auto re-award for launch-period accounts
      const revokedBadgeKeys = special_founding_member
        ? (user.revokedBadgeKeys || []).filter((k) => k !== "founding_member")
        : Array.from(
            new Set([...(user.revokedBadgeKeys || []), "founding_member"]),
          );

      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...rest,
          specialBadgeKeys,
          revokedBadgeKeys,
          completedSales: Number(completedSales) || 0,
          responseRate: Math.max(0, Math.min(100, Number(responseRate) || 0)),
          complaintRate: Math.max(0, Math.min(100, Number(complaintRate) || 0)),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("User updated successfully");
        onUpdate(data.user);
        setTimeout(() => {
          setIsEditing(false);
          setSuccess("");
        }, 1500);
      } else {
        setError(data.message || "Failed to update user");
      }
    } catch (error) {
      setError("An error occurred while updating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white text-[var(--brand)] flex items-center justify-center text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-[var(--brand-muted)]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <svg
              className="w-6 h-6"
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

        {/* Content */}
        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {!isEditing ? (
            // View Mode
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </label>
                  <p className="text-gray-900 font-medium mt-1">{user.email}</p>
                </div>

                {/* Role */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Role
                  </label>
                  <p className="text-gray-900 font-medium mt-1 capitalize">
                    {user.role}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Editable in edit mode
                  </p>
                </div>

                {/* Name */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Full Name
                  </label>
                  <p className="text-gray-900 font-medium mt-1">{user.name}</p>
                </div>

                {/* Mobile */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Mobile Number
                  </label>
                  <p className="text-gray-900 font-medium mt-1">
                    {user.countryCode} {user.mobile}
                  </p>
                  <p className="text-xs mt-2">
                    <TrustBadges
                      phoneVerified={user.phoneVerified}
                      emailVerified={user.emailVerified}
                      kycVerified={user.kycVerified}
                      businessVerified={user.businessVerified}
                      addressVerified={user.addressVerified}
                      isTrusted={user.isTrusted}
                      trustScore={user.trustScore}
                      activeBadgeKeys={user.activeBadgeKeys}
                      showScore
                      size="md"
                    />
                  </p>
                  {(user.activeBadgeKeys || []).includes("founding_member") && (
                    <p className="text-xs text-violet-700 mt-2">
                      Founding Member is auto for launch-period accounts (joined
                      on/before{" "}
                      {FOUNDING_MEMBER_UNTIL.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      ). Toggle it under Edit → Special recognition.
                    </p>
                  )}
                </div>

                {/* Reputation */}
                <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-lg md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Seller reputation
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <StarRatingDisplay
                      value={user.averageRating || 0}
                      count={user.ratingCount || 0}
                      size="md"
                    />
                    <span className="text-xs text-gray-600">
                      Sales: {user.completedSales ?? 0} · Response:{" "}
                      {user.responseRate ?? 0}% · Complaints:{" "}
                      {user.complaintRate ?? 0}%
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {ratingsLoading ? (
                      <p className="text-xs text-gray-500">Loading ratings…</p>
                    ) : ratings.length === 0 ? (
                      <p className="text-xs text-gray-500">No ratings yet.</p>
                    ) : (
                      ratings.map((r) => (
                        <div
                          key={r._id}
                          className={`rounded-lg border px-3 py-2 text-xs ${
                            r.isHidden
                              ? "bg-gray-50 border-gray-200 opacity-70"
                              : "bg-white border-amber-100"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {r.rater?.name || "User"} · ★{r.stars} (B
                                {r.behaviour}/R{r.response})
                              </p>
                              {r.comment && (
                                <p className="text-gray-600 mt-0.5">{r.comment}</p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                className="text-[10px] font-semibold text-[var(--brand-hover)] px-2 py-1 rounded border border-[var(--brand-muted)]"
                                onClick={async () => {
                                  const stars = prompt(
                                    "Stars 1–5",
                                    String(r.stars),
                                  );
                                  if (!stars) return;
                                  const token = localStorage.getItem("token");
                                  if (!token) return;
                                  await fetch(
                                    `/api/admin/users/${user._id}/ratings`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        ratingId: r._id,
                                        stars: Number(stars),
                                      }),
                                    },
                                  );
                                  await loadRatings();
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-[10px] font-semibold text-amber-800 px-2 py-1 rounded border border-amber-200"
                                onClick={async () => {
                                  const token = localStorage.getItem("token");
                                  if (!token) return;
                                  await fetch(
                                    `/api/admin/users/${user._id}/ratings`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        ratingId: r._id,
                                        isHidden: !r.isHidden,
                                      }),
                                    },
                                  );
                                  await loadRatings();
                                }}
                              >
                                {r.isHidden ? "Show" : "Hide"}
                              </button>
                              <button
                                type="button"
                                className="text-[10px] font-semibold text-rose-700 px-2 py-1 rounded border border-rose-200"
                                onClick={async () => {
                                  if (!confirm("Delete this rating?")) return;
                                  const token = localStorage.getItem("token");
                                  if (!token) return;
                                  await fetch(
                                    `/api/admin/users/${user._id}/ratings?ratingId=${r._id}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                    },
                                  );
                                  await loadRatings();
                                }}
                              >
                                Del
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    WhatsApp Number
                  </label>
                  <p className="text-gray-900 font-medium mt-1">
                    {user.countryCode} {user.whatsappNumber}
                  </p>
                </div>

                {/* About */}
                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    About
                  </label>
                  <p className="text-gray-900 font-medium mt-1 whitespace-pre-wrap">
                    {user.about?.trim() || "—"}
                  </p>
                </div>

                {/* Status */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Account Status
                  </label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        user.isBlocked
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Address Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Address
                </label>
                <p className="text-gray-900 mt-1">{user.address}</p>
                <p className="text-gray-600 mt-2">
                  PIN: {user.pinCode} | City: {user.city} | State: {user.state}
                </p>
              </div>

              {/* Metadata */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Joined:</span>{" "}
                  {new Date(user.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold">Last Updated:</span>{" "}
                  {user.updatedAt
                    ? new Date(user.updatedAt as string).toLocaleString()
                    : "N/A"}
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-6 py-2.5 bg-[var(--brand)] text-white font-medium rounded-lg hover:bg-[var(--brand-hover)] transition"
                >
                  Edit User
                </button>
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        "Reset this user's password? They will receive an email with a reset link.",
                      )
                    ) {
                      setLoading(true);
                      setError("");
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(
                          `/api/admin/users/${user._id}/reset-password`,
                          {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        const data = await res.json();
                        if (res.ok) {
                          setSuccess("Password reset email sent successfully");
                        } else {
                          setError(data.message || "Failed to reset password");
                        }
                      } catch (err) {
                        setError("Error resetting password");
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="flex-1 px-6 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  Reset Password
                </button>
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to delete this user? This action cannot be undone.",
                      )
                    ) {
                      setLoading(true);
                      setError("");
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(
                          `/api/admin/users/${user._id}`,
                          {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        const data = await res.json();
                        if (res.ok) {
                          setSuccess("User deleted successfully");
                          setTimeout(() => onClose(), 1500);
                        } else {
                          setError(data.message || "Failed to delete user");
                        }
                      } catch (err) {
                        setError("Error deleting user");
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="flex-1 px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  Delete User
                </button>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Picture
                  </label>

                  {/* Current Image Preview */}
                  {editData.profilePicture && (
                    <div className="mb-3 flex items-center gap-4">
                      <img
                        src={editData.profilePicture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditData((prev) => ({
                            ...prev,
                            profilePicture: "",
                          }))
                        }
                        className="text-red-600 text-sm hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* File Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? "Uploading..." : "Upload New Image"}
                  </button>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>

                  {/* Or URL Input */}
                  <div className="mt-3">
                    <label className="text-xs text-gray-600 font-medium">
                      Or enter image URL:
                    </label>
                    <input
                      type="text"
                      name="profilePicture"
                      value={editData.profilePicture}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent mt-1"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Changing email clears email verification until re-confirmed.
                  </p>
                </div>

                {/* Mobile with Country Code */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country Code
                    </label>
                    <select
                      name="countryCode"
                      value={editData.countryCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={editData.mobile}
                      onChange={handleChange}
                      maxLength={10}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={editData.whatsappNumber}
                    onChange={handleChange}
                    maxLength={10}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>

                {/* About */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    About
                  </label>
                  <textarea
                    name="about"
                    value={editData.about}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    placeholder="Public bio shown on their profile"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {(editData.about || "").length}/500
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={editData.address}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>

                {/* PIN, City, State */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pinCode"
                      value={editData.pinCode}
                      onChange={handleChange}
                      maxLength={6}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={editData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={editData.state}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={editData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  >
                    <option value="technician">Technician</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Block Status */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isBlocked"
                    name="isBlocked"
                    checked={editData.isBlocked}
                    onChange={handleChange}
                    className="w-5 h-5 text-[var(--brand)] border-gray-300 rounded focus:ring-[var(--brand)]"
                  />
                  <label
                    htmlFor="isBlocked"
                    className="text-sm font-medium text-gray-700"
                  >
                    Block this user
                  </label>
                </div>

                {/* Trusted seller */}
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <input
                    type="checkbox"
                    id="isTrusted"
                    name="isTrusted"
                    checked={!!editData.isTrusted}
                    onChange={handleChange}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label
                    htmlFor="isTrusted"
                    className="text-sm font-medium text-amber-950"
                  >
                    Grant Trusted Seller reputation badge
                  </label>
                </div>

                {/* Verification badges */}
                <div className="p-4 bg-[var(--brand-soft)] border border-[var(--brand-muted)] rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-teal-950">
                    Verification badges
                  </p>
                  {(
                    [
                      ["phoneVerified", "Mobile verified"],
                      ["emailVerified", "Email verified"],
                      ["kycVerified", "KYC verified"],
                      ["businessVerified", "Business verified"],
                      ["addressVerified", "Address verified"],
                    ] as const
                  ).map(([name, label]) => (
                    <div key={name} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={!!editData[name]}
                        onChange={handleChange}
                        className="w-4 h-4 text-[var(--brand)] border-gray-300 rounded"
                      />
                      <label htmlFor={name} className="text-sm text-teal-950">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Special recognition */}
                <div className="p-4 bg-violet-50 border border-violet-100 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-violet-950">
                    Special recognition
                  </p>
                  <p className="text-xs text-violet-800/80 leading-relaxed">
                    Founding Member is auto-assigned for accounts created on or
                    before 31 Dec 2026 (launch period). Uncheck to revoke; check
                    to grant manually.
                  </p>
                  {(
                    [
                      ["special_founding_member", "Founding Member"],
                      ["special_official_store", "Official Store"],
                      ["special_verified_technician", "Verified Technician"],
                      ["special_moderator", "Moderator"],
                      ["eliteApproved", "Elite Seller admin approval"],
                    ] as const
                  ).map(([name, label]) => (
                    <div key={name} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={name}
                        name={name}
                        checked={!!editData[name]}
                        onChange={handleChange}
                        className="w-4 h-4 text-violet-600 border-gray-300 rounded"
                      />
                      <label htmlFor={name} className="text-sm text-violet-950">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Reputation metrics */}
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-amber-950">
                    Reputation metrics
                  </p>
                  <p className="text-xs text-amber-900/80">
                    Average rating is computed from buyer reviews. Adjust sales /
                    response / complaint rates for trust scoring.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Completed sales
                      </label>
                      <input
                        type="number"
                        name="completedSales"
                        min={0}
                        value={editData.completedSales}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Response rate %
                      </label>
                      <input
                        type="number"
                        name="responseRate"
                        min={0}
                        max={100}
                        value={editData.responseRate}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">
                        Complaint rate %
                      </label>
                      <input
                        type="number"
                        name="complaintRate"
                        min={0}
                        max={100}
                        value={editData.complaintRate}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2.5 bg-[var(--brand)] text-white font-medium rounded-lg hover:bg-[var(--brand-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {cropOpen && cropImageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Adjust Profile Picture
                </h3>
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="relative w-full h-[360px] bg-gray-100">
                <Cropper
                  image={cropImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCropCancel}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCropConfirm}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-[var(--brand)] text-white rounded-lg hover:bg-[var(--brand-hover)] disabled:opacity-50"
                  >
                    {uploadingImage ? "Uploading..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
