# SparesX - Active Pages & API Reference

## 📄 **PUBLIC PAGES**

### Core Pages

- **`/`** - Homepage with featured products and categories
- **`/about`** - About SparesX platform
- **`/how-it-works`** - Platform guide for users
- **`/faq`** - Frequently asked questions

### Authentication

- **`/login`** - User login (Technician/Admin)
- **`/register`** - New user registration
- **`/forgot-password`** - Password reset request

### Product Pages

- **`/products`** - Browse all products with filters
- **`/product/[slug]`** - Individual product detail page
- **`/browse`** - Alternative browse interface

### Marketplace

- **`/requests`** - View/create spare part requests
- **`/sellers`** - Browse verified sellers

---

## 🔧 **TECHNICIAN DASHBOARD**

### Main Dashboard

- **`/technician/dashboard`** - Technician overview & stats

### Product Management

- **`/technician/products/new`** - Add new product listing
- **`/technician/products/edit/[id]`** - Edit existing product

### Profile

- **`/technician/profile`** - View/edit technician profile

---

## 👤 **BUYER/SELLER DASHBOARDS**

### Buyer Dashboard

- **`/dashboard/buyer`** - Buyer overview
- **`/dashboard/buyer/enquiries`** - Product enquiries
- **`/dashboard/buyer/requests`** - Spare part requests
- **`/dashboard/buyer/saved`** - Saved products
- **`/dashboard/buyer/profile`** - Buyer profile

### Seller Dashboard

- **`/dashboard/seller`** - Seller overview
- **`/dashboard/seller/listings`** - Manage listings
- **`/dashboard/seller/add`** - Add new listing
- **`/dashboard/seller/messages`** - Messages
- **`/dashboard/seller/verification`** - Verification status
- **`/dashboard/seller/profile`** - Seller profile

---

## 👨‍💼 **ADMIN PANEL**

### Main Admin

- **`/admin`** - Admin dashboard overview
- **`/admin/dashboard`** - Admin statistics

### Management

- **`/admin/device-management`** - Manage categories, brands, device types
- **`/admin/categories`** - Product categories management
- **`/admin/device-categories`** - Device brands management
- **`/admin/products`** - Product moderation
- **`/admin/listings`** - All listings overview

### User Management

- **`/admin/users`** - All users
- **`/admin/technicians`** - Technician verification
- **`/admin/verification`** - Verification requests

### System

- **`/admin/reports`** - Reports & analytics
- **`/admin/settings`** - Platform settings

---

## 🔌 **API ENDPOINTS**

### Authentication APIs

- **`POST /api/auth/login`** - User login
- **`POST /api/auth/register`** - User registration
- **`POST /api/auth/forgot-password`** - Password reset request
- **`POST /api/auth/reset-password`** - Reset password with token

### Public Product APIs

- **`GET /api/products`** - Get products (with filters: brand, partType, condition, price)
- **`GET /api/products/[id]`** - Get single product details

### Category & Brand APIs

- **`GET /api/categories`** - Get all active product categories (Screen, Battery, etc.)
- **`GET /api/categories/[category]/brands`** - Get brands for device type (mobile/laptop/desktop/tv)
- **`GET /api/categories/[category]/brands/[slug]/models`** - Get models for specific brand

### Device Management APIs

- **`GET /api/device-categories`** - Get device type brands (CategoryBrands collection)
- **`GET /api/brands`** - Get all brands (simplified)
- **`GET /api/conditions`** - Get product conditions (new/used)

### Technician APIs

- **`GET /api/technician/products`** - Get technician's products
- **`POST /api/technician/products`** - Create new product
- **`PUT /api/technician/products/[id]`** - Update product
- **`DELETE /api/technician/products/[id]`** - Delete product
- **`GET /api/technician/profile`** - Get technician profile
- **`PUT /api/technician/profile`** - Update technician profile

### Admin APIs - Categories

- **`GET /api/admin/categories`** - Get all categories (admin)
- **`POST /api/admin/categories`** - Create category
- **`PUT /api/admin/categories/[id]`** - Update category
- **`DELETE /api/admin/categories/[id]`** - Delete category

### Admin APIs - Device Types

- **`GET /api/admin/device-types`** - Get device types (Mobile, Laptop, Desktop, TV)
- **`POST /api/admin/device-types`** - Create device type
- **`PUT /api/admin/device-types/[id]`** - Update device type
- **`DELETE /api/admin/device-types/[id]`** - Delete device type

### Admin APIs - Device Brands

- **`GET /api/admin/device-categories`** - Get all device brands
- **`POST /api/admin/device-categories`** - Create device brand
- **`PUT /api/admin/device-categories/[id]`** - Update device brand
- **`DELETE /api/admin/device-categories/[id]`** - Delete device brand

### Admin APIs - Products

- **`GET /api/admin/products`** - Get all products (admin view)
- **`PUT /api/admin/products/[id]`** - Update product status (approve/reject)
- **`DELETE /api/admin/products/[id]`** - Delete product

### Admin APIs - Users

- **`GET /api/admin/users`** - Get all users
- **`PUT /api/admin/users/[id]`** - Update user details
- **`DELETE /api/admin/users/[id]`** - Delete user

### Admin APIs - Technicians

- **`GET /api/admin/technicians`** - Get all technicians
- **`PUT /api/admin/technicians/[id]/verify`** - Verify technician

### Admin APIs - Dashboard

- **`GET /api/admin/dashboard`** - Get admin dashboard stats

### Admin APIs - System

- **`POST /api/admin/seed`** - Seed initial data (dev only)
- **`POST /api/admin/create`** - Create admin user

### Utility APIs

- **`POST /api/upload`** - Upload images (Vercel Blob)
- **`GET /api/requests`** - Get spare part requests
- **`POST /api/requests`** - Create spare part request
- **`GET /api/sellers`** - Get verified sellers

### Deprecated APIs (Kept for backward compatibility)

- **`GET /api/part-types`** - ⚠️ DEPRECATED - Now redirects to /api/categories

---

## 📊 **DATABASE COLLECTIONS**

### Core Collections (Active)

- **`users`** - User accounts (technician, admin, buyer, seller)
- **`products`** - Product listings
- **`categories`** - Product categories (Screen, Battery, Camera, etc.) - **18 items**
- **`devicetypes`** - Device types (Mobile, Laptop, Desktop, TV) - **4 items**
- **`categorybrands`** - Device brands (Apple, Samsung, Dell, etc.) - **18 brands**
- **`orders`** - Order history
- **`requests`** - Spare part requests

### Deprecated Collections

- **`parttypes`** - ⚠️ DEPRECATED - Replaced by `categories` collection

---

## 🗂️ **ACTIVE SCRIPTS**

### Seeding Scripts

- **`scripts/seed.ts`** - Main seed script
- **`scripts/seed-admin.js`** - Seed admin user
- **`scripts/seed-categories.js`** - Seed product categories (17 categories)
- **`scripts/seed-device-types.ts`** - Seed device types (4 types)
- **`scripts/seed-device-categories.js`** - Seed device brands (18 brands)
- **`scripts/check-database.js`** - Database verification utility

### Package.json Scripts

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint",
"seed:device-types": "tsx scripts/seed-device-types.ts"
```

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### JWT-based Authentication

- Tokens stored in localStorage
- JWT verification via `/lib/auth/jwt.ts`
- Middleware protection via `/lib/auth/middleware.ts`

### User Roles

- **`admin`** - Full platform access
- **`technician`** - Can list products, manage profile
- **`buyer`** - Can browse, request parts
- **`seller`** - Can sell products (future)

---

## 📁 **KEY MODELS**

Located in `/src/lib/models/`:

- **`User.ts`** - User accounts
- **`Product.ts`** - Product listings
- **`Category.ts`** - Product categories
- **`DeviceType.ts`** - Device types
- **`CategoryBrand.ts`** - Device brands with models
- **`Order.ts`** - Orders
- **`Request.ts`** - Spare part requests

---

## 🎨 **UI COMPONENTS**

Located in `/src/components/`:

- **`Navbar.tsx`** - Main navigation bar

Page-specific components in respective `_components/` folders.

---

## 📌 **IMPORTANT NOTES**

### Unified Category System

All pages now use the **unified `/api/categories` endpoint** for product categories:

- Admin page manages categories
- Product add/edit pages fetch from categories
- Browse/filter pages use categories
- No more duplicate `parttypes` collection

### Database Structure

- **categories** = Spare part types (Screen, Battery, etc.)
- **devicetypes** = Device types (Mobile, Laptop, etc.)
- **categorybrands** = Device brands (Apple, Samsung, etc.)

### Environment Variables Required

```env
MONGODB_URI=mongodb://localhost:27017/spares-x
JWT_SECRET=your-secret-key
BLOB_READ_WRITE_TOKEN=vercel-blob-token (for image uploads)
```

---

**Last Updated:** February 1, 2026
**Project Status:** ✅ Active Development
**Database:** MongoDB (Local: spares-x)
