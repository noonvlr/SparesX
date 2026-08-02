"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DeviceHierarchyTree from "./_components/DeviceHierarchyTree";
import ContextPanel from "./_components/ContextPanel";
import { useDeviceHierarchy } from "./_components/hooks";
import { AdminPage } from "@/components/layout";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";

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
    <AdminPage>
      <PageHeader
        title="Device Management"
        description="Manage devices, brands, models, and parts categories in one place."
        actions={
          <p className="text-xs text-[var(--muted)] max-w-xs">
            Tip: Select any node to edit details on the right.
          </p>
        }
      />

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

      <Modal
        open={!!hierarchy.disableTarget}
        onClose={hierarchy.cancelDisable}
        title="Disable this item?"
        sheet={false}
        footer={
          <>
            <Button variant="secondary" onClick={hierarchy.cancelDisable}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={hierarchy.confirmDisable}
              loading={hierarchy.isDisabling}
            >
              Disable
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--ink-secondary)]">
          This action will softly disable the selected item and cascade to its
          children.
        </p>
      </Modal>

      {hierarchy.toasts.length > 0 && (
        <div className="fixed right-6 top-20 z-50 space-y-2">
          {hierarchy.toasts.map((toast) => (
            <Alert
              key={toast.id}
              tone={
                toast.variant === "error"
                  ? "danger"
                  : toast.variant === "success"
                    ? "success"
                    : "neutral"
              }
            >
              {toast.message}
            </Alert>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
