"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DeviceHierarchyTree from "./_components/DeviceHierarchyTree";
import ContextPanel from "./_components/ContextPanel";
import { useDeviceHierarchy } from "./_components/hooks";

export default function AdminDeviceManagementPage() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceManagementContent />
    </QueryClientProvider>
  );
}

function DeviceManagementContent() {
  const router = useRouter();
  const hierarchy = useDeviceHierarchy();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Device Management
              </h1>
              <p className="text-sm text-slate-500">
                Manage devices, brands, models, and parts categories in one
                place.
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Tip: Select any node to edit details on the right.
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <DeviceHierarchyTree
            nodes={hierarchy.nodes}
            selected={hierarchy.selected}
            expanded={hierarchy.expanded}
            search={hierarchy.search}
            onSearchChange={hierarchy.setSearch}
            newDeviceName={hierarchy.newDeviceName}
            onNewDeviceNameChange={hierarchy.setNewDeviceName}
            onAddDevice={hierarchy.addDevice}
            loading={hierarchy.loading}
            error={hierarchy.error}
            onToggleNode={hierarchy.toggleNode}
            onSelectNode={hierarchy.selectNode}
            isAddingDevice={hierarchy.isAddingDevice}
          />

          <ContextPanel
            selected={hierarchy.selected}
            selectedDevice={hierarchy.selectedDevice}
            selectedBrand={hierarchy.selectedBrand}
            selectedModel={hierarchy.selectedModel}
            selectedPartCategory={hierarchy.selectedPartCategory}
            selectedDevicePartCategories={hierarchy.selectedDevicePartCategories}
            availableGlobalCategories={hierarchy.availableGlobalCategories}
            draftName={hierarchy.draftName}
            onDraftNameChange={hierarchy.setDraftName}
            draftIcon={hierarchy.draftIcon}
            onDraftIconChange={hierarchy.setDraftIcon}
            draftActive={hierarchy.draftActive}
            onActivateDevice={hierarchy.activateDevice}
            newChildName={hierarchy.newChildName}
            onNewChildNameChange={hierarchy.setNewChildName}
            newPartCategoryName={hierarchy.newPartCategoryName}
            onNewPartCategoryNameChange={hierarchy.setNewPartCategoryName}
            newPartCategoryIcon={hierarchy.newPartCategoryIcon}
            onNewPartCategoryIconChange={hierarchy.setNewPartCategoryIcon}
            onAddChild={hierarchy.addChild}
            onAddPartCategory={hierarchy.addPartCategory}
            onAddPartCategoryFromTemplate={
              hierarchy.addPartCategoryFromTemplate
            }
            onRequestDisablePartCategory={
              hierarchy.requestDisablePartCategory
            }
            onSave={hierarchy.saveSelected}
            onRequestDisable={hierarchy.requestDisable}
            inlineError={hierarchy.inlineError}
            isSaving={hierarchy.isSaving}
            isAddingChild={hierarchy.isAddingChild}
            isAddingPartCategory={hierarchy.isAddingPartCategory}
            isDisabling={hierarchy.isDisabling}
          />
        </div>
      </div>

      {hierarchy.disableTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Disable this item?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This action will softly disable the selected item and cascade to
              its children.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={hierarchy.cancelDisable}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={hierarchy.confirmDisable}
                disabled={hierarchy.isDisabling}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
              >
                {hierarchy.isDisabling ? "Disabling..." : "Disable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {hierarchy.toasts.length > 0 && (
        <div className="fixed right-6 top-20 z-50 space-y-2">
          {hierarchy.toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg px-4 py-3 text-sm shadow-lg ${
                toast.variant === "error"
                  ? "bg-red-600 text-white"
                  : toast.variant === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-white"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
