/**
 * Relevance helpers for marketplace product search.
 * Keeps free-text recall ($text / Atlas) from ranking description-only
 * or single-token OR hits above listings that match the user's intent.
 */

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True filler words only — never brand or model marketing names. */
export const SEARCH_STOPWORDS = new Set([
  "for",
  "the",
  "and",
  "with",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "at",
  "or",
  "mobile",
  "phone",
  "smartphone",
  "spare",
  "spares",
  "part",
  "parts",
]);

/** Fields that should decide whether a hit is "about" the query. */
export const PRIMARY_SEARCH_FIELDS = [
  "name",
  "brand",
  "deviceModel",
  "modelNumber",
  "partType",
] as const;

const TOKEN_SYNONYMS: Record<string, string> = {
  cam: "camera",
  cams: "camera",
  screen: "display",
  screens: "display",
  lcd: "display",
  oled: "display",
  amoled: "display",
  batt: "battery",
  bat: "battery",
  batteries: "battery",
  fpc: "flex",
  charger: "charging",
  charge: "charging",
};

const MODEL_ALIASES: Record<string, string> = {
  s24u: "s24 ultra",
  s24ultra: "s24 ultra",
  s23u: "s23 ultra",
  s23ultra: "s23 ultra",
  i13: "iphone 13",
  i14: "iphone 14",
  i15: "iphone 15",
  i16: "iphone 16",
  "13pro": "iphone 13 pro",
  "14pro": "iphone 14 pro",
  "15pro": "iphone 15 pro",
};

const PHRASE_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bcharge\s*port\b/gi, replacement: "charging port" },
  { pattern: /\bcharging\s*port\b/gi, replacement: "charging port" },
  { pattern: /\bback\s*glass\b/gi, replacement: "rear glass" },
  { pattern: /\brear\s*glass\b/gi, replacement: "rear glass" },
  { pattern: /\bfront\s*glass\b/gi, replacement: "front glass" },
];

function normalizeKey(token: string) {
  return token.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * One relevance requirement.
 * - `all`: every token must match (normal words)
 * - `anyOf`: any alternative group may match (model nicknames)
 */
export type TokenRequirement =
  | { type: "all"; tokens: string[] }
  | { type: "anyOf"; groups: string[][] };

/**
 * Canonical relevance requirements for AND gating.
 * Model nicknames accept either the compact code or the expanded phrase.
 */
export function canonicalizeSearchRequirements(raw: string): TokenRequirement[] {
  let q = (raw || "").trim();
  if (!q) return [];

  for (const { pattern, replacement } of PHRASE_REPLACEMENTS) {
    q = q.replace(pattern, replacement);
  }

  const requirements: TokenRequirement[] = [];
  const seen = new Set<string>();

  for (const rawToken of q.split(/[\s,]+/).filter(Boolean)) {
    const key = normalizeKey(rawToken);
    if (!key) continue;

    const alias = MODEL_ALIASES[key];
    if (alias) {
      const phrase = alias
        .split(/\s+/)
        .map((t) => t.toLowerCase())
        .filter((t) => t.length >= 2 && !SEARCH_STOPWORDS.has(t));
      const compact = key;
      const sig = `alias:${compact}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      requirements.push({
        type: "anyOf",
        groups: [[compact], phrase],
      });
      continue;
    }

    const syn = TOKEN_SYNONYMS[key] || rawToken.toLowerCase();
    const cleaned = syn.trim().toLowerCase();
    if (cleaned.length < 2) continue;
    if (SEARCH_STOPWORDS.has(cleaned)) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    requirements.push({ type: "all", tokens: [cleaned] });
  }

  return requirements;
}

/** Flat token list for Atlas must-clauses (compact alias form preferred). */
export function canonicalizeSearchTokens(raw: string): string[] {
  const tokens: string[] = [];
  const seen = new Set<string>();
  for (const req of canonicalizeSearchRequirements(raw)) {
    const pick =
      req.type === "all" ? req.tokens : req.groups[0] || req.groups.flat();
    for (const t of pick) {
      if (seen.has(t)) continue;
      seen.add(t);
      tokens.push(t);
    }
  }
  return tokens;
}

/** Word-aware regex; digit tokens may match inside compact model codes. */
export function tokenMatchRegex(token: string): RegExp {
  const escaped = escapeRegex(token.trim());
  if (/\d/.test(token)) {
    return new RegExp(escaped, "i");
  }
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i");
}

function primaryFieldMatch(token: string) {
  return {
    $or: PRIMARY_SEARCH_FIELDS.map((field) => ({
      [field]: { $regex: tokenMatchRegex(token).source, $options: "i" },
    })),
  };
}

function groupMatch(tokens: string[]) {
  if (tokens.length === 1) return primaryFieldMatch(tokens[0]);
  return { $and: tokens.map((token) => primaryFieldMatch(token)) };
}

/**
 * Every significant requirement must hit a primary listing field.
 * Description / tags alone cannot satisfy the gate.
 */
export function buildPrimaryTokenAndFilter(rawOrTokens: string | string[]) {
  const requirements = Array.isArray(rawOrTokens)
    ? rawOrTokens
        .filter((t) => t.length >= 2 && !SEARCH_STOPWORDS.has(t.toLowerCase()))
        .map((t): TokenRequirement => ({ type: "all", tokens: [t] }))
    : canonicalizeSearchRequirements(rawOrTokens);

  if (requirements.length === 0) return null;

  return {
    $and: requirements.map((req) => {
      if (req.type === "all") {
        return groupMatch(req.tokens);
      }
      return {
        $or: req.groups.map((group) => groupMatch(group)),
      };
    }),
  };
}

/**
 * Regex fallback when the text index is unavailable.
 * Uses the same primary-field gate so behavior stays consistent.
 */
export function buildSearchFilter(search: string) {
  const gate = buildPrimaryTokenAndFilter(search);
  if (gate) return gate;

  const escaped = escapeRegex(search.trim());
  if (!escaped) return { name: { $exists: true } };

  return {
    $or: PRIMARY_SEARCH_FIELDS.map((field) => ({
      [field]: { $regex: escaped, $options: "i" },
    })),
  };
}
