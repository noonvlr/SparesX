import { getTemplateById } from "./resolveTemplate";
import type { ConditionAttributes, ConditionTemplate } from "./types";

export type ConditionValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  /** Sanitized attributes (unknown keys stripped) or null if fatal */
  value: ConditionAttributes | null;
};

function flattenSelected(attrs: ConditionAttributes): string[] {
  return Object.values(attrs.selections || {}).flat();
}

function collectAllowed(template: ConditionTemplate): {
  optionIds: Set<string>;
  groupIds: Set<string>;
  fieldIds: Set<string>;
  singleGroups: Set<string>;
} {
  const optionIds = new Set<string>();
  const groupIds = new Set<string>();
  const singleGroups = new Set<string>();
  for (const g of template.groups) {
    groupIds.add(g.id);
    if (g.mode === "single") singleGroups.add(g.id);
    for (const o of g.options) optionIds.add(o.id);
  }
  const fieldIds = new Set((template.fields || []).map((f) => f.id));
  return { optionIds, groupIds, fieldIds, singleGroups };
}

/**
 * Validate and sanitize condition attributes for a known template.
 * Unknown options/groups are stripped. Conflicts become warnings (or errors if strict).
 */
export function validateConditionAttributes(
  raw: unknown,
  opts?: { strictConflicts?: boolean },
): ConditionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (raw == null || raw === "") {
    return { ok: true, errors: [], warnings: [], value: null };
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      errors: ["Invalid conditionAttributes payload"],
      warnings: [],
      value: null,
    };
  }

  const obj = raw as Record<string, unknown>;
  const version = obj.version === 1 ? 1 : null;
  if (version !== 1) {
    return {
      ok: false,
      errors: ["Unsupported conditionAttributes version"],
      warnings: [],
      value: null,
    };
  }

  const templateId = String(obj.templateId || "").trim();
  const template = getTemplateById(templateId);
  if (!template) {
    return {
      ok: false,
      errors: [`Unknown condition template: ${templateId}`],
      warnings: [],
      value: null,
    };
  }

  const { optionIds, groupIds, fieldIds, singleGroups } =
    collectAllowed(template);

  const selectionsIn =
    obj.selections && typeof obj.selections === "object" && !Array.isArray(obj.selections)
      ? (obj.selections as Record<string, unknown>)
      : {};
  const fieldsIn =
    obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)
      ? (obj.fields as Record<string, unknown>)
      : {};

  const selections: Record<string, string[]> = {};
  for (const [groupId, rawIds] of Object.entries(selectionsIn)) {
    if (!groupIds.has(groupId)) continue;
    if (!Array.isArray(rawIds)) continue;
    const ids = rawIds
      .map((id) => String(id))
      .filter((id) => optionIds.has(id));
    const unique = [...new Set(ids)];
    if (singleGroups.has(groupId) && unique.length > 1) {
      selections[groupId] = [unique[0]];
      warnings.push(
        `Only one option allowed in "${groupId}"; kept "${unique[0]}".`,
      );
    } else if (unique.length) {
      selections[groupId] = unique;
    }
  }

  const fields: Record<string, string> = {};
  for (const [fieldId, rawVal] of Object.entries(fieldsIn)) {
    if (!fieldIds.has(fieldId)) continue;
    const val = String(rawVal ?? "").trim().slice(0, 500);
    if (val) fields[fieldId] = val;
  }

  const value: ConditionAttributes = {
    version: 1,
    templateId: template.id,
    selections,
    fields,
  };

  const labelById = new Map<string, string>();
  for (const g of template.groups) {
    for (const o of g.options) labelById.set(o.id, o.label);
  }

  const selected = flattenSelected(value);
  const selectedSet = new Set(selected);
  for (const [a, b] of template.conflicts || []) {
    if (selectedSet.has(a) && selectedSet.has(b)) {
      const la = labelById.get(a) || a;
      const lb = labelById.get(b) || b;
      const msg = `Conflicting selections: "${la}" and "${lb}". Please correct one of them.`;
      if (opts?.strictConflicts) errors.push(msg);
      else warnings.push(msg);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    value,
  };
}

/** Soft conflict check for live UI (warnings only). */
export function getConflictWarnings(
  attrs: ConditionAttributes | null,
): string[] {
  if (!attrs) return [];
  const result = validateConditionAttributes(attrs, { strictConflicts: false });
  return result.warnings.filter((w) => w.startsWith("Conflicting"));
}
