export type PlacementSize = { width: number; height: number };

export type AdminPlacement = {
  id: string;
  key: string;
  name: string;
  description: string;
  pageLocation: string;
  desktop: PlacementSize;
  mobile: PlacementSize | null;
  desktopAspect: string;
  mobileAspect: string | null;
  supportedDevices: Array<"desktop" | "mobile">;
  enabled: boolean;
  maxSlots: number;
  fallbackToHouseAds: boolean;
  createdAt: string;
  updatedAt: string;
};
