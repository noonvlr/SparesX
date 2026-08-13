# SparesX — Launch Readiness Report

**Date:** August 2026  
**Verdict:** **READY FOR PRIVATE BETA** (controlled public launch)  
**Not:** fully open production without external verification

This report reflects repository inspection plus P1 fixes applied in the launch-readiness session. Claims are limited to what was verified in code. Live Mongo counts, GSC index coverage, SMS delivery, and penetration testing require manual/external verification.

---

## 1. Executive summary

SparesX is a working Next.js App Router marketplace (MongoDB, JWT auth, chat, listings, requests, admin). No P0 launch blockers were found in the authorization/IDOR review of protected routes. Four P1 issues were fixed in this session (regex injection surface, OTP confirm rate limits, error leakage, homepage empty stats). Remaining work is P2 hardening, ops/config, legal review, and real inventory for a soft launch.

---

## 2. P0 issues

| Finding | Status |
|--------|--------|
| No open P0 IDOR / privilege-escalation / auth bypass found in audited listing, chat, upload, admin, review paths | Inspected — no code change required for a new P0 |

---

## 3. P1 issues (fixed this session)

1. **Unescaped `$regex`** on `GET /api/requests` for `category` / `brand` → `escapeRegex` + length cap  
2. **Email/phone OTP confirm** lacked attempt rate limiting → `checkRateLimitAsync` (8 / 15 min per user)  
3. **Production error leakage** in upload + product GET + generic `errorResponse` → safe client messages  
4. **Homepage 0/0 stats** → soft-launch CTA when listed and sold counts are both zero  

---

## 4. P2 issues (backlog)

- Google auth rate limiting  
- Admin UI middleware cookie-only posture (APIs still role-gated)  
- CSP headers  
- Stronger password policy  
- Image URL allowlist on product writes  
- Dedicated `search_zero_results` marketplace event (zero-result UX/deep-links exist; enum tracking incomplete)  
- Refresh-token CSRF / reuse review  

---

## 5. Security

**Fixed:** regex escape on requests filters; OTP confirm RL; sanitized 500 payloads.  
**Already present (inspected):** `requireUser` ownership checks on listing mutations; chat participant authorization; admin role checks on admin APIs; upload auth + size/type constraints; forgot-password verify RL.  
**Requires manual/external verification:** production secrets, Twilio Verify, Redis rate-limit durability, full pentest.

---

## 6. Marketplace

| Area | Notes |
|------|--------|
| Listings | Structured brand/device/part fields; quality/condition controlled where modeled |
| Search | Token / partial matching on existing architecture |
| Filters | Browse filters present; mobile sheet patterns from prior work |
| Seller profiles | Verification vs reputation badges; response-rate gated on sample size |
| Messaging | Listing context in thread; server-side participant checks |
| Trust | Precise verification labels preferred over vague “Verified” |
| Requests | Request-a-Part board + notify accuracy (prior phase) |

---

## 7. SEO

Per-page metadata, sitemap, robots, Open Graph, structured data where applicable; root layout no longer forces `canonical: "/"` onto every page. Index coverage and GSC “Alternate page with proper canonical” clearance require manual/external verification in Search Console.

---

## 8. Mobile

Prior phases addressed bottom nav overflow, 16px inputs, filter sheets. Full Journey A–E on real devices still required before open public.

---

## 9. Typography

Cross-platform system stack (no Apple SF Pro files, no Geist webfont):

`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

Fluid type tokens + hierarchy shipped earlier (`8407b28`).

---

## 10. Analytics

`MarketplaceEvent` types include at least: `product_view` and related seller funnel events. Product view deduped to PDP RSC. Dedicated zero-result event remains P2. Do not treat page views alone as the north-star KPI — prioritize buyer↔seller connections.

---

## 11. Performance

Image remotePatterns / Google avatar unoptimized path; solid chrome (no glass blur); avoid premature micro-optimizations. Bundle/DB index deep-dive remains ongoing ops work.

---

## 12. Files changed (this session)

| File | Why |
|------|-----|
| `src/app/api/requests/route.ts` | Escape regex on category/brand |
| `src/app/api/auth/verify/email/confirm/route.ts` | OTP confirm rate limit |
| `src/app/api/auth/verify/phone/confirm/route.ts` | OTP confirm rate limit |
| `src/app/api/upload/route.ts` | Generic upload 500 message |
| `src/app/api/products/[id]/route.ts` | Remove `details` leak |
| `src/lib/auth/requireUser.ts` | Harden `errorResponse` for 500s |
| `src/components/HomeMarketplaceStats.tsx` | Empty marketplace soft-launch CTA |
| `SPARESX-LAUNCH-READINESS.md` | This report |

Canvas (IDE only, not committed): `canvases/sparesx-launch-readiness.canvas.tsx`

---

## 13. Test results

| Check | Result |
|-------|--------|
| `npm run build` | **Pass** (Next.js production build completed) |
| `npm run lint` | **Fails repo-wide** (pre-existing scripts/`any` issues); changed files clean after HomeMarketplaceStats hook fix |
| Unit / integration tests | **Not configured** in `package.json` (no `test` script) |
| TypeScript | Covered by `next build` typecheck — **pass** |

---

## 14. Remaining risks

- No automated unit/integration suite in package.json beyond lint/build  
- JWT in localStorage XSS surface  
- Empty marketplace liquidity until real sellers list  
- Legal UI consistency needs counsel review  
- Admin moderation SLAs not productized  

---

## 15. Top 10 next steps

1. External authz/IDOR pentest (listings, chat, admin, uploads)  
2. Verify production env secrets (JWT, OTP pepper, Blob, SMTP, SMS)  
3. Legal review vs Terms (no payment/escrow claims)  
4. Seed real inventory before paid traffic  
5. Confirm GSC sitemap / canonicals  
6. Manual Journeys A–E on mobile Safari + Chrome  
7. CSP + Google auth RL (P2)  
8. Wire `search_zero_results` analytics  
9. Moderation playbook for reports  
10. Private-beta invite criteria + support channel  
