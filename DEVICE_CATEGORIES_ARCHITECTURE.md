# Device Categories System - Integration Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     SparesX Product System                       │
└──────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
    ADMIN PANEL        TECHNICIAN PORTAL    PUBLIC SHOPPING
        ↓                     ↓                     ↓
  Device Categories    Product Creation       Product Browsing
  & Brands Manager     & Editing               & Filtering
        ↓                     ↓                     ↓
  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │ CategoryBrand       │ Products    │      │ Products    │
  │ Management UI       │ Form (NEW)  │      │ Listing     │
  │                     │ & (EDIT)    │      │ Page        │
  └─────────────┘      └─────────────┘      └─────────────┘
        ↓                     ↓                     ↓
        └─────────────────────┼─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  API Layer          │
                    │                     │
                    │ GET /api/admin/     │
                    │   device-categories │
                    │ POST /api/admin/    │
                    │   device-categories │
                    │ PUT /api/admin/     │
                    │   device-categories/│
                    │   {id}              │
                    │ DELETE /api/admin/  │
                    │   device-categories/│
                    │   {id}              │
                    │ GET /api/categories/│
                    │   {category}/brands │
                    │ GET /api/categories/│
                    │   {category}/brands/│
                    │   {slug}/models     │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  MongoDB            │
                    │                     │
                    │ CategoryBrand       │
                    │ Collection          │
                    │                     │
                    │ Brands:             │
                    │ - Apple             │
                    │ - Samsung           │
                    │ - Google            │
                    │ - ...               │
                    │                     │
                    │ Models per Brand:   │
                    │ - iPhone 15 Pro     │
                    │ - Galaxy S24        │
                    │ - Pixel 8 Pro       │
                    │ - ...               │
                    └─────────────────────┘
```

## Detailed Component Architecture

### 1. Admin Layer

```
/admin/device-categories (Page)
├── State Management
│   ├── brands: CategoryBrand[]
│   ├── selectedCategory: DeviceCategory
│   ├── editingBrand: CategoryBrand | null
│   ├── formData: FormData
│   ├── newModel: ModelInput
│   ├── loading: boolean
│   ├── error: string
│   └── success: string
│
├── Functions
│   ├── fetchBrands()
│   ├── handleAddNew()
│   ├── handleEdit(brand)
│   ├── handleAddModel()
│   ├── handleRemoveModel(index)
│   ├── handleSubmit(e)
│   └── handleDelete(id)
│
├── UI Components
│   ├── Header (Title + Add Button)
│   ├── Alert Messages (Error/Success)
│   ├── Form (Conditional)
│   ├── Category Tabs
│   └── Brands Table
│
└── API Calls
    ├── GET /api/admin/device-categories
    ├── POST /api/admin/device-categories
    ├── PUT /api/admin/device-categories/{id}
    └── DELETE /api/admin/device-categories/{id}
```

### 2. Technician Layer

```
/technician/products/new (Product Creation)
├── State Management
│   ├── form: FormData
│   │   ├── deviceCategory: DeviceCategory
│   │   ├── brand: string
│   │   ├── brandSlug: string
│   │   ├── deviceModel: string
│   │   ├── modelNumber: string
│   │   ├── partType: PartType
│   │   ├── description: string
│   │   ├── price: number
│   │   ├── condition: ProductCondition
│   │   └── images: File[]
│   │
│   ├── brands: CategoryBrand[] (fetched)
│   ├── models: IModel[] (fetched)
│   └── loading/error states
│
├── Form Flow
│   ├── Step 1: Select Device Category
│   │   └── Buttons: 📱 Mobile, 💻 Laptop, 🖥️ Desktop
│   │
│   ├── Step 2: Select Brand & Model
│   │   ├── Fetch brands: GET /api/categories/{category}/brands
│   │   ├── Brand dropdown (searchable)
│   │   ├── Fetch models: GET /api/categories/{category}/brands/{slug}/models
│   │   └── Model dropdown (shows when brand selected)
│   │
│   └── Step 3: Product Details (shows only when all above filled)
│       ├── Name (auto-populated from model)
│       ├── Part Type
│       ├── Description
│       ├── Price
│       ├── Condition
│       └── Images
│
└── API Calls
    ├── GET /api/categories/{category}/brands
    ├── GET /api/categories/{category}/brands/{slug}/models
    └── POST /api/technician/products
```

```
/technician/products/edit/[id] (Product Editing)
├── Mirrors the creation page structure
├── Pre-fills form with existing product data
├── Same cascading dropdown system
├── Allows modification of device category and model
└── PUT /api/technician/products/{id}
```

### 3. Public Layer

```
/products (Product Listing)
├── Product Filters (Optional Enhancement)
│   ├── Filter by: Device Category, Brand, etc.
│   └── Real-time updates (no Apply button)
│
├── Product Grid
│   ├── 3 columns (desktop)
│   ├── 2 columns (tablet)
│   └── 1 column (mobile)
│
└── Display Fields from ProductSchema
    ├── name
    ├── brand
    ├── deviceModel
    ├── price
    ├── images
    ├── condition
    └── deviceCategory (badge display)
```

## Data Flow Examples

### Example 1: Creating a New Product

```
Technician visits /technician/products/new
    ↓
[Step 1] Selects "Mobile" category
    ↓
Page shows Brand dropdown
    ↓
API: GET /api/categories/mobile/brands
    ↓
Returns: [Apple, Samsung, Google, ...]
    ↓
[Step 2] Selects "Apple" from dropdown
    ↓
API: GET /api/categories/mobile/brands/apple/models
    ↓
Returns: [{name: "iPhone 15 Pro", modelNumber: "A3108", ...}, ...]
    ↓
Model dropdown appears with 5 Apple models
    ↓
Selects "iPhone 15 Pro"
    ↓
[Step 3] Product name auto-fills with "iPhone 15 Pro"
    ↓
Form shows all product details fields
    ↓
Fills: Part Type, Description, Price, Condition, Images
    ↓
Submits form
    ↓
API: POST /api/technician/products
    {
      "deviceCategory": "mobile",
      "brand": "Apple",
      "deviceModel": "iPhone 15 Pro",
      "modelNumber": "A3108",
      "partType": "screen",
      "description": "Original OLED display",
      "price": 15000,
      "condition": "new",
      "images": [...]
    }
    ↓
Product saved to MongoDB
    ↓
Redirects to /technician/products
    ↓
New product visible in technician's list
```

### Example 2: Admin Managing Brands

```
Admin visits /admin/device-categories
    ↓
API: GET /api/admin/device-categories
    ↓
Returns: All brands organized by category
    ↓
Sees tabs: [📱 Mobile (7)] [💻 Laptop (6)] [🖥️ Desktop (5)]
    ↓
Clicks "📱 Mobile" tab
    ↓
Table shows 7 mobile brands with edit/delete buttons
    ↓
Clicks "+ Add Brand"
    ↓
Form appears with category selection
    ↓
Selects "📱 Mobile"
    ↓
Fills: Name "OnePlus", Logo URL
    ↓
Slug auto-generates as "oneplus"
    ↓
Adds 3 models:
    - OnePlus 12 (Model: CPH2417)
    - OnePlus 11 (Model: CPH2391)
    - OnePlus 10 Pro (Model: NE2213)
    ↓
Clicks "Create Brand"
    ↓
API: POST /api/admin/device-categories
    {
      "category": "mobile",
      "name": "OnePlus",
      "slug": "oneplus",
      "logo": "https://...",
      "models": [
        {"name": "OnePlus 12", "modelNumber": "CPH2417"},
        ...
      ],
      "isActive": true
    }
    ↓
Brand saved to MongoDB
    ↓
✓ Success message shows
    ↓
OnePlus appears in mobile brands table
    ↓
Now available in /technician/products/new dropdown
```

### Example 3: Product Filtering (Future)

```
User visits /products
    ↓
Filters section shows:
├─ Device Category: [All ▼]
├─ Brand: [All ▼]
└─ Part Type: [All ▼]
    ↓
User selects Device Category → "Mobile"
    ↓
Brands dropdown updates automatically (mobile brands only)
    ↓
API: GET /api/categories/mobile/brands
    ↓
User selects Brand → "Apple"
    ↓
Product grid filters in real-time
    ↓
Shows only Apple mobile products
    ↓
User can further refine by Part Type
    ↓
Grid shows iPhone screens, batteries, chargers, etc.
```

## Database Schema Relationships

```
CategoryBrand Collection
├── _id: ObjectId
├── category: "mobile" | "laptop" | "desktop"
├── name: string (e.g., "Apple")
├── slug: string (e.g., "apple")
├── logo?: string (URL)
├── models: Array
│   └── {
│       name: string (e.g., "iPhone 15 Pro"),
│       modelNumber?: string (e.g., "A3108"),
│       releaseYear?: number (e.g., 2024)
│     }
├── isActive: boolean
├── createdAt: Date
└── updatedAt: Date

        ↕️ (Referenced by)

Product Collection
├── _id: ObjectId
├── deviceCategory: "mobile" | "laptop" | "desktop"
├── brand: string (matches CategoryBrand.name)
├── deviceModel: string (matches models[].name)
├── modelNumber?: string (matches models[].modelNumber)
├── partType: string
├── description: string
├── price: number
├── condition: "new" | "used"
├── images: Array<string>
├── status: "pending" | "approved" | "rejected"
├── technician: ObjectId (ref to User)
├── createdAt: Date
└── updatedAt: Date
```

## API Endpoint Map

```
Admin Operations
├── GET    /api/admin/device-categories
│           → Fetch all brands (with optional category filter)
│
├── POST   /api/admin/device-categories
│           → Create new brand with models
│
├── PUT    /api/admin/device-categories/{id}
│           → Update brand details and models
│
└── DELETE /api/admin/device-categories/{id}
            → Delete brand and all models

Public Cascading Dropdowns
├── GET    /api/categories/{category}/brands
│           → Fetch brands for selected category
│           → Used in: /technician/products/new
│           → Used in: /technician/products/edit/[id]
│
└── GET    /api/categories/{category}/brands/{slug}/models
            → Fetch models for selected brand+category
            → Used in: /technician/products/new
            → Used in: /technician/products/edit/[id]

Product Operations (Future Enhancement)
├── GET    /api/products?deviceCategory=mobile
│           → Fetch products filtered by category
│
├── GET    /api/products?brand=apple
│           → Fetch products filtered by brand
│
└── GET    /api/products?category=mobile&brand=apple&partType=screen
            → Fetch products with multiple filters
```

## Type Definitions

```typescript
// Device Category
type DeviceCategory = "mobile" | "laptop" | "desktop";

// Model Definition
interface IModel {
  name: string;
  modelNumber?: string;
  releaseYear?: number;
}

// Category Brand Document
interface ICategoryBrand extends Document {
  category: DeviceCategory;
  name: string;
  slug: string;
  logo?: string;
  models: IModel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Integration
interface IProduct extends Document {
  deviceCategory: DeviceCategory;
  brand: string;
  deviceModel: string;
  modelNumber?: string;
  partType: PartType;
  // ... other fields
}

// Admin Form State
interface FormData {
  category: DeviceCategory;
  name: string;
  slug: string;
  logo: string;
  models: IModel[];
  isActive: boolean;
}

// New Model Input
interface ModelInput {
  name: string;
  modelNumber: string;
  releaseYear: string;
}
```

## Security Architecture

```
                    User Request
                         ↓
                  Authentication Layer
                  ├─ Check JWT token
                  ├─ Extract user role
                  └─ Validate expiration
                         ↓
                  Authorization Layer
                  ├─ Check if user role === "admin"
                  │  (for admin endpoints)
                  └─ Check if user is logged in
                     (for technician endpoints)
                         ↓
                  Input Validation
                  ├─ Validate category enum
                  ├─ Check required fields
                  ├─ Validate URL formats
                  └─ Sanitize strings
                         ↓
                  Database Query
                  ├─ Use MongoDB ObjectId validation
                  ├─ Use Mongoose schema validation
                  └─ Apply compound unique indexes
                         ↓
                  Response
                  ├─ Return sanitized data
                  └─ No sensitive information exposed
```

## Performance Considerations

### Database Indexes

```
CategoryBrand Collection
├── Index 1: { category: 1, slug: 1 }
│              ↳ Unique compound index
│              ↳ Fast lookups by category + slug
│
└── Index 2: { category: 1 }
               ↳ Fast filtering by category
```

### Query Optimization

```
Fetch Mobile Brands
├─ Query: { category: "mobile" }
├─ Index Used: { category: 1 }
├─ Expected Time: < 5ms
└─ Returns: ~7 brands

Fetch Apple Mobile Models
├─ Query: { category: "mobile", slug: "apple" }
├─ Index Used: { category: 1, slug: 1 }
├─ Expected Time: < 5ms
└─ Returns: ~5 models
```

### Caching Strategy (Future)

```
Layer 1: Browser Cache
├─ Cache category brands for 1 hour
└─ Cache models for 1 hour

Layer 2: Server Cache (Redis - Future)
├─ Cache all brands: 24 hours
├─ Cache brands by category: 24 hours
└─ Invalidate on admin update

Layer 3: Database
└─ MongoDB with indexes
```

## Scalability Plan

```
Current State (< 100 technicians)
├─ Single MongoDB instance
├─ 20-50 brands
├─ 100-300 models
└─ Fast queries (< 100ms)

Growth Phase (100-1000 technicians)
├─ Add database indexing
├─ Implement Redis caching
├─ Add pagination to admin page
└─ Expected: Still < 500ms response

Scale Phase (1000+ technicians)
├─ Database sharding by category
├─ Multi-region Redis cache
├─ CDN for logo images
├─ API rate limiting
└─ Expected: < 200ms globally
```

## Monitoring & Debugging

```
Admin Metrics to Track
├─ Brand creation rate
├─ Model count per brand
├─ Update frequency
├─ Delete operations
└─ Form submission errors

API Metrics
├─ GET /api/admin/device-categories
│  └─ Response time, error rate
├─ POST /api/admin/device-categories
│  └─ Success rate, validation errors
├─ GET /api/categories/{category}/brands
│  └─ Cache hit rate, response time
└─ GET /api/categories/.../models
   └─ Query time, model count

Alerts to Set
├─ API response time > 1000ms
├─ Error rate > 5%
├─ Database connection failed
├─ Unauthorized attempts > 10/hour
└─ Large number of delete operations
```

## Summary

This system provides:

- ✅ Centralized admin interface for brand/model management
- ✅ Cascading dropdowns for intuitive product creation
- ✅ Automatic slug generation and validation
- ✅ Real-time form updates
- ✅ Clean API for future mobile app integration
- ✅ Scalable database design
- ✅ Professional error handling
- ✅ Mobile-responsive UI
- ✅ Security through JWT and role validation
- ✅ Performance through indexing and caching
