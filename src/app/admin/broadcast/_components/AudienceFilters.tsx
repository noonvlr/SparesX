"use client";

import { useEffect, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { BroadcastFilterState, Tri } from "./types";

const TRI_OPTIONS: { value: Tri; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function TriField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: Tri;
  onChange: (v: Tri) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as Tri)}
      >
        {TRI_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function AudienceFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: BroadcastFilterState;
  onChange: (next: BroadcastFilterState) => void;
  onClear: () => void;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.cities)) setCities(d.cities);
      })
      .catch(() => {});
  }, []);

  const set = <K extends keyof BroadcastFilterState>(
    key: K,
    value: BroadcastFilterState[K],
  ) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Who should receive this message?
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            All selected filters are combined (AND) to narrow the audience.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onClear}>
          Clear all filters
        </Button>
      </div>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Account
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Role" htmlFor="bc-role">
            <Select
              id="bc-role"
              value={filters.role}
              onChange={(e) =>
                set("role", e.target.value as BroadcastFilterState["role"])
              }
            >
              <option value="technician">Technicians (platform users)</option>
              <option value="all">All non-admin users</option>
            </Select>
          </Field>
          <Field label="Account status" htmlFor="bc-status">
            <Select
              id="bc-status"
              value={filters.accountStatus}
              onChange={(e) =>
                set(
                  "accountStatus",
                  e.target.value as BroadcastFilterState["accountStatus"],
                )
              }
            >
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="all">All</option>
            </Select>
          </Field>
          <TriField
            id="bc-phone"
            label="Phone verification"
            value={filters.phoneVerified}
            onChange={(v) => set("phoneVerified", v)}
          />
          <TriField
            id="bc-email"
            label="Email verification"
            value={filters.emailVerified}
            onChange={(v) => set("emailVerified", v)}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Admin accounts are never included in broadcast audiences.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Marketplace activity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <TriField
            id="bc-products"
            label="Has products"
            value={filters.hasProducts}
            onChange={(v) => set("hasProducts", v)}
          />
          <TriField
            id="bc-live"
            label="Has live listings"
            value={filters.hasApprovedProducts}
            onChange={(v) => set("hasApprovedProducts", v)}
          />
          <TriField
            id="bc-req"
            label="Has spare requests"
            value={filters.hasRequests}
            onChange={(v) => set("hasRequests", v)}
          />
          <TriField
            id="bc-open"
            label="Has open spare requests"
            value={filters.hasOpenRequests}
            onChange={(v) => set("hasOpenRequests", v)}
          />
          <TriField
            id="bc-trusted"
            label="Trusted seller"
            value={filters.isTrusted}
            onChange={(v) => set("isTrusted", v)}
          />
          <TriField
            id="bc-elite"
            label="Elite approved"
            value={filters.eliteApproved}
            onChange={(v) => set("eliteApproved", v)}
          />
        </div>
      </section>

      <div>
        <button
          type="button"
          className="text-sm font-medium text-[var(--brand)] hover:underline"
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          {advancedOpen ? "Hide" : "Show"} location & activity filters
        </button>
      </div>

      {advancedOpen ? (
        <>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="City"
                htmlFor="bc-city"
                hint="Exact match against the user city field"
              >
                <Input
                  id="bc-city"
                  list="bc-city-list"
                  value={filters.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Search city…"
                />
                <datalist id="bc-city-list">
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="State / region" htmlFor="bc-state">
                <Input
                  id="bc-state"
                  value={filters.state}
                  onChange={(e) => set("state", e.target.value)}
                  placeholder="Exact state match"
                />
              </Field>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Account age & activity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="Signed up from" htmlFor="bc-from">
                <Input
                  id="bc-from"
                  type="date"
                  value={filters.signedUpFrom}
                  onChange={(e) => set("signedUpFrom", e.target.value)}
                />
              </Field>
              <Field label="Signed up to" htmlFor="bc-to">
                <Input
                  id="bc-to"
                  type="date"
                  value={filters.signedUpTo}
                  onChange={(e) => set("signedUpTo", e.target.value)}
                />
              </Field>
              <Field
                label="Inactive for"
                htmlFor="bc-inactive"
                hint="Based on lastSeen"
              >
                <Select
                  id="bc-inactive"
                  value={filters.inactivePreset}
                  onChange={(e) => set("inactivePreset", e.target.value)}
                >
                  <option value="">Any activity</option>
                  <option value="7">7+ days</option>
                  <option value="14">14+ days</option>
                  <option value="30">30+ days</option>
                  <option value="60">60+ days</option>
                  <option value="90">90+ days</option>
                  <option value="custom">Custom…</option>
                </Select>
              </Field>
              {filters.inactivePreset === "custom" ? (
                <Field label="Custom days" htmlFor="bc-inactive-custom">
                  <Input
                    id="bc-inactive-custom"
                    type="number"
                    min={1}
                    value={filters.inactiveCustom}
                    onChange={(e) => set("inactiveCustom", e.target.value)}
                    placeholder="e.g. 45"
                  />
                </Field>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
