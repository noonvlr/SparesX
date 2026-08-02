"use client";

import type {
  Brand,
  BrandModel,
  DeviceType,
  GlobalCategory,
  PartCategory,
  SelectedNode,
} from "./hooks";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

interface ContextPanelProps {
  selected: SelectedNode | null;
  selectedDevice: DeviceType | null;
  selectedBrand: Brand | null;
  selectedModel: BrandModel | null;
  selectedPartCategory: PartCategory | null;
  selectedDevicePartCategories: PartCategory[];
  availableGlobalCategories: GlobalCategory[];
  draftName: string;
  onDraftNameChange: (value: string) => void;
  draftIcon: string;
  onDraftIconChange: (value: string) => void;
  draftActive: boolean;
  onActivateDevice: (nextActive: boolean) => void;
  newChildName: string;
  onNewChildNameChange: (value: string) => void;
  newPartCategoryName: string;
  onNewPartCategoryNameChange: (value: string) => void;
  newPartCategoryIcon: string;
  onNewPartCategoryIconChange: (value: string) => void;
  onAddChild: () => void;
  onAddPartCategory: () => void;
  onAddPartCategoryFromTemplate: (category: GlobalCategory) => void;
  onRequestDisablePartCategory: (category: PartCategory) => void;
  onSave: () => void;
  onRequestDisable: () => void;
  inlineError: string;
  isSaving: boolean;
  isAddingChild: boolean;
  isAddingPartCategory: boolean;
  isDisabling: boolean;
}

export default function ContextPanel({
  selected,
  selectedDevice,
  selectedBrand,
  selectedModel,
  selectedPartCategory,
  selectedDevicePartCategories,
  availableGlobalCategories,
  draftName,
  onDraftNameChange,
  draftIcon,
  onDraftIconChange,
  draftActive,
  onActivateDevice,
  newChildName,
  onNewChildNameChange,
  newPartCategoryName,
  onNewPartCategoryNameChange,
  newPartCategoryIcon,
  onNewPartCategoryIconChange,
  onAddChild,
  onAddPartCategory,
  onAddPartCategoryFromTemplate,
  onRequestDisablePartCategory,
  onSave,
  onRequestDisable,
  inlineError,
  isSaving,
  isAddingChild,
  isAddingPartCategory,
  isDisabling,
}: ContextPanelProps) {
  if (!selected) {
    return (
      <Card padding="lg" className="border-dashed text-center text-sm text-[var(--muted)]">
        Select a device, brand, model, or parts category to manage.
      </Card>
    );
  }

  const showChildInput = selected.type === "device" || selected.type === "brand";
  const childLabel = selected.type === "device" ? "New brand" : "New model";
  const addButtonLabel = selected.type === "device" ? "Add Brand" : "Add Model";
  const selectedPath = (() => {
    if (selected.type === "device") {
      return selectedDevice?.name || "Device";
    }
    if (selected.type === "brand") {
      return `${selectedDevice?.name || "Device"} > ${
        selectedBrand?.name || "Brand"
      }`;
    }
    if (selected.type === "model") {
      return `${selectedDevice?.name || "Device"} > ${
        selectedBrand?.name || "Brand"
      } > ${selectedModel?.name || "Model"}`;
    }
    if (selected.type === "parts-root") {
      return `${selectedDevice?.name || "Device"} > Parts Categories`;
    }
    if (selected.type === "part-category") {
      return `${selectedDevice?.name || "Device"} > Parts Categories > ${
        selectedPartCategory?.name || "Category"
      }`;
    }
    return "";
  })();

  return (
    <Card padding="lg">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
          Context panel
        </p>
        <h2 className="text-xl font-semibold text-[var(--ink)]">
          {selected.type === "device" && "Device"}
          {selected.type === "brand" && "Brand"}
          {selected.type === "model" && "Model"}
          {selected.type === "parts-root" && "Parts Categories"}
          {selected.type === "part-category" && "Parts Category"}
        </h2>
      </header>

      {inlineError ? (
        <Alert tone="danger" className="mb-4">
          {inlineError}
        </Alert>
      ) : null}

      {selectedPath ? (
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
          <p className="text-xs uppercase text-[var(--muted)]">Selected path</p>
          <p className="mt-1 text-sm font-medium text-[var(--ink)]">
            {selectedPath}
          </p>
        </div>
      ) : null}

      {selected.type === "device" && selectedDevice ? (
        <div className="space-y-4">
          <Field label="Device name" htmlFor="draft-device-name">
            <Input
              id="draft-device-name"
              value={draftName}
              onChange={(event) => onDraftNameChange(event.target.value)}
              size="sm"
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--ink-secondary)]">Status</p>
              <p className="text-xs text-[var(--muted)]">
                {draftActive ? "Active" : "Disabled"}
              </p>
            </div>
            <label className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={draftActive}
                onChange={(event) => onActivateDevice(event.target.checked)}
              />
              <span className="h-6 w-11 rounded-full bg-[var(--surface-3)] transition peer-checked:bg-[var(--success)]"></span>
              <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-[var(--surface)] transition peer-checked:translate-x-5"></span>
            </label>
          </div>
        </div>
      ) : null}

      {selected.type === "brand" && selectedBrand ? (
        <div className="space-y-4">
          <Field label="Brand name" htmlFor="draft-brand-name">
            <Input
              id="draft-brand-name"
              value={draftName}
              onChange={(event) => onDraftNameChange(event.target.value)}
              size="sm"
            />
          </Field>

          <div className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
            <p className="text-xs uppercase text-[var(--muted)]">Parent device</p>
            <p className="mt-1 font-medium text-[var(--ink)]">
              {selectedDevice?.name || "Unknown device"}
            </p>
          </div>
        </div>
      ) : null}

      {selected.type === "model" && selectedModel ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink-secondary)]">
              Model name
            </label>
            <input
              value={draftName}
              onChange={(event) => onDraftNameChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--border-strong)] focus:outline-none"
            />
          </div>
        </div>
      ) : null}

      {selected.type === "parts-root" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
            <p className="text-xs uppercase text-[var(--muted)]">Device</p>
            <p className="mt-1 font-medium text-[var(--ink)]">
              {selectedDevice?.name || "Unknown device"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--ink-secondary)]">
              Existing categories
            </p>
            {selectedDevicePartCategories.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                No parts categories created yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm text-[var(--ink-secondary)] list-none p-0">
                {selectedDevicePartCategories.map((category) => (
                  <li
                    key={category._id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                      category.isActive !== false
                        ? "border-[var(--border)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-3)] text-sm text-[var(--ink-secondary)]">
                        {category.icon || "P"}
                      </span>
                      {category.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">
                        {category.isActive !== false ? "Active" : "Disabled"}
                      </span>
                      {category.isActive !== false ? (
                        <button
                          type="button"
                          onClick={() => onRequestDisablePartCategory(category)}
                          className="rounded-full border border-[var(--danger)]/20 px-2 py-1 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                        >
                          Disable
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {availableGlobalCategories.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-[var(--ink-secondary)]">
                Add from existing categories
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableGlobalCategories.slice(0, 8).map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => onAddPartCategoryFromTemplate(category)}
                    disabled={isAddingPartCategory}
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-60"
                  >
                    <span className="text-sm">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
              {availableGlobalCategories.length > 8 ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Showing the first 8 categories. Use the fields below to add a
                  custom category.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--ink-secondary)]">
              New parts category
            </label>
            <div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
              <input
                value={newPartCategoryName}
                onChange={(event) =>
                  onNewPartCategoryNameChange(event.target.value)
                }
                placeholder="Parts category name"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onAddPartCategory();
                  }
                }}
                className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--border-strong)] focus:outline-none"
              />
              <input
                value={newPartCategoryIcon}
                onChange={(event) =>
                  onNewPartCategoryIconChange(event.target.value)
                }
                placeholder="Icon"
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--border-strong)] focus:outline-none"
              />
              <button
                type="button"
                onClick={onAddPartCategory}
                disabled={isAddingPartCategory}
                className="rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--success)] disabled:opacity-60"
              >
                {isAddingPartCategory ? "Adding..." : "Add Parts Category"}
              </button>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Icon can be an emoji or short label.
            </p>
          </div>
        </div>
      ) : null}

      {selected.type === "part-category" && selectedPartCategory ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--ink-secondary)]">
              Parts category name
            </label>
            <input
              value={draftName}
              onChange={(event) => onDraftNameChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--border-strong)] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--ink-secondary)]">
              Icon
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={draftIcon}
                onChange={(event) => onDraftIconChange(event.target.value)}
                placeholder="Icon"
                className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--border-strong)] focus:outline-none"
              />
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-lg text-[var(--ink-secondary)]">
                {draftIcon || selectedPartCategory.icon || "P"}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Use an emoji or short label.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
            <p className="text-xs uppercase text-[var(--muted)]">Device</p>
            <p className="mt-1 font-medium text-[var(--ink)]">
              {selectedDevice?.name || "Unknown device"}
            </p>
          </div>
        </div>
      ) : null}

      {showChildInput ? (
        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium text-[var(--ink-secondary)]">
            {childLabel}
          </label>
          <div className="flex gap-2">
            <input
              value={newChildName}
              onChange={(event) => onNewChildNameChange(event.target.value)}
              placeholder={childLabel}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddChild();
                }
              }}
              className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--border-strong)] focus:outline-none"
            />
            <button
              type="button"
              onClick={onAddChild}
              disabled={isAddingChild}
              className="rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--success)] disabled:opacity-60"
            >
              {isAddingChild ? "Adding..." : addButtonLabel}
            </button>
          </div>
        </div>
      ) : null}

      {selected.type !== "parts-root" ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onSave}
            loading={isSaving}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onRequestDisable}
            loading={isDisabling}
          >
            Disable
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
