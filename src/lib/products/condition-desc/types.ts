/** Structured condition attributes saved on Product.conditionAttributes */

export type ConditionOption = {
  id: string;
  label: string;
};

export type ConditionField = {
  id: string;
  label: string;
  placeholder?: string;
  optional?: boolean;
};

export type ConditionGroup = {
  id: string;
  label: string;
  /** multi = checkboxes; single = radio-like (one selection) */
  mode: "multi" | "single";
  options: ConditionOption[];
  optional?: boolean;
};

export type ConditionTemplate = {
  id: string;
  label: string;
  /** Noun used in generated sentences, e.g. "motherboard", "display" */
  componentNoun: string;
  groups: ConditionGroup[];
  fields?: ConditionField[];
  /** Pairs of option ids that should not be selected together */
  conflicts?: Array<[string, string]>;
};

export type ConditionAttributesV1 = {
  version: 1;
  templateId: string;
  /** groupId → selected option ids */
  selections: Record<string, string[]>;
  /** free-text field id → value */
  fields: Record<string, string>;
};

export type ConditionAttributes = ConditionAttributesV1;

export type GenerateContext = {
  deviceCategory?: string;
  brand?: string;
  deviceModel?: string;
  partTypeLabel?: string;
  /** Listing title if already composed by the seller */
  productTitle?: string;
};
