# SparesX — Phase 53 Production Readiness, Regression & Growth Audit

**Date:** 2026-08-09  
**Baseline commit:** `6f0cca6` (Phases 1–52 complete)  
**Mode:** Read-only verification of code + live surface checks  
**Business model:** India B2B technician spare-parts network — chat / WhatsApp deals, **no cart / payments**

---

## Executive Summary

Phases 1–52 delivered a **real** security and platform upgrade (HttpOnly sessions, CSRF, refresh rotation, WhatsApp gating, notifications, moderation, SEO scaffolding). Spot-checks of the current codebase largely **confirm** those claims.

SparesX is **close to production-ready for a soft launch**, but it is **not yet a strong, SEO-liquid marketplace**. The biggest gaps are no longer “missing CSRF” — they are:

1. **Live SEO ops failure:** `https://www.sparesx.com/sitemap.xml` returns **HTTP 500** (robots.txt is fine; product SSR works).
2. **Auth soft-path regressions:** some GETs trust JWT claims without DB `sessionVersion` / `isBlocked` revalidation.
3. **Peer-block incomplete:** enforced on chat send/create only — not typing, WhatsApp, or ratings.
4. **Search / matching quality:** Mongo `$text` is MVP; no synonyms; request matching is heuristic, not catalog-ObjectId-first.
5. **Marketplace intelligence:** almost no funnel analytics; trust metrics like `completedSales` are not closed-loop.

**Do not** re-do Phases 1–52. Fix confirmed regressions and growth blockers in priority order.

---

## Production Readiness Score

| Area | Score | Rationale |
|------|------:|-----------|
| Security | **76** | Strong cookie/CSRF/upload/OTP posture; soft JWT paths + refresh CSRF design subtract |
| Authentication | **82** | HttpOnly access + rotating refresh + `sv` + revoke on reset/block/password change |
| Authorization | **88** | Ownership-bound mutations solid; demoted-admin JWT window on requests list |
| Privacy | **90** | WhatsApp pre-approval redaction solid (API + cookie-less SSR product fetch) |
| Realtime | **82** | Cookie + `sv` + membership; peer-block gaps on typing/presence |
| Database | **71** | Good Product indexes; catalog refs may be sparse; RateLimitBucket lacks TTL |
| Search | **62** | Weighted `$text` + optional Atlas without score/synonyms |
| SEO | **58** | Strong page tech; **live sitemap 500** + env/docs mismatch drag score |
| Marketplace | **58** | Loop exists; matching/search/analytics not yet competitive |
| Seller UX | **70** | Listings, demand panel, badges; friction + trust auto-metrics weak |
| Buyer UX | **68** | Browse → trust → chat/WA works; findability limited by search |
| Notifications | **65** | Broad coverage; chat flood / weak dedupe |
| Analytics | **28** | Demand UI only; no search→deal funnel |
| Performance | **55** | Acceptable at low traffic; regex/self-fetch risks |
| Reliability | **66** | Fallbacks exist; sitemap failure shows missing alerting |
| Observability | **35** | Mostly `console.*`; no product APM |
| Operations | **70** | README + scripts; `.env.example` incomplete vs real SEO var |

**Overall (weighted toward security + marketplace loop):** **~68 / 100**  
**Verdict:** Soft-launch capable after **P0 SEO/ops + soft-auth fixes**. Not yet “strong B2B marketplace” without search/matching/analytics work.

---

## What was already correct (do not redo)

- HttpOnly `sparesx_session` / `sparesx_refresh`; login/Google/refresh **do not** return JWT in JSON
- CSRF on `requireUser` / `requireAdmin` mutations; client `authFetch` attaches header
- `sessionVersion` checked in `requireUser` / socket; refresh checks `isBlocked`
- Password reset / change-password / admin block|role → bump `sv` + revoke refresh
- Upload: `requireUser`, rate limit, MIME allowlist, magic-byte sniff, re-encode
- WhatsApp: contact only after approve; product SSR loads API without cookies
- Chat: membership ACL; peer block on send/create; Mongo chat rate limits
- Listing moderation toggle; notifications for approve/reject/sold/support/WA/saved search
- Product SSR for sample URL returns real title/price/description (live check)
- `robots.txt` live: correct Host + Sitemap URL; private routes disallowed
- No cart/payments (correct for current model)

---

## P0 — Critical findings

### P0-1 Live sitemap returns HTTP 500

- **Evidence:** `GET https://www.sparesx.com/sitemap.xml` → **500** (2026-08-09)
- **Impact:** Google cannot reliably discover product/parts/seller URLs via sitemap — primary technical explanation for weak “SparesX + product” search visibility
- **Contrast:** Product page SSR works; `robots.txt` OK
- **Likely causes:** DB timeout/aggregation error in `src/app/sitemap.ts`, cold start, or Mongo connectivity during sitemap generation
- **Action:** Fix + monitor; verify in Search Console after repair

### P0-2 Production SEO env documentation gap

- **Code:** `src/lib/seo/site.ts` uses **`NEXT_PUBLIC_SITE_URL`** only (deliberately ignores `NEXT_PUBLIC_BASE_URL`)
- **Docs:** `.env.example` lists `NEXT_PUBLIC_BASE_URL` / `# SITE_URL` but **omits `NEXT_PUBLIC_SITE_URL`**
- **Impact:** Misconfigured deploy poisons every canonical/OG/sitemap host (fallback `https://www.sparesx.com` may save prod today, but ops risk remains)

### P0-3 Soft JWT auth on sensitive GET paths (session revoke window)

- **Evidence:** `GET /api/requests` uses `verifyJwt` only — no DB `sessionVersion` / `isBlocked` / live role (`src/app/api/requests/route.ts`)
- **Impact (≤1h access TTL):** After password reset / logout / block / demotion, a still-valid access cookie JWT can:
  - load `mine=1` requests
  - if JWT still claims `admin`, see requester **email/phone** on the public list
- **Similar soft pattern:** product detail owner / unlock path (`src/app/api/products/[id]/route.ts`)
- **Contrast:** Mutations via `requireUser` are correct

---

## P1 — High priority findings

### P1-1 Peer block incomplete

| Surface | Blocked? |
|---------|----------|
| Chat create/send | Yes |
| Typing / presence | **No** |
| WhatsApp Connect | **No** |
| Ratings | **No** |

`isPeerBlocked` is only used in `src/lib/chat/chatService.ts`.

### P1-2 Search not marketplace-grade

- Default: Mongo `$text` + regex fallback
- Atlas optional but **no `searchScore` ranking**, no synonyms
- Queries like “S24U cam” / “lcd” / “batt” will underperform

### P1-3 Request ↔ listing matching is heuristic

- Regex scoring in match helpers; not ObjectId-first (`brandId` / `partCategoryId`)
- No synonyms; limited seller alert coverage for later-created inventory

### P1-4 Chat notification spam

- Every offline message → in-app (+ push); email only on first unread
- href always `/messages` (not conversation deep-link)
- No idempotency key on `createNotification`

### P1-5 Trust metrics not closed-loop

- `completedSales` / response metrics appear admin-editable; mark-sold does not auto-bump sales counters used by trust/elite logic

### P1-6 Catalog backfill status unknown

- Script exists (`npm run backfill:catalog-refs`) — **do not assume production was run**
- Until verified, ObjectId filters only partially help historical inventory

### P1-7 `/api/auth/refresh` without CSRF

- Documented intentional; mitigated by `SameSite=Lax`
- Acceptable for now if cookies stay Lax; do not switch to `SameSite=None` without CSRF

---

## P2 — Medium priority findings

- Middleware treats forgeable `sparesx_auth` as enough to enter gated shells (APIs still enforce)
- Logout with refresh-only cookie revokes **one** refresh token, does not bump `sv`
- Bearer still accepted server-side and skips CSRF (browser client is cookie-first)
- Password min length 6
- Saved-search: `sellerType` not always enforced; overlapping searches → duplicate alerts
- Product JSON-LD lacks AggregateRating
- RateLimitBucket lacks TTL expire index
- Observability: no APM / error product
- Redis optional adapter exists — **not required yet** at current scale
- Web push MVP ready — needs VAPID env; private key must never go client-side

---

## Security

**Strengths:** Cookie flags (HttpOnly access/refresh, Secure in production, SameSite=Lax), CSRF double-submit, hashed OTPs with pepper, hashed refresh tokens with rotation, upload sniff + re-encode, rate limits on auth/upload/chat/block.

**Residual risks:** Soft JWT GET paths (P0-3), peer-block gaps (P1-1), refresh CSRF design (P1-7), forgeable auth-flag middleware (P2).

**Final security checklist (Phase 52 intent vs reality)**

| Check | Status |
|-------|--------|
| No localStorage auth tokens written | Pass (legacy clear only) |
| No OTP plaintext logging | Pass (verify paths) |
| No refresh token in JSON | Pass |
| Admin APIs requireAdmin | Pass (mutations) |
| Classic IDOR on owned resources | Pass |
| WhatsApp pre-approval leak | Pass |
| Socket membership | Pass |
| Upload auth | Pass |
| CSRF on cookie mutations | Pass (except refresh) |
| Rate limits | Pass (core paths) |

---

## Authentication

End-to-end model:

```text
login/Google → access JWT cookie (1h) + refresh cookie (7d, hashed in Mongo)
authFetch → credentials + CSRF on mutations
401 → POST /api/auth/refresh → retry
logout / password change / reset / block / role change → invalidate
```

**Invalidation matrix**

| Event | Access `sv` | Refresh |
|-------|-------------|---------|
| Logout (has access) | Bumped | All revoked |
| Logout (refresh only) | Not bumped | Single token |
| Password change/reset | Bumped | All revoked |
| Admin block / role change | Bumped | All revoked |
| Soft GET JWT paths | **Not revalidated** | N/A |

Google: no auto-link onto password accounts; explicit `/api/auth/google/link`.

---

## Authorization

Solid ownership pattern on technician products, chat participants, support tickets, notifications, saved items, WhatsApp parties, admin routes.

**Gaps:** JWT-role admin on requests list; soft owner on product GET; admin shell cookie presence only.

---

## Privacy

WhatsApp unlock flow verified in code. Product page server render does not receive session cookies for the internal API fetch → contact stays locked in HTML for anonymous Googlebot.

Post-approve `wa.me` URL contains full number **by design** for the authorized party.

---

## Socket

- Cookie session + optional legacy Bearer → DB `sv` + blocked check
- Join/send/read require participant
- `maxHttpBufferSize` 256KB
- Optional Redis adapter when `REDIS_URL` set
- Peer block on send; **not** on typing/presence

### Redis readiness

| Question | Answer |
|----------|--------|
| Current scale | Single-region web + optional single socket host |
| Bottleneck first | DB / search / sitemap / cold starts — not Redis |
| When Redis needed | Multiple socket hosts **or** rate-limit fairness across many serverless instances under abuse |
| What Redis should handle | Socket.io adapter first; optional rate-limit store later |
| Recommendation | **Keep optional.** Do not force Redis for “readiness theater.” |

---

## Database

Product compound + text indexes present. Catalog ObjectId fields optional. Backfill script available with `--dry-run`.

**Safe backfill plan (do not auto-run on prod):**

1. Staging restore of prod dump  
2. `npm run backfill:catalog-refs -- --dry-run` → count unmatched  
3. Resolve duplicate DeviceType/Brand names  
4. Run for real on staging; spot-check filters  
5. Production during low traffic; monitor  
6. Then `backfill:slugs` if needed  

---

## Search

**Mongo `$text`:** adequate for early inventory.  
**Atlas:** optional; enable only with relevance sort + synonym map.

**Synonym approach (maintainable):**

```text
Admin/config map (small):
  cam → camera
  lcd|screen → display
  batt → battery
```

Apply as query expansion **before** `$text`/`$search` — do not hard-code hundreds in code. Prefer Site Settings or a small `SearchSynonym` collection later.

**Device → model → part:** `/parts/[category]/[brand]/[model]` hubs exist and are inventory-gated for indexing. Catalog should continue to power filters, SEO hubs, and matching — avoid free-text-only architecture.

---

## SEO

### Live checks (2026-08-09)

| URL | Result |
|-----|--------|
| `/robots.txt` | OK — Host `www.sparesx.com`, Sitemap pointed correctly |
| `/sitemap.xml` | **500** |
| `/product/mobile-samsung-s24-ultra-camera-1769954858093` | **200**, SSR title/price/description/seller badges visible |

### Why Google may not show “SparesX Samsung S24 Ultra camera”

1. **Sitemap broken (P0)** — crawl discovery impaired  
2. Page may be too new / thin / duplicate among similar listings  
3. Brand queries compete with OEM + large retailers  
4. Need Search Console URL Inspection (cannot claim indexed without GSC)  
5. Internal linking / parts hub strength still limited  

**Not** a “client-only render” problem for the sampled product page.

### Parts hubs / sellers / requests

- Parts hubs: index when inventory exists; empty → noindex (correct)  
- Seller profiles: useful public fields without private contact (OK to index when active)  
- Requests board: low SEO value; keep contacts private (already)

---

## Marketplace

Core loop works: list → browse → trust badges → chat / WhatsApp.

**Gaps for liquidity:** search quality, structured matching, demand signals (“parts technicians need now”), funnel measurement, closed-loop trust.

**Condition fields:** `new` / `used` / `refurbished` is enough for now. Separate authenticity/testing later only if sellers consistently need it — do not overload `condition`.

---

## Seller Experience

Friction likely remains in: device/part taxonomy selection, approval wait when moderation on, image upload limits, unclear “pending” state.

Opportunity: demand panel (“open requests matching your stock”) is high leverage if matching becomes ObjectId-accurate.

---

## Buyer Experience

Path is clear. Biggest UX tax is **findability** (search synonyms/typos) and **trust explainability**.

---

## Notifications

Broad event coverage is a strength. Fix spam/dedupe before adding more channels. Push is optional and correctly gated on VAPID.

**Required push env (production):**

```text
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY   # server only
VAPID_SUBJECT       # mailto:...
```

---

## Analytics

Missing product funnel:

```text
Search → PDP → Chat start → WA request → WA approve → (self-reported deal)
```

Demand vs supply (“high requests / low listings”) is a top growth feature once request/listing ObjectIds are reliable.

**Do not invent “successful deals” without seller/buyer confirmation.**

---

## Performance

Prioritize: sitemap reliability, avoid regex search under load, image sizes, mobile CWV. Atlas only when inventory/query volume justifies.

---

## Operations

### Env classification

| Variable | Class |
|----------|--------|
| `MONGODB_URI`, `JWT_SECRET` | Required |
| `NEXT_PUBLIC_SITE_URL` | Required for SEO correctness |
| `NEXT_PUBLIC_BASE_URL` | Required for SSR self-fetch / deploy URL |
| `BLOB_READ_WRITE_TOKEN` | Required in production uploads |
| SMTP / Site Settings SMS + `SETTINGS_ENCRYPTION_KEY` | Required for OTP/email/SMS |
| Google client IDs | Optional (feature) |
| `OTP_PEPPER` | Recommended (falls back to `JWT_SECRET`) |
| `REDIS_URL` / `SOCKET_REDIS_URL` | Optional scale |
| `VAPID_*` | Optional push |
| `ATLAS_SEARCH_INDEX` | Optional search quality |
| Socket companion URL/ports | Required if using realtime host |

### OTP_PEPPER

Used by `hashOtp` / `verifyOtp`. Not client-exposed. **Set a strong random pepper in production**; do not rely on fallback forever.

### Legal / KYC / payments

Flag for counsel (not code): Terms/Privacy vs WhatsApp contact sharing, dispute liability, data retention.  
KYC upload: design later with encryption, retention, audit trail — **do not build now**.  
Payments/orders: **out of scope**.

---

## Remaining Technical Debt (ranked)

1. Soft JWT GET revalidation (`requireUser`-equivalent)  
2. Sitemap 500 root-cause + monitoring  
3. Peer-block consistency  
4. Search synonyms + relevance  
5. Structured request matching + backfill verification  
6. Notification dedupe  
7. Trust closed-loop metrics  
8. Observability (Sentry or equivalent)  
9. `.env.example` / ops docs alignment  
10. Analytics funnel  

---

## Recommended Roadmap (next 10 phases)

| Phase | Focus | Priority |
|-------|--------|----------|
| **53** | This audit document (complete) | — |
| **54** | Fix live sitemap 500 + document `NEXT_PUBLIC_SITE_URL` in `.env.example` | P0 |
| **55** | Soft-auth GETs → DB `sv` / blocked / live role (requests, product detail) | P0 |
| **56** | Peer-block on typing, WhatsApp, ratings (+ revoke unlock on block) | P1 |
| **57** | Search query expansion synonyms + Atlas relevance sort (if Atlas on) | P1 |
| **58** | Catalog backfill dry-run report + staged migration; structured request match | P1 |
| **59** | Chat notify collapse + conversation deep-links; saved-search dedupe | P1 |
| **60** | Trust closed-loop (`completedSales` on mark-sold) + product JSON-LD ratings | P1 |
| **61** | Funnel/demand analytics MVP (aggregated, no PII) + seller “high demand” panel | P2 |
| **62** | Observability + RateLimit TTL + Search Console ops checklist | P2 |

---

## Implementation order (after this audit)

1. **P0:** Sitemap + SEO env docs + soft JWT DB checks  
2. **P1:** Peer-block completion, search, matching/backfill, notifications, trust  
3. **P2:** Growth analytics, location discovery, bulk inventory design  
4. **P3:** AI NL search / image ID — only after catalog+search quality  

---

## What should NOT be implemented yet

| Idea | Why wait |
|------|----------|
| Forced Redis | Premature at current scale |
| Full Atlas migration without relevance plan | Optional hook already exists |
| Full KYC document vault | Legal + security design first |
| Cart / payments / escrow | Business model change |
| Mass synonym hard-coding | Prefer config-driven small map |
| Auto-delete duplicate listings | Prefer moderation flags |

---

## Production blockers (genuine)

1. **Sitemap HTTP 500 in production**  
2. Soft JWT path allowing demoted-admin / revoked-session PII window on requests  
3. Unverified catalog/slug backfill (SEO + matching consistency)  
4. Missing Search Console / monitoring around sitemap failures  

Everything else is important but not an immediate “do not soft-launch” blocker if ops accepts risk.

---

## Marketplace opportunities (impact rank)

1. Accurate device/part matching (ObjectId + synonyms)  
2. Seller “parts in demand now” from real request aggregates  
3. Better search relevance  
4. Closed-loop trust from real sold/chat behavior  
5. City-level discovery (same city first — no precise GPS yet)  
6. Bulk inventory tools for power sellers  

## SEO opportunities (impact rank)

1. Fix sitemap 500  
2. Confirm GSC indexing of top products + parts hubs  
3. Strengthen unique product copy / internal links from hubs  
4. Product AggregateRating JSON-LD  
5. Ensure `NEXT_PUBLIC_SITE_URL` set correctly  

## Security risks (severity rank)

1. Soft JWT GET / admin PII window  
2. Incomplete peer-block  
3. Refresh CSRF if SameSite policy changes  
4. Forgeable `sparesx_auth` shell gate  

---

## Final instruction compliance

- Phase 53 is **audit-only** — no application code changes in this step  
- Artifact: `SPARESX-PHASE53-AUDIT.md`  
- Implementation should start at **Phase 54** per roadmap above  

**Strategic north star remains:** SparesX should know what technicians need, what sellers have, where they are, and who is trustworthy — then connect them via chat/WhatsApp with privacy and reputation — **not** become ecommerce checkout.
