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
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";
import { authFetch, setAccessToken, isLoggedInClient } from "@/lib/auth/clientAuth";
import GoogleLinkButton from "@/components/GoogleLinkButton";
import BlockedUsersPanel from "@/components/BlockedUsersPanel";

const COUNTRY_CODES = [{ code: "+91", label: "🇮🇳 +91 (India)" }];

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
    <Badge tone={ok ? "success" : "warning"} className="border border-transparent">
      {label}: {ok ? "Verified" : "Not verified"}
    </Badge>
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
    <Card id={id} className="overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--ink)]">{title}</h2>
        {description && (
          <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </Card>
  );
}

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
    if (!isLoggedInClient()) {
      setError("Not authenticated");
      setLoading(false);
      router.push("/login?next=/technician/profile");
      return;
    }
    authFetch("/api/auth/me")
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
      const response = await authFetch("/api/upload", {
        method: "POST",
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
    if (!isLoggedInClient()) {
      setError("Not authenticated");
      return;
    }
    if (!dirty) {
      showToast("No changes to save");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/technician/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
    if (!isLoggedInClient()) return;
    const needsCurrent = Boolean(profile?.hasPassword);
    if (needsCurrent && !pwCurrent) {
      showToast("Enter your current password", "error");
      return;
    }
    setPwSaving(true);
    try {
      const res = await authFetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      setAccessToken();
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
      <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center p-4">
        <LoadingState label="Loading profile…" />
      </main>
    );
  }

  const location = [form.city, form.state].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-[var(--surface-2)] pb-28">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => router.back()}
          className="mb-4 px-0 hover:bg-transparent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>

        {error ? (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        ) : null}

        {/* Channel-style header */}
        <Card className="overflow-hidden mb-6">
          <div className="h-28 sm:h-36 bg-gradient-to-r from-[var(--brand-hover)] to-[var(--brand)]" />
          <div className="px-4 sm:px-6 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
              <div className="relative self-center sm:self-auto shrink-0">
                {form.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.profilePicture}
                    alt={form.name}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[var(--surface)] shadow-[var(--shadow)] bg-[var(--surface)]"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[var(--brand)] text-[var(--primary-foreground)] flex items-center justify-center text-4xl font-semibold border-4 border-[var(--surface)] shadow-[var(--shadow)]">
                    {(form.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <label
                  htmlFor="profilePicInput"
                  className="absolute bottom-1 right-1 w-9 h-9 bg-[var(--surface)] border border-[var(--border-strong)] rounded-full flex items-center justify-center cursor-pointer hover:bg-[var(--surface-2)] shadow-[var(--shadow-sm)]"
                  title="Change photo"
                >
                  <svg className="w-4 h-4 text-[var(--ink-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--ink)] truncate">
                  {form.name || "Your profile"}
                </h1>
                <p className="text-sm text-[var(--muted)] mt-1 truncate">{form.email}</p>
                {location && (
                  <p className="text-sm text-[var(--ink-secondary)] mt-0.5">{location}</p>
                )}
                {typeof profile?.trustScore === "number" && (
                  <p className="text-xs text-[var(--muted)] mt-2">
                    Trust score {profile.trustScore}
                    {profile.trustLabel ? ` · ${profile.trustLabel}` : ""}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-end sm:pb-1">
                {profile?._id && (
                  <Link
                    href={`/u/${profile._id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
                  >
                    View public profile
                  </Link>
                )}
                <Button
                  className="rounded-full px-4"
                  onClick={() => handleUpdate()}
                  disabled={saving || !dirty}
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div className="border-t border-[var(--border)] px-2 sm:px-4 overflow-x-auto">
            <nav className="flex gap-1 min-w-max">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`px-3.5 py-3 text-sm font-semibold border-b-2 transition ${
                    activeSection === s.id
                      ? "border-[var(--brand)] text-[var(--brand)]"
                      : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </Card>

        <form onSubmit={handleUpdate} className="space-y-5">
          <SectionCard
            id="about"
            title="About"
            description="Shown on your public profile. Tell buyers who you are."
          >
            <Textarea
              className="resize-y min-h-[120px]"
              value={form.about}
              onChange={(e) =>
                setField("about", e.target.value.slice(0, MAX_ABOUT_LENGTH))
              }
              maxLength={MAX_ABOUT_LENGTH}
              placeholder="e.g. Mobile parts seller in Pune. Genuine LCD, battery & charging port stock with quick dispatch."
            />
            <p className="mt-2 text-xs text-[var(--muted)] text-right">
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
                <Input
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
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  required
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Code">
                  <Select
                    value={form.countryCode}
                    onChange={(e) => setField("countryCode", e.target.value)}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
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
                    <Input
                      type="tel"
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
              <label className="flex items-center gap-2 text-sm text-[var(--ink-secondary)]">
                <Checkbox
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
                />
                Same as mobile number
              </label>
              <Field label="WhatsApp number">
                <Input
                  type="tel"
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
                <Textarea
                  className="resize-none min-h-[72px]"
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
                <Input
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
                  <Input
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    required
                  />
                </Field>
                <Field label="State">
                  <Input
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
            <Link href="/verify">
              <Button className="rounded-full" variant="secondary">
                Verify phone / email
              </Button>
            </Link>
          </SectionCard>

          <SectionCard id="trust" title="Trust & badges">
            {profile ? (
              <TrustBadges
                density="full"
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
              <p className="text-sm text-[var(--muted)]">No trust data yet.</p>
            )}
            <Link
              href="/trust-score"
              className="inline-block mt-4 text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              How Trust Score works →
            </Link>
          </SectionCard>

          <SectionCard
            id="security"
            title="Security"
            description={
              profile?.hasPassword
                ? "Change your password. Minimum 8 characters."
                : "Add a password so you can also sign in with email (Google Sign-In still works). Minimum 8 characters."
            }
          >
            {profile?.googleLinked ? (
              <p className="text-sm text-[var(--muted)] mb-4">
                Google Sign-In is linked to this account.
              </p>
            ) : (
              <div className="mb-6 space-y-2">
                <p className="text-sm text-[var(--muted)]">
                  Link Google using the same email as this account. Password
                  accounts are never auto-linked on the login page.
                </p>
                <GoogleLinkButton
                  onLinked={() =>
                    setProfile((p: Record<string, unknown> | null) =>
                      p ? { ...p, googleLinked: true } : p,
                    )
                  }
                />
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">
                Blocked users
              </h3>
              <BlockedUsersPanel />
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
              {profile?.hasPassword ? (
                <Field label="Current password">
                  <Input
                    type="password"
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
                <Input
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
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
                <Input
                  type="password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
              <Button
                type="submit"
                variant="secondary"
                className="rounded-full"
                disabled={pwSaving}
              >
                {pwSaving
                  ? profile?.hasPassword
                    ? "Updating…"
                    : "Setting…"
                  : profile?.hasPassword
                    ? "Update password"
                    : "Set password"}
              </Button>
            </form>
          </SectionCard>
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setForm(initialForm);
                  setWaSameAsMobile(
                    !!initialForm.mobile &&
                      initialForm.mobile.replace(/\D/g, "") ===
                        initialForm.whatsappNumber.replace(/\D/g, ""),
                  );
                }}
              >
                Discard
              </Button>
              <Button
                className="rounded-full"
                onClick={() => handleUpdate()}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {cropOpen && (
        <div className="fixed inset-0 bg-[var(--overlay)] z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] w-full max-w-md overflow-hidden border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--ink)]">
                Crop profile picture
              </h3>
            </div>
            <div className="relative h-80 bg-[var(--surface-2)]">
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
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <label className="block text-sm font-medium text-[var(--ink-secondary)] mb-2">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[var(--brand)]"
              />
            </div>
            {uploading && uploadProgress > 0 && (
              <div className="px-6 py-3">
                <div className="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--brand)] transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="px-6 py-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full"
                onClick={handleCropCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full"
                onClick={handleCropConfirm}
                disabled={uploading}
                loading={uploading}
              >
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
