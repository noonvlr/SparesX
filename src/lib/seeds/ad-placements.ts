import type { AdDevice, AdSizeSpec } from "@/lib/models/AdPlacement";

export type AdPlacementSeed = {
  key: string;
  name: string;
  description: string;
  pageLocation: string;
  desktop: AdSizeSpec;
  mobile: AdSizeSpec | null;
  supportedDevices: AdDevice[];
  enabled: boolean;
  maxSlots: number;
  fallbackToHouseAds: boolean;
};

/**
 * Idempotent seed rows (upsert by `key`).
 * Dimensions match Phase 0 approved table in docs/ads-system.md.
 */
export const AD_PLACEMENT_SEEDS: AdPlacementSeed[] = [
  {
    key: "homepage_hero",
    name: "Homepage Hero",
    description: "Full-width band below the homepage hero CTAs.",
    pageLocation: "/ — after hero, before stats/categories",
    desktop: { width: 1200, height: 300 },
    mobile: { width: 720, height: 360 },
    supportedDevices: ["desktop", "mobile"],
    enabled: true,
    maxSlots: 1,
    fallbackToHouseAds: false,
  },
  {
    key: "homepage_secondary",
    name: "Homepage Secondary",
    description: "Mid-page band between categories and featured products.",
    pageLocation: "/ — between categories and featured",
    desktop: { width: 1200, height: 250 },
    mobile: { width: 720, height: 360 },
    supportedDevices: ["desktop", "mobile"],
    enabled: true,
    maxSlots: 1,
    fallbackToHouseAds: false,
  },
  {
    key: "parts_listing",
    name: "Parts Listing",
    description: "Listing band on product browse and parts model leaf pages.",
    pageLocation:
      "/products (below grid); /parts/[category]/[brand]/[model] (below listings)",
    desktop: { width: 1200, height: 200 },
    mobile: { width: 720, height: 240 },
    supportedDevices: ["desktop", "mobile"],
    enabled: true,
    maxSlots: 1,
    fallbackToHouseAds: false,
  },
  {
    key: "product_details",
    name: "Product Details",
    description: "Full-width band below the main product layout.",
    pageLocation: "/product/[slug] — below main grid, above similar products",
    desktop: { width: 1200, height: 250 },
    mobile: { width: 720, height: 300 },
    supportedDevices: ["desktop", "mobile"],
    enabled: true,
    maxSlots: 1,
    fallbackToHouseAds: false,
  },
  {
    key: "sidebar_ad",
    name: "Products Sidebar",
    description:
      "Desktop-only skyscraper in the products filter column (lg:w-72).",
    pageLocation: "/products — sticky filter column, below filters (lg+ only)",
    desktop: { width: 300, height: 600 },
    mobile: null,
    supportedDevices: ["desktop"],
    enabled: true,
    maxSlots: 1,
    fallbackToHouseAds: true,
  },
];
