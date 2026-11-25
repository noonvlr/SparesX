export type {
  ConditionAttributes,
  ConditionAttributesV1,
  ConditionField,
  ConditionGroup,
  ConditionOption,
  ConditionTemplate,
  GenerateContext,
} from "./types";

export { TEMPLATES } from "./templates";
export {
  getTemplateById,
  getTemplateForPartType,
  listTemplateIds,
  normalizePartTypeSlug,
  resolveTemplateId,
} from "./resolveTemplate";
export {
  emptyAttributes,
  generateConditionDescription,
} from "./generate";
export {
  getConflictWarnings,
  validateConditionAttributes,
  type ConditionValidationResult,
} from "./validate";
