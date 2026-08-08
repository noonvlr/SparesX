/**
 * Optional Atlas Search path when ATLAS_SEARCH_INDEX is set.
 * Falls back to callers using Mongo $text / regex when unavailable.
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
            },
          },
          {
            text: {
              query,
              path: "description",
            },
          },
        ],
      },
    },
  };
}
