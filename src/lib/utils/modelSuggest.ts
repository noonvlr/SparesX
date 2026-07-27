export interface SuggestableModel {
  name: string;
  modelNumber?: string;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = temp;
    }
  }
  return prev[b.length];
}

function similarity(a: string, b: string) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) {
    const shorter = Math.min(left.length, right.length);
    const longer = Math.max(left.length, right.length);
    return shorter / longer;
  }
  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

/** Rank existing models that look like a misspelling / close match of the typed value. */
export function getModelSuggestions(
  query: string,
  models: SuggestableModel[],
  limit = 5,
): SuggestableModel[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const scored = models
    .map((model) => {
      const byName = similarity(q, model.name);
      const byNumber = model.modelNumber
        ? similarity(q, model.modelNumber)
        : 0;
      return { model, score: Math.max(byName, byNumber) };
    })
    .filter(({ score, model }) => {
      const exact =
        normalize(model.name) === normalize(q) ||
        (model.modelNumber && normalize(model.modelNumber) === normalize(q));
      // Close but not exact — "did you mean"
      return !exact && score >= 0.55;
    })
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: SuggestableModel[] = [];
  for (const item of scored) {
    const key = normalize(item.model.name);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item.model);
    if (results.length >= limit) break;
  }
  return results;
}

export function findExactModel(
  query: string,
  models: SuggestableModel[],
): SuggestableModel | null {
  const q = normalize(query);
  if (!q) return null;
  return (
    models.find(
      (m) =>
        normalize(m.name) === q ||
        (m.modelNumber && normalize(m.modelNumber) === q),
    ) || null
  );
}

export function slugifyModelName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
