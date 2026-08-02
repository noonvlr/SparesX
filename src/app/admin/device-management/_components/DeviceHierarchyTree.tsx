"use client";

import { useEffect, useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import type { DeviceHierarchyNode, NodeType, SelectedNode } from "./hooks";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

interface FlatNode {
  node: DeviceHierarchyNode;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
}

interface DeviceHierarchyTreeProps {
  nodes: DeviceHierarchyNode[];
  expanded: Set<string>;
  selected: SelectedNode | null;
  search: string;
  onSearchChange: (value: string) => void;
  newDeviceName: string;
  onNewDeviceNameChange: (value: string) => void;
  onAddDevice: () => void;
  loading: boolean;
  error: string;
  onToggleNode: (nodeId: string) => void;
  onSelectNode: (node: DeviceHierarchyNode) => void;
  isAddingDevice: boolean;
}

function filterTree(
  node: DeviceHierarchyNode,
  query: string,
): DeviceHierarchyNode | null {
  const matches =
    node.name.toLowerCase().includes(query) ||
    node.slug.toLowerCase().includes(query);

  const children = node.children
    ? node.children
        .map((child) => filterTree(child, query))
        .filter((child): child is DeviceHierarchyNode => Boolean(child))
    : [];

  if (matches || children.length > 0) {
    return { ...node, children };
  }

  return null;
}

function flattenTree(
  nodes: DeviceHierarchyNode[],
  expanded: Set<string>,
  depth = 0,
  result: FlatNode[] = [],
): FlatNode[] {
  nodes.forEach((node) => {
    const hasChildren = Boolean(node.children && node.children.length);
    const isExpanded = expanded.has(node.id);
    result.push({ node, depth, hasChildren, isExpanded });
    if (hasChildren && isExpanded) {
      flattenTree(node.children || [], expanded, depth + 1, result);
    }
  });
  return result;
}

function flattenAll(
  nodes: DeviceHierarchyNode[],
  depth = 0,
  result: FlatNode[] = [],
): FlatNode[] {
  nodes.forEach((node) => {
    const hasChildren = Boolean(node.children && node.children.length);
    result.push({ node, depth, hasChildren, isExpanded: true });
    if (hasChildren) {
      flattenAll(node.children || [], depth + 1, result);
    }
  });
  return result;
}

export default function DeviceHierarchyTree({
  nodes,
  expanded,
  selected,
  search,
  onSearchChange,
  newDeviceName,
  onNewDeviceNameChange,
  onAddDevice,
  loading,
  error,
  onToggleNode,
  onSelectNode,
  isAddingDevice,
}: DeviceHierarchyTreeProps) {
  const [listHeight, setListHeight] = useState(360);
  const query = search.trim().toLowerCase();
  const typeLabels: Record<NodeType, string> = {
    device: "DEVICE",
    brand: "BRAND",
    model: "MODEL",
    "parts-root": "GROUP",
    "part-category": "PART",
  };
  const typeDots: Record<NodeType, string> = {
    device: "bg-[var(--ink)]",
    brand: "bg-[var(--brand)]",
    model: "bg-[var(--success)]",
    "parts-root": "bg-[var(--warning)]",
    "part-category": "bg-[var(--info)]",
  };

  const counts = useMemo(() => {
    let devices = 0;
    let brands = 0;
    let models = 0;
    let parts = 0;

    const walk = (node: DeviceHierarchyNode) => {
      if (node.type === "device") devices += 1;
      if (node.type === "brand") brands += 1;
      if (node.type === "model") models += 1;
      if (node.type === "part-category") parts += 1;
      if (node.children) {
        node.children.forEach(walk);
      }
    };

    nodes.forEach(walk);
    return { devices, brands, models, parts };
  }, [nodes]);

  useEffect(() => {
    const updateHeight = () => {
      const height = Math.max(240, window.innerHeight - 360);
      setListHeight(height);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const visibleNodes = useMemo(() => {
    if (!query) {
      return flattenTree(nodes, expanded);
    }
    const filtered = nodes
      .map((node) => filterTree(node, query))
      .filter((node): node is DeviceHierarchyNode => Boolean(node));
    return flattenAll(filtered);
  }, [nodes, expanded, query]);

  const countDescendants = (node: DeviceHierarchyNode, type: NodeType) => {
    let count = 0;
    const walk = (current: DeviceHierarchyNode) => {
      if (current.type === type) count += 1;
      if (current.children) current.children.forEach(walk);
    };
    if (node.children) node.children.forEach(walk);
    return count;
  };

  return (
    <Card padding="md">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Hierarchy</h2>
            <p className="text-xs text-[var(--muted)]">
              Devices, brands, models, and parts categories
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-secondary)]">
            <span className="rounded-full bg-[var(--surface-3)] px-2 py-1">
              Devices {counts.devices}
            </span>
            <span className="rounded-full bg-[var(--surface-3)] px-2 py-1">
              Brands {counts.brands}
            </span>
            <span className="rounded-full bg-[var(--surface-3)] px-2 py-1">
              Models {counts.models}
            </span>
            <span className="rounded-full bg-[var(--surface-3)] px-2 py-1">
              Parts {counts.parts}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--ink)]" />
            Device
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
            Brand
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
            Model
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--warning)]" />
            Parts root
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--info)]" />
            Part category
          </span>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <Field
          label="Search hierarchy"
          htmlFor="hierarchy-search"
          hint={`Showing ${visibleNodes.length} item${visibleNodes.length === 1 ? "" : "s"}`}
        >
          <Input
            id="hierarchy-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search device, brand, model, or parts"
            size="sm"
          />
        </Field>

        <Field label="Add new device" htmlFor="new-device-name">
          <div className="flex gap-2">
            <Input
              id="new-device-name"
              value={newDeviceName}
              onChange={(event) => onNewDeviceNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddDevice();
                }
              }}
              placeholder="Device name"
              size="sm"
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onAddDevice}
              loading={isAddingDevice}
            >
              Add
            </Button>
          </div>
        </Field>
      </div>

      {error ? (
        <Alert tone="danger" className="mb-3">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-[var(--muted)]">
          <Spinner /> Loading hierarchy...
        </div>
      ) : visibleNodes.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-[var(--muted)]">
          No nodes match your search.
        </div>
      ) : (
        <List
          height={listHeight}
          itemCount={visibleNodes.length}
          itemSize={44}
          width="100%"
          itemKey={(index) => visibleNodes[index].node.id}
        >
          {({ index, style }) => {
            const item = visibleNodes[index];
            const isSelected = selected?.id === item.node.id;
            const isDisabled = item.node.isActive === false;
            return (
              <div
                style={style}
                className={`flex items-center gap-2 rounded-lg border-l-2 px-2 ${
                  isSelected
                    ? "border-[var(--ink)] bg-[var(--surface-3)]"
                    : "border-transparent hover:bg-[var(--surface-2)]"
                }`}
                onClick={() => onSelectNode(item.node)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectNode(item.node);
                  }
                }}
              >
                <div
                  className={`flex items-center ${isDisabled ? "opacity-60" : ""}`}
                  style={{ paddingLeft: 8 + item.depth * 18 }}
                >
                  <span
                    className={`mr-2 h-2 w-2 rounded-full ${
                      typeDots[item.node.type]
                    }`}
                  />
                  {item.hasChildren ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleNode(item.node.id);
                      }}
                      className="mr-2 w-5 text-xs text-[var(--muted)]"
                      aria-label={item.isExpanded ? "Collapse" : "Expand"}
                    >
                      {item.isExpanded ? "-" : "+"}
                    </button>
                  ) : (
                    <span className="mr-2 w-5 text-xs text-[var(--muted)]">.</span>
                  )}
                  <div>
                    <div
                      className={`text-sm font-medium ${
                        isDisabled ? "text-[var(--muted)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {item.node.type === "part-category" && item.node.icon ? (
                        <span className="mr-2 text-sm">{item.node.icon}</span>
                      ) : null}
                      {item.node.name}
                      {item.node.type === "device" ? (
                        <span className="ml-2 text-xs text-[var(--muted)]">
                          ({countDescendants(item.node, "brand")} brands,{" "}
                          {countDescendants(item.node, "model")} models)
                        </span>
                      ) : null}
                      {item.node.type === "brand" ? (
                        <span className="ml-2 text-xs text-[var(--muted)]">
                          ({countDescendants(item.node, "model")} models)
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {typeLabels[item.node.type] || item.node.type.toUpperCase()}
                      {isDisabled ? " - Disabled" : ""}
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        </List>
      )}
    </Card>
  );
}
