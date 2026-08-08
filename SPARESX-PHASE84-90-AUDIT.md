# SparesX — Phase 84–90 Production Evidence, Marketplace Conversion & SEO Validation

**Audit date:** 2026-08-09 (IST)  
**Repository HEAD:** `ef91833` — *Phases 79-83: evidence layer, zero-result requests, demand notify, SEO hygiene, seller analytics*  
**Mode:** Read-only evidence audit. **No application behavior changed.**  
**Live host spot-checks:** `https://www.sparesx.com` (thin inventory; not a substitute for GSC or Mongo aggregates)

---

# Executive Summary

Phases 79–83 made the marketplace **technically measurable on the browse path** and closed several conversion gaps (zero-result → request, demand notify, seller analytics, SEO hygiene). This audit asks whether those pieces form a trustworthy **MEASURE → FIX → MEASURE** loop.

**Verdict:**

| Question | Answer |
|----------|--------|
| Can we measure Search → Contact → Deal in production? | **Partially.** Events exist, but PDP `product_view` is multi-counted; several request-lifecycle events are missing; **no production aggregates were available in this environment** |
| Does search dominate ranking (vs trust)? | **Yes.** Relevance + featured/recency (+ soft same-city). Trust/responseRate **not** in sort |
| Does zero-result → request work? | **Mostly yes** in code; city prefill dropped; live synonym edge cases need measurement |
| Do sellers get notified on unmet demand? | **Yes, with FIX gaps** (false “sellers notified”; blocked sellers on catalog path) |
| Is seller analytics private & useful? | **Private: yes.** Useful: views/chats/WA/sold — **saves missing**; weak action guidance |
| Is SEO architecture index-safe? | **Mostly yes** (hubs ≥2, dupes noindex, Person rating). **Google index status unverified** |
| Liquidity flywheel complete? | **Architected, starved by inventory + evidence quality** |

**Do not build** payments, Redis, LLM image-ID, or a large new event taxonomy. Prefer fixing measurement integrity and the two notify correctness bugs.

---

# Current State

Shipped and in scope for this audit (verified on `ef91833`):

- SSR `/products` `search` events (`meta.source: "products_ssr"`)
- Zero-result CTA → `requestSubmitHref` + RequestForm prefill
- Zero-match request seller fanout + deep links
- Parts sitemap `count ≥ 2`; duplicate noindex; filtered `/sellers` noindex
- Seller Person JSON-LD ratings (not on Product)
- Response-rate UI when sample ≥ 3
- `/api/technician/analytics` + dashboard panel
- `rating_created` MarketplaceEvent

Intentionally out of scope: cart/payments/KYC vault/forced Redis/LLM image-ID.

---

# Production Evidence

## Event inventory (actual)

All emits are **server-side** via `trackMarketplaceEvent` (`src/lib/analytics/events.ts`). No client tracker.

| Event (actual) | Where | Payload (typical) | Identity | Duplicate risk | Spoof risk | Consumers |
|----------------|-------|-------------------|----------|----------------|------------|-----------|
| `search` | `products/page.tsx` SSR; also `api/products` (orphan for app UI) | query, brand/part/model/city, `meta.resultCount`, `source` | Anonymous OK | Soft-nav re-runs RSC once per URL — **OK**. API path unused by UI | Low (server) | Demand gaps (`searches/3`) |
| `product_view` | `api/products/[id]` | productId, brand, part, model, city | Anonymous OK | **HIGH** — metadata + page SSR + client refetch (± ContactSheet) ≈ **2–4× / visit** | Low | Seller analytics `views` |
| `chat_start` | `chatService` new Conversation | productId | Implicit via auth on API | Once per new thread | Low | Seller analytics `chats` |
| `whatsapp_request` | WA connect POST | productId | Auth user | Per request create | Low | Seller analytics |
| `whatsapp_approved` | WA approve | productId | Seller auth | Per approve | Low | Seller analytics (UI underuses) |
| `request_created` | requests POST | brand, partType, deviceModel | Auth | Per create | Low | Demand gaps |
| `listing_sold` | sold API | productId, meta.soldVia | Owner | Per mark-sold | Low | Seller analytics |
| `rating_created` | ratings POST (new only) | productId?, meta.stars | Auth | Per new rating | Low | **None yet** |

TTL ~180d on `MarketplaceEvent`. Docs forbid phones/emails/WA in meta — **KEEP**.

## Desired events classification

| Desired | Status | Class |
|---------|--------|-------|
| search_started | Missing | **UNNECESSARY** (completed `search` with resultCount is enough) |
| search_completed | Exists as `search` | — |
| search_result_viewed | Missing | **UNNECESSARY** |
| product_clicked | Missing | **USEFUL** (cleaner than inflated views) |
| product_viewed | Exists as `product_view` | **FIX** counting |
| seller_viewed | Missing | **USEFUL** |
| chat_started | Exists as `chat_start` | — |
| whatsapp_requested / approved | Exist | — |
| request_created | Exists | — |
| seller_notified | Missing | **USEFUL** (after notify fanout succeeds) |
| seller_viewed_request | Missing | **USEFUL** |
| seller_responded | Missing as funnel event | **USEFUL** (User.responseRate exists separately) |
| product_marked_sold | Exists as `listing_sold` | — |
| rating_created | Exists | — |

**Do not auto-add every missing event.** Priority is **dedupe `product_view`**, then optional `seller_notified` with accurate counts.

---

# Funnel

## 84.1 Core funnel measurability

```text
Search → Result → Product view → Contact → Seller response → Deal
```

| Stage | Measurable? | Notes |
|-------|-------------|-------|
| Search | **Yes** (SSR) | Not double-counted with `/api/products` in-app |
| Result → click | **No** | No `product_clicked` |
| Product view | **Yes, inflated** | Multi-fetch |
| Contact | **Yes** | `chat_start` / `whatsapp_request` |
| Seller response | **Partial** | Closed-loop `User.responseRate`, not MarketplaceEvent |
| Deal | **Partial** | `listing_sold` only when seller marks sold |

Request route:

```text
Search → 0 results → Request → Seller notify → Seller opens → Response → Contact → Deal
```

| Stage | Measurable? |
|-------|-------------|
| 0-result | Infer from `search.meta.resultCount === 0` |
| Request | `request_created` |
| Seller notify | **Not as event** (side-effect only) |
| Seller opens request | **No** |
| Response / contact / deal | Same gaps as above |

> **Funnel measurement is technically partially available but not production-validated in this audit because Mongo MarketplaceEvent aggregates and Google Search Console data were not accessible here. Do not invent conversion rates.**

## 84.2 Definitions (use these going forward)

| Metric | Definition |
|--------|------------|
| Search conversion | Distinct `search` with `resultCount > 0` → subsequent `product_view` same session (**not implemented as joined metric**) |
| Product contact conversion | Deduped `product_view` → (`chat_start` OR `whatsapp_request`) on same productId |
| Seller response rate | **Existing:** first reply within 24h / inbound bursts (`responseRate.ts`) |
| Request response rate | request → any seller message/WA related to request (**not implemented**) |
| Marketplace connection | `chat_start` OR `whatsapp_approved` (not a sale) |
| Sale | `listing_sold` only |

## 84.3 Analytics quality

| Issue | Severity | Classification |
|-------|----------|----------------|
| PDP `product_view` ×2–4 per visit | High | **FIX** |
| SSR search vs client: no double-count on `/products` | OK | **KEEP** |
| Orphan `search` on `/api/products` if external hitters appear | Low | **KEEP** / document |
| Bot traffic | Unknown | **MEASURE FIRST** |
| Logged-out searches counted | Intentional | **KEEP** |
| Soft navigation re-search counts again | Acceptable | **KEEP** |

---

# Search Quality

## Ranking (actual — explainable)

1. Hard filter: `status: approved` only  
2. Synonyms + optional NL → filters  
3. Structured filters  
4. Text: Atlas `searchScore` **or** `$text` **or** regex  
5. Sort: relevance (if searching) → `featured` → `createdAt`  
6. Soft same-city reorder when preferred city set  

**Trust / responseRate / complaintRate are not in listing sort.** Relevance dominates — **KEEP**.

## Live / representative probes (2026-08-09)

Inventory remains tiny (~7 listings). Probes via live HTML are RSC-noisy; treat as smoke only:

| Query | Observed | Notes |
|-------|----------|-------|
| Samsung S24 Ultra camera | Relevant hits historically (prior audit: 2) | Good marketing-phrase recall |
| S24U camera | Empty on live smoke | **MEASURE FIRST** — synonym/`s24u` may not be firing as expected on prod, or inventory mismatch |
| SM-S928B camera | Empty | Expected without modelNumber stock — **IMPROVE** catalog/model-number recall later |
| i13 screen | Ambiguous in smoke | Synonym map has `i13→iphone 13`; depends on stock |
| zzzznonexistentpart999 | Empty CTA path | Zero-result path present |

## Evaluation matrix (code-based expectations)

| Query | Expected | Actual system behavior | Relevant? |
|-------|----------|------------------------|-----------|
| S24 Ultra camera | S24 Ultra camera listings first | Synonyms + text/Atlas | Yes if stock |
| S24U camera | Same as above | Alias `s24u` | **Verify prod** |
| SM-S928B rear camera | Match modelNumber if stored | Boosted in Atlas; weak if field empty | Catalog-dependent |
| i13 screen / iPhone 13 LCD | Display parts for iPhone 13 | screen/lcd→display; i13 alias | Stock-dependent |
| S23 charge port | Charging port + S23 | Phrase → charging port | Stock-dependent |
| Nonsense | 0 + request CTA | Implemented | Yes |

**Do not retune ranking from one query.** Next step: offline relevance sheet against staging DB dump — **MEASURE FIRST**.

---

# Zero-Result Requests

**KEEP:** EmptyState + “Post a part request” → `/requests?tab=submit&…` (`products/page.tsx`, `demandLinks.requestSubmitHref`).

**IMPROVE:** `city` is placed on the submit URL but **RequestForm does not read `city`**.

**KEEP:** `q` seeds description when brand/part absent.

**MEASURE FIRST:** Whether NL parser over-interprets junk tokens into brand/part on submit path (RequestForm mostly free-text + structured pickers).

---

# Seller Matching

Exact listing match: ObjectId-first (`matchListings.ts`) + string fallback; excludes requester; filters blocked sellers.

Zero-match catalog opportunity (`findCatalogOpportunitySellers`): brand/part/model OR; cap 10 sellers; **does not filter `User.isBlocked`** — **FIX**.

No peer-block filter on notify (blocked pairs could still get demand alerts) — **IMPROVE**.

Matcher for seller dashboard demand: latest **120** open requests — **MEASURE FIRST** at scale.

---

# Seller Analytics

**KEEP:** `GET /api/technician/analytics` — `requireUser` + role; products scoped to `auth.id` only (no sellerId spoof).

Metrics available: views, chats, WA requests/approved, sold, responseRate (+ sample), completedSales.

**IMPROVE:** Saves not tracked/shown; UI omits some fields; no “what to do next” guidance (high views / low chats).

**MEASURE FIRST:** Aggregation over all owner product IDs × 30–90d events under growth.

---

# Response Rate

**KEEP definition:** inbound burst opportunity; first reply ≤24h = hit; rate = hits/opportunities.

**KEEP UX:** Show only when `responseSampleSize >= 3` on product / profile / sellers / seller analytics.

**FIX / IMPROVE:** Badge engine / trust auto-qualification uses `responseRate` **without** sample-size ≥3 — UI honesty ≠ score honesty.

**MEASURE FIRST:** Lifetime counters (no decay); gaming via sockpuppets; whether sample size should appear in copy (“based on N chats”).

Blocked peers cannot message — no rate inflation via blocked threads — **KEEP**.

---

# Trust

Buyer-visible before contact:

| Signal | Visible? |
|--------|----------|
| Verification badges | Yes |
| Trust score / band | Yes |
| Ratings | Yes |
| Response rate (≥3) | Yes |
| Completed sales | Via badges/reputation, not always raw |
| Complaints | Internal / badge scoring — not raw public % |

**KEEP** hierarchy. Avoid dumping moderation internals.

---

# SEO

## Product page (architecture verified)

Approved PDP: SSR title/description, canonical, robots index (unless sold/duplicate), Product + Offer JSON-LD, seller **Person** (+ AggregateRating on Person), OG image absolute, breadcrumbs, parts-hub links.

## Indexability classification

| Route | Class | Why |
|-------|-------|-----|
| `/product/[slug]` approved | **INDEX** | Primary money page |
| `/product/[slug]` sold / `possible_duplicate` | **NOINDEX** | Soft 404 / dupe risk |
| `/parts/...` total ≥ 2 | **INDEX** | Hub utility |
| `/parts/...` total &lt; 2 | **NOINDEX** + sitemap exclude | Thin doorway |
| `/products` unfiltered | **INDEX** | Browse |
| `/products?…` filtered | **NOINDEX** | Infinite permutations |
| `/sellers` unfiltered | **INDEX** | Directory |
| `/sellers?city…` | **NOINDEX** | Near-duplicate |
| `/u/[id]` with listings | **INDEX** | Seller entity |
| `/requests` | **INDEX** (browse) | Demand surface; private fields not in URL |
| Auth/admin/technician/messages | **PRIVATE** (robots disallow) | No public value |

## Thin content & duplicates

Phase 82 principle (`count ≥ 2` for parts sitemap + page robots) is **consistent** between `sitemap.ts` and parts `generateMetadata`.

Duplicates: soft tag → noindex + sitemap exclude — **KEEP**. Admin clear_duplicate does not merge URLs — **IMPROVE** process, not auto-delete.

## Internal linking

Homepage → Products → Product → Parts hub → related products / request CTA → Seller profile — **KEEP**. Sitemap is backup, not sole discovery.

## Google Search Console

Runbook in `docs/SPARESX-OPS-CHECKLIST.md` matches code (Person rating, hubs ≥2, filtered noindex, soft-dupe). Header still says “Phase 62” — cosmetic **IMPROVE**.

> **Cannot claim any URL is indexed in Google — GSC credentials/data not available in this audit.**

---

# Marketplace Liquidity

Demand/supply gap UI exists (`getDemandSupplyGaps` + DemandMatches + List this part). City-level gap matrix is **not** computed (brand/part/model aggregates only).

Flywheel support:

```text
Demand (search/request) → Opportunity UI → List this part → Listing → Search → Contact → Response → Mark sold → Trust
```

Missing links for evidence:

1. Deduped views / contact conversion  
2. Accurate seller_notified counts  
3. Request → seller open / respond metrics  
4. Supply at city grain  

**MEASURE FIRST** before new recommendation engines.

---

# Performance

| Area | Note | Class |
|------|------|-------|
| Seller analytics aggregate | Owner products × day window | **MEASURE FIRST** |
| Demand matcher | 120 open requests in memory | **MEASURE FIRST** |
| Demand gaps | Full approved catalog group | **MEASURE FIRST** |
| Catalog notify find | limit 80 products | **KEEP** at current scale |

No Redis/Kafka justified.

---

# Security Regression (targeted)

| Control | Status |
|---------|--------|
| Technician analytics scoped to self | **KEEP** |
| CSRF on cookie mutations | **KEEP** |
| WhatsApp number gated until unlock | **KEEP** |
| Peer block on chat/WA/ratings | **KEEP** |
| Catalog notify may include blocked sellers | **FIX** |
| Request deep links expose only public board fields | **KEEP** |

No full Phase 1–52 re-audit performed; no new critical auth bypass found in 79–83 surfaces beyond notify blocked-seller gap.

---

# P0 Findings

| ID | Finding | Class |
|----|---------|-------|
| P0-1 | `product_view` multi-count corrupts seller analytics & any view→contact rate | **FIX** |
| P0-2 | Production funnel rates **cannot be asserted** here (no DB/GSC) — ops must pull 14d aggregates before optimizing conversion UX | **MEASURE FIRST** |

*(P0-2 is an evidence blocker, not a code outage.)*

---

# P1 Findings

| ID | Finding | Class |
|----|---------|-------|
| P1-1 | Requester notified “sellers alerted” even when fanout ends empty | **FIX** |
| P1-2 | Catalog opportunity notify does not exclude `isBlocked` sellers | **FIX** |
| P1-3 | Badge/trust score uses responseRate without sample ≥3 | **FIX** |
| P1-4 | RequestForm ignores `city` prefill from zero-result URL | **IMPROVE** |
| P1-5 | Optional `seller_notified` event with real recipient count | **USEFUL** / **IMPROVE** |
| P1-6 | Verify live synonym recall (`S24U`) vs empty results | **MEASURE FIRST** |

---

# P2 Findings

| ID | Finding | Class |
|----|---------|-------|
| P2-1 | Saves absent from seller analytics | **IMPROVE** |
| P2-2 | Seller “next action” copy (high views / low chats) | **IMPROVE** |
| P2-3 | Peer-block on demand notify | **IMPROVE** |
| P2-4 | Notify collapseKey / idempotency | **IMPROVE** |
| P2-5 | Offer.seller JSON-LD thinner than Product.seller | **IMPROVE** |
| P2-6 | Demand matcher 120-cap + gap rollup scale | **MEASURE FIRST** |
| P2-7 | Show “based on N chats” beside response rate | **IMPROVE** |
| P2-8 | Ops checklist title still “Phase 62” | **IMPROVE** |

---

# What Should NOT Be Built

| Idea | Why |
|------|-----|
| Payments / cart / checkout | Business model unchanged |
| Forced Redis / queues / microservices | No scale evidence |
| LLM image ID | Deferred |
| Full event taxonomy (started/viewed/clicked × every surface) | Prefer fix view dedupe first |
| Trust-weighted search ranking | Would bury relevance — **REMOVE** as near-term idea |
| Mass thin SEO city×part pages | Violates index strategy |
| Auto-delete duplicates | Soft tag + noindex enough for now |

---

# Recommended Next Steps

## Phase 91 — Measurement integrity (**FIX**)

Deduplicate `product_view` (track once per request/session, or only from page body, not metadata + client). Align badge responseRate with sample ≥3. Fix notify copy + blocked-seller filter.

## Phase 92 — Evidence pull (**MEASURE FIRST**)

Ops: 14-day MarketplaceEvent rollups + GSC URL inspection on top 5 products. Publish conversion baselines before UX churn.

## Phase 93 — Request loop polish (**IMPROVE**)

City prefill; `seller_notified` event; peer-block on fanout; collapseKey.

## Phase 94 — Seller actionability (**IMPROVE**)

Simple cues on analytics panel; optional saves later.

## Phase 95 — Search relevance sheet (**MEASURE FIRST**)

Staging/prod query set with human labels; only then synonym/modelNumber tweaks.

---

# Required Final Report

## 1. What is working (verified in code)

- SSR browse `search` events without client/API double-count on `/products`
- Zero-result → Post request CTA + brand/model/part/`q` prefill
- Zero-match demand fanout + deep-linked board URLs
- Seller analytics owner-scoped; response-rate UI gated at sample ≥3
- SEO: parts hubs ≥2, duplicate noindex, filtered sellers noindex, Person ratings on JSON-LD
- Ranking: relevance before seller trust
- WhatsApp privacy + CSRF + chat peer-block still present on core paths

## 2. What is not working / weak

- `product_view` inflation — `src/app/api/products/[id]/route.ts` + PDP metadata/client refetch
- False “sellers notified” — `src/lib/requests/notifySellers.ts`
- Catalog notify may include blocked sellers — same file
- ResponseRate affects badges without sample gate — `src/lib/badges/engine.ts`
- City prefill ignored — `src/app/requests/_components/RequestForm.tsx`
- Saves not in seller analytics — `src/app/api/technician/analytics/route.ts`

## 3. What cannot be measured (this audit)

- Real Search→Contact→Deal conversion rates  
- Google index/ranking for product URLs  
- Whether `S24U` empty results are synonym bugs vs inventory  
- Bot share of `search` / `product_view`  
- Request → seller open → respond rates  

## 4. What should be measured next

1. 14d: searches, zero-result %, unique product views (after dedupe fix), chat_start, WA request/approve, listing_sold  
2. GSC: sitemap status + URL Inspection on top products  
3. Notify fanout size distribution (0 / 1–3 / 4–10)  
4. Response-rate distribution by sample size buckets (3–9 / 10+)  

## 5. P0 blockers

1. Inflated `product_view` (breaks seller analytics trust)  
2. Lack of production aggregate baseline before further conversion “optimization”

## 6. P1 improvements

Notify accuracy (copy + blocked filter); badge sample gate; city prefill; prod synonym smoke (`S24U`); optional `seller_notified` event.

## 7. P2 improvements

Saves metric; action cues; peer-block notify; JSON-LD Offer.seller parity; response-rate “based on N”; checklist title.

## 8. Features to defer

Payments/cart, Redis/Kafka, LLM image ID, trust-weighted search ranking, mass SEO doorway pages, large new analytics event sets.

---

# Success criteria (restate)

Judge next work by: relevant searches → useful listings → successful contacts → seller responses → completed deals → trust → returning technicians → demand-informed supply — **and SEO only for genuinely useful pages**.

**Strategic rule:** Measure first. Fix evidence integrity before adding features.
