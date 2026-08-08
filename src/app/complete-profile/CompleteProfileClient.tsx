"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import { isProfileComplete } from "@/lib/auth/profileComplete";
import { AuthPage } from "@/components/layout";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { authFetch, getAccessToken } from "@/lib/auth/clientAuth";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
];

export default function CompleteProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [waSameAsMobile, setWaSameAsMobile] = useState(true);
  const [pinLoading, setPinLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [form, setForm] = useState({
    countryCode: "+91",
    mobile: "",
    whatsappNumber: "",
    address: "",
    pinCode: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace(
        `/login?next=${encodeURIComponent("/complete-profile")}`,
      );
      return;
    }

    authFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/login");
          return;
        }
        if (data.user.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
        if (isProfileComplete(data.user)) {
          router.replace(next || "/technician/dashboard");
          return;
        }
        setPhoneVerified(!!data.user.phoneVerified);
        setForm({
          countryCode: data.user.countryCode || "+91",
          mobile: data.user.mobile || "",
          whatsappNumber: data.user.whatsappNumber || data.user.mobile || "",
          address: data.user.address || "",
          pinCode: data.user.pinCode || "",
          city: data.user.city || "",
          state: data.user.state || "",
        });
        setWaSameAsMobile(
          !data.user.whatsappNumber ||
            data.user.whatsappNumber === data.user.mobile,
        );
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router, next]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((f) => {
      const nextForm = { ...f, [key]: value };
      if (key === "mobile" && waSameAsMobile) {
        nextForm.whatsappNumber = value.replace(/\D/g, "").slice(0, 10);
      }
      return nextForm;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!getAccessToken()) return;

    setSaving(true);
    try {
      const res = await authFetch("/api/technician/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Could not save profile");
        showToast(data.message || "Could not save profile", "error");
        return;
      }

      showToast("Profile completed");
      if (!phoneVerified && !data.user?.phoneVerified) {
        router.push(next ? `/verify?next=${encodeURIComponent(next)}` : "/verify");
      } else {
        router.push(next || "/technician/dashboard");
      }
    } catch {
      setError("Something went wrong");
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthPage>
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-[var(--brand)]" />
        </div>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <Card variant="elevated" className="overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--brand-soft)]">
          <span className="inline-flex items-center gap-1 text-xs font-bold tracking-tight text-[var(--brand-hover)] mb-2">
            <span>Spares</span>
            <span>X</span>
          </span>
          <h1 className="text-xl font-bold text-[var(--ink)]">
            Complete your profile
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Add your contact details so buyers can reach you. Required once
            after Google Sign-In.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}

          <div className="grid grid-cols-3 gap-3">
            <Field label="Code" htmlFor="countryCode">
              <Select
                id="countryCode"
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
            <Field label="Mobile" htmlFor="mobile" className="col-span-2" required>
              <Input
                id="mobile"
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
                placeholder="10-digit mobile"
              />
            </Field>
          </div>

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
            WhatsApp same as mobile
          </label>

          <Field label="WhatsApp number" htmlFor="whatsappNumber" required>
            <Input
              id="whatsappNumber"
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

          <Field label="Address" htmlFor="address" required>
            <Textarea
              id="address"
              rows={2}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              required
            />
          </Field>

          <Field
            label="PIN code"
            htmlFor="pinCode"
            required
            hint={pinLoading ? "Looking up…" : undefined}
          >
            <Input
              id="pinCode"
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="City" htmlFor="city" required>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                required
              />
            </Field>
            <Field label="State" htmlFor="state" required>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
                required
              />
            </Field>
          </div>

          <Button type="submit" className="w-full" loading={saving}>
            Save and continue
          </Button>
        </form>
      </Card>
    </AuthPage>
  );
}
