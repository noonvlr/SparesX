# SparesX production environment variables

Copy from `.env.example`. **Never commit real secret values.**

This document lists variables found in the repository. Values must be verified in the deployed environment (Vercel / host secrets UI).

| Variable | Purpose | Required in production | Used by |
|----------|---------|------------------------|---------|
| `MONGODB_URI` | MongoDB connection string | **Yes** (or `MONGO_URI` / `DATABASE_URL`) | `src/lib/db/connect.ts` |
| `MONGO_URI` | Alias for Mongo URI | Alt | same |
| `DATABASE_URL` | Alias for Mongo URI | Alt | same |
| `MONGODB_DB_NAME` | Database name override | No (default `sparesx`) | db connect |
| `JWT_SECRET` | Signs access JWTs | **Yes** | `src/lib/auth/jwt.ts` |
| `OTP_PEPPER` | Hashes OTPs at rest | Strongly recommended (falls back to `JWT_SECRET`) | `src/lib/security/secrets.ts` |
| `SETTINGS_ENCRYPTION_KEY` | Encrypts SMS/SMTP secrets in Site Settings (≥32 chars) | **Yes** if admin SMS/SMTP overrides used | `src/lib/security/secrets.ts` |
| `NEXT_PUBLIC_BASE_URL` | App origin for SSR self-fetch / CORS fallback | **Yes** | layout/fetch/socket helpers |
| `NEXT_PUBLIC_SITE_URL` | Canonical SEO host (`https://www.sparesx.com`) | **Yes** | `src/lib/seo/site.ts`, robots, sitemap, OG |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads | **Yes** on serverless | `src/app/api/upload/route.ts` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Transactional email | Required for email OTP / password reset | email services |
| `EMAIL_USER` / `EMAIL_PASSWORD` | Alternate SMTP auth | Optional alt | email services |
| `GOOGLE_CLIENT_ID` | Google ID token audience (server) | Required for Google Sign-In | `src/app/api/auth/google*` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google GIS client (browser) | Required for Google Sign-In UI | `src/lib/auth/googleClient.ts` |
| `SOCKET_PORT` | Companion Socket.io listen port | Dev / dedicated socket host | `server/index.ts` |
| `SOCKET_CORS_ORIGIN` | Allowed origins for socket | When socket host used | socket server |
| `NEXT_PUBLIC_SOCKET_URL` | Browser socket endpoint | When realtime chat enabled | `src/lib/chat/socketUrl.ts` |
| `NEXT_PUBLIC_SOCKET_PORT` | Local socket port hint | Dev only | socket URL helper |
| `REDIS_URL` | Rate-limit / optional Redis | Recommended for multi-instance | rate limit / adapters |
| `SOCKET_REDIS_URL` | Socket.io Redis adapter | Multi-instance sockets | socket server |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web push | Optional | push APIs |
| `ATLAS_SEARCH_INDEX` | Atlas Search index name | Optional | product search |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring | Optional | Sentry init |
| `SENTRY_ENVIRONMENT` | Sentry env label | Optional | Sentry |
| `SENTRY_TRACES_SAMPLE_RATE` | Trace sample rate | Optional | Sentry |
| `NEXT_PUBLIC_ADS_ENABLED` | Ads slot placeholders | Optional | `AdSlot.tsx` |

AdSense site script (`ca-pub-8411517519858379`) is hardcoded in `src/components/AdSenseScript.tsx` plus `public/ads.txt`. Not a secret.
| `NODE_ENV` | `production` / `development` | Set by host | cookies, CSP, uploads |

## Not primary env (admin Site Settings)

Twilio / MSG91 SMS credentials and optional SMTP overrides are stored **encrypted in MongoDB** via Admin → Site Settings, using `SETTINGS_ENCRYPTION_KEY`. Configure and test in the deployed admin UI.

## Callback / OAuth notes

- Google Sign-In uses **GIS ID token** verification against `GOOGLE_CLIENT_ID` (not a classic redirect OAuth callback URL in this codebase).
- Ensure the Google Cloud OAuth client allows your production origin(s) (`NEXT_PUBLIC_SITE_URL` / app host).
- Canonical SEO must use `NEXT_PUBLIC_SITE_URL=https://www.sparesx.com` — do not point it at preview URLs.

## CSP

`Content-Security-Policy-Report-Only` is set in `next.config.ts`. Browser console reports violations without blocking. Enforce only after manual QA.

## Verification

Production secret presence and correctness: **REQUIRES EXTERNAL/MANUAL VERIFICATION** (host dashboard + smoke tests). Do not paste secret values into tickets or chat.
