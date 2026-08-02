"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/components/ToastHost";
import { isProfileComplete } from "@/lib/auth/profileComplete";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
];

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

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
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(
        `/login?next=${encodeURIComponent("/complete-profile")}`,
      );
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
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
    const token = localStorage.getItem("token");
    if (!token) return;

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
      <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b-2 border-gray-200 bg-gray-50">
            <h1 className="text-xl font-bold text-gray-900">
              Complete your profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Add your contact details so buyers can reach you. Required once
              after Google Sign-In.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Code
                </label>
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
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mobile
                </label>
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
                  placeholder="10-digit mobile"
                />
              </div>
            </div>

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
              WhatsApp same as mobile
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                WhatsApp number
              </label>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                PIN code
                {pinLoading ? " · Looking up…" : ""}
              </label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City
                </label>
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  State
                </label>
                <input
                  className={inputClass}
                  value={form.state}
                  onChange={(e) => setField("state", e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save and continue"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
