# SparesX — Advertisement Management System (AMS)

Living doc. Updated as phases complete. **Status: Phase 5 complete — ready for Phase 6 (tracking).**

---

## Progress

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Discovery + plan | **Done** | Approved (300×600 sidebar, leaf parts, house on sidebar, etc.) |
| 1 Models, indexes, seed, admin API skeleton, effective-status | **Done** | Models + helpers + seed + admin APIs + unit tests |
| 2 Placement management UI + sidebar entry | **Done** | Overview, placements edit, campaigns list, nav |
| 3 Upload + draft wizard + campaigns table | **Done** | Draft-first wizard, creatives upload, actions |
| 4 Delivery, public API, PromoSlot, cache | **Done** | Eligibility cache, PromoSlot, click redirect stub |
| 5 Page integration + CLS/LCP | **Done** | PromoSlot on home/products/parts/PDP; AdSlot removed |
| 6 Tracking (impressions, clicks, dedupe, rate limit, tokens) | Pending | |
| 7 Analytics + Overview | Pending | |
| 8 Security, tests, perf, docs | Pending | |

---

## Phase 0 — Discovery

### Stack (verified)

| Area | Finding |
|------|---------|
| Framework | Next.js **16.1.3** App Router, React **19.2.3**, TypeScript |
| DB | MongoDB Atlas via Mongoose **9.1.5** (`src/lib/models/*`, `connectDB`) |
| Blob | `@vercel/blob` `put()` in `src/app/api/upload/route.ts`; `BLOB_READ_WRITE_TOKEN`; local `public/uploads` in dev |
| Images | **sharp** already used (`src/lib/images/optimizeUpload.ts`) — reuse for magic bytes + dimensions; **do not resize** ad creatives |
| Auth (admin) | `requireAdmin` + `isAdminError` (`src/lib/auth/requireAdmin.ts`): JWT + DB role + CSRF for cookie mutations |
| Rate limit | `checkRateLimitAsync` → Mongo `RateLimitBucket` with in-memory fallback (`src/lib/security/authRateLimit.ts`) — **reuse for public promo endpoints** |
| Cache tags | `unstable_cache` (parts hubs); `revalidateTag("categories", { expire: 0 })` pattern — **reuse for promo eligibility TTL ~60s** |
| Admin UI | `AdminGate` + `AdminPage`; nav in `AppShell.tsx` (admin branch) + dashboard/settings control grids |
| API shape | Mixed `{ message }` / `{ success, error }` / resource keys; prefer `{ message }` errors + resource payloads like products admin |
| Charts | **None** in deps — do **not** add recharts; Phase 7 uses a small SVG line/bar component |
| Tests | `tsx --test` (`npm test`); unit under `tests/unit/`, integration under `tests/integration/` |
| Seeds | CLI `scripts/seed-*.ts` + admin POST `/api/admin/seed/mobile-brands` (insertMany, not upsert). AMS placements: **idempotent upsert-by-key** admin seed + CLI |
| Robots | `src/app/robots.ts` already `disallow: ["/api", …]` — `/api/promos` covered; still add explicit `/api/promos` for clarity |
| Existing ads | `AdSlot` placeholder (`NEXT_PUBLIC_ADS_ENABLED`); `AdSenseScript` site-wide. **AMS uses `PromoSlot` (D11); replace `AdSlot` call sites; leave AdSense alone** |
| Privacy | `src/app/privacy/page.tsx` — add first-party anonymous promo measurement section in Phase 6/8 |

### Target pages — render mode & containers

| Page | Mode | Container | Notes |
|------|------|-----------|-------|
| `/` | ISR `revalidate = 60` | `max-w-7xl` (~1280px) − `px-4/6/8` → **~1216px** content | Existing `<AdSlot id="home-mid">` mid-page. Hero is LCP-sensitive — promo **below** hero, never LCP |
| `/products` | **Dynamic** (searchParams) | Same `max-w-7xl`; main column after `lg:w-72` filters ≈ **~896px**; sticky filter rail **288px** | Bottom `<AdSlot id="products-grid-bottom">`. Natural home for sidebar placement |
| `/parts/...` | ISR `revalidate = 3600` on hub + leaf | Leaf: `max-w-7xl` grid; hubs are link lists | No AdSlot today; **`parts_listing` on leaf model page only** (hubs are thin) |
| `/product/[slug]` | **Dynamic** (`cookies()` via optional viewer) | `max-w-7xl`, `lg:grid-cols-2` (~580px/col) — **no third column** | Full-width band below main grid / above SimilarProducts |

**D5 adaptation:** Homepage + parts are cached/ISR — eligibility must be fetched via short-TTL `unstable_cache` (or client fetch to `/api/promos/...`) and **client-side weighted pick** so rotation is not frozen into HTML. Products + product detail are already dynamic; still use the same client `PromoSlot` path for one code path.

**Layout audit (corroborated):** Products filter rail is the **only** durable public marketplace sidebar (`lg:w-72`). No technician/buyer dashboard sidebar for promos. Current `AdSlot` when disabled renders `hidden` (zero height) — flipping `NEXT_PUBLIC_ADS_ENABLED` causes CLS; `PromoSlot` must use aspect-ratio reserve while loading/eligible and **collapse** only when empty (per placement table). Do not place promos inside the homepage `max-w-3xl` brand stack or PDP contact column.

### Proposed final placement table

| key | name | Page location | Desktop | Mobile | maxSlots | Empty behavior | fallbackToHouseAds |
|-----|------|---------------|---------|--------|----------|----------------|--------------------|
| `homepage_hero` | Homepage Hero | `/` — after hero CTAs, before category grid | 1200×300 (2×: 2400×600) AR 4:1 | 720×360 (2×: 1440×720) AR 2:1 | 1 | **Collapse** | false |
| `homepage_secondary` | Homepage Secondary | `/` — replaces `home-mid` AdSlot | 1200×250 (2×: 2400×500) AR 24:5 | 720×360 AR 2:1 | 1 | **Collapse** | false |
| `parts_listing` | Parts Listing | `/products` bottom (replaces grid-bottom AdSlot); `/parts/[category]/[brand]/[model]` below listings | 1200×200 (2×: 2400×400) AR 6:1 | 720×240 AR 3:1 | 1 | **Collapse** | false |
| `product_details` | Product Details | `/product/[slug]` full-width below 2-col main, above similar | 1200×250 AR 24:5 | 720×300 AR 12:5 | 1 | **Collapse** | false |
| `sidebar_ad` | Products Sidebar | `/products` sticky filter column **below** filters; **`lg+` only** | **300×600** (2×: 600×1200) AR 1:2 | N/A (`supportedDevices: ['desktop']`) | 1 | **Collapse** when empty; when eligible reserve aspect box so filters don’t jump | true |

**Deviation from seed sketch:** `sidebar_ad` desktop **300×600** (not 600×900). Filter rail is `lg:w-72` (288px); 600×900 cannot fit without breaking layout. 300×600 is a standard half-page and scales cleanly inside 288px.

**Aspect reserved space:** CSS `aspect-ratio` + `width: 100%` so 1200-wide creatives shrink in ~896px columns without CLS. Ads never use `fetchpriority="high"` / eager LCP.

### Design decisions confirmation (D1–D11)

All followed. Notes:

- **D5:** Prefer client fetch of eligible list from `/api/promos/placement/[key]` with `Cache-Control` / route-level `unstable_cache` tag `promo:placement:{key}`, `revalidate: 60`, `revalidateTag` on admin mutations. Server Components only mount `<PromoSlot placement="…" />` — no campaign pick in RSC.
- **D6:** Plain `<picture>`/`<img>` with width/height; not `next/image` (repo uses Blob CDN URLs; creatives are exact-size).
- **D9:** Collapse when no eligible (paid or house). Sidebar may enable house fallback by default.
- **D11:** Public: `/api/promos/*`, `.promo-slot`, `data-promo-slot`. Admin keeps `/admin/ads`, `/api/admin/ads/*`. Visible label: “Sponsored”.

### Indexes (proposed)

**AdPlacement:** unique `key`.

**AdCampaign:**

- `{ status: 1, 'creatives.placementKey': 1, startDate: 1, endDate: 1 }` — eligibility
- `{ status: 1, updatedAt: -1 }` — admin lists
- text or regex search on name/advertiserName as needed

**AdDailyStat:** unique `{ istDate: 1, campaignId: 1, placementKey: 1, device: 1 }`.

**AdEvent:** unique `dedupeKey`; TTL on `createdAt` 30 days.

### Env vars (to add)

| Var | Purpose |
|-----|---------|
| `PROMO_HMAC_SECRET` | Sign/verify short-lived delivery/tracking tokens (required in prod) |
| Existing | `BLOB_READ_WRITE_TOKEN`, JWT/CSRF secrets unchanged |

### Upload strategy

**Server upload** via authenticated `/api/admin/ads/campaigns/[id]/creatives` (multipart). Cap **2 MB** ≪ Vercel body limit (~4.5 MB). No client upload token. Validate: size → magic bytes → sharp metadata → exact or 2× dimensions → `put()` under `ads/{campaignId}/{placementKey}/{device}-{hash}.{ext}`. Reject SVG always.

### Rate limiting

Reuse `checkRateLimitAsync` (Mongo-backed). Suggested: impressions/events ~60/min/IP+session; click redirect ~30/min/IP.

### Chart library

No new dependency. Custom SVG chart for daily series in `/admin/ads/analytics`.

### Tests (Phase 8 / as logic lands)

Extend `tsx --test` with pure modules: effective status, eligibility, weighted rotation, CTR, URL validator, dimension/2×, dedupe key, HMAC, IST bucketing. Dev-only seed script `scripts/seed-ads-demo.ts` (abort if `NODE_ENV===production` or `VERCEL_ENV===production`).

---

## Phase 1 report

**Shipped**
- Models: `AdPlacement`, `AdCampaign`, `AdDailyStat`, `AdEvent` (+ indexes / TTL)
- Shared: `getEffectiveStatus` (D1), `ist.ts`, `dimensions.ts`, `destinationUrl.ts`, `serialize.ts`, `seedPlacements.ts`
- Seed: `AD_PLACEMENT_SEEDS`, `npm run seed:ad-placements` (`--force` overwrites), `POST /api/admin/ads/placements/seed`
- Admin APIs (all `requireAdmin`):  
  `GET /api/admin/ads/overview`  
  `GET /api/admin/ads/placements` (+ auto-seed if empty)  
  `GET|PATCH /api/admin/ads/placements/[key]`  
  `POST /api/admin/ads/placements/seed`  
  `GET /api/admin/ads/campaigns` (paginated list)
- Tests: `tests/unit/adsEffectiveStatus.test.ts`, `adsIstAndDimensions.test.ts`
- Env doc: `PROMO_HMAC_SECRET` noted (wired in Phase 6)

**Checks:** unit tests for new modules pass.

## File-by-file plan

### Phase 1 — Models + seed + shared status + admin API skeleton — DONE

### Phase 2 — Placement UI + nav — DONE

**Shipped**
- Routes: `/admin/ads`, `/admin/ads/placements`, `/admin/ads/campaigns` (list only)
- `AdsSubnav`; placement list + inline edit (dims, enabled, house fallback, maxSlots)
- Seed missing placements button
- Nav: AppShell More + top links, dashboard + control center cards
- Overview: campaign status counts + impressions/clicks/CTR (zeros until traffic)

### Phase 3 — Upload + wizard + campaigns — DONE

**Shipped**
- `placementKeys` on `AdCampaign`; creative upload via magic bytes + sharp dims (exact/2×, ≤2 MB, no SVG)
- Blob paths `ads/{campaignId}/{placementKey}/{device}-{hash}.{ext}`; replace/remove deletes orphans; duplicate copies blobs
- APIs: POST campaigns, GET/PATCH/DELETE `[id]`, creatives POST/DELETE, actions publish/pause/activate/archive/duplicate, placement coverage hint
- UI: `/admin/ads/campaigns/new`, `/admin/ads/campaigns/[id]` wizard (5 steps, draft-first); table with search/filter/actions
- Preview uses uploaded images; real `PromoSlot` preview mode in Phase 4

### Phase 4 — Delivery + PromoSlot — DONE

**Shipped**
- `getEligibleAds` via `unstable_cache` (~60s) tags `promo:all` / `promo:placement:{key}`; `revalidatePromoCaches` on publish/pause/activate/archive + placement/creative edits
- `GET /api/promos/placement/[key]` (rate-limited); `GET /api/promos/click/[campaignId]` (token + Mongo destination + UTM; event rollup in Phase 6)
- `PromoSlot` client: aspect reserve, `<picture>`, weighted pick, house fallback, date re-check, previewMode
- Wizard preview uses `PromoSlot` previewMode
- HMAC `PROMO_HMAC_SECRET` (falls back to `JWT_SECRET`); robots disallow `/api/promos`
- Tests: rotation weights + token sign/verify

### Phase 5 — Integrate pages — DONE

| Placement | Page |
|-----------|------|
| `homepage_hero` | `/` after hero, before stats |
| `homepage_secondary` | `/` between categories and featured |
| `parts_listing` | `/products` bottom; `/parts/.../[model]` above grid |
| `product_details` | `/product/[slug]` above SimilarProducts |
| `sidebar_ad` | `/products` desktop filter column (below filters) |

Removed unused `AdSlot.tsx`. AdSense script unchanged. Empty slots collapse (no CLS from empty reserved boxes). Loading state briefly reserves aspect ratio.

### Phase 6 — Tracking

- `src/app/api/promos/events/route.ts` (batch beacon)
- `src/app/api/promos/click/[campaignId]/route.ts` (302 + UTM)
- Client observer in PromoSlot; skip admin sessions + preview
- Privacy policy copy update
- robots explicit `/api/promos`

### Phase 7 — Analytics

- Aggregate from `AdDailyStat` only
- `/admin/ads/analytics` + Overview cards
- SVG chart; CTR “—” when impressions = 0

### Phase 8 — Hardening

- Unit tests, demo seed, security pass, build/lint/typecheck, docs finalize

---

## Risks

1. **ISR + ads:** Mitigated by client pick + date re-check (D5).
2. **Ad blockers:** D11 naming; still may block some patterns — acceptable.
3. **Sidebar width vs creative:** Resolved by 300×600 proposal.
4. **AdSense coexistence:** Two systems on page; ensure PromoSlot does not use `ad` class names that AdSense/blockers target aggressively.
5. **Blob orphans:** Duplicate must copy blobs; replace/delete must `del()`.
6. **CSRF:** Admin mutations must go through cookie+CSRF path already in `requireAdmin`.

## Decisions (from Phase 0 approval)

1. **Sidebar dimensions:** **Approved — 300×600** (2×: 600×1200). Mobile N/A.
2. **`parts_listing` scope:** **`/products` + parts leaf only** (`/parts/[category]/[brand]/[model]`). Skip category/brand hubs (link lists, low inventory intent). Can add hubs later via placement edit / new key without schema change.
3. **House fallback default:** **`sidebar_ad` → `fallbackToHouseAds: true`**; all other placements → `false`. Banner slots collapse cleanly when empty; sticky sidebar benefits from a house promo so the filter column doesn’t feel barren. Admin can flip any placement later.
4. **Overview in Phase 2:** **Ship the `/admin/ads` route + nav in Phase 2** with campaign/placement counts and status chips from Mongo (no impression/CTR yet). Phase 7 fills impression/click/CTR cards and charts. Avoids a dead nav link and matches deep-linkable sub-routes.
5. **`AdSlot`:** **Replace call sites with `PromoSlot` in Phase 5**; **delete `AdSlot.tsx`** once unused. Keep `AdSenseScript` + `ads.txt` untouched. Do not gate PromoSlot on `NEXT_PUBLIC_ADS_ENABLED` (that flag was for the placeholder).

**Status:** Decisions recorded — **awaiting “go” / Phase 1 approval.**

---

## Acceptance criteria map

| # | Covered by |
|---|------------|
| 1 E2E publish | Phases 3–5 |
| 2 Upload rejections | Phase 3 + tests |
| 3 Desktop/mobile picture | Phases 4–5 |
| 4 Pause/expire/cache | Phases 4–6 |
| 5 Impression rules | Phase 6 |
| 6 Click + anti-tamper | Phase 6 |
| 7 CTR seed math | Phases 7–8 |
| 8 CLS/LCP | Phases 5, 8 |
| 9 Regression build | Phase 8 |

---

## Deviations from §2 (none pending)

Only proposed placement size change for `sidebar_ad` (see open question 1). No new dependencies planned. No new infra providers.
