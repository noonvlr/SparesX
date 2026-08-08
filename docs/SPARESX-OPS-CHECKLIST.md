# SparesX — Ops checklist (Phase 62)

Use this after deploys and when diagnosing SEO / auth / scale issues.

## Required production env

| Variable | Notes |
|---|---|
| `MONGODB_URI` | Production cluster |
| `JWT_SECRET` | Strong random (≥32 chars) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.sparesx.com` (SEO canonical host) |
| `NEXT_PUBLIC_BASE_URL` | Deploy URL used for SSR self-fetch |
| `BLOB_READ_WRITE_TOKEN` | Uploads |
| `OTP_PEPPER` | Recommended; falls back to `JWT_SECRET` |

## Optional

| Variable | Notes |
|---|---|
| `VAPID_*` | Web push (private key **server-only**) |
| `ATLAS_SEARCH_INDEX` | Atlas `$search` (with `searchScore` ranking) |
| `REDIS_URL` / `SOCKET_REDIS_URL` | Only when multi-instance Socket.io is needed |
| SMTP / Google OAuth | Auth + transactional email |

## Post-deploy checks

1. `GET /robots.txt` → 200, Sitemap points at `https://www.sparesx.com/sitemap.xml`
2. `GET /sitemap.xml` → 200, includes product + `/parts/...` + `/u/...` URLs
3. Spot-check one approved product: SSR title, canonical, JSON-LD Product (+ AggregateRating when seller has ratings)
4. Login → refresh → logout; password reset invalidates sessions
5. WhatsApp request before approval never returns full number
6. Google Search Console: submit sitemap; inspect a top product URL

## Auth / CSRF notes

- Session, refresh, CSRF, and auth-flag cookies are **`SameSite=Lax`**.
- Cookie mutations require `sparesx_csrf` + `X-CSRF-Token` (via `authFetch`).
- **`POST /api/auth/refresh`** intentionally skips the CSRF header (cookie rotation only) but still rejects cross-origin Origin/Referer. **Do not** change refresh cookies to `SameSite=None` without adding full CSRF (or equivalent) on that route first.
- Bearer `Authorization` skips CSRF by design; browser clients should use cookies.

## Catalog backfill (staging first)

```bash
npm run backfill:catalog-refs -- --dry-run --requests
# review unmatched samples, then on staging only:
npm run backfill:catalog-refs -- --write --requests
```

Do **not** run `--write` against production without a reviewed dry-run report.

## Observability notes

- App logs are primarily `console.*` today; use `src/lib/observability/log.ts` for new paths (redacts secrets).
- Optional Sentry: set `SENTRY_DSN` and/or `NEXT_PUBLIC_SENTRY_DSN` (see `.env.example`). Disabled when unset.
- `RateLimitBucket` documents TTL-expire after `resetAt`.
- `MarketplaceEvent` raw rows TTL-expire after 180 days.

## Location discovery

- Product filters: `?city=Chennai&nearby=1` expands metro/region cities and prefers same-city listings.
- Sellers: `/sellers?city=Chennai&nearby=1`.
- No GPS / precise coordinates.

## Bulk inventory

- Technician UI: **Bulk CSV import** on My Products.
- API: `POST /api/technician/products/bulk` (csv or rows), `PATCH` for bulk price/sold/delete.
- Soft duplicate tag `possible_duplicate` when same seller re-lists identical brand/model/part/price within 7 days.

## Natural-language search

- Rule-based parser (no LLM required): e.g. `S24 ultra camera under 1500 near Chennai`.
- Merges into structured filters inside `fetchProductList`.

## Funnel events (no PII)

Tracked types: `search`, `product_view`, `chat_start`, `whatsapp_request`, `whatsapp_approved`, `request_created`, `listing_sold`.

Seller demand API (`/api/technician/demand`) returns matching open requests plus aggregated `opportunities` (high demand / low supply).
