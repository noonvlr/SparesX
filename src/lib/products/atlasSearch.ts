/**
 * Optional Atlas Search path when ATLAS_SEARCH_INDEX is set.
 * Falls back to callers using Mongo $text / regex when unavailable.
 *
 * Intentional vs `$text`: Atlas uses fuzzy (maxEdits:1) and a flatter boost
 * layout; Mongo text index uses weighted fields without fuzzy. Field coverage
 * is aligned (name, brand, deviceModel, partType, modelNumber, tags, description).
 * Exact recall/ranking parity is not required across engines.
 */
export function atlasSearchEnabled() {
  return Boolean(process.env.ATLAS_SEARCH_INDEX?.trim());
}

export function atlasSearchIndexName() {
  return process.env.ATLAS_SEARCH_INDEX?.trim() || "";
}

/** Build an Atlas $search stage for product free-text. */
export function buildAtlasProductSearchStage(query: string) {
  const index = atlasSearchIndexName();
  return {
    $search: {
      index,
      compound: {
        should: [
          {
            text: {
              query,
              path: ["name", "brand", "deviceModel", "partType", "modelNumber"],
              fuzzy: { maxEdits: 1 },
              score: { boost: { value: 3 } },
            },
          },
          {
            text: {
              query,
              path: "tags",
              score: { boost: { value: 1.5 } },
            },
          },
          {
            text: {
              query,
              path: "description",
            },
          },
        ],
        minimumShouldMatch: 1,
      },
    },
  };
}
