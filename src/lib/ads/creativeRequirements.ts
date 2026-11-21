import type { IAdCreative } from "@/lib/models/AdCampaign";
import type { IAdPlacement } from "@/lib/models/AdPlacement";
import { checkCreativeDimensions } from "@/lib/ads/dimensions";

export function placementNeedsMobile(
  placement: Pick<IAdPlacement, "mobile" | "supportedDevices">,
): boolean {
  return (
    Boolean(placement.mobile) &&
    placement.supportedDevices.includes("mobile")
  );
}

/** True when every selected placement has all required creatives + alt text. */
export function hasAllRequiredCreatives(params: {
  placementKeys: string[];
  creatives: IAdCreative[];
  placementsByKey: Map<
    string,
    Pick<IAdPlacement, "key" | "mobile" | "supportedDevices" | "name">
  >;
}): boolean {
  for (const key of params.placementKeys) {
    const placement = params.placementsByKey.get(key);
    if (!placement) return false;
    const desktop = params.creatives.find(
      (c) => c.placementKey === key && c.device === "desktop",
    );
    if (!desktop || !desktop.altText?.trim() || !desktop.url) return false;
    if (placementNeedsMobile(placement)) {
      const mobile = params.creatives.find(
        (c) => c.placementKey === key && c.device === "mobile",
      );
      if (!mobile || !mobile.altText?.trim() || !mobile.url) return false;
    }
  }
  return params.placementKeys.length > 0;
}

export function creativeNeedsUpdate(
  creative: Pick<IAdCreative, "width" | "height" | "device" | "placementKey">,
  placement: Pick<IAdPlacement, "desktop" | "mobile" | "name"> | undefined,
): boolean {
  if (!placement) return true;
  const required =
    creative.device === "mobile" ? placement.mobile : placement.desktop;
  if (!required) return true;
  const check = checkCreativeDimensions(
    { width: creative.width, height: creative.height },
    required,
    `${creative.device} image for ${placement.name}`,
  );
  return !check.ok;
}

export function annotateCreativesNeedsUpdate(
  creatives: IAdCreative[],
  placementsByKey: Map<
    string,
    Pick<IAdPlacement, "desktop" | "mobile" | "name" | "key">
  >,
): Array<IAdCreative & { needsUpdate: boolean }> {
  return creatives.map((c) => ({
    ...c,
    needsUpdate: creativeNeedsUpdate(c, placementsByKey.get(c.placementKey)),
  }));
}
