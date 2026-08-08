# SparesX — Phase 74–78 Marketplace Reality, SEO, Conversion & Growth Audit

**Audit date:** 2026-08-09 (IST)  
**Repository HEAD at audit:** `54bdff7` — *Phases 72-73: demand deep-links, list prefills, refresh origin harden*  
**Note:** Prompt baseline `6f0cca6` is **not** current. Phases 53–73 are already on `main` after that commit.  
**Live host checked:** `https://www.sparesx.com`  
**Mode:** Read-only. No application behavior changed in this phase.

---

# Executive Summary

SparesX’s technician↔seller loop is **architecturally present** and usable on a thin inventory (~7 approved listings at audit time). Search finds common marketing phrases (`S24 Ultra camera` → 2 hits). Contact (chat / WhatsApp), trust badges, demand panel, closed-loop response/complaint rates, sitemap product URLs, and product SSR metadata are largely in place.

The marketplace is **not yet evidence-driven or SEO-liquid**:

1. **Funnel analytics cannot measure conversion.** Browse/search on `/products` is SSR and does **not** hit `GET /api/products`, so `search` MarketplaceEvents rarely fire from the main UI. Several funnel stages have no events at all.
2. **Production funnel rates cannot be calculated** — no trustworthy event series for Search → View → Contact → Response → Deal → Rating.
3. **Zero-result → request** is broken as a conversion path: empty `/products` has no “Post a request” CTA / prefill.
4. **Google indexing status is unknown** (no Search Console data in this environment). Technical indexability of product pages looks **good**; ranking/quality is a separate problem and inventory is tiny.
5. **Liquidity tools exist but are under-powered:** demand gaps ignore zero-match requests for push notify; sellers don’t see response/complaint rates publicly; listing analytics (views/chats per listing) are absent.

**Verdict:** Soft-launch capable for a small technician cohort. Not yet a data-backed or SEO-dominant marketplace. Prioritize evidence (analytics on SSR path), zero-result→request, sitemap/hub hygiene, then seller opportunity UX — not new platforms.

---

# Current Production Readiness

| Area | Score (0–100) | Notes |
|------|---------------|-------|
| Auth / privacy / block | **85** | Phases 54–56, 63–65, 73 largely solid |
| Contact loop (chat/WA) | **80** | Works; responseRate closed-loop exists |
| Search recall (common phrases) | **70** | Synonyms help; model numbers / sparse catalog weak |
| Funnel measurement | **35** | Events exist but SSR browse orphans `search` |
| SEO technical product pages | **78** | SSR + canonical + Product JSON-LD + OG image verified live |
| SEO discoverability / ranking | **Unknown** | No GSC data; inventory too small to judge |
| Zero-result conversion | **25** | No CTA/prefill on `/products` empty state |
| Demand → supply | **65** | Panel + List this part; notify gap when 0 matches |
| Trust explainability | **60** | Badges strong; rates mostly internal |
| Liquidity | **40** | ~7 live listings; flywheel starved by supply |

Intentionally still out of scope (confirmed): payments/cart/checkout, KYC vault, forced Redis, LLM image-ID.

---

# Marketplace Funnel

## Desired loop vs drop-offs

```text
Search / Google
      ↓  (unknown: GSC not available)
Landing /products or /product/[slug]
      ↓  (works for thin catalog)
Search / filters
      ↓  DROP: zero-result has no request CTA
Product result → Product detail
      ↓  (SSR + contact CTAs work)
Seller trust (badges / stars)
      ↓  DROP: response/complaint rates not shown
Chat / WhatsApp
      ↓  (block-aware)
Seller response
      ↓  DROP: no MarketplaceEvent; only User.responseRate
Deal → Mark sold → Rating
      ↓  DROP: rating_created not tracked; sold analytics sparse
Reputation / better matching
```

## 74.1 Event inventory (`MarketplaceEvent`)

Canonical types in `src/lib/models/MarketplaceEvent.ts` (TTL ~180d). All emissions are **server-side** via `trackMarketplaceEvent` (`src/lib/analytics/events.ts`). Docs forbid PII in meta (phones/emails/WA).

| Desired name | Actual | Where | Trusted? | Used by UI? |
|--------------|--------|-------|----------|-------------|
| search_started | — | — | — | — |
| search_completed | `search` | `api/products` only when `search`≥2 | Partial (orphaned from SSR browse) | Demand gaps (`searches/3`) |
| search_result_viewed | — | — | — | — |
| product_clicked | — | — | — | — |
| product_viewed | `product_view` | `api/products/[id]` | Yes (also SSR self-fetch) | **No consumer** |
| seller_viewed | — | `/u/[id]` silent | — | — |
| chat_started | `chat_start` | new Conversation only | Yes | **No** |
| whatsapp_requested | `whatsapp_request` | WA connect POST | Yes | **No** |
| whatsapp_approved | `whatsapp_approved` | WA approve | Yes | **No** |
| request_created | `request_created` | requests POST | Yes | Demand gaps |
| seller_responded | — | (User.responseRate only) | — | Badge engine |
| product_marked_sold | `listing_sold` | sold API (not all bulk paths) | Partial | **No** |
| rating_created | — | ratings POST silent | — | — |

**Do not invent duplicate event names** — prefer wiring existing types to the SSR path and adding only the missing stages that unblock decisions.

## 74.2 Measured funnel rates

> **Cannot calculate due to unavailable production data.**

Reasons:

- No access to Mongo `MarketplaceEvent` aggregates in this audit environment.
- Main browse path does not emit `search`.
- No joined identity across search → view → contact → sold for conversion ratios.
- Live inventory ~7 products — rates would be statistically meaningless even if events were complete.

**MEASURE FIRST:** After wiring SSR search/view emissions, aggregate 14–30 days before optimizing ranking/UX by “conversion.”

---

# Search Quality

## Live probes (2026-08-09)

| Query | Result (live `/products?search=`) |
|-------|-----------------------------------|
| `S24 Ultra camera` | **2** products (Samsung S24 Ultra cameras) |
| `SM-S928B camera` | **0** — model-number gap |
| `charging port S23` | **0** — no S23 inventory (correct empty) |
| `i13 screen` | Synonym map has `i13→iphone 13`; no iPhone 13 listing in catalog → empty expected |

Synonym map (`src/lib/products/searchSynonyms.ts`) covers cam/screen/lcd/batt, `s24u`, `i13`–`i16`, charge port phrases. NL parser (`parseNaturalQuery.ts`) can extract city/price/condition when few structured filters set.

## Ranking model (actual)

Hard filter: **`status: "approved"` only** (sold/pending/rejected out of browse).

Then:

1. Optional NL → structured params  
2. Synonym expansion  
3. Structured filters (device/brand/model/part/condition/price/sellerType)  
4. City filter **or** soft `preferCity` (profile) without excluding other cities  
5. Text backend priority: Atlas (`searchScore`) → Mongo `$text` → regex AND tokens  
6. Sort: default `featured ↓, createdAt ↓`; with search + featured → relevance then featured/newest  
7. Same-city soft reorder on featured (over-fetch ≤60)

**Seller trust / responseRate / complaintRate are NOT in listing sort.** Freshness is `createdAt`. Availability = approved only.

### Proposed documented hierarchy (do not implement until measured)

```text
1. Exact model + part (catalog ObjectId / strong token)
2. Text / Atlas relevance
3. Availability (approved)
4. Same-city preference (soft)
5. Featured flag
6. Seller trust band (only after MEASURE)
7. Response rate (only after MEASURE)
8. Listing freshness
```

**Classification:** Current ranking = **KEEP** (not over-complicated). Adding trust into sort = **MEASURE FIRST**.

---

# Google / SEO

## Live technical checks

| Check | Result |
|-------|--------|
| `robots.txt` | 200; sitemap host `https://www.sparesx.com`; private shells disallowed |
| `sitemap.xml` | **200** via `curl` (Vercel cache HIT); ~32 `<loc>` (static + 7 products + 6 parts hubs). One WebFetch attempt returned 500 — treat intermittency as **MEASURE FIRST**, not assumed fixed forever |
| Product example | `/product/mobile-samsung-s24-ultra-camera-1770294830067` |
| HTTP | 200 |
| `robots` | `index, follow` |
| Canonical | absolute www product URL |
| OG | `og:type=product`, title, absolute `og:image` (Blob) |
| JSON-LD | `Product` + `Offer` (INR, InStock/UsedCondition) + `BreadcrumbList` |
| AggregateRating | Absent on this sample (seller likely has no ratings) — correct conditional |

Homepage WebFetch showed “Live listings 0” — that is the **client count-up starting at 0** without JS execution in the fetcher, **not** a DB zero (featured products render with prices).

---

# Product Indexability

## Technical vs ranking

**Technical indexability (product pages):** largely **YES** — SSR title/description, canonical, indexable robots when approved, sitemap inclusion, absolute images, Product schema.

**Ranking / quality:** **Unknown / weak by volume** — tiny catalog, duplicate near-identical S24 Ultra camera listings, limited unique copy, unknown GSC impressions.

### Risks

| Risk | Class | Notes |
|------|-------|-------|
| Seller stars as Product `aggregateRating` | **FIX** | JSON-LD attaches **seller** rating onto **Product** when present — Google guideline risk |
| Thin `/parts` hubs in sitemap while page `noindex` if `total < 2` | **FIX** | e.g. vivo T1 hub live `robots=noindex` but still listed in sitemap |
| `/sellers?…` always indexable | **IMPROVE** | Mirror `/products` filtered `noindex` |
| Duplicate soft-tag still indexable | **IMPROVE** | `possible_duplicate` does not `noindex` |
| Soft 404 / thin product copy | **MEASURE FIRST** | Inventory quality, not meta tags |

---

# Parts Hub

**KEEP:** `/parts/[category]/[brand]/[model]` with ItemList, breadcrumbs, request CTA, product cards, `noindex` when `total < 2`, product→hub links (Phase 71).

**FIX:** Sitemap `loadPartsEntries` does not require `count >= 2`.

**IMPROVE:** Templated hub prose; related chips often point at filtered `/products?…` (noindex) instead of sibling hubs.

---

# Zero-Result Experience

**Current:** `/products` empty state = “No products match your filters” + adjust filters. **No** Post a request CTA. **No** query prefill into request form.

Parts hub empty state **does** link `/requests?tab=submit` without brand/model prefill.

**Desired:** Search → 0 results → “Can’t find this part? Post a request” with brand/model/part/city prefilled from search/NL parse.

**Classification:** **FIX** (P1 conversion). Highest marketplace ROI among UX gaps.

---

# Part Requests

| Capability | Status |
|------------|--------|
| Structured create + rate limits | **KEEP** |
| Catalog ObjectId matching | **KEEP** (Phase 58) |
| Notify matching sellers when listings exist | **KEEP** (`notifySellers.ts`) |
| Notify when **zero** listing matches | **FIX** — early `return` at `matches.length === 0` kills demand push |
| Seller notify deep-link with `focus=` | **IMPROVE** — often plain `/requests` |
| Board deep-link `q` + `focus` | **KEEP** (Phase 72) |
| Request form prefill from search URL | **FIX** — missing |
| Expiry / spam / duplicates | Partial rate limits; no strong duplicate-request UX |

---

# Seller Demand Intelligence

**KEEP:** `getDemandSupplyGaps` + DemandMatches (requests / listings / searches / gap) without requester PII; “List this part” prefills new listing.

**IMPROVE:** Opportunity ranking is gap-oriented but still volume-heavy; no trend/contact signals; matcher scans latest **120** open requests with score ≥ 30.

**DEFER:** Push/email “new demand alert” fanout until notify-on-zero-match and analytics trust are fixed.

---

# Seller Experience

Sellers can see:

- High-demand aggregates + matching open requests  
- List this part  
- Own products Live/Pending/Rejected/Sold  
- Trust score / badges on profile  

Sellers **cannot** see:

- Per-listing views / saves / chat starts / WA requests  
- Public response rate / complaint rate on their storefront (internal to badges)  
- Funnel for which listings get contacts  

**Classification:** Listing-level seller analytics = **IMPROVE** (P2). Surface response rate lightly = **IMPROVE** (P1 trust).

---

# Trust & Reputation

## Response rate (Phase 66) — verified

- Opportunity: inbound chat burst (`previousUnread === 0`)  
- Hit: first reply within **24h**  
- Rate: `hits/opportunities` capped 0–100  
- Blocked peers cannot message (no artificial chat with blocked users)  
- Spam: message rate limits exist; responseRate itself is not anti-spam beyond burst logic  
- Deleted conversations: historical counters not rolled back (**IMPROVE** / accept)

Gaming: messaging yourself is prevented by conversation rules; sockpuppet buyers could still inflate — **MEASURE FIRST** before complex anti-gaming.

## Complaint rate (Phase 69) — verified

- Only abuse tickets `resolved|closed` with `complaintUpheld !== false`  
- Denominator: `completedSales` (if 0 sales → `upheld * 25` capped)  
- **No minimum sample / Bayesian smoothing** — 1/1 looks like 100%  
- Admin override still possible via user PATCH  

**Classification:** Smoothing / min sample = **IMPROVE** (P2), not blind change.

## Trust display

Shown: verification badges, trust band, stars, completed-sales-driven reputation badges.  
Hidden on public surfaces: raw responseRate / complaintRate (`pickTrustFields` omits them).

## Blocking regression

| Surface | Peer-block? |
|---------|-------------|
| Chat create/send | Yes |
| Typing | Yes (silent) |
| WhatsApp | Yes + unlock revoke on block |
| Ratings | Yes |
| Presence list filtering | Partial / not fully audited as seller discovery filter |
| `/api/sellers` discovery | **No** block filter (**IMPROVE**) |
| Request board visibility | Public board — block does not hide requests (**KEEP** — demand is public) |

---

# Notifications

| Type | Quality |
|------|---------|
| Chat collapse + read-on-open | **KEEP** (59/67) |
| Saved search | Exists; dedupe **KEEP** |
| Part request seller alert | **IMPROVE** href focus; **FIX** zero-match silence |
| Listing approved/rejected | Exists |
| WA request/approved | Exists |
| Support reply | Exists |
| Demand opportunity push | Absent (**DEFER**) |

Email + in-app can both fire for some paths — acceptable if not spammy; chat email only on first unread burst (**KEEP**).

---

# Performance

No production APM samples in this audit.

Code-level observations:

- Product list over-fetch for same-city sort ≤60 — OK at current scale  
- Seller demand matcher loads 120 open requests into app memory — OK now; **IMPROVE** if open requests ≫1k  
- Homepage + products are SSR with `revalidate` where set  
- Images via Blob + `UploadedImage`  

**MEASURE FIRST** with Vercel/Sentry timings before indexes or caching rewrites.

---

# Database

Solid indexes on Product status/featured/text, Message conversation compounds, Notification user compounds, MarketplaceEvent type/day.

Gaps (**IMPROVE**, not blind create):

- `Request.status` / `createdAt` / `userId` — used in open-request scans  
- `User.city` + `role` + `isBlocked` — seller city resolution  

Redundant indexes: none flagged as harmful. Expensive regex search is fallback only.

---

# Mobile UX

Code review (not device lab):

- Product detail sticky mobile contact bar — **KEEP**  
- Filters / chat / WA / upload flows exist and are mobile-oriented  
- Demand panel CTAs added Phase 72  

**IMPROVE:** Zero-result CTA (affects mobile search heavily). No redesign for aesthetics.

---

# Analytics

Privacy posture **KEEP**: MarketplaceEvent avoids phones/emails/WA/message bodies.

Gaps: orphaned `search` on SSR browse; missing seller_viewed / rating_created / seller_responded; product_view unused; no admin funnel dashboard.

**FIX:** Emit `search` (and optionally `product_view` already OK) from the path users actually use — either call track from RSC `fetchProductList` wrapper or have client report once per query.

---

# Marketplace Liquidity

At audit time ~**7** approved products, **6** parts hubs, duplicate camera SKUs from same model family. Demand tools exist but supply is the bottleneck.

Flywheel status: **architected, starved**.

Priority is not more admin panels — it is **make empty search create demand** and **make demand notify sellers who can list**.

---

# P0 Findings

| ID | Finding | Class |
|----|---------|-------|
| P0-1 | Cannot measure Search→Contact→Deal (SSR orphans `search`; missing stages) | **FIX** / **MEASURE FIRST** |
| P0-2 | Google ranking/indexing unknown — no GSC runbook/data in repo env | **MEASURE FIRST** (ops) |
| P0-3 | Sitemap intermittent 500 observed once via WebFetch (curl 200) — monitor | **MEASURE FIRST** |

No new critical auth/privacy regression found vs Phases 54–73.

---

# P1 Findings

| ID | Finding | Class |
|----|---------|-------|
| P1-1 | Zero-result `/products` lacks request CTA + prefill | **FIX** |
| P1-2 | `notifyOnPartRequestCreated` no-ops when zero listing matches | **FIX** |
| P1-3 | Product JSON-LD may put seller AggregateRating on Product | **FIX** |
| P1-4 | Sitemap includes thin parts hubs that self-`noindex` | **FIX** |
| P1-5 | Model-number / sparse synonym recall (e.g. SM-S928B) | **IMPROVE** |
| P1-6 | Trust rates not shown where buyers decide to contact | **IMPROVE** |
| P1-7 | Seller notify / email hrefs often lack `focus` / `q` | **IMPROVE** |

---

# P2 Findings

| ID | Finding | Class |
|----|---------|-------|
| P2-1 | `/sellers` filtered URLs always indexable | **IMPROVE** |
| P2-2 | Duplicate listings soft-tagged but still indexed | **IMPROVE** |
| P2-3 | ComplaintRate lacks min-sample smoothing | **IMPROVE** |
| P2-4 | No per-listing seller analytics | **IMPROVE** |
| P2-5 | Request/User city indexes may be missing | **IMPROVE** |
| P2-6 | Blocked peers still appear in seller directory | **IMPROVE** |
| P2-7 | Hub copy templated / related links to noindex filters | **IMPROVE** |
| P2-8 | GSC ops checklist too thin | **FIX** (docs) |

---

# Recommended Changes

For every change: problem → classification. Implementation only after review against Phases 1–73.

| Change | Class | Why |
|--------|-------|-----|
| Track `search` (+ resultCount) from `/products` SSR path | **FIX** | Unlocks funnel + demand |
| Zero-result → request CTA with prefill | **FIX** | Core conversion |
| Notify sellers / log demand when 0 listing matches | **FIX** | Demand→supply |
| Sitemap parts only if count ≥ 2 | **FIX** | Crawl budget |
| Fix Product AggregateRating semantics | **FIX** | Rich-result safety |
| GSC runbook in ops checklist | **FIX** | Discoverability ops |
| Show response rate band on profile/product (not raw spammy %) | **IMPROVE** | Contact confidence |
| Deep-link request notifications | **IMPROVE** | Seller speed |
| Seller listing analytics MVP | **IMPROVE** | Liquidity |
| ComplaintRate Bayesian / min n | **IMPROVE** | Fairness |
| Model number / catalog synonym expansion | **IMPROVE** | Recall |
| Payments / Redis / AI ID | **DEFER** | Out of scope |
| Rebuild ranking with many signals | **REMOVE** / **DEFER** | Premature |

---

# Recommended Roadmap

## Phase 79 — Evidence layer (P0/P1)

Wire marketplace events to the real browse path; document GSC manual workflow; sitemap health alert.

## Phase 80 — Zero-result → request (P1)

Empty search CTA + prefill RequestForm from `q` / NL parse / filters.

## Phase 81 — Demand notify completion (P1)

Remove zero-match early-return; deep-link seller notifications; optional capped broadcast to relevant catalog sellers.

## Phase 82 — SEO hygiene (P1)

Parts sitemap count≥2; AggregateRating fix; sellers filtered noindex; duplicate policy for indexability.

## Phase 83 — Trust presentation + seller analytics MVP (P1/P2)

Show safe trust cues; listing view/chat/WA counters for owners only.

---

# Implementation plan sketches (for genuine P0/P1 only)

### A. SSR search analytics

- **Problem:** `search` events almost never fire from main UI.  
- **Current:** `trackMarketplaceEvent({ type: "search" })` only in `api/products`.  
- **Desired:** Same event when `/products` SSR (or client) runs a search ≥2 chars.  
- **Files:** `src/app/products/page.tsx`, optionally `src/lib/analytics/events.ts`.  
- **API/DB:** None / existing MarketplaceEvent.  
- **Security:** No PII; truncate query length.  
- **SEO:** None.  
- **Migration:** None.  
- **Test:** Search on `/products`, confirm event row.  
- **Rollback:** Remove track call.

### B. Zero-result → request

- **Problem:** Empty search dead-ends.  
- **Current:** EmptyState without action.  
- **Desired:** CTA → `/requests?tab=submit&q=…` (or brand/model/part params) with form prefill.  
- **Files:** `products/page.tsx`, `RequestForm` / `RequestsBoard`, `demandLinks`-style helper.  
- **Security:** Prefill is public search text only.  
- **SEO:** noindex already on filtered `/products`.  
- **Test:** Search nonsense → CTA → prefilled submit.  
- **Rollback:** Revert CTA.

### C. Parts sitemap ≥2

- **Problem:** noindex hubs still in sitemap.  
- **Files:** `src/app/sitemap.ts` aggregate `$match` having count≥2.  
- **Test:** sitemap omits single-listing hubs; hub page still noindex.  
- **Rollback:** Revert aggregate.

---

# Indexability strategy (explicit)

| Page class | Policy |
|------------|--------|
| Home, `/products` (unfiltered), `/requests` browse, `/sellers` unfiltered | **Index** |
| `/product/[slug]` approved | **Index** |
| `/product/[slug]` sold | **noindex** (existing) |
| `/parts/...` with ≥2 listings | **Index** |
| `/parts/...` with &lt;2 | **noindex** + **exclude from sitemap** |
| `/u/[id]` with active listings | **Index** |
| Filtered `/products?…`, `/sellers?…` | **noindex** (sellers gap) |
| Auth/admin/technician/messages | **Disallow** (robots) |

---

# Google search intents (realistic)

| Intent | SparesX page today |
|--------|--------------------|
| Samsung S24 Ultra camera spare | Product + `/parts/mobile-camera/samsung/s24-ultra` |
| S24 Ultra rear camera | Partial (synonym/recall) |
| iPhone 13 display spare | Weak — little/no stock |
| Mobile spare parts Chennai | City filter / preferCity — not a dedicated landing |
| Samsung spare parts India | Brand filter / hubs — thin |

Do **not** mass-generate city×part doorways.

---

# Final instruction compliance

- Phase 74–78 is **audit-only** — artifact: this file.  
- No payments/cart/KYC vault/Redis/LLM image-ID added.  
- No blind ranking rewrites.  
- Production metrics not invented.  
- Next implementation should start at **Phase 79** only after this audit is accepted.

**Strategic north star remains:** turn demand into supply and supply into successful technician↔seller connections — measured, not assumed.
