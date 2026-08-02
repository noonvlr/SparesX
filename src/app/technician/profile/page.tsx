"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "@/lib/utils/cropImage";
import { getCroppedImage } from "@/lib/utils/cropImage";
import TrustBadges from "@/components/TrustBadges";
import { showToast } from "@/components/ToastHost";
import { MAX_ABOUT_LENGTH } from "@/lib/validation/userContact";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+65", label: "🇸🇬 +65" },
];

type ProfileForm = {
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  countryCode: string;
  pinCode: string;
  whatsappNumber: string;
  profilePicture: string;
  about: string;
};

const emptyForm = (): ProfileForm => ({
  name: "",
  email: "",
  mobile: "",
  address: "",
  city: "",
  state: "",
  countryCode: "+91",
  pinCode: "",
  whatsappNumber: "",
  profilePicture: "",
  about: "",
});

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
        ok
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-amber-50 text-amber-900 border-amber-200"
      }`}
    >
      {label}: {ok ? "Verified" : "Not verified"}
    </span>
  );
}

function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden"
    >
      <div className="px-5 sm:px-6 py-4 border-b-2 border-gray-200 bg-gray-50/80">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "identity", label: "Identity" },
  { id: "contact", label: "Contact" },
  { id: "address", label: "Address" },
  { id: "verification", label: "Verification" },
  { id: "trust", label: "Trust" },
  { id: "security", label: "Security" },
] as const;

export default function TechnicianProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm());
  const [initialForm, setInitialForm] = useState<ProfileForm>(emptyForm());
  const [waSameAsMobile, setWaSameAsMobile] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("about");

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const dirty = (Object.keys(initialForm) as (keyof ProfileForm)[]).some(
    (k) => form[k] !== initialForm[k],
  );

  const emailWillReverify =
    form.email.trim().toLowerCase() !== initialForm.email.trim().toLowerCase();
  const phoneWillReverify =
    form.mobile.replace(/\D/g, "") !== initialForm.mobile.replace(/\D/g, "") ||
    form.countryCode !== initialForm.countryCode;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      router.push("/login?next=/technician/profile");
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          const nextForm: ProfileForm = {
            name: data.user.name || "",
            email: data.user.email || "",
            mobile: data.user.mobile || "",
            address: data.user.address || "",
            city: data.user.city || "",
            state: data.user.state || "",
            countryCode: data.user.countryCode || "+91",
            pinCode: data.user.pinCode || "",
            whatsappNumber: data.user.whatsappNumber || "",
            profilePicture: data.user.profilePicture || "",
            about: data.user.about || "",
          };
          setProfile(data.user);
          setForm(nextForm);
          setInitialForm(nextForm);
          setWaSameAsMobile(
            !!nextForm.mobile &&
              nextForm.mobile.replace(/\D/g, "") ===
                nextForm.whatsappNumber.replace(/\D/g, ""),
          );
        } else {
          setError("Failed to load profile");
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (loading) return;
    const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    if (!hash) return;
    const t = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(hash);
    }, 100);
    return () => window.clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [loading]);

  const setField = <K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "mobile" && waSameAsMobile) {
        next.whatsappNumber = String(value).replace(/\D/g, "").slice(0, 10);
      }
      return next;
    });
  };

  const fetchLocationFromPincode = async (pincode: string) => {
    if (pincode.length !== 6) return;
    setPinLoading(true);
    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0]?.Status === "Success" &&
        data[0]?.PostOffice?.[0]
      ) {
        const po = data[0].PostOffice[0];
        setForm((f) => ({
          ...f,
          city: po.District || po.Block || f.city,
          state: po.State || f.state,
        }));
      }
    } catch {
      // ignore
    } finally {
      setPinLoading(false);
    }
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size should be less than 5MB", "error");
      return;
    }
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
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setUploadProgress(0);
    try {
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
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });
      setUploadProgress(80);
      const data = await response.json();
      if (response.ok && data.urls?.[0]) {
        setForm((prev) => ({ ...prev, profilePicture: data.urls[0] }));
        setUploadProgress(100);
        setCropOpen(false);
        setCropImageSrc(null);
        showToast("Profile picture uploaded");
      } else {
        showToast(data.error || "Failed to upload image", "error");
      }
    } catch {
      showToast("Failed to crop or upload image", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  async function handleUpdate(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    if (!dirty) {
      showToast("No changes to save");
      return;
    }
    setSaving(true);
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
        const next: ProfileForm = data.user
          ? {
              name: data.user.name || "",
              email: data.user.email || "",
              mobile: data.user.mobile || "",
              address: data.user.address || "",
              city: data.user.city || "",
              state: data.user.state || "",
              countryCode: data.user.countryCode || "+91",
              pinCode: data.user.pinCode || "",
              whatsappNumber: data.user.whatsappNumber || "",
              profilePicture: data.user.profilePicture || "",
              about: data.user.about || "",
            }
          : form;
        setForm(next);
        setInitialForm(next);
        setProfile((p: any) => ({ ...p, ...data.user }));
        showToast(
          emailWillReverify || phoneWillReverify
            ? "Profile saved. Please re-verify updated email/phone."
            : "Profile updated successfully",
        );
        window.dispatchEvent(new Event("sparesx-profile-updated"));
      } else {
        setError(data.message || "Failed to update profile");
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch {
      setError("An error occurred while updating your profile");
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      showToast("New passwords do not match", "error");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    const needsCurrent = Boolean(profile?.hasPassword);
    if (needsCurrent && !pwCurrent) {
      showToast("Enter your current password", "error");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(needsCurrent ? { currentPassword: pwCurrent } : {}),
          newPassword: pwNew,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Could not update password", "error");
        return;
      }
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setProfile((p: Record<string, unknown> | null) =>
        p ? { ...p, hasPassword: true } : p,
      );
      window.dispatchEvent(new Event("sparesx-profile-updated"));
      showToast(
        needsCurrent
          ? "Password updated successfully"
          : "Password set successfully. You can also sign in with email.",
      );
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setPwSaving(false);
    }
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </main>
    );
  }

  const location = [form.city, form.state].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-[#f8f9fa] pb-28">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {error && (
          <div className="mb-4 p-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Channel-style header */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden mb-6">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-slate-700 via-blue-700 to-sky-600" />
          <div className="px-4 sm:px-6 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
              <div className="relative self-center sm:self-auto shrink-0">
                {form.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.profilePicture}
                    alt={form.name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-md">
                    {(form.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <label
                  htmlFor="profilePicInput"
                  className="absolute bottom-1 right-1 w-9 h-9 bg-white border border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow"
                  title="Change photo"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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

              <div className="flex-1 min-w-0 text-center sm:text-left sm:pb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                  {form.name || "Your profile"}
                </h1>
                <p className="text-sm text-gray-500 mt-1 truncate">{form.email}</p>
                {location && (
                  <p className="text-sm text-gray-600 mt-0.5">{location}</p>
                )}
                {typeof profile?.trustScore === "number" && (
                  <p className="text-xs text-gray-500 mt-2">
                    Trust score {profile.trustScore}
                    {profile.trustLabel ? ` · ${profile.trustLabel}` : ""}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-end sm:pb-1">
                {profile?._id && (
                  <Link
                    href={`/u/${profile._id}`}
                    className="px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    View public profile
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleUpdate()}
                  disabled={saving || !dirty}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div className="border-t-2 border-gray-200 px-2 sm:px-4 overflow-x-auto">
            <nav className="flex gap-1 min-w-max">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`px-3.5 py-3 text-sm font-semibold border-b-2 transition ${
                    activeSection === s.id
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          <SectionCard
            id="about"
            title="About"
            description="Shown on your public profile. Tell buyers who you are."
          >
            <textarea
              className={`${inputClass} resize-y min-h-[120px]`}
              value={form.about}
              onChange={(e) =>
                setField("about", e.target.value.slice(0, MAX_ABOUT_LENGTH))
              }
              maxLength={MAX_ABOUT_LENGTH}
              placeholder="e.g. Mobile parts seller in Pune. Genuine LCD, battery & charging port stock with quick dispatch."
            />
            <p className="mt-2 text-xs text-gray-500 text-right">
              {form.about.length}/{MAX_ABOUT_LENGTH}
            </p>
          </SectionCard>

          <SectionCard
            id="identity"
            title="Identity"
            description="Changing email or mobile requires re-verification."
          >
            <div className="space-y-4 max-w-xl">
              <Field label="Full name">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
              </Field>
              <Field
                label="Email"
                hint={
                  emailWillReverify
                    ? "Saving will mark email as unverified until you confirm it again."
                    : undefined
                }
              >
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  required
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Code">
                  <select
                    className={inputClass}
                    value={form.countryCode}
                    onChange={(e) => setField("countryCode", e.target.value)}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="col-span-2">
                  <Field
                    label="Mobile"
                    hint={
                      phoneWillReverify
                        ? "Saving will mark phone as unverified until you confirm it again."
                        : "10-digit Indian mobile starting with 6–9"
                    }
                  >
                    <input
                      type="tel"
                      className={inputClass}
                      value={form.mobile}
                      onChange={(e) =>
                        setField(
                          "mobile",
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      maxLength={10}
                      required
                    />
                  </Field>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard id="contact" title="WhatsApp contact">
            <div className="max-w-xl space-y-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={waSameAsMobile}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setWaSameAsMobile(checked);
                    if (checked) {
                      setField(
                        "whatsappNumber",
                        form.mobile.replace(/\D/g, "").slice(0, 10),
                      );
                    }
                  }}
                  className="rounded border-gray-300"
                />
                Same as mobile number
              </label>
              <Field label="WhatsApp number">
                <input
                  type="tel"
                  className={inputClass}
                  value={form.whatsappNumber}
                  onChange={(e) => {
                    setWaSameAsMobile(false);
                    setField(
                      "whatsappNumber",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    );
                  }}
                  maxLength={10}
                  disabled={waSameAsMobile}
                  required
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard id="address" title="Address">
            <div className="space-y-4 max-w-xl">
              <Field label="Street address">
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  required
                />
              </Field>
              <Field
                label="PIN code"
                hint={pinLoading ? "Looking up city & state…" : undefined}
              >
                <input
                  className={inputClass}
                  value={form.pinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setField("pinCode", value);
                    if (value.length === 6) void fetchLocationFromPincode(value);
                  }}
                  maxLength={6}
                  required
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="City">
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    required
                  />
                </Field>
                <Field label="State">
                  <input
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    required
                  />
                </Field>
              </div>
            </div>
          </SectionCard>
        </form>

        <div className="space-y-5 mt-5">
          <SectionCard
            id="verification"
            title="Verification"
            description="Confirm phone and email yourself. KYC and trust are granted by SparesX."
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusPill ok={!!profile?.phoneVerified} label="Phone" />
              <StatusPill ok={!!profile?.emailVerified} label="Email" />
              <StatusPill ok={!!profile?.kycVerified} label="KYC" />
              <StatusPill ok={!!profile?.businessVerified} label="Business" />
              <StatusPill ok={!!profile?.addressVerified} label="Address" />
              <StatusPill ok={!!profile?.isTrusted} label="Trusted" />
            </div>
            <Link
              href="/verify"
              className="inline-flex px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
            >
              Verify phone / email
            </Link>
          </SectionCard>

          <SectionCard id="trust" title="Trust & badges">
            {profile ? (
              <TrustBadges
                phoneVerified={profile.phoneVerified}
                emailVerified={profile.emailVerified}
                kycVerified={profile.kycVerified}
                businessVerified={profile.businessVerified}
                addressVerified={profile.addressVerified}
                isTrusted={profile.isTrusted}
                trustScore={profile.trustScore}
                trustLabel={profile.trustLabel}
                badges={profile.badges}
                activeBadgeKeys={profile.activeBadgeKeys}
                showScore
                size="md"
              />
            ) : (
              <p className="text-sm text-gray-500">No trust data yet.</p>
            )}
            <Link
              href="/trust-score"
              className="inline-block mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              How Trust Score works →
            </Link>
          </SectionCard>

          <SectionCard
            id="security"
            title="Security"
            description={
              profile?.hasPassword
                ? "Change your password. Minimum 6 characters."
                : "Add a password so you can also sign in with email (Google Sign-In still works). Minimum 6 characters."
            }
          >
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
              {profile?.hasPassword ? (
                <Field label="Current password">
                  <input
                    type="password"
                    className={inputClass}
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </Field>
              ) : null}
              <Field
                label={profile?.hasPassword ? "New password" : "Password"}
              >
                <input
                  type="password"
                  className={inputClass}
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </Field>
              <Field
                label={
                  profile?.hasPassword
                    ? "Confirm new password"
                    : "Confirm password"
                }
              >
                <input
                  type="password"
                  className={inputClass}
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </Field>
              <button
                type="submit"
                disabled={pwSaving}
                className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                {pwSaving
                  ? profile?.hasPassword
                    ? "Updating…"
                    : "Setting…"
                  : profile?.hasPassword
                    ? "Update password"
                    : "Set password"}
              </button>
            </form>
          </SectionCard>
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t-2 border-gray-200 bg-white/95 backdrop-blur px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setWaSameAsMobile(
                    !!initialForm.mobile &&
                      initialForm.mobile.replace(/\D/g, "") ===
                        initialForm.whatsappNumber.replace(/\D/g, ""),
                  );
                }}
                className="px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => handleUpdate()}
                disabled={saving}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cropOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border-2 border-gray-200">
            <div className="px-6 py-4 border-b-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Crop profile picture
              </h3>
            </div>
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
            <div className="px-6 py-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            {uploading && uploadProgress > 0 && (
              <div className="px-6 py-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="px-6 py-4 flex gap-3">
              <button
                type="button"
                onClick={handleCropCancel}
                disabled={uploading}
                className="flex-1 py-3 rounded-full border border-gray-300 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={uploading}
                className="flex-1 py-3 rounded-full bg-blue-600 text-white font-semibold disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
