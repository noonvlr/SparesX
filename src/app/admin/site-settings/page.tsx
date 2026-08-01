"use client";

import { useCallback, useEffect, useState } from "react";

type Settings = {
  activeSmsProvider: "twilio" | "msg91";
  twilioAccountSid: string;
  twilioAuthTokenMasked: string;
  twilioFromNumber: string;
  twilioConfigured: boolean;
  msg91AuthKeyMasked: string;
  msg91SenderId: string;
  msg91TemplateId: string;
  msg91Configured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassMasked: string;
  smtpFrom: string;
  smtpConfigured: boolean;
  encryptionReady: boolean;
};

const empty: Settings = {
  activeSmsProvider: "twilio",
  twilioAccountSid: "",
  twilioAuthTokenMasked: "",
  twilioFromNumber: "",
  twilioConfigured: false,
  msg91AuthKeyMasked: "",
  msg91SenderId: "",
  msg91TemplateId: "",
  msg91Configured: false,
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPassMasked: "",
  smtpFrom: "",
  smtpConfigured: false,
  encryptionReady: false,
};

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Settings>(empty);
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [msg91AuthKey, setMsg91AuthKey] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [testMobile, setTestMobile] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = () => localStorage.getItem("token") || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/site-settings", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load settings");
        return;
      }
      setSettings(data.settings);
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activeSmsProvider: settings.activeSmsProvider,
          twilioAccountSid: settings.twilioAccountSid,
          twilioFromNumber: settings.twilioFromNumber,
          twilioAuthToken: twilioAuthToken || undefined,
          msg91SenderId: settings.msg91SenderId,
          msg91TemplateId: settings.msg91TemplateId,
          msg91AuthKey: msg91AuthKey || undefined,
          smtpHost: settings.smtpHost,
          smtpPort: Number(settings.smtpPort) || 587,
          smtpSecure: settings.smtpSecure,
          smtpUser: settings.smtpUser,
          smtpFrom: settings.smtpFrom,
          smtpPass: smtpPass || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Save failed");
        return;
      }
      setSettings(data.settings);
      setTwilioAuthToken("");
      setMsg91AuthKey("");
      setSmtpPass("");
      setMessage("Settings saved");
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function testSms() {
    setTesting(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/site-settings/test-sms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile: testMobile, countryCode: "+91" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Test SMS failed");
        return;
      }
      setMessage(data.message || "Test SMS sent");
    } catch {
      setError("Test SMS failed");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <main className="max-w-3xl mx-auto py-8 px-4">Loading…</main>;
  }

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Site settings</h1>
      <p className="text-sm text-gray-600 mb-6">
        Control SMS provider credentials and email OTP SMTP. Secrets are
        encrypted at rest. Leave password fields blank to keep existing values.
      </p>

      {!settings.encryptionReady && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Set <code className="font-mono">SETTINGS_ENCRYPTION_KEY</code> (32+
          characters) in your environment before saving credentials.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <form onSubmit={save} className="space-y-8">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Active SMS provider</h2>
          <div className="flex flex-wrap gap-4">
            {(["twilio", "msg91"] as const).map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  checked={settings.activeSmsProvider === p}
                  onChange={() =>
                    setSettings((s) => ({ ...s, activeSmsProvider: p }))
                  }
                />
                <span className="font-medium uppercase">{p}</span>
                {p === "twilio" && settings.twilioConfigured && (
                  <span className="text-xs text-emerald-600">configured</span>
                )}
                {p === "msg91" && settings.msg91Configured && (
                  <span className="text-xs text-emerald-600">configured</span>
                )}
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Twilio</h2>
          <label className="block text-sm">
            <span className="text-gray-600">Account SID</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={settings.twilioAccountSid}
              onChange={(e) =>
                setSettings((s) => ({ ...s, twilioAccountSid: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">
              Auth Token{" "}
              {settings.twilioAuthTokenMasked && (
                <span className="text-gray-400">
                  (saved: {settings.twilioAuthTokenMasked})
                </span>
              )}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank to keep existing"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={twilioAuthToken}
              onChange={(e) => setTwilioAuthToken(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">From number (E.164)</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="+91XXXXXXXXXX"
              value={settings.twilioFromNumber}
              onChange={(e) =>
                setSettings((s) => ({ ...s, twilioFromNumber: e.target.value }))
              }
            />
          </label>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">MSG91</h2>
          <label className="block text-sm">
            <span className="text-gray-600">
              Auth key{" "}
              {settings.msg91AuthKeyMasked && (
                <span className="text-gray-400">
                  (saved: {settings.msg91AuthKeyMasked})
                </span>
              )}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank to keep existing"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={msg91AuthKey}
              onChange={(e) => setMsg91AuthKey(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Sender ID</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={settings.msg91SenderId}
              onChange={(e) =>
                setSettings((s) => ({ ...s, msg91SenderId: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Template ID (OTP)</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={settings.msg91TemplateId}
              onChange={(e) =>
                setSettings((s) => ({ ...s, msg91TemplateId: e.target.value }))
              }
            />
          </label>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Email OTP SMTP (optional override)
          </h2>
          <p className="text-xs text-gray-500">
            If empty, the app uses SMTP env vars. Fill these to manage email OTP
            from admin only.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm sm:col-span-2">
              <span className="text-gray-600">Host</span>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={settings.smtpHost}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smtpHost: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Port</span>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={settings.smtpPort}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    smtpPort: Number(e.target.value) || 587,
                  }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm mt-6">
              <input
                type="checkbox"
                checked={settings.smtpSecure}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smtpSecure: e.target.checked }))
                }
              />
              Secure (465)
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">User</span>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={settings.smtpUser}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smtpUser: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">
                Password{" "}
                {settings.smtpPassMasked && (
                  <span className="text-gray-400">
                    (saved: {settings.smtpPassMasked})
                  </span>
                )}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Leave blank to keep existing"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-gray-600">From</span>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="SparesX &lt;noreply@sparesx.in&gt;"
                value={settings.smtpFrom}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smtpFrom: e.target.value }))
                }
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <section className="mt-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Test SMS</h2>
        <p className="text-xs text-gray-500">
          Sends a test OTP via the active provider to a mobile number you enter.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
            placeholder="10-digit mobile"
            value={testMobile}
            onChange={(e) => setTestMobile(e.target.value)}
          />
          <button
            type="button"
            onClick={testSms}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-50"
          >
            {testing ? "Sending…" : "Send test SMS"}
          </button>
        </div>
      </section>
    </main>
  );
}
