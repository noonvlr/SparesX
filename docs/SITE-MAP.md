# SparesX — Full Site Map

Base URL: `https://www.sparesx.com`

Generated from the App Router (`src/app`). Dynamic SEO sitemap (crawlable public URLs only) is served at `/sitemap.xml` via `src/app/sitemap.ts`.

---

## 1. Public & marketing pages

| Path | Notes |
|------|--------|
| `/` | Homepage |
| `/about` | About SparesX |
| `/how-it-works` | How it works |
| `/faq` | FAQ |
| `/trust-score` | Trust score explained |
| `/guidelines` | Community guidelines |
| `/technician-guidelines` | Technician guidelines |
| `/prohibited-items` | Prohibited items |
| `/disputes` | Dispute policy |
| `/refund` | Refund policy |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/report-abuse` | Report abuse |
| `/support` | Support hub |
| `/support/report` | Submit support / report |
| `/support/submitted` | Submission confirmation |
| `/support/cases` | User’s support cases (auth) |
| `/support/cases/[id]` | Support case detail (auth) |

---

## 2. Browse & marketplace

| Path | Notes |
|------|--------|
| `/products` | Browse / search listings |
| `/product/[slug]` | Listing detail |
| `/parts` | Parts index (qualifying part types) |
| `/parts/[category]` | Brands for a part type (≥2-listing hubs) |
| `/parts/[category]/[brand]` | Models for part type + brand |
| `/parts/[category]/[brand]/[model]` | Parts hub by part type / brand / model |
| `/technicians` | Technician directory |
| `/u/[id]` | Public technician / user profile |
| `/requests` | Open part requests board |
| `/requests/mine` | My requests (auth) |

---

## 3. Auth & account

| Path | Notes |
|------|--------|
| `/login` | Sign in |
| `/register` | Sign up |
| `/forgot-password` | Password recovery |
| `/verify` | Email / phone verification |
| `/complete-profile` | Finish profile after signup / Google |
| `/whatsapp-connect` | WhatsApp connect flow |
| `/messages` | In-app chat |
| `/notifications` | Notifications inbox |

---

## 4. Technician (primary seller UI)

| Path | Notes |
|------|--------|
| `/technician/dashboard` | Seller dashboard + site updates |
| `/technician/products` | My listings |
| `/technician/products/new` | Create listing |
| `/technician/products/edit/[id]` | Edit listing |
| `/technician/profile` | Seller profile & trust |

---

## 5. Dashboard aliases (legacy)

### Buyer (still present — Phase 1 did not change these)

| Path | Notes |
|------|--------|
| `/dashboard/buyer` | Soft redirect → technician dashboard |
| `/dashboard/buyer/saved` | Live saved listings UI |
| `/dashboard/buyer/requests` | Redirect → `/requests?tab=mine` |
| `/dashboard/buyer/enquiries` | Soft redirect → `/messages` |
| `/dashboard/buyer/profile` | Soft redirect → `/technician/profile` |

### Seller (removed — permanent redirects in `next.config.ts`)

| Legacy path | Permanent destination |
|-------------|------------------------|
| `/dashboard/seller` | `/technician/dashboard` |
| `/dashboard/seller/listings` | `/technician/products` |
| `/dashboard/seller/add` | `/technician/products/new` |
| `/dashboard/seller/messages` | `/messages` |
| `/dashboard/seller/profile` | `/technician/profile` |
| `/dashboard/seller/verification` | `/technician/profile` |

Canonical seller/technician UI: `/technician/*` (see section 4).

---

## 6. Admin

| Path | Notes |
|------|--------|
| `/admin` | Admin entry |
| `/admin/dashboard` | Admin dashboard |
| `/admin/settings` | Settings hub |
| `/admin/site-settings` | SMS / site config |
| `/admin/updates` | Site updates (dashboard feed) |
| `/admin/users` | User management |
| `/admin/technicians` | Permanent redirect → `/admin/users` |
| `/admin/listings` | Listings moderation |
| `/admin/products` | Products |
| `/admin/requests` | Requests moderation |
| `/admin/categories` | Part categories |
| `/admin/device-categories` | Device categories |
| `/admin/device-management` | Device / catalog management |
| `/admin/verification` | KYC / verification |
| `/admin/chat` | Chat moderation |
| `/admin/support` | Support inbox |
| `/admin/support/[id]` | Support case detail |
| `/admin/reports` | Reports |
| `/admin/disputes` | Disputes |

---

## 7. SEO / system routes

| Path | Notes |
|------|--------|
| `/sitemap.xml` | Dynamic public sitemap |
| `/robots.txt` | Crawler rules |
| `/icon.png` | App icon |
| `/apple-icon.png` | Apple touch icon |

### Included in `/sitemap.xml` (crawlable)

Static: `/`, `/products`, `/requests`, `/technicians`, `/support`, `/how-it-works`, `/about`, `/faq`, `/trust-score`, `/technician-guidelines`, `/guidelines`, `/prohibited-items`, `/disputes`, `/refund`, `/report-abuse`, `/terms`, `/privacy`

Dynamic (from DB): `/product/[slug]`, `/parts` hierarchy (`/parts`, `/parts/[category]`, `/parts/[category]/[brand]`, and `/parts/[category]/[brand]/[model]` hubs with ≥2 listings), `/u/[id]` (active sellers)

Auth, admin, and dashboard URLs are **not** in the SEO sitemap.

---

## 8. API map

### Auth — `/api/auth/…`

| Method path | Purpose |
|-------------|---------|
| `POST /api/auth/register` | Register |
| `POST /api/auth/login` | Login |
| `POST /api/auth/logout` | Logout |
| `POST /api/auth/refresh` | Refresh token |
| `GET /api/auth/me` | Current user |
| `POST /api/auth/google` | Google sign-in |
| `POST /api/auth/google/link` | Link Google account |
| `POST /api/auth/change-password` | Change password |
| `POST /api/auth/forgot-password/request` | Request reset OTP |
| `POST /api/auth/forgot-password/verify` | Verify reset OTP |
| `POST /api/auth/forgot-password/reset` | Set new password |
| `POST /api/auth/verify/email/send` | Send email OTP |
| `POST /api/auth/verify/email/confirm` | Confirm email OTP |
| `POST /api/auth/verify/phone/send` | Send phone OTP |
| `POST /api/auth/verify/phone/confirm` | Confirm phone OTP |
| `GET /api/auth/verify/status` | Verification status |

### Catalog & marketplace — `/api/…`

| Path | Purpose |
|------|---------|
| `/api/products` | List / create products |
| `/api/products/[id]` | Product by id |
| `/api/brands` | Brands |
| `/api/brands/[slug]/models` | Models for brand |
| `/api/categories` | Categories |
| `/api/categories/[category]/brands` | Brands in category |
| `/api/categories/[category]/brands/[slug]/models` | Models |
| `/api/device-categories` | Device categories |
| `/api/device-management/part-categories` | Part categories |
| `/api/device-management/part-categories/[id]` | Part category |
| `/api/device-management/part-categories/[id]/disable` | Disable category |
| `/api/conditions` | Conditions list |
| `/api/cities` | Cities |
| `/api/sellers` | Technician directory API (legacy path name; response `{ sellers }`) |
| `/api/users/[id]/public` | Public profile API |
| `/api/upload` | Image upload |
| `/api/ratings` | Seller ratings |

### Requests

| Path | Purpose |
|------|---------|
| `/api/requests` | List / create requests |
| `/api/requests/[id]` | Request detail / update |
| `/api/requests/[id]/matches` | Matching listings |

### Technician (seller)

| Path | Purpose |
|------|---------|
| `/api/technician/products` | My products |
| `/api/technician/products/bulk` | Bulk price / sold / delete |
| `/api/technician/products/edit/[id]` | Edit product |
| `/api/technician/products/delete/[id]` | Delete (approved → sold) |
| `/api/technician/products/sold/[id]` | Mark sold |
| `/api/technician/products/relist/[id]` | Relist sold |
| `/api/technician/profile` | Seller profile |
| `/api/technician/analytics` | Dashboard analytics |
| `/api/technician/demand` | Demand signals |

### Chat

| Path | Purpose |
|------|---------|
| `/api/chat/conversations` | Conversations |
| `/api/chat/conversations/[id]` | Conversation detail |
| `/api/chat/messages` | Send / list messages |
| `/api/chat/messages/[conversationId]` | Messages in thread |
| `/api/chat/messages/item/[id]` | Single message |
| `/api/chat/messages/read` | Mark read |
| `/api/chat/block` | Block user |
| `/api/chat/presence` | Presence |
| `/api/chat/unread-count` | Unread count |

### Saved, notifications, push

| Path | Purpose |
|------|---------|
| `/api/saved` | Saved listings |
| `/api/saved/[productId]` | Save / unsave one |
| `/api/saved-searches` | Saved searches |
| `/api/saved-searches/[id]` | One saved search |
| `/api/notifications` | Notifications |
| `/api/notifications/unread-count` | Unread count |
| `/api/push/subscribe` | Web push subscribe |
| `/api/push/vapid-public-key` | VAPID public key |

### Support & WhatsApp

| Path | Purpose |
|------|---------|
| `/api/support` | Create / list support |
| `/api/support/[id]` | Support case |
| `/api/support/context` | Report context |
| `/api/whatsapp-connect` | WhatsApp connect |
| `/api/whatsapp-connect/[id]` | Connect by id |

### Site updates (dashboard feed)

| Path | Purpose |
|------|---------|
| `/api/updates` | Published updates (auth) |
| `/api/admin/updates` | Admin list / create |
| `/api/admin/updates/[id]` | Admin patch / delete |

### Admin

| Path | Purpose |
|------|---------|
| `/api/admin/dashboard` | Dashboard stats |
| `/api/admin/users` | Users list / create |
| `/api/admin/users/[id]` | User get / update / delete |
| `/api/admin/users/[id]/ratings` | User ratings |
| `/api/admin/users/[id]/reset-password` | Reset password |
| `/api/admin/products` | Admin products |
| `/api/admin/products/[id]` | Product moderation |
| `/api/admin/products/bulk` | Bulk product actions |
| `/api/admin/requests` | Admin requests |
| `/api/admin/requests/[id]` | Request moderation |
| `/api/admin/categories` | Categories |
| `/api/admin/categories/[id]` | Category by id |
| `/api/admin/categories/reconcile` | Reconcile categories |
| `/api/admin/device-categories` | Device categories |
| `/api/admin/device-categories/[id]` | Device category |
| `/api/admin/device-types` | Device types |
| `/api/admin/device-types/[id]` | Device type |
| `/api/admin/catalog-import` | Catalog import |
| `/api/admin/seed/mobile-brands` | Seed brands |
| `/api/admin/site-settings` | Site settings |
| `/api/admin/site-settings/test-sms` | Test SMS |
| `/api/admin/support` | Support inbox |
| `/api/admin/support/[id]` | Support case |
| `/api/admin/support/unread-count` | Support unread |
| `/api/admin/chat/conversations` | Admin conversations |
| `/api/admin/chat/conversations/[id]` | Admin conversation |
| `/api/admin/chat/messages/[id]` | Admin message |

---

## 9. Counts (approximate)

| Layer | Count |
|-------|------:|
| App pages (`page.tsx`) | ~68 |
| API route handlers | ~97 |
| Public SEO static paths | 17 |
| Dynamic SEO paths | products + parts hubs + seller profiles |

---

## 10. Related realtime

Chat also uses a separate Socket.io server (`server/index.ts`), not listed as HTTP pages above.
