"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "@/lib/utils/cropImage";
import { getCroppedImage } from "@/lib/utils/cropImage";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Divider,
  Field,
  IconButton,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";

const COUNTRY_CODES = [{ code: "+91", country: "India", flag: "🇮🇳" }];

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    countryCode: "+91",
    mobile: "",
    address: "",
    pinCode: "",
    city: "",
    state: "",
    whatsappNumber: "",
    profilePicture: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobileWhatsapp, setIsMobileWhatsapp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password" || name === "confirmPassword") {
      const pass = name === "password" ? value : formData.password;
      const confirm =
        name === "confirmPassword" ? value : formData.confirmPassword;
      setPasswordMatch(pass === confirm || confirm === "");
    }
  };

  const handleWhatsappToggle = (value: boolean) => {
    setIsMobileWhatsapp(value);
    if (value) {
      setFormData((prev) => ({
        ...prev,
        whatsappNumber: prev.mobile,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        whatsappNumber: "",
      }));
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      mobile: value,
      whatsappNumber: isMobileWhatsapp ? value : prev.whatsappNumber,
    }));
  };

  const fetchLocationFromPincode = async (pincode: string) => {
    if (pincode.length !== 6) return;

    setLoadingLocation(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );
      const data = await response.json();

      if (data && data[0] && data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        setFormData((prev) => ({
          ...prev,
          city: postOffice.District || "",
          state: postOffice.State || "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          city: "",
          state: "",
        }));
      }
    } catch (err) {
      console.error("Error fetching location:", err);
      setFormData((prev) => ({
        ...prev,
        city: "",
        state: "",
      }));
    } finally {
      setLoadingLocation(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({
      ...prev,
      pinCode: value,
    }));

    if (value.length === 6) {
      fetchLocationFromPincode(value);
    }
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
      const uploadForm = new FormData();
      uploadForm.append(
        "files",
        new File([croppedBlob], `profile-${Date.now()}.jpg`, {
          type: "image/jpeg",
        }),
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const data = await response.json();

      if (response.ok && data.urls?.[0]) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: data.urls[0],
        }));
        setCropOpen(false);
        setCropImageSrc(null);
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch {
      setError("Failed to crop or upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!acceptedTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        countryCode: formData.countryCode,
        address: formData.address,
        pinCode: formData.pinCode,
        city: formData.city,
        state: formData.state,
        whatsappNumber: formData.whatsappNumber,
        profilePicture: formData.profilePicture,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (res.ok) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => router.push("/login?next=/verify"), 2500);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" className="w-full overflow-hidden">
      <div className="bg-[var(--brand)] px-8 py-8">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold tracking-tight text-[var(--ink-inverse)]/90 mb-3">
          <span>Spares</span>
          <span className="text-[var(--ink-inverse)]">X</span>
        </span>
        <h2 className="text-4xl font-bold text-[var(--ink-inverse)] mb-2">
          Create Your Account
        </h2>
        <p className="text-[var(--ink-inverse)]/85">
          Join SparesX and start connecting with technicians across India
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="mb-8">
          <GoogleSignInButton />
          <Divider label="Or register with email" className="mt-6" />
        </div>

        {error ? (
          <Alert tone="danger" className="mb-6">
            {error}
          </Alert>
        ) : null}

        {success ? (
          <Alert tone="success" className="mb-6">
            {success}
          </Alert>
        ) : null}

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <span className="bg-[var(--brand-soft)] text-[var(--brand-hover)] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              1
            </span>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" htmlFor="name" required>
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Email Address" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Profile Picture (Optional)"
                htmlFor="profilePicture"
                hint="Max file size: 5MB. You can also add or update your profile picture later"
              >
                {formData.profilePicture ? (
                  <div className="mb-3 flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.profilePicture}
                      alt="Profile preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border)]"
                    />
                    <Button
                      type="button"
                      variant="link"
                      className="text-[var(--danger)]"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, profilePicture: "" }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingImage}
                  className="mb-3"
                >
                  Upload Image
                </Button>

                <p className="text-caption text-[var(--muted)] mb-1.5">
                  Or enter image URL:
                </p>
                <Input
                  id="profilePicture"
                  type="text"
                  name="profilePicture"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.profilePicture}
                  onChange={handleChange}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <span className="bg-[var(--brand-soft)] text-[var(--brand-hover)] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              2
            </span>
            Security
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Password"
              htmlFor="password"
              required
              hint="Minimum 6 characters"
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pr-12"
                  required
                  minLength={6}
                />
                <IconButton
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 18a8 8 0 100-16 8 8 0 000 16zm0-14a3.978 3.978 0 00-1.482.285 4 4 0 015.656 5.656 3.978 3.978 0 00-.285-1.482A4 4 0 0010 4zm6.707 6.707a4 4 0 01-5.656 5.656 4 4 0 005.656-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </IconButton>
              </div>
            </Field>

            <Field
              label="Confirm Password"
              htmlFor="confirmPassword"
              required
              error={
                !passwordMatch && formData.confirmPassword
                  ? "Passwords do not match"
                  : null
              }
            >
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  variant={passwordMatch ? "default" : "error"}
                  className="pr-12"
                  required
                  minLength={6}
                />
                <IconButton
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 18a8 8 0 100-16 8 8 0 000 16zm0-14a3.978 3.978 0 00-1.482.285 4 4 0 015.656 5.656 3.978 3.978 0 00-.285-1.482A4 4 0 0010 4zm6.707 6.707a4 4 0 01-5.656 5.656 4 4 0 005.656-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </IconButton>
              </div>
            </Field>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <span className="bg-[var(--brand-soft)] text-[var(--brand-hover)] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              3
            </span>
            Contact Information
          </h3>

          <Field label="Mobile Number" htmlFor="mobile" required>
            <div className="flex gap-2">
              <Select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="min-w-fit w-auto"
              >
                {COUNTRY_CODES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.code}
                  </option>
                ))}
              </Select>
              <Input
                id="mobile"
                type="tel"
                name="mobile"
                placeholder="9876543210"
                value={formData.mobile}
                onChange={handleMobileChange}
                maxLength={10}
                className="flex-1"
                required
              />
            </div>
          </Field>

          <div className="mt-4 p-4 bg-[var(--success-soft)] rounded-[var(--radius)] border border-[var(--success)]/20">
            <p className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2 mb-3">
              <svg
                className="w-5 h-5 text-[var(--success)]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp Number
            </p>

            <div className="flex items-center gap-3 mb-3">
              <Button
                type="button"
                variant={isMobileWhatsapp ? "success" : "outline"}
                className="flex-1"
                onClick={() => handleWhatsappToggle(true)}
              >
                Same as mobile
              </Button>
              <Button
                type="button"
                variant={!isMobileWhatsapp ? "success" : "outline"}
                className="flex-1"
                onClick={() => handleWhatsappToggle(false)}
              >
                Different number
              </Button>
            </div>

            {isMobileWhatsapp && formData.mobile ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] rounded-[var(--radius)] border border-[var(--success)]/30">
                <span className="text-sm text-[var(--ink-secondary)] font-medium">
                  {formData.countryCode} {formData.mobile}
                </span>
              </div>
            ) : null}

            {!isMobileWhatsapp ? (
              <div className="flex gap-2">
                <Select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="min-w-fit w-auto"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.flag} {item.code}
                    </option>
                  ))}
                </Select>
                <Input
                  type="tel"
                  name="whatsappNumber"
                  placeholder="Enter WhatsApp number"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  maxLength={10}
                  className="flex-1"
                  required={!isMobileWhatsapp}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <span className="bg-[var(--brand-soft)] text-[var(--brand-hover)] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              4
            </span>
            Address & Location
          </h3>

          <Field
            label="Street Address"
            htmlFor="address"
            required
            className="mb-4"
          >
            <Textarea
              id="address"
              name="address"
              placeholder="Enter your complete address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              required
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Field label="PIN Code" htmlFor="pinCode" required>
              <div className="relative">
                <Input
                  id="pinCode"
                  type="text"
                  name="pinCode"
                  placeholder="6-digit PIN"
                  value={formData.pinCode}
                  onChange={handlePincodeChange}
                  maxLength={6}
                  required
                />
                {loadingLocation ? (
                  <Spinner
                    size="sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand)]"
                  />
                ) : null}
              </div>
            </Field>

            <Field label="City" htmlFor="city" required>
              <Input
                id="city"
                type="text"
                name="city"
                placeholder="Auto-filled"
                value={formData.city}
                onChange={handleChange}
                className="bg-[var(--surface-2)]"
                readOnly={formData.pinCode.length === 6}
              />
            </Field>

            <Field label="State" htmlFor="state" required>
              <Input
                id="state"
                type="text"
                name="state"
                placeholder="Auto-filled"
                value={formData.state}
                onChange={handleChange}
                className="bg-[var(--surface-2)]"
                readOnly={formData.pinCode.length === 6}
              />
            </Field>
          </div>

          {loadingLocation ? (
            <p className="text-xs text-[var(--brand-hover)] flex items-center gap-1">
              <Spinner size="sm" className="text-[var(--brand)]" />
              Fetching location details...
            </p>
          ) : null}
        </div>

        <div className="pt-6 border-t border-[var(--border)] space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <Checkbox
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1"
              required
            />
            <span className="text-sm text-[var(--muted)] leading-relaxed">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] font-semibold hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand)] font-semibold hover:underline"
              >
                Privacy Policy
              </a>
              . I understand SparesX is an India-only marketplace platform and
              does not process payments.
            </span>
          </label>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!passwordMatch || !acceptedTerms}
          >
            Create Account
          </Button>

          <p className="mt-6 text-center text-[var(--muted)]">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-[var(--brand)] font-semibold hover:text-[var(--brand-hover)] transition"
            >
              Login here
            </a>
          </p>
        </div>
      </form>

      <Modal
        open={cropOpen && !!cropImageSrc}
        onClose={handleCropCancel}
        title="Adjust Profile Picture"
        sheet={false}
        className="sm:max-w-2xl"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleCropCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              loading={uploadingImage}
            >
              Save
            </Button>
          </>
        }
      >
        {cropImageSrc ? (
          <>
            <div className="relative w-full h-[360px] bg-[var(--surface-3)] -mx-5 -mt-5 mb-4">
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
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted)]">Zoom</span>
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
          </>
        ) : null}
      </Modal>
    </Card>
  );
}
