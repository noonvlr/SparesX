"use client";

import { useEffect, useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import type { DeviceHierarchyNode, NodeType, SelectedNode } from "./hooks";

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
    device: "bg-slate-900",
    brand: "bg-blue-500",
    model: "bg-emerald-500",
    "parts-root": "bg-amber-500",
    "part-category": "bg-purple-500",
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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Hierarchy</h2>
            <p className="text-xs text-slate-500">
              Devices, brands, models, and parts categories
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-2 py-1">
              Devices {counts.devices}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1">
              Brands {counts.brands}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1">
              Models {counts.models}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1">
              Parts {counts.parts}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-900" />
            Device
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Brand
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Model
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Parts root
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Part category
          </span>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Search hierarchy
          </label>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search device, brand, model, or parts"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Showing {visibleNodes.length} item
            {visibleNodes.length === 1 ? "" : "s"}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Add new device
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={newDeviceName}
              onChange={(event) => onNewDeviceNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddDevice();
                }
              }}
              placeholder="Device name"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={onAddDevice}
              disabled={isAddingDevice}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {isAddingDevice ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
          Loading hierarchy...
        </div>
      ) : visibleNodes.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
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
                    ? "border-slate-900 bg-slate-100"
                    : "border-transparent hover:bg-slate-50"
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
                      className="mr-2 w-5 text-xs text-slate-500"
                      aria-label={item.isExpanded ? "Collapse" : "Expand"}
                    >
                      {item.isExpanded ? "-" : "+"}
                    </button>
                  ) : (
                    <span className="mr-2 w-5 text-xs text-slate-300">.</span>
                  )}
                  <div>
                    <div
                      className={`text-sm font-medium ${
                        isDisabled ? "text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {item.node.type === "part-category" && item.node.icon ? (
                        <span className="mr-2 text-sm">{item.node.icon}</span>
                      ) : null}
                      {item.node.name}
                      {item.node.type === "device" ? (
                        <span className="ml-2 text-xs text-slate-500">
                          ({countDescendants(item.node, "brand")} brands,{" "}
                          {countDescendants(item.node, "model")} models)
                        </span>
                      ) : null}
                      {item.node.type === "brand" ? (
                        <span className="ml-2 text-xs text-slate-500">
                          ({countDescendants(item.node, "model")} models)
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-400">
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
    </section>
  );
}
