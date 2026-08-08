# SPARESX TECHNICAL AUDIT

**Date:** 2026-08-09  
**Scope:** Phase 1 read-only audit of SparesX (`https://www.sparesx.com/`)  
**Stack:** Next.js App Router, MongoDB/Mongoose, JWT Bearer (localStorage), Express Socket.io  
**Business model:** B2B technician marketplace — list/find/request parts; deals via chat + WhatsApp Connect. **No cart / payment gateway.**

---

## Executive summary

Core marketplace authorization (technician ownership, most admin APIs, chat message membership, WhatsApp pre-approval privacy) is generally sound. Highest risks are: an **admin seed route that never verifies JWT**, **OTP hashes leaked via `/api/auth/me`**, **plaintext OTP logging**, **part-request PII exposed to any logged-in user**, **socket join/typing ACL gaps**, and **auto-approved listings bypassing moderation UI**.

HttpOnly cookie migration is recommended later (large). Do not turn SparesX into consumer ecommerce.

---

## Architecture (verified)

```text
Browser (JWT in localStorage)
  → Next.js API routes (Bearer)
  → MongoDB
Browser
  → Socket server (handshake.auth.token)
  → MongoDB / chatService
```

- Roles: `technician` | `admin` only  
- Product catalog fields on listings: **strings** (`brand`, `deviceModel`, `partType`, …), not ObjectIds  
- WhatsApp Connect: phone not returned until seller approval (product path OK)

---

## Product status state machine

```text
create → approved          (default; SiteSettings.requireListingApproval can force pending)
pending → approved|rejected (admin)
approved → sold|rejected    (owner mark sold; admin reject)
sold → approved             (owner relist; clears soldVia/soldAt)
```

**Note:** Admin approving a previously sold listing should clear `soldVia`/`soldAt` (gap). Auto-approve on create is **documented as intentional** for Phase 2 unless product policy changes to require moderation.

---

## SEO indexing rules

| Route pattern | Index? | Notes |
|---------------|--------|--------|
| `/`, `/products` (unfiltered), `/product/[slug]` approved | Yes | Canonical www |
| `/parts/...` with inventory | Yes | Empty → noindex |
| `/sellers`, `/u/[id]`, marketing/legal | Yes (selective) | No PII |
| Sold product detail | noindex | Still HTTP 200 for UX |
| Filtered `/products?...` | noindex | Avoid duplicate SERPs |
| `/login`, `/register`, dashboards, `/admin`, `/messages`, `/api` | No | robots disallow |

---

## WhatsApp privacy status

| Check | Status |
|-------|--------|
| Phone before approval (connect API) | OK — not leaked |
| Approve/decline ownership | OK |
| Product detail pre-unlock | OK — contact stripped |
| Part requests contact | **FAIL** — any JWT gets email/phone |

---

# P0 — Critical

### P0-1 Admin seed missing JWT verification

- **Issue:** `/api/admin/seed/mobile-brands` accepts any non-empty Bearer string; JWT never verified; role never checked.
- **Severity:** P0
- **Area:** Admin authorization
- **File(s):** `src/app/api/admin/seed/mobile-brands/route.ts`
- **Current behavior:** Comment says “Verify admin token” but only checks header presence. POST/DELETE can reseed/wipe brands.
- **Why it is a problem:** Privilege escalation / catalog destruction by unauthenticated attackers.
- **Recommended solution:** Use `requireAdmin(req)` on POST/DELETE.
- **Risk of fixing:** Low
- **Estimated complexity:** S

### P0-2 OTP hashes exposed via profile APIs

- **Issue:** Authenticated profile responses return OTP hash fields.
- **Severity:** P0
- **Area:** Auth / secrets over-fetch
- **File(s):** `src/app/api/auth/me/route.ts`, `src/app/api/technician/profile/route.ts`, admin user GETs
- **Current behavior:** `toPublicUser` only deletes `password`. Fields like `emailVerifyOTP`, `phoneVerifyOTP`, `passwordResetOTP` ship to the client.
- **Why it is a problem:** 6-digit OTPs hashed with unsalted SHA-256 are offline-bruteforceable; XSS + session steals live OTPs.
- **Recommended solution:** Explicit allowlist DTO; never return `*OTP*` / counters / expiries.
- **Risk of fixing:** Low
- **Estimated complexity:** S

### P0-3 Plaintext OTP logged on admin password reset

- **Issue:** Admin reset-password logs OTP in plaintext when email fails.
- **Severity:** P0
- **Area:** Password reset / logging
- **File(s):** `src/app/api/admin/users/[id]/reset-password/route.ts`
- **Current behavior:** `console.warn(... OTP: ${otp})`
- **Why it is a problem:** Log aggregators retain usable account-takeover codes.
- **Recommended solution:** Never log OTPs; log delivery failure only.
- **Risk of fixing:** Low
- **Estimated complexity:** S

---

# P1 — High

### P1-1 Part-request email/phone leaked to any logged-in user

- **Issue:** Authenticated `/api/requests` returns full contact for all requests.
- **Severity:** P1
- **Area:** PII / marketplace privacy
- **File(s):** `src/app/api/requests/route.ts`
- **Current behavior:** `if (payload || mine) return item` — any valid JWT sees everyone’s email/phone.
- **Why it is a problem:** Mass PII harvest; bypasses WhatsApp Connect consent model.
- **Recommended solution:** Strip contact for non-owners; owner/admin only; expose `hasContact` for others.
- **Risk of fixing:** Medium (UX: sellers must use chat/WA instead of direct scrape)
- **Estimated complexity:** M

### P1-2 Listings default to approved (moderation bypass)

- **Issue:** Schema default `status: 'approved'`; create API omits status.
- **Severity:** P1 (policy)
- **Area:** Product lifecycle
- **File(s):** `src/lib/models/Product.ts`, `src/app/api/technician/products/route.ts`
- **Current behavior:** New listings go live immediately despite admin pending UI.
- **Why it is a problem:** Spam/scam listings can appear without review.
- **Recommended solution:** Product decision — keep auto-approve for velocity **or** set `pending`. Phase 2 documents intentional auto-approve.
- **Risk of fixing:** Medium (seller UX)
- **Estimated complexity:** S

### P1-3 Socket join before membership; typing without ACL

- **Issue:** `join-conversation` joins room before ACL; typing emits to arbitrary peerId.
- **Severity:** P1
- **Area:** Chat / Socket security
- **File(s):** `server/socket/handlers.ts`, `src/lib/chat/chatService.ts`
- **Current behavior:** Join + setViewing before `markConversationRead` (which asserts membership). Typing has no check.
- **Why it is a problem:** Latent room IDOR; typing harassment.
- **Recommended solution:** Assert participant before join; gate typing on conversation membership.
- **Risk of fixing:** Low
- **Estimated complexity:** S

### P1-4 No login / password-reset rate limits; OTP not consumed on verify

- **Issue:** Unlimited login attempts; weak reset OTP lifecycle.
- **Severity:** P1
- **Area:** Authentication abuse
- **File(s):** `src/app/api/auth/login/route.ts`, `src/app/api/auth/forgot-password/*`, `src/lib/security/secrets.ts`
- **Current behavior:** No IP/email throttle on login; reset verify may leave OTP reusable.
- **Why it is a problem:** Credential stuffing / OTP spray.
- **Recommended solution:** Rate limits; CSPRNG OTP; single-use after verify/reset.
- **Risk of fixing:** Low–medium
- **Estimated complexity:** M

### P1-5 Blocked / demoted users keep JWT privileges for up to 7 days

- **Issue:** `requireUser` / `requireAdmin` trust JWT; no DB `isBlocked` / role re-check.
- **Severity:** P1
- **Area:** Authorization lifecycle
- **File(s):** `src/lib/auth/requireUser.ts`, `src/lib/auth/requireAdmin.ts`, `src/lib/auth/jwt.ts`
- **Current behavior:** `isBlocked` only at login/Google.
- **Why it is a problem:** Blocked users and demoted admins retain access until expiry.
- **Recommended solution:** Load user in require helpers; reject blocked; authorize from DB role.
- **Risk of fixing:** Medium (extra DB reads)
- **Estimated complexity:** M

### P1-6 JWT in localStorage

- **Issue:** XSS can steal 7-day Bearer token; logout is client-only.
- **Severity:** P1
- **Area:** Session storage
- **File(s):** Login/Google clients, many `localStorage.getItem("token")` sites
- **Current behavior:** Token in localStorage; no server revocation.
- **Why it is a problem:** Full account takeover via XSS.
- **Recommended solution:** Later: HttpOnly Secure cookies + CSRF + short-lived access. **Deferred** (large).
- **Risk of fixing:** High migration risk
- **Estimated complexity:** L

### P1-7 Anonymous uploads allowed

- **Issue:** Unauthenticated uploads (1 file / 2MB).
- **Severity:** P1
- **Area:** Upload abuse
- **File(s):** `src/app/api/upload/route.ts`
- **Current behavior:** Optional auth.
- **Why it is a problem:** Spam hosting / cost / malware distribution.
- **Recommended solution:** Require authentication for uploads.
- **Risk of fixing:** Low
- **Estimated complexity:** S

### P1-8 Any user can POST brand models

- **Issue:** Authenticated non-admins can mutate brand catalog.
- **Severity:** P1
- **Area:** Catalog integrity
- **File(s):** `src/app/api/brands/[slug]/models/route.ts`
- **Current behavior:** Any valid JWT can append models.
- **Why it is a problem:** Catalog / SEO pollution.
- **Recommended solution:** Admin-only POST (Phase 2).
- **Risk of fixing:** Low (sellers may lose “suggest model” — acceptable)
- **Estimated complexity:** S

### P1-9 Google auto-link by email (pre-account takeover)

- **Issue:** Google sign-in links to existing email account without verified ownership.
- **Severity:** P1
- **Area:** OAuth linking
- **File(s):** `src/app/api/auth/google/route.ts`
- **Current behavior:** Find by email → set googleId.
- **Why it is a problem:** Attacker registers victim email first; victim Google-login lands in attacker account.
- **Recommended solution:** Only link if emailVerified / force merge proof. **Deferred to follow-up** (careful UX).
- **Risk of fixing:** Medium
- **Estimated complexity:** M

### P1-10 Parts SEO pages use free-text search

- **Issue:** `/parts/[category]/[brand]/[model]` queries via search string, not brand+model filters.
- **Severity:** P1
- **Area:** SEO / discovery
- **File(s):** `src/app/parts/[category]/[brand]/[model]/page.tsx`
- **Current behavior:** Wrong/missed matches; thin/noisy pages.
- **Recommended solution:** `fetchProductList({ brand, deviceModel, … })`.
- **Risk of fixing:** Low
- **Estimated complexity:** S

### P1-11 Sitemap omits `/parts/...` hubs

- **Issue:** Inventory-backed parts pages not in sitemap.
- **Severity:** P1
- **Area:** SEO
- **File(s):** `src/app/sitemap.ts`
- **Recommended solution:** Include combinations with listings (capped).
- **Risk of fixing:** Low
- **Estimated complexity:** M

---

# P2 — Medium

### P2-1 Weak OTP entropy (`Math.random`)

- **File(s):** `src/lib/security/secrets.ts`  
- **Fix:** `crypto.randomInt`  
- **Complexity:** S

### P2-2 Open redirect via `?next=`

- **File(s):** `src/lib/auth/postAuthRedirect.ts`  
- **Fix:** Allowlist relative paths only  
- **Complexity:** S

### P2-3 Relative image URLs in product JSON-LD / OG

- **File(s):** `src/app/product/[slug]/page.tsx`  
- **Fix:** `absoluteUrl()`  
- **Complexity:** S

### P2-4 Missing listing compound indexes

- **File(s):** `src/lib/models/Product.ts`  
- **Fix:** `{ status, featured, createdAt }` etc.  
- **Complexity:** S

### P2-5 Regex-only search (no text index)

- **File(s):** `src/lib/products/listQuery.ts`  
- **Status:** Phase 6 added MongoDB `product_text_search` + `$text` with regex fallback. Atlas Search still optional at larger scale.  
- **Complexity:** L (Atlas deferred)

### P2-6 In-memory chat rate limits / multi-instance

- **File(s):** `src/lib/chat/rateLimit.ts`  
- **Defer:** Redis  
- **Complexity:** L

### P2-7 Presence broadcasts all online user IDs

- **File(s):** `server/socket/handlers.ts`  
- **Complexity:** M *(Phase 4: peer-scoped)*

### P2-8 Ratings gameable via mutual chat

- **File(s):** `src/lib/ratings/engine.ts`  
- **Status:** Phase 6 — phone verified + (WhatsApp approved **or** 2+ msgs each + 1h chat age); daily new-rating cap; seller notified.  
- **Complexity:** M

### P2-9 Condition only new/used

- Evaluate authenticity / testing as separate fields later — do not overload `condition`.

### P2-10 String catalog vs DeviceType/CategoryBrand drift

- Large ObjectId migration deferred.

### P2-11 Public GETs under `/api/admin/*` for some catalog

- Lock admin GETs behind `requireAdmin`.

### P2-12 Post-unlock product API returns raw phone digits

- Prefer `whatsappUrl` + mask only.

---

# P3 — Nice to have

- Pin `algorithms: ['HS256']` on `jwt.verify`
- Generic errors on forgot-password verify/reset (enumeration)
- Cap message `limit` / Socket `maxHttpBufferSize`
- Product backlog: ~~bulk tools, demand analytics~~ (Phase 8 MVP)
- HttpOnly cookies + refresh tokens
- ObjectId-normalized catalog
- Atlas Search when scale demands

---

## Quick wins (implemented in Phase 2)

1. Seed `requireAdmin`
2. Strip OTP secrets from user DTOs
3. Stop OTP logging
4. Mask part-request contacts for non-owners
5. Socket membership before join + typing ACL
6. Require auth for uploads
7. Admin-only brand model POST
8. Login/forgot-password rate limits; CSPRNG OTP; consume OTP
9. Blocked-user + DB role checks in require helpers
10. Absolute SEO images; parts filters; sitemap `/parts` with inventory
11. Pin JWT algorithms

## Deferred (large)

- HttpOnly cookie migration
- Catalog ObjectId rewrite
- Atlas Search (Mongo `$text` covers MVP in Phase 6)
- Redis socket adapter / shared rate-limit store
- Full email/push notification channels *(Phase 10: listing + support reply email; push still open)*

### Phase 3 additions

- JWT claim `sv` must match `User.sessionVersion` (API + Socket)
- Google refuses auto-link onto unverified local password accounts
- Product detail post-unlock returns `whatsappUrl` + `maskedNumber` (raw digits owner-only)
- Admin approve/reject clears `soldVia` / `soldAt`
- Chat `listMessages` limit capped; Socket `maxHttpBufferSize` 256KB

### Phase 4 additions

- In-app notifications (`Notification` model, `/notifications`, shell badge)
- Events: WhatsApp request/approve/decline, offline chat messages
- Admin device-types / device-categories GETs require admin
- Presence snapshot + online/offline scoped to conversation peers only

### Phase 5 additions

- Part request create notifies matching sellers (`part_request`) + requester match count (`request_match`)
- Saved searches MVP (`SavedSearch`, `/api/saved-searches`, Save this search on `/products`, Saved tab)
- New listing alerts for matching saved searches (`saved_search`)
- Site setting `requireListingApproval` (admin toggle; create/relist respect it)
- Site-settings PATCH no longer blocks non-secret updates when encryption key missing

### Phase 10 additions

- Transactional email on listing approve/reject + support reply (SMTP when configured)
- Admin support inbox pagination (`page`/`limit`, unread filter server-side)
- Admin reports 30-day daily series (listings + requests)
- Sitemap includes `/support` and active seller `/u/{id}` profiles

---

## Well-protected areas (positive)

- Most `/api/admin/**` mutating routes use `requireAdmin`
- Technician product edit/delete/sold/relist check ownership
- Chat REST + send/read/delete use `assertParticipant`
- WhatsApp Connect unlock-after-approve
- Public sellers/profiles strip contact fields
- Product browse filters `status: approved`
- robots.txt blocks admin/dashboard/auth/messages
- Sitemap includes approved products only; sold excluded
