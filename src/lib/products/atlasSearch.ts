/**
 * Optional Atlas Search path when ATLAS_SEARCH_INDEX is set.
 * Falls back to callers using Mongo $text / regex when unavailable.
 *
 * Multi-token queries require each significant token on primary paths so a
 * single fuzzy / description hit cannot satisfy the whole query.
 */
import {
  PRIMARY_SEARCH_FIELDS,
  canonicalizeSearchTokens,
} from "@/lib/products/searchRelevance";

export function atlasSearchEnabled() {
  return Boolean(process.env.ATLAS_SEARCH_INDEX?.trim());
}

export function atlasSearchIndexName() {
  return process.env.ATLAS_SEARCH_INDEX?.trim() || "";
}

/** Build an Atlas $search stage for product free-text. */
export function buildAtlasProductSearchStage(query: string) {
  const index = atlasSearchIndexName();
  const tokens = canonicalizeSearchTokens(query);
  const primaryPaths = [...PRIMARY_SEARCH_FIELDS];
  const useFuzzy = tokens.length <= 1;

  const must =
    tokens.length > 0
      ? tokens.map((token) => ({
          compound: {
            should: [
              {
                text: {
                  query: token,
                  path: primaryPaths,
                },
              },
              {
                text: {
                  query: token,
                  path: "tags",
                },
              },
            ],
            minimumShouldMatch: 1,
          },
        }))
      : [
          {
            text: {
              query,
              path: primaryPaths,
              ...(useFuzzy ? { fuzzy: { maxEdits: 1 as const } } : {}),
            },
          },
        ];

  return {
    $search: {
      index,
      compound: {
        must,
        should: [
          {
            text: {
              query,
              path: primaryPaths,
              ...(useFuzzy ? { fuzzy: { maxEdits: 1 as const } } : {}),
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
              score: { boost: { value: 0.25 } },
            },
          },
        ],
      },
    },
  };
}
