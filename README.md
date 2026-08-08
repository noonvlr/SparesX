# SparesX

India B2B marketplace for mobile / laptop spare parts. Technicians list and request parts; buyers and sellers connect directly. **SparesX does not process payments, escrow, or shipping.**

Stack: Next.js App Router, MongoDB, JWT session cookies + CSRF, optional Socket.io chat server.

## Local development

```bash
npm install
cp .env.example .env   # if present; otherwise create .env
npm run dev            # Next.js + Socket.io (concurrent)
```

- Web: [http://localhost:3000](http://localhost:3000)
- Socket only: `npm run start:socket` (default port from `server/index.ts`, often `4001`)

### Required env (minimum)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` | HS256 signing secret |
| `NEXT_PUBLIC_BASE_URL` | Deploy / SSR self-fetch base URL |
| `NEXT_PUBLIC_SITE_URL` | Public canonical host (SEO: canonicals, OG, sitemap) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads (production) |

### Recommended env

| Variable | Purpose |
|---|---|
| `SMTP_*` or Site Settings SMTP | Password reset + email verification |
| `SETTINGS_ENCRYPTION_KEY` | Encrypt SMS/SMTP secrets in Site Settings (≥32 chars) |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Sign-In |
| `NEXT_PUBLIC_SOCKET_URL` | Public Socket.io URL when not same-host |
| `REDIS_URL` / `SOCKET_REDIS_URL` | Multi-instance Socket.io adapter |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web push |
| `ATLAS_SEARCH_INDEX` | Optional Atlas `$search` for products |
| `OTP_PEPPER` | OTP HMAC pepper (falls back to `JWT_SECRET`) |

## Auth model

- HttpOnly `sparesx_session` (access JWT, ~1h) + `sparesx_refresh` (7d, rotating)
- Readable `sparesx_auth` flag for UI soft-gates
- CSRF: `sparesx_csrf` cookie + `X-CSRF-Token` on cookie-authenticated mutations
- Session/refresh/CSRF cookies use `SameSite=Lax` (never switch refresh to `SameSite=None` without full CSRF on `/api/auth/refresh`)
- `/api/auth/refresh` skips the CSRF header by design but still enforces same-origin Origin/Referer
- Bearer `Authorization` skips CSRF (not a classic cookie CSRF vector); prefer cookie + `authFetch`
- Clients use `authFetch` (`credentials: "include"`); silent refresh on 401

## SEO / Search Console

- Canonical host: `NEXT_PUBLIC_SITE_URL` (production: `https://www.sparesx.com`)
- After deploy: follow the Google Search Console runbook in `docs/SPARESX-OPS-CHECKLIST.md`
- Thin `/parts/...` hubs (`< 2` listings) and soft-duplicate products are `noindex` / sitemap-excluded

## Useful scripts

```bash
npm run build
npm run backfill:catalog-refs   # Product ObjectId refs
npm run backfill:slugs
npm run seed:device-types
npm run seo:audit
```

## Admin seed

Create the first admin user in Mongo (or via your existing seed path), then sign in at `/login`. Admin UI is under `/admin/*` (middleware requires a session cookie; APIs still use `requireAdmin`).

## Chat modes

1. **REST-only** — messages work without the socket process (polling / fetch).
2. **Socket.io** — run `npm run start:socket` (or `npm run dev`) and set `NEXT_PUBLIC_SOCKET_URL` when the socket host differs from the web app.

## Production notes

- Set cookie `secure` via `NODE_ENV=production`
- Do not commit `.env`
- Optional: run catalog backfill after deploying ObjectId catalog refs
- Ops checklist: [`docs/SPARESX-OPS-CHECKLIST.md`](docs/SPARESX-OPS-CHECKLIST.md)
- Legal pages are placeholders for counsel review before payments or KYC claims

## License

Private — all rights reserved unless otherwise stated.
