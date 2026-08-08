"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPage } from "@/components/layout";
import { Card, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

type Settings = {
  activeSmsProvider: "twilio" | "msg91";
  twilioAccountSid: string;
  twilioAuthTokenMasked: string;
  twilioFromNumber: string;
  twilioVerifyServiceSid: string;
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
  requireListingApproval: boolean;
  encryptionReady: boolean;
};

const empty: Settings = {
  activeSmsProvider: "twilio",
  twilioAccountSid: "",
  twilioAuthTokenMasked: "",
  twilioFromNumber: "",
  twilioVerifyServiceSid: "",
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
  requireListingApproval: false,
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
          twilioVerifyServiceSid: settings.twilioVerifyServiceSid,
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
          requireListingApproval: settings.requireListingApproval,
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
    return (
      <AdminPage title="Site settings">
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
          <Spinner /> Loading…
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage containerSize="md">
      <PageHeader
        title="Site settings"
        description="Control SMS provider credentials and email OTP SMTP. Secrets are encrypted at rest. Leave password fields blank to keep existing values."
      />

      {!settings.encryptionReady && (
        <Alert tone="warning" className="mb-4">
          Set <code className="font-mono">SETTINGS_ENCRYPTION_KEY</code> (32+
          characters) in your environment before saving credentials.
        </Alert>
      )}

      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {message && (
        <Alert tone="success" className="mb-4">
          {message}
        </Alert>
      )}

      <form onSubmit={save} className="space-y-8">
        <Card padding="md" className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            Marketplace moderation
          </h2>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <Checkbox
              checked={settings.requireListingApproval}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  requireListingApproval: e.target.checked,
                }))
              }
            />
            <span>
              <span className="font-medium text-[var(--ink)] block">
                Require admin approval for new listings
              </span>
              <span className="text-[var(--muted)] text-xs">
                When enabled, technician posts and relists start as pending until
                an admin approves them. Leave off for auto-approve.
              </span>
            </span>
          </label>
        </Card>

        <Card padding="md" className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Active SMS provider</h2>
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
                  <span className="text-xs text-[var(--success)]">configured</span>
                )}
                {p === "msg91" && settings.msg91Configured && (
                  <span className="text-xs text-[var(--success)]">configured</span>
                )}
              </label>
            ))}
          </div>
        </Card>

        <Card padding="md" className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Twilio</h2>
          <p className="text-xs text-[var(--muted)]">
            Trial accounts cannot send custom SMS text. Create a{" "}
            <strong>Verify</strong> service in Twilio and paste the Service SID
            below (starts with <code className="font-mono">VA</code>). OTP will
            use Verify automatically when this is set.
          </p>
          <Field label="Account SID" htmlFor="twilio-sid">
            <Input
              id="twilio-sid"
              value={settings.twilioAccountSid}
              onChange={(e) =>
                setSettings((s) => ({ ...s, twilioAccountSid: e.target.value }))
              }
            />
          </Field>
          <Field
            label="Auth Token"
            htmlFor="twilio-token"
            hint={
              settings.twilioAuthTokenMasked
                ? `Saved: ${settings.twilioAuthTokenMasked}`
                : undefined
            }
          >
            <Input
              id="twilio-token"
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank to keep existing"
              value={twilioAuthToken}
              onChange={(e) => setTwilioAuthToken(e.target.value)}
            />
          </Field>
          <Field label="Verify Service SID (required for trial OTP)" htmlFor="twilio-verify">
            <Input
              id="twilio-verify"
              className="font-mono"
              placeholder="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={settings.twilioVerifyServiceSid}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  twilioVerifyServiceSid: e.target.value,
                }))
              }
            />
          </Field>
          <Field label="From number (optional if Verify SID is set)" htmlFor="twilio-from">
            <Input
              id="twilio-from"
              placeholder="+1... or leave blank when using Verify"
              value={settings.twilioFromNumber}
              onChange={(e) =>
                setSettings((s) => ({ ...s, twilioFromNumber: e.target.value }))
              }
            />
          </Field>
        </Card>

        <Card padding="md" className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">MSG91</h2>
          <Field
            label="Auth key"
            htmlFor="msg91-key"
            hint={
              settings.msg91AuthKeyMasked
                ? `Saved: ${settings.msg91AuthKeyMasked}`
                : undefined
            }
          >
            <Input
              id="msg91-key"
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank to keep existing"
              value={msg91AuthKey}
              onChange={(e) => setMsg91AuthKey(e.target.value)}
            />
          </Field>
          <Field label="Sender ID" htmlFor="msg91-sender">
            <Input
              id="msg91-sender"
              value={settings.msg91SenderId}
              onChange={(e) =>
                setSettings((s) => ({ ...s, msg91SenderId: e.target.value }))
              }
            />
          </Field>
          <Field label="Template ID (OTP)" htmlFor="msg91-template">
            <Input
              id="msg91-template"
              value={settings.msg91TemplateId}
              onChange={(e) =>
                setSettings((s) => ({ ...s, msg91TemplateId: e.target.value }))
              }
            />
          </Field>
        </Card>

        <Card padding="md" className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            Email OTP SMTP (optional override)
          </h2>
          <p className="text-xs text-[var(--muted)]">
            If empty, the app uses SMTP env vars. Fill these to manage email OTP
            from admin only.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Host" htmlFor="smtp-host" className="sm:col-span-2">
              <Input
                id="smtp-host"
                value={settings.smtpHost}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smtpHost: e.target.value }))
                }
              />
            </Field>
            <Field label="Port" htmlFor="smtp-port">
              <Input
                id="smtp-port"
                type="number"
                value={settings.smtpPort}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    smtpPort: Number(e.target.value) || 587,
                  }))
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm mt-6 text-[var(--ink)]">
              <Checkbox
                checked={settings.smtpSecure}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smtpSecure: e.target.checked }))
                }
              />
              Secure (465)
            </label>
            <Field label="User" htmlFor="smtp-user">
              <Input
                id="smtp-user"
                value={settings.smtpUser}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smtpUser: e.target.value }))
                }
              />
            </Field>
            <Field
              label="Password"
              htmlFor="smtp-pass"
              hint={
                settings.smtpPassMasked
                  ? `Saved: ${settings.smtpPassMasked}`
                  : undefined
              }
            >
              <Input
                id="smtp-pass"
                type="password"
                autoComplete="new-password"
                placeholder="Leave blank to keep existing"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
            </Field>
            <Field label="From" htmlFor="smtp-from" className="sm:col-span-2">
              <Input
                id="smtp-from"
                placeholder="SparesX <noreply@sparesx.in>"
                value={settings.smtpFrom}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, smtpFrom: e.target.value }))
                }
              />
            </Field>
          </div>
        </Card>

        <Button type="submit" loading={saving}>
          Save settings
        </Button>
      </form>

      <Card padding="md" className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Test SMS</h2>
        <p className="text-xs text-[var(--muted)]">
          Sends a test OTP via the active provider to a mobile number you enter.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            className="flex-1"
            placeholder="10-digit mobile"
            value={testMobile}
            onChange={(e) => setTestMobile(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={testSms}
            loading={testing}
          >
            Send test SMS
          </Button>
        </div>
      </Card>
    </AdminPage>
  );
}
