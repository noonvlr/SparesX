import { TEMPLATES } from "./templates";
import type { ConditionTemplate } from "./types";

/** Map Category slugs / aliases → template id */
const SLUG_TO_TEMPLATE: Record<string, string> = {
  motherboard: "motherboard",
  "logic-board": "motherboard",
  mainboard: "motherboard",
  pcb: "motherboard",
  screen: "display",
  display: "display",
  lcd: "display",
  oled: "display",
  "touch-screen": "display",
  "charging-port": "chargingBoard",
  "charging-board": "chargingBoard",
  charging: "chargingBoard",
  "usb-board": "chargingBoard",
  camera: "camera",
  "rear-camera": "camera",
  "front-camera": "camera",
  battery: "battery",
  speaker: "speaker",
  "loud-speaker": "speaker",
  earpiece: "earpiece",
  "ear-speaker": "earpiece",
  "flex-cable": "flexCable",
  flex: "flexCable",
  buttons: "buttons",
  "power-button": "buttons",
  "volume-button": "buttons",
  fingerprint: "fingerprint",
  "fingerprint-sensor": "fingerprint",
  "sub-board": "subBoard",
  subboard: "subBoard",
  "daughter-board": "subBoard",
};

export function normalizePartTypeSlug(partType: string): string {
  return String(partType || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

export function resolveTemplateId(partType: string): string {
  const slug = normalizePartTypeSlug(partType);
  if (!slug) return "generic";
  if (SLUG_TO_TEMPLATE[slug]) return SLUG_TO_TEMPLATE[slug];
  // Fuzzy contains
  if (slug.includes("motherboard") || slug.includes("logic")) return "motherboard";
  if (slug.includes("screen") || slug.includes("display") || slug.includes("lcd"))
    return "display";
  if (slug.includes("charg") || slug.includes("usb")) return "chargingBoard";
  if (slug.includes("camera")) return "camera";
  if (slug.includes("battery")) return "battery";
  if (slug.includes("earpiece") || slug.includes("ear-speaker")) return "earpiece";
  if (slug.includes("speaker")) return "speaker";
  if (slug.includes("flex")) return "flexCable";
  if (slug.includes("button") || slug.includes("volume") || slug.includes("power"))
    return "buttons";
  if (slug.includes("fingerprint") || slug.includes("sensor")) return "fingerprint";
  if (slug.includes("sub") || slug.includes("daughter")) return "subBoard";
  return "generic";
}

export function getTemplateForPartType(
  partType: string,
): ConditionTemplate | null {
  if (!partType?.trim()) return null;
  const id = resolveTemplateId(partType);
  return TEMPLATES[id] || TEMPLATES.generic;
}

export function getTemplateById(id: string): ConditionTemplate | null {
  return TEMPLATES[id] || null;
}

export function listTemplateIds(): string[] {
  return Object.keys(TEMPLATES);
}
