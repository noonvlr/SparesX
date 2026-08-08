"use client";
import { useState, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "@/lib/utils/cropImage";
import { getCroppedImage } from "@/lib/utils/cropImage";
import type { AdminUser } from "@/app/admin/users/_components/types";
import TrustBadges from "@/components/TrustBadges";
import { FOUNDING_MEMBER_UNTIL } from "@/lib/badges/catalog";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import { Alert } from "@/components/ui/Alert";
import { authFetch, getAccessToken } from "@/lib/auth/clientAuth";

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
    if (!getAccessToken()) return;
    setRatingsLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${user._id}/ratings`);
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

      const response = await authFetch("/api/upload", {
        method: "POST",
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
      if (!getAccessToken()) {
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

      const response = await authFetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
    <div className="fixed inset-0 bg-[var(--overlay)] flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--brand)] text-[var(--primary-foreground)] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-[var(--primary-foreground)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--surface)] text-[var(--brand)] flex items-center justify-center text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-[var(--brand-muted)]">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--primary-foreground)] hover:bg-[var(--surface)] hover:bg-opacity-20 rounded-full p-2 transition"
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
            <Alert tone="danger" className="mb-4">
              {error}
            </Alert>
          )}
          {success && (
            <Alert tone="success" className="mb-4">
              {success}
            </Alert>
          )}

          {!isEditing ? (
            // View Mode
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Email
                  </label>
                  <p className="text-[var(--ink)] font-medium mt-1">{user.email}</p>
                </div>

                {/* Role */}
                <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Role
                  </label>
                  <p className="text-[var(--ink)] font-medium mt-1 capitalize">
                    {user.role}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Editable in edit mode
                  </p>
                </div>

                {/* Name */}
                <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Full Name
                  </label>
                  <p className="text-[var(--ink)] font-medium mt-1">{user.name}</p>
                </div>

                {/* Mobile */}
                <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Mobile Number
                  </label>
                  <p className="text-[var(--ink)] font-medium mt-1">
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
                    <p className="text-xs text-[var(--verified)] mt-2">
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
                <div className="p-4 bg-[var(--warning-soft)]/60 border border-[var(--warning)]/20 rounded-[var(--radius-lg)] md:col-span-2">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Seller reputation
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <StarRatingDisplay
                      value={user.averageRating || 0}
                      count={user.ratingCount || 0}
                      size="md"
                    />
                    <span className="text-xs text-[var(--ink-secondary)]">
                      Sales: {user.completedSales ?? 0} · Response:{" "}
                      {user.responseRate ?? 0}% · Complaints:{" "}
                      {user.complaintRate ?? 0}%
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {ratingsLoading ? (
                      <p className="text-xs text-[var(--muted)]">Loading ratings…</p>
                    ) : ratings.length === 0 ? (
                      <p className="text-xs text-[var(--muted)]">No ratings yet.</p>
                    ) : (
                      ratings.map((r) => (
                        <div
                          key={r._id}
                          className={`rounded-[var(--radius-lg)] border px-3 py-2 text-xs ${
                            r.isHidden
                              ? "bg-[var(--surface-2)] border-[var(--border)] opacity-70"
                              : "bg-[var(--surface)] border-[var(--warning)]/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-[var(--ink)]">
                                {r.rater?.name || "User"} · ★{r.stars} (B
                                {r.behaviour}/R{r.response})
                              </p>
                              {r.comment && (
                                <p className="text-[var(--ink-secondary)] mt-0.5">{r.comment}</p>
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
                                  if (!getAccessToken()) return;
                                  await authFetch(
                                    `/api/admin/users/${user._id}/ratings`,
                                    {
                                      method: "PATCH",
                                      headers: {
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
                                className="text-[10px] font-semibold text-[var(--warning)] px-2 py-1 rounded border border-[var(--warning)]/20"
                                onClick={async () => {
                                  if (!getAccessToken()) return;
                                  await authFetch(
                                    `/api/admin/users/${user._id}/ratings`,
                                    {
                                      method: "PATCH",
                                      headers: {
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
                                className="text-[10px] font-semibold text-[var(--danger)] px-2 py-1 rounded border border-[var(--danger)]/20"
                                onClick={async () => {
                                  if (!confirm("Delete this rating?")) return;
                                  if (!getAccessToken()) return;
                                  await authFetch(
                                    `/api/admin/users/${user._id}/ratings?ratingId=${r._id}`,
                                    {
                                      method: "DELETE",
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
                <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    WhatsApp Number
                  </label>
                  <p className="text-[var(--ink)] font-medium mt-1">
                    {user.countryCode} {user.whatsappNumber}
                  </p>
                </div>

                {/* About */}
                <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)] md:col-span-2">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    About
                  </label>
                  <p className="text-[var(--ink)] font-medium mt-1 whitespace-pre-wrap">
                    {user.about?.trim() || "—"}
                  </p>
                </div>

                {/* Status */}
                <div className="p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Account Status
                  </label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        user.isBlocked
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : "bg-[var(--success-soft)] text-[var(--success)]"
                      }`}
                    >
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Address Section */}
              <div className="mt-6 p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                  Address
                </label>
                <p className="text-[var(--ink)] mt-1">{user.address}</p>
                <p className="text-[var(--ink-secondary)] mt-2">
                  PIN: {user.pinCode} | City: {user.city} | State: {user.state}
                </p>
              </div>

              {/* Metadata */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--ink-secondary)]">
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
                  className="flex-1 px-6 py-2.5 bg-[var(--brand)] text-[var(--primary-foreground)] font-medium rounded-[var(--radius-lg)] hover:bg-[var(--brand-hover)] transition"
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
                        if (!getAccessToken()) return;
                        const res = await authFetch(
                          `/api/admin/users/${user._id}/reset-password`,
                          {
                            method: "POST",
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
                  className="flex-1 px-6 py-2.5 bg-[var(--warning)] text-[var(--primary-foreground)] font-medium rounded-[var(--radius-lg)] hover:opacity-90 transition disabled:opacity-50"
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
                        if (!getAccessToken()) return;
                        const res = await authFetch(
                          `/api/admin/users/${user._id}`,
                          {
                            method: "DELETE",
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
                  className="flex-1 px-6 py-2.5 bg-[var(--danger)] text-[var(--primary-foreground)] font-medium rounded-[var(--radius-lg)] hover:bg-[var(--danger-hover)] transition disabled:opacity-50"
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
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Profile Picture
                  </label>

                  {/* Current Image Preview */}
                  {editData.profilePicture && (
                    <div className="mb-3 flex items-center gap-4">
                      <img
                        src={editData.profilePicture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border)]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditData((prev) => ({
                            ...prev,
                            profilePicture: "",
                          }))
                        }
                        className="text-[var(--danger)] text-sm hover:text-[var(--danger)] font-medium"
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
                    className="px-4 py-2.5 bg-[var(--surface-3)] border border-[var(--border-strong)] text-[var(--ink-secondary)] rounded-[var(--radius-lg)] hover:bg-[var(--surface-3)] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? "Uploading..." : "Upload New Image"}
                  </button>
                  <p className="text-xs text-[var(--muted)] mt-1.5">
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>

                  {/* Or URL Input */}
                  <div className="mt-3">
                    <label className="text-xs text-[var(--ink-secondary)] font-medium">
                      Or enter image URL:
                    </label>
                    <input
                      type="text"
                      name="profilePicture"
                      value={editData.profilePicture}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent mt-1"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Full Name <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Email <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Changing email clears email verification until re-confirmed.
                  </p>
                </div>

                {/* Mobile with Country Code */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                      Country Code
                    </label>
                    <select
                      name="countryCode"
                      value={editData.countryCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                      Mobile Number <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={editData.mobile}
                      onChange={handleChange}
                      maxLength={10}
                      required
                      className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    WhatsApp Number <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={editData.whatsappNumber}
                    onChange={handleChange}
                    maxLength={10}
                    required
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>

                {/* About */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    About
                  </label>
                  <textarea
                    name="about"
                    value={editData.about}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    placeholder="Public bio shown on their profile"
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {(editData.about || "").length}/500
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Address <span className="text-[var(--danger)]">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={editData.address}
                    onChange={handleChange}
                    rows={3}
                    required
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  />
                </div>

                {/* PIN, City, State */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                      PIN Code <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      type="text"
                      name="pinCode"
                      value={editData.pinCode}
                      onChange={handleChange}
                      maxLength={6}
                      required
                      className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                      City <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={editData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                      State <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={editData.state}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-secondary)] mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={editData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[var(--border-strong)] rounded-[var(--radius-lg)] focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
                  >
                    <option value="technician">Technician</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Block Status */}
                <div className="flex items-center gap-3 p-4 bg-[var(--surface-2)] rounded-[var(--radius-lg)]">
                  <input
                    type="checkbox"
                    id="isBlocked"
                    name="isBlocked"
                    checked={editData.isBlocked}
                    onChange={handleChange}
                    className="w-5 h-5 text-[var(--brand)] border-[var(--border-strong)] rounded focus:ring-[var(--brand)]"
                  />
                  <label
                    htmlFor="isBlocked"
                    className="text-sm font-medium text-[var(--ink-secondary)]"
                  >
                    Block this user
                  </label>
                </div>

                {/* Trusted seller */}
                <div className="flex items-center gap-3 p-4 bg-[var(--warning-soft)] border border-[var(--warning)]/20 rounded-[var(--radius-lg)]">
                  <input
                    type="checkbox"
                    id="isTrusted"
                    name="isTrusted"
                    checked={!!editData.isTrusted}
                    onChange={handleChange}
                    className="w-5 h-5 text-[var(--warning)] border-[var(--border-strong)] rounded focus:ring-[var(--warning)]"
                  />
                  <label
                    htmlFor="isTrusted"
                    className="text-sm font-medium text-[var(--warning)]"
                  >
                    Grant Trusted Seller reputation badge
                  </label>
                </div>

                {/* Verification badges */}
                <div className="p-4 bg-[var(--brand-soft)] border border-[var(--brand-muted)] rounded-[var(--radius-lg)] space-y-3">
                  <p className="text-sm font-semibold text-[var(--brand-hover)]">
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
                        className="w-4 h-4 text-[var(--brand)] border-[var(--border-strong)] rounded"
                      />
                      <label htmlFor={name} className="text-sm text-[var(--brand-hover)]">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Special recognition */}
                <div className="p-4 bg-[var(--verified-soft)] border border-[var(--verified)]/20 rounded-[var(--radius-lg)] space-y-3">
                  <p className="text-sm font-semibold text-[var(--verified)]">
                    Special recognition
                  </p>
                  <p className="text-xs text-[var(--verified)]/80 leading-relaxed">
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
                        className="w-4 h-4 text-[var(--verified)] border-[var(--border-strong)] rounded"
                      />
                      <label htmlFor={name} className="text-sm text-[var(--verified)]">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Reputation metrics */}
                <div className="p-4 bg-[var(--warning-soft)] border border-[var(--warning)]/20 rounded-[var(--radius-lg)] space-y-3">
                  <p className="text-sm font-semibold text-[var(--warning)]">
                    Reputation metrics
                  </p>
                  <p className="text-xs text-[var(--warning)]/80">
                    Average rating is computed from buyer reviews. Adjust sales /
                    response / complaint rates for trust scoring.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--ink-secondary)]">
                        Completed sales
                      </label>
                      <input
                        type="number"
                        name="completedSales"
                        min={0}
                        value={editData.completedSales}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--ink-secondary)]">
                        Response rate %
                      </label>
                      <input
                        type="number"
                        name="responseRate"
                        min={0}
                        max={100}
                        value={editData.responseRate}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--ink-secondary)]">
                        Complaint rate %
                      </label>
                      <input
                        type="number"
                        name="complaintRate"
                        min={0}
                        max={100}
                        value={editData.complaintRate}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-2.5 bg-[var(--surface-3)] text-[var(--ink-secondary)] font-medium rounded-[var(--radius-lg)] hover:bg-[var(--surface-3)] transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2.5 bg-[var(--brand)] text-[var(--primary-foreground)] font-medium rounded-[var(--radius-lg)] hover:bg-[var(--brand-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {cropOpen && cropImageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4">
            <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] w-full max-w-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--ink)]">
                  Adjust Profile Picture
                </h3>
                <button
                  type="button"
                  onClick={handleCropCancel}
                  aria-label="Close"
                  className="text-[var(--muted)] hover:text-[var(--ink-secondary)]"
                >
                  ✕
                </button>
              </div>
              <div className="relative w-full h-[360px] bg-[var(--surface-3)]">
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
              <div className="px-6 py-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-[var(--ink-secondary)]">Zoom</label>
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
                    className="px-4 py-2 bg-[var(--surface-3)] text-[var(--ink-secondary)] rounded-[var(--radius-lg)] hover:bg-[var(--surface-3)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCropConfirm}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-[var(--brand)] text-[var(--primary-foreground)] rounded-[var(--radius-lg)] hover:bg-[var(--brand-hover)] disabled:opacity-50"
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
