"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type NodeType =
  | "device"
  | "brand"
  | "model"
  | "parts-root"
  | "part-category";

export interface DeviceType {
  _id: string;
  name: string;
  emoji: string;
  slug: string;
  description?: string;
  isActive: boolean;
  order?: number;
}

export interface BrandModel {
  name: string;
  modelNumber?: string;
  releaseYear?: number;
  isActive?: boolean;
  slug?: string;
}

export interface Brand {
  _id: string;
  category: string;
  name: string;
  slug: string;
  logo?: string;
  models: BrandModel[];
  isActive: boolean;
}

export interface PartCategory {
  _id: string;
  deviceId: string;
  name: string;
  slug: string;
  icon?: string;
  isActive: boolean;
}

export interface GlobalCategory {
  _id: string;
  name: string;
  icon: string;
  slug: string;
  isActive: boolean;
  order?: number;
}

export interface DeviceHierarchyNode {
  id: string;
  type: NodeType;
  name: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  parentId?: string;
  deviceId?: string;
  brandId?: string;
  modelIndex?: number;
  children?: DeviceHierarchyNode[];
}

export type SelectedNode =
  | { type: "device"; id: string }
  | { type: "brand"; id: string }
  | { type: "model"; id: string; brandId: string; modelIndex: number }
  | { type: "parts-root"; id: string; deviceId: string }
  | { type: "part-category"; id: string; deviceId: string };

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

const DEVICE_QUERY_KEY = ["device-types"];
const BRAND_QUERY_KEY = ["device-brands"];
const PART_CATEGORY_QUERY_KEY = ["part-categories"];
const GLOBAL_CATEGORY_QUERY_KEY = ["global-categories"];

const EMOJI_DEVICE = "\uD83D\uDCE6";
const EMOJI_PHONE = "\uD83D\uDCF1";
const EMOJI_LAPTOP = "\uD83D\uDCBB";
const EMOJI_DESKTOP = "\uD83D\uDDA5";
const EMOJI_TV = "\uD83D\uDCFA";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalize = (value: string) => value.trim().toLowerCase();

const buildUniqueSlug = (name: string, existing: Set<string>) => {
  const base = slugify(name) || "item";
  let candidate = base;
  let counter = 2;
  while (existing.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
};

const guessEmoji = (value: string) => {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("mobile") ||
    normalized.includes("phone") ||
    normalized.includes("tablet")
  ) {
    return EMOJI_PHONE;
  }
  if (normalized.includes("laptop") || normalized.includes("notebook")) {
    return EMOJI_LAPTOP;
  }
  if (normalized.includes("desktop") || normalized.includes("pc")) {
    return EMOJI_DESKTOP;
  }
  if (normalized.includes("tv") || normalized.includes("television")) {
    return EMOJI_TV;
  }
  return EMOJI_DEVICE;
};

async function fetchDeviceTypes() {
  const response = await fetch("/api/admin/device-types", {
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch device types");
  }
  return (data.deviceTypes || []) as DeviceType[];
}

async function fetchBrands() {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/admin/device-categories", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch brands");
  }
  return (data.brands || []) as Brand[];
}

async function fetchPartCategories() {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/device-management/part-categories", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch part categories");
  }
  return ((data.categories || []) as PartCategory[]).map((category) => ({
    ...category,
    deviceId: String(category.deviceId),
  }));
}

async function fetchGlobalCategories() {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/admin/categories", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch categories");
  }
  return (data.categories || []) as GlobalCategory[];
}

async function requestJson<T>(
  url: string,
  options: RequestInit,
  errorMessage: string,
): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || errorMessage);
  }
  return data as T;
}

export function useDeviceHierarchy() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftActive, setDraftActive] = useState(true);
  const [draftIcon, setDraftIcon] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [newPartCategoryName, setNewPartCategoryName] = useState("");
  const [newPartCategoryIcon, setNewPartCategoryIcon] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [disableTarget, setDisableTarget] = useState<SelectedNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isAddingPartCategory, setIsAddingPartCategory] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const deviceQuery = useQuery({
    queryKey: DEVICE_QUERY_KEY,
    queryFn: fetchDeviceTypes,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
  });

  const brandQuery = useQuery({
    queryKey: BRAND_QUERY_KEY,
    queryFn: fetchBrands,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
  });

  const partCategoryQuery = useQuery({
    queryKey: PART_CATEGORY_QUERY_KEY,
    queryFn: fetchPartCategories,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
  });

  const globalCategoryQuery = useQuery({
    queryKey: GLOBAL_CATEGORY_QUERY_KEY,
    queryFn: fetchGlobalCategories,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
  });

  const deviceTypes = deviceQuery.data || [];
  const brands = brandQuery.data || [];
  const partCategories = partCategoryQuery.data || [];
  const globalCategories = globalCategoryQuery.data || [];

  const nodes = useMemo(() => {
    const brandsByCategory = new Map<string, Brand[]>();
    const partCategoriesByDevice = new Map<string, PartCategory[]>();

    brands.forEach((brand) => {
      const list = brandsByCategory.get(brand.category) || [];
      list.push(brand);
      brandsByCategory.set(brand.category, list);
    });

    partCategories.forEach((category) => {
      const list = partCategoriesByDevice.get(category.deviceId) || [];
      list.push(category);
      partCategoriesByDevice.set(category.deviceId, list);
    });

    const sortedDevices = [...deviceTypes].sort((a, b) => {
      const orderDiff = (a.order || 0) - (b.order || 0);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });

    return sortedDevices.map<DeviceHierarchyNode>((device) => {
      const categoryBrands = brandsByCategory.get(device.slug) || [];
      const sortedBrands = [...categoryBrands].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      const devicePartCategories =
        partCategoriesByDevice.get(device._id) || [];
      const sortedPartCategories = [...devicePartCategories].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      const brandNodes = sortedBrands.map<DeviceHierarchyNode>((brand) => {
        const modelNodes = (brand.models || []).map<DeviceHierarchyNode>(
          (model, index) => ({
            id: `model:${brand._id}:${index}`,
            type: "model",
            name: model.name,
            slug: model.slug || slugify(model.name),
            isActive: model.isActive !== false,
            parentId: brand._id,
            deviceId: device._id,
            brandId: brand._id,
            modelIndex: index,
          }),
        );

        return {
          id: brand._id,
          type: "brand",
          name: brand.name,
          slug: brand.slug,
          isActive: brand.isActive !== false,
          parentId: device._id,
          deviceId: device._id,
          brandId: brand._id,
          children: modelNodes,
        };
      });

      const partsRootId = `parts:${device._id}`;
      const partNodes = sortedPartCategories.map<DeviceHierarchyNode>(
        (category) => ({
          id: category._id,
          type: "part-category",
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          isActive: category.isActive !== false,
          parentId: partsRootId,
          deviceId: device._id,
        }),
      );

      const partsRootNode: DeviceHierarchyNode = {
        id: partsRootId,
        type: "parts-root",
        name: `Parts Categories (${sortedPartCategories.length})`,
        slug: "parts-categories",
        isActive: device.isActive !== false,
        parentId: device._id,
        deviceId: device._id,
        children: partNodes,
      };

      return {
        id: device._id,
        type: "device",
        name: device.name,
        slug: device.slug,
        isActive: device.isActive !== false,
        deviceId: device._id,
        children: [...brandNodes, partsRootNode],
      };
    });
  }, [deviceTypes, brands, partCategories]);

  const selectedBrand = useMemo(() => {
    if (!selected) return null;
    if (selected.type === "brand") {
      return brands.find((brand) => brand._id === selected.id) || null;
    }
    if (selected.type === "model") {
      return brands.find((brand) => brand._id === selected.brandId) || null;
    }
    return null;
  }, [selected, brands]);

  const selectedDevice = useMemo(() => {
    if (!selected) return null;
    if (selected.type === "device") {
      return deviceTypes.find((device) => device._id === selected.id) || null;
    }
    if (selected.type === "parts-root" || selected.type === "part-category") {
      return (
        deviceTypes.find((device) => device._id === selected.deviceId) || null
      );
    }
    if (selectedBrand) {
      return (
        deviceTypes.find((device) => device.slug === selectedBrand.category) ||
        null
      );
    }
    return null;
  }, [selected, selectedBrand, deviceTypes]);

  const selectedModel = useMemo(() => {
    if (!selected || selected.type !== "model") return null;
    if (!selectedBrand) return null;
    return selectedBrand.models[selected.modelIndex] || null;
  }, [selected, selectedBrand]);

  const selectedPartCategory = useMemo(() => {
    if (!selected || selected.type !== "part-category") return null;
    return partCategories.find((category) => category._id === selected.id) || null;
  }, [selected, partCategories]);

  const selectedDevicePartCategories = useMemo(() => {
    if (!selectedDevice) return [];
    return partCategories
      .filter((category) => category.deviceId === selectedDevice._id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [partCategories, selectedDevice]);

  const availableGlobalCategories = useMemo(() => {
    if (!selectedDevice) return [];
    const existingNames = new Set(
      selectedDevicePartCategories.map((category) => normalize(category.name)),
    );
    const uniqueByName = new Map<string, GlobalCategory>();
    globalCategories.forEach((category) => {
      if (category.isActive === false) return;
      const key = normalize(category.name);
      if (existingNames.has(key)) return;
      if (!uniqueByName.has(key)) {
        uniqueByName.set(key, category);
      }
    });

    return Array.from(uniqueByName.values()).sort(
      (a, b) => (a.order || 0) - (b.order || 0),
    );
  }, [globalCategories, selectedDevice, selectedDevicePartCategories]);

  useEffect(() => {
    if (deviceTypes.length && expanded.size === 0) {
      const next = new Set<string>();
      deviceTypes.forEach((device) => {
        next.add(device._id);
        next.add(`parts:${device._id}`);
      });
      setExpanded(next);
    }
  }, [deviceTypes, expanded.size]);

  useEffect(() => {
    if (!selected) {
      setDraftName("");
      setDraftActive(true);
      setDraftIcon("");
      setNewChildName("");
      setNewPartCategoryName("");
      setNewPartCategoryIcon("");
      return;
    }

    if (selected.type === "device" && selectedDevice) {
      setDraftName(selectedDevice.name);
      setDraftActive(selectedDevice.isActive !== false);
      setDraftIcon("");
      setNewChildName("");
      setNewPartCategoryName("");
      setNewPartCategoryIcon("");
      return;
    }

    if (selected.type === "brand" && selectedBrand) {
      setDraftName(selectedBrand.name);
      setDraftIcon("");
      setNewChildName("");
      setNewPartCategoryName("");
      setNewPartCategoryIcon("");
      return;
    }

    if (selected.type === "model" && selectedModel) {
      setDraftName(selectedModel.name);
      setDraftIcon("");
      setNewChildName("");
      setNewPartCategoryName("");
      setNewPartCategoryIcon("");
      return;
    }

    if (selected.type === "parts-root") {
      setDraftName("");
      setDraftIcon("");
      setNewChildName("");
      setNewPartCategoryName("");
      setNewPartCategoryIcon("");
      return;
    }

    if (selected.type === "part-category" && selectedPartCategory) {
      setDraftName(selectedPartCategory.name);
      setDraftIcon(selectedPartCategory.icon || "");
      setNewChildName("");
      setNewPartCategoryName("");
      setNewPartCategoryIcon("");
    }
  }, [
    selected,
    selectedDevice,
    selectedBrand,
    selectedModel,
    selectedPartCategory,
  ]);

  useEffect(() => {
    if (!selected) return;
    if (
      deviceQuery.isFetching ||
      brandQuery.isFetching ||
      partCategoryQuery.isFetching
    )
      return;

    if (selected.type === "device") {
      const exists = deviceTypes.some((device) => device._id === selected.id);
      if (!exists) setSelected(null);
      return;
    }

    if (selected.type === "brand") {
      const exists = brands.some((brand) => brand._id === selected.id);
      if (!exists) setSelected(null);
      return;
    }

    if (selected.type === "model") {
      const brand = brands.find((b) => b._id === selected.brandId);
      if (!brand || !brand.models[selected.modelIndex]) {
        setSelected(null);
      }
    }
    if (selected.type === "parts-root") {
      const exists = deviceTypes.some((device) => device._id === selected.deviceId);
      if (!exists) setSelected(null);
    }

    if (selected.type === "part-category") {
      const exists = partCategories.some(
        (category) => category._id === selected.id,
      );
      if (!exists) setSelected(null);
    }
  }, [
    selected,
    brands,
    deviceTypes,
    partCategories,
    deviceQuery.isFetching,
    brandQuery.isFetching,
    partCategoryQuery.isFetching,
  ]);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const ensureAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: DEVICE_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: BRAND_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: PART_CATEGORY_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const toggleNode = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectNode = useCallback((node: DeviceHierarchyNode) => {
    if (node.type === "model" && node.brandId != null && node.modelIndex != null) {
      setSelected({
        type: "model",
        id: node.id,
        brandId: node.brandId,
        modelIndex: node.modelIndex,
      });
    } else if (node.type === "brand") {
      setSelected({ type: "brand", id: node.id });
    } else if (node.type === "parts-root") {
      setSelected({
        type: "parts-root",
        id: node.id,
        deviceId: node.deviceId || "",
      });
    } else if (node.type === "part-category") {
      setSelected({
        type: "part-category",
        id: node.id,
        deviceId: node.deviceId || "",
      });
    } else {
      setSelected({ type: "device", id: node.id });
    }

    if (node.parentId || node.deviceId || node.type === "parts-root") {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (node.parentId) {
          next.add(node.parentId);
        }
        if (node.deviceId) {
          next.add(node.deviceId);
        }
        if (node.type === "parts-root") {
          next.add(node.id);
        }
        return next;
      });
    }

    setInlineError("");
  }, []);

  const addDevice = useCallback(async () => {
    setInlineError("");
    const name = newDeviceName.trim();
    if (!name) {
      setInlineError("Device name is required.");
      return;
    }

    const nameKey = normalize(name);
    if (deviceTypes.some((device) => normalize(device.name) === nameKey)) {
      setInlineError("Device name already exists.");
      return;
    }

    const existingSlugs = new Set(
      deviceTypes.map((device) => device.slug.toLowerCase()),
    );
    const slug = buildUniqueSlug(name, existingSlugs);
    const emoji = guessEmoji(name);
    const order =
      deviceTypes.length > 0
        ? Math.max(...deviceTypes.map((device) => device.order || 0)) + 1
        : 0;

    setIsAddingDevice(true);
    try {
      const data = await requestJson<{ deviceType: DeviceType }>(
        "/api/admin/device-types",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...ensureAuthHeaders(),
          },
          body: JSON.stringify({
            name,
            slug,
            emoji,
            description: "",
            isActive: true,
            order,
          }),
        },
        "Failed to create device type",
      );

      setNewDeviceName("");
      await refreshData();
      setSelected({ type: "device", id: data.deviceType._id });
      setExpanded((prev) => new Set(prev).add(data.deviceType._id));
      addToast("Device created successfully.", "success");
    } catch (error: any) {
      setInlineError(error.message || "Failed to create device.");
      addToast("Failed to create device.", "error");
    } finally {
      setIsAddingDevice(false);
    }
  }, [newDeviceName, deviceTypes, refreshData, addToast]);

  const addChild = useCallback(async () => {
    if (!selected) {
      setInlineError("Select a device or brand first.");
      return;
    }

    const name = newChildName.trim();
    if (!name) {
      setInlineError("Name is required.");
      return;
    }

    setInlineError("");
    setIsAddingChild(true);

    try {
      if (selected.type === "device") {
        const device = deviceTypes.find((item) => item._id === selected.id);
        if (!device) throw new Error("Selected device not found.");

        const existingBrands = brands.filter(
          (brand) => brand.category === device.slug,
        );
        if (
          existingBrands.some((brand) => normalize(brand.name) === normalize(name))
        ) {
          throw new Error("Brand name already exists for this device.");
        }

        const existingSlugs = new Set(
          existingBrands.map((brand) => brand.slug.toLowerCase()),
        );
        const slug = buildUniqueSlug(name, existingSlugs);

        const data = await requestJson<{ brand: Brand }>(
          "/api/admin/device-categories",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify({
              category: device.slug,
              name,
              slug,
              models: [],
              isActive: true,
            }),
          },
          "Failed to create brand",
        );

        setNewChildName("");
        await refreshData();
        setSelected({ type: "brand", id: data.brand._id });
        setExpanded((prev) => new Set(prev).add(device._id));
        addToast("Brand created successfully.", "success");
        return;
      }

      if (selected.type === "brand") {
        const brand = brands.find((item) => item._id === selected.id);
        if (!brand) throw new Error("Selected brand not found.");

        if (
          brand.models.some((model) => normalize(model.name) === normalize(name))
        ) {
          throw new Error("Model name already exists for this brand.");
        }

        const existingSlugs = new Set(
          brand.models.map((model) =>
            (model.slug || slugify(model.name)).toLowerCase(),
          ),
        );
        const slug = buildUniqueSlug(name, existingSlugs);

        const updatedModels = [
          ...brand.models,
          {
            name,
            slug,
            isActive: true,
          },
        ];

        await requestJson(
          `/api/admin/device-categories/${brand._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify({
              category: brand.category,
              name: brand.name,
              slug: brand.slug,
              logo: brand.logo || "",
              models: updatedModels,
              isActive: brand.isActive !== false,
            }),
          },
          "Failed to add model",
        );

        setNewChildName("");
        await refreshData();
        addToast("Model added successfully.", "success");
        return;
      }

      throw new Error("Select a device or brand to add a child.");
    } catch (error: any) {
      setInlineError(error.message || "Failed to add item.");
      addToast("Failed to add item.", "error");
    } finally {
      setIsAddingChild(false);
    }
  }, [selected, newChildName, deviceTypes, brands, refreshData, addToast]);

  const createPartCategory = useCallback(
    async (payload: { name: string; icon?: string }) => {
      const device = selectedDevice;
      if (!device) {
        setInlineError("Select a device first.");
        return null;
      }

      const name = payload.name.trim();
      if (!name) {
        setInlineError("Parts category name is required.");
        return null;
      }

      const existingForDevice = partCategories.filter(
        (category) => category.deviceId === device._id,
      );
      if (
        existingForDevice.some(
          (category) => normalize(category.name) === normalize(name),
        )
      ) {
        setInlineError("Parts category already exists for this device.");
        return null;
      }

      const body: Record<string, any> = {
        deviceId: device._id,
        name,
      };
      if (payload.icon && payload.icon.trim()) {
        body.icon = payload.icon.trim();
      }

      const data = await requestJson<{ category: PartCategory }>(
        "/api/device-management/part-categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...ensureAuthHeaders(),
          },
          body: JSON.stringify(body),
        },
        "Failed to create parts category",
      );

      return data.category;
    },
    [selectedDevice, partCategories],
  );

  const addPartCategory = useCallback(async () => {
    if (!selected || selected.type !== "parts-root") {
      setInlineError("Select Parts Categories for a device first.");
      return;
    }

    const device = deviceTypes.find((item) => item._id === selected.deviceId);
    if (!device) {
      setInlineError("Selected device not found.");
      return;
    }

    setInlineError("");
    setIsAddingPartCategory(true);

    try {
      const created = await createPartCategory({
        name: newPartCategoryName,
        icon: newPartCategoryIcon,
      });
      if (!created) return;

      setNewPartCategoryName("");
      setNewPartCategoryIcon("");
      await refreshData();
      setSelected({
        type: "part-category",
        id: created._id,
        deviceId: device._id,
      });
      setExpanded((prev) => new Set(prev).add(`parts:${device._id}`));
      addToast("Parts category created successfully.", "success");
    } catch (error: any) {
      setInlineError(error.message || "Failed to create parts category.");
      addToast("Failed to create parts category.", "error");
    } finally {
      setIsAddingPartCategory(false);
    }
  }, [
    selected,
    newPartCategoryName,
    newPartCategoryIcon,
    deviceTypes,
    createPartCategory,
    refreshData,
    addToast,
  ]);

  const addPartCategoryFromTemplate = useCallback(
    async (template: GlobalCategory) => {
      if (!selected || selected.type !== "parts-root") {
        setInlineError("Select Parts Categories for a device first.");
        return;
      }

      const device = deviceTypes.find((item) => item._id === selected.deviceId);
      if (!device) {
        setInlineError("Selected device not found.");
        return;
      }

      setInlineError("");
      setIsAddingPartCategory(true);

      try {
        const created = await createPartCategory({
          name: template.name,
          icon: template.icon,
        });
        if (!created) return;

        await refreshData();
        setSelected({
          type: "part-category",
          id: created._id,
          deviceId: device._id,
        });
        setExpanded((prev) => new Set(prev).add(`parts:${device._id}`));
        addToast("Parts category added from template.", "success");
      } catch (error: any) {
        setInlineError(error.message || "Failed to add parts category.");
        addToast("Failed to add parts category.", "error");
      } finally {
        setIsAddingPartCategory(false);
      }
    },
    [selected, deviceTypes, createPartCategory, refreshData, addToast],
  );

  const saveSelected = useCallback(async () => {
    if (!selected) {
      setInlineError("Select an item to save.");
      return;
    }

    if (selected.type === "parts-root") {
      setInlineError("Select a parts category to save.");
      return;
    }

    const name = draftName.trim();
    if (!name) {
      setInlineError("Name is required.");
      return;
    }

    setInlineError("");
    setIsSaving(true);

    try {
      if (selected.type === "device") {
        const device = deviceTypes.find((item) => item._id === selected.id);
        if (!device) throw new Error("Selected device not found.");

        if (
          deviceTypes.some(
            (item) =>
              item._id !== device._id &&
              normalize(item.name) === normalize(name),
          )
        ) {
          throw new Error("Device name already exists.");
        }

        if (device.isActive !== false && !draftActive) {
          setIsSaving(false);
          setDisableTarget(selected);
          return;
        }

        const payload = {
          name,
          emoji: device.emoji || guessEmoji(name),
          slug: device.slug || slugify(name),
          description: device.description || "",
          isActive: draftActive,
          order: device.order || 0,
        };

        await requestJson(
          `/api/admin/device-types/${device._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify(payload),
          },
          "Failed to update device",
        );

        await refreshData();
        addToast("Device updated successfully.", "success");
        return;
      }

      if (selected.type === "brand") {
        const brand = brands.find((item) => item._id === selected.id);
        if (!brand) throw new Error("Selected brand not found.");

        const peers = brands.filter((item) => item.category === brand.category);
        if (
          peers.some(
            (item) =>
              item._id !== brand._id &&
              normalize(item.name) === normalize(name),
          )
        ) {
          throw new Error("Brand name already exists for this device.");
        }

        await requestJson(
          `/api/admin/device-categories/${brand._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify({
              category: brand.category,
              name,
              slug: brand.slug,
              logo: brand.logo || "",
              models: brand.models || [],
              isActive: brand.isActive !== false,
            }),
          },
          "Failed to update brand",
        );

        await refreshData();
        addToast("Brand updated successfully.", "success");
        return;
      }

      if (selected.type === "model") {
        const brand = brands.find((item) => item._id === selected.brandId);
        if (!brand) throw new Error("Selected brand not found.");

        if (!brand.models[selected.modelIndex]) {
          throw new Error("Selected model not found.");
        }

        if (
          brand.models.some(
            (model, index) =>
              index !== selected.modelIndex &&
              normalize(model.name) === normalize(name),
          )
        ) {
          throw new Error("Model name already exists for this brand.");
        }

        const existingSlugs = new Set(
          brand.models
            .filter((_, index) => index !== selected.modelIndex)
            .map((model) => (model.slug || slugify(model.name)).toLowerCase()),
        );
        const slug = buildUniqueSlug(name, existingSlugs);

        const updatedModels = brand.models.map((model, index) => {
          if (index !== selected.modelIndex) return model;
          return {
            ...model,
            name,
            slug,
          };
        });

        await requestJson(
          `/api/admin/device-categories/${brand._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify({
              category: brand.category,
              name: brand.name,
              slug: brand.slug,
              logo: brand.logo || "",
              models: updatedModels,
              isActive: brand.isActive !== false,
            }),
          },
          "Failed to update model",
        );

        await refreshData();
        addToast("Model updated successfully.", "success");
        return;
      }

      if (selected.type === "part-category") {
        const category = partCategories.find(
          (item) => item._id === selected.id,
        );
        if (!category) throw new Error("Selected parts category not found.");

        const peers = partCategories.filter(
          (item) => item.deviceId === category.deviceId,
        );
        if (
          peers.some(
            (item) =>
              item._id !== category._id &&
              normalize(item.name) === normalize(name),
          )
        ) {
          throw new Error("Parts category already exists for this device.");
        }

        const existingSlugs = new Set(
          peers
            .filter((item) => item._id !== category._id)
            .map((item) => item.slug.toLowerCase()),
        );
        const slug = buildUniqueSlug(name, existingSlugs);

        const body: Record<string, any> = {
          name,
        };
        if (draftIcon.trim()) {
          body.icon = draftIcon.trim();
        }

        await requestJson(
          `/api/device-management/part-categories/${category._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify(body),
          },
          "Failed to update parts category",
        );

        await refreshData();
        addToast("Parts category updated successfully.", "success");
      }
    } catch (error: any) {
      setInlineError(error.message || "Failed to save changes.");
      addToast("Failed to save changes.", "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    selected,
    draftName,
    draftActive,
    draftIcon,
    deviceTypes,
    brands,
    partCategories,
    refreshData,
    addToast,
  ]);

  const requestDisable = useCallback(() => {
    if (!selected) {
      setInlineError("Select an item to disable.");
      return;
    }
    if (selected.type === "parts-root") {
      setInlineError("Select a parts category to disable.");
      return;
    }
    setDisableTarget(selected);
  }, [selected]);

  const requestDisablePartCategory = useCallback(
    (category: PartCategory) => {
      if (!category) return;
      setSelected({
        type: "part-category",
        id: category._id,
        deviceId: category.deviceId,
      });
      setDisableTarget({
        type: "part-category",
        id: category._id,
        deviceId: category.deviceId,
      });
    },
    [],
  );

  const cancelDisable = useCallback(() => {
    setDisableTarget(null);
    if (selectedDevice) {
      setDraftActive(selectedDevice.isActive !== false);
    }
  }, [selectedDevice]);

  const confirmDisable = useCallback(async () => {
    if (!disableTarget) return;
    setInlineError("");
    setIsDisabling(true);

    try {
      if (disableTarget.type === "device") {
        const device = deviceTypes.find(
          (item) => item._id === disableTarget.id,
        );
        if (!device) throw new Error("Selected device not found.");

        await requestJson(
          `/api/admin/device-types/${device._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify({
              name: device.name,
              emoji: device.emoji || guessEmoji(device.name),
              slug: device.slug,
              description: device.description || "",
              isActive: false,
              order: device.order || 0,
            }),
          },
          "Failed to disable device",
        );

        const relatedBrands = brands.filter(
          (brand) => brand.category === device.slug,
        );

        await Promise.all(
          relatedBrands.map((brand) =>
            requestJson(
              `/api/admin/device-categories/${brand._id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...ensureAuthHeaders(),
                },
                body: JSON.stringify({
                  category: brand.category,
                  name: brand.name,
                  slug: brand.slug,
                  logo: brand.logo || "",
                  models: (brand.models || []).map((model) => ({
                    ...model,
                    isActive: false,
                  })),
                  isActive: false,
                }),
              },
              "Failed to disable brand",
            ),
          ),
        );

        const relatedPartCategories = partCategories.filter(
          (category) => category.deviceId === device._id,
        );

        await Promise.all(
          relatedPartCategories.map((category) =>
            requestJson(
              `/api/device-management/part-categories/${category._id}/disable`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  ...ensureAuthHeaders(),
                },
              },
              "Failed to disable parts category",
            ),
          ),
        );

        addToast(
          "Device disabled. Brands, models, and parts categories were disabled.",
          "success",
        );
      } else if (disableTarget.type === "brand") {
        const brand = brands.find((item) => item._id === disableTarget.id);
        if (!brand) throw new Error("Selected brand not found.");

        await requestJson(
          `/api/admin/device-categories/${brand._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify({
              category: brand.category,
              name: brand.name,
              slug: brand.slug,
              logo: brand.logo || "",
              models: (brand.models || []).map((model) => ({
                ...model,
                isActive: false,
              })),
              isActive: false,
            }),
          },
          "Failed to disable brand",
        );

        addToast("Brand disabled. Models were disabled.", "success");
      } else if (disableTarget.type === "model") {
        const brand = brands.find((item) => item._id === disableTarget.brandId);
        if (!brand) throw new Error("Selected brand not found.");

        const updatedModels = brand.models.map((model, index) => {
          if (index !== disableTarget.modelIndex) return model;
          return { ...model, isActive: false };
        });

        await requestJson(
          `/api/admin/device-categories/${brand._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
            body: JSON.stringify({
              category: brand.category,
              name: brand.name,
              slug: brand.slug,
              logo: brand.logo || "",
              models: updatedModels,
              isActive: brand.isActive !== false,
            }),
          },
          "Failed to disable model",
        );

        addToast("Model disabled.", "success");
      } else if (disableTarget.type === "part-category") {
        await requestJson(
          `/api/device-management/part-categories/${disableTarget.id}/disable`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...ensureAuthHeaders(),
            },
          },
          "Failed to disable parts category",
        );

        addToast("Parts category disabled.", "success");
      }

      await refreshData();
    } catch (error: any) {
      setInlineError(error.message || "Failed to disable item.");
      addToast("Failed to disable item.", "error");
    } finally {
      setIsDisabling(false);
      setDisableTarget(null);
    }
  }, [disableTarget, deviceTypes, brands, partCategories, refreshData, addToast]);

  const activateDevice = useCallback(
    (nextActive: boolean) => {
      if (!selectedDevice) return;
      if (!nextActive && selectedDevice.isActive !== false) {
        setDisableTarget({ type: "device", id: selectedDevice._id });
        return;
      }
      setDraftActive(nextActive);
    },
    [selectedDevice],
  );

  return {
    nodes,
    selected,
    selectedDevice,
    selectedBrand,
    selectedModel,
    selectedPartCategory,
    selectedDevicePartCategories,
    availableGlobalCategories,
    search,
    setSearch,
    expanded,
    toggleNode,
    selectNode,
    newDeviceName,
    setNewDeviceName,
    newChildName,
    setNewChildName,
    newPartCategoryName,
    setNewPartCategoryName,
    newPartCategoryIcon,
    setNewPartCategoryIcon,
    draftName,
    setDraftName,
    draftIcon,
    setDraftIcon,
    draftActive,
    activateDevice,
    addDevice,
    addChild,
    addPartCategory,
    addPartCategoryFromTemplate,
    saveSelected,
    requestDisable,
    requestDisablePartCategory,
    cancelDisable,
    confirmDisable,
    disableTarget,
    inlineError,
    toasts,
    loading:
      deviceQuery.isLoading ||
      brandQuery.isLoading ||
      partCategoryQuery.isLoading ||
      globalCategoryQuery.isLoading,
    error:
      (deviceQuery.error as Error | null)?.message ||
      (brandQuery.error as Error | null)?.message ||
      (partCategoryQuery.error as Error | null)?.message ||
      (globalCategoryQuery.error as Error | null)?.message ||
      "",
    isSaving,
    isAddingDevice,
    isAddingChild,
    isAddingPartCategory,
    isDisabling,
  };
}
