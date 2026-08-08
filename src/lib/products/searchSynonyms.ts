/**
 * Small, config-driven search synonym expansion for free-text product search.
 * Prefer expanding abbreviations to catalog language (camera, display, battery)
 * rather than hundreds of hard-coded aliases.
 *
 * Future: move this map to site settings / admin-managed config without
 * changing call sites in listQuery.
 */

/** Single-token abbreviations → preferred catalog term */
const TOKEN_SYNONYMS: Record<string, string> = {
  cam: "camera",
  cams: "camera",
  camera: "camera",
  screen: "display",
  screens: "display",
  lcd: "display",
  oled: "display",
  amoled: "display",
  batt: "battery",
  bat: "battery",
  batteries: "battery",
  glass: "glass",
  fpc: "flex",
  flex: "flex",
  ic: "ic",
  port: "port",
  charger: "charging",
  charge: "charging",
};

/** Compact model / marketing nicknames → searchable phrases */
const MODEL_ALIASES: Record<string, string> = {
  s24u: "s24 ultra",
  "s24ultra": "s24 ultra",
  s23u: "s23 ultra",
  "s23ultra": "s23 ultra",
  i13: "iphone 13",
  i14: "iphone 14",
  i15: "iphone 15",
  i16: "iphone 16",
  "13pro": "iphone 13 pro",
  "14pro": "iphone 14 pro",
  "15pro": "iphone 15 pro",
};

/** Multi-word phrase normalizations (applied before tokenization) */
const PHRASE_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bcharge\s*port\b/gi, replacement: "charging port" },
  { pattern: /\bcharging\s*port\b/gi, replacement: "charging port" },
  { pattern: /\bback\s*glass\b/gi, replacement: "rear glass" },
  { pattern: /\brear\s*glass\b/gi, replacement: "rear glass" },
  { pattern: /\bfront\s*glass\b/gi, replacement: "front glass" },
];

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Expand a sanitized search string with synonyms / aliases.
 * Appends canonical terms so Mongo `$text` OR / Atlas text recall improves
 * without dropping the user's original tokens.
 */
export function expandSearchSynonyms(query: string): string {
  let q = query.trim();
  if (!q) return q;

  for (const { pattern, replacement } of PHRASE_REPLACEMENTS) {
    q = q.replace(pattern, replacement);
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  const extras: string[] = [];

  const expandedTokens = tokens.map((raw) => {
    const key = normalizeToken(raw);
    if (!key) return raw;

    const model = MODEL_ALIASES[key];
    if (model) {
      extras.push(model);
      return raw;
    }

    const syn = TOKEN_SYNONYMS[key];
    if (syn && syn !== key) {
      extras.push(syn);
      return syn;
    }
    return raw;
  });

  const merged = [...expandedTokens, ...extras]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of merged.split(/\s+/)) {
    const k = part.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(part);
  }

  return unique.join(" ").slice(0, 160);
}
