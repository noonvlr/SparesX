# Device Categories & Brands Admin Management

## Overview

The **Device Categories & Brands** admin page allows administrators to manage device brands and their models across three device categories (mobile, laptop, desktop). This feature powers the cascading dropdown system used in product creation and editing.

## Features

### 1. **Device Category Selection**

- Three main categories: **Mobile (📱)**, **Laptop (💻)**, **Desktop (🖥️)**
- Tab-based interface to filter brands by category
- Category counts displayed on each tab

### 2. **Brand Management**

#### Create New Brand

- Brand name (auto-generates slug)
- Optional logo URL
- Active/Inactive toggle
- Automatic slug generation from name

#### Edit Brand

- Modify all brand details
- Update models list
- Preserve brand history

#### Delete Brand

- Confirmation dialog
- Cascades to remove all associated models

### 3. **Device Models**

Each brand contains multiple device models with:

- **Model Name** (required): e.g., "iPhone 15 Pro"
- **Model Number** (optional): e.g., "A3108"
- **Release Year** (optional): e.g., "2024"

#### Model Operations

- **Add Model**: Quick form to add new models
- **Remove Model**: Delete models from the brand
- **Display**: Shows all models with full details

## UI/UX Components

### Layout Structure

```
Header (Title + Add Brand Button)
  ↓
Alert Messages (Error/Success)
  ↓
Form (Create/Edit - Conditional)
  ↓
Category Tabs
  ↓
Brands Table
```

### Visual Design

- **Gradient Background**: `from-gray-50 to-white`
- **Form Cards**: Rounded corners with shadow
- **Category Buttons**: Blue ring selection indicator
- **Status Badges**: Green (Active) / Gray (Inactive)
- **Model Counter**: Circular badge showing model count

### Responsive Design

- Mobile-first approach
- Full-width on small screens
- Horizontal scroll on tables if needed
- Tab-based filtering for better mobile UX

## API Endpoints

### GET `/api/admin/device-categories`

**Fetch all brands (optionally filtered by category)**

```bash
GET /api/admin/device-categories?category=mobile
Headers: Authorization: Bearer {token}
```

Response:

```json
{
  "brands": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "category": "mobile",
      "name": "Apple",
      "slug": "apple",
      "logo": "https://...",
      "models": [
        {
          "name": "iPhone 15 Pro",
          "modelNumber": "A3108",
          "releaseYear": 2024
        }
      ],
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 7
}
```

### POST `/api/admin/device-categories`

**Create a new brand**

```bash
POST /api/admin/device-categories
Content-Type: application/json
Authorization: Bearer {token}

{
  "category": "mobile",
  "name": "Apple",
  "slug": "apple",
  "logo": "https://example.com/apple.png",
  "models": [
    {
      "name": "iPhone 15 Pro",
      "modelNumber": "A3108",
      "releaseYear": 2024
    }
  ],
  "isActive": true
}
```

Response:

```json
{
  "brand": { ... },
  "message": "Brand created successfully"
}
```

### PUT `/api/admin/device-categories/[id]`

**Update an existing brand**

```bash
PUT /api/admin/device-categories/507f1f77bcf86cd799439011
Content-Type: application/json
Authorization: Bearer {token}

{ ...brand data... }
```

### DELETE `/api/admin/device-categories/[id]`

**Delete a brand and all its models**

```bash
DELETE /api/admin/device-categories/507f1f77bcf86cd799439011
Authorization: Bearer {token}
```

## Data Validation

### Brand Validation

- ✅ Category must be: `mobile`, `laptop`, or `desktop`
- ✅ Name is required and must be non-empty
- ✅ Slug is required and must be non-empty
- ✅ Slug + Category combination must be unique
- ✅ Logo URL must be valid (if provided)

### Model Validation

- ✅ Model name is required
- ✅ Model number is optional
- ✅ Release year must be valid number (if provided)

## Integration Points

### 1. **Product Creation/Editing**

The brands and models created here power the cascading dropdowns in:

- `/technician/products/new` - Product creation form
- `/technician/products/edit/[id]` - Product editing form

API endpoints consumed:

- `GET /api/categories/[category]/brands` - Fetch brands by category
- `GET /api/categories/[category]/brands/[slug]/models` - Fetch models for brand

### 2. **Product Filtering**

Main products page (`/products`) can filter by device category and brand

### 3. **Database Model**

Uses the `CategoryBrand` model:

```typescript
interface ICategoryBrand extends Document {
  category: DeviceCategory; // 'mobile' | 'laptop' | 'desktop'
  name: string; // Brand name
  slug: string; // URL-friendly identifier
  logo?: string; // Brand logo URL
  models: IModel[]; // Array of device models
  isActive: boolean; // Active status
  createdAt: Date;
  updatedAt: Date;
}
```

## Workflow Example

### Creating a New Mobile Brand

1. **Click "Add Brand"** → Form appears
2. **Select Category**: Click 📱 Mobile button
3. **Enter Brand Details**:
   - Name: "Samsung"
   - Slug: auto-fills as "samsung"
   - Logo: (optional) https://...
   - Active: ✓ checked
4. **Add Models**:
   - Model Name: "Galaxy S24"
   - Model Number: "SM-S928"
   - Release Year: 2024
   - Click "Add Model"
5. **Submit**: Click "Create Brand"
6. **Confirmation**: Success message, brand appears in table

### Editing a Brand

1. **Find brand in table** → Click "Edit"
2. **Form pre-fills** with existing data
3. **Modify details** as needed
4. **Add/Remove models** as required
5. **Click "Update Brand"** → Changes saved

### Deleting a Brand

1. **Find brand in table** → Click "Delete"
2. **Confirm** deletion (includes all models)
3. **Brand removed** from system

## Error Handling

### Common Errors

- **"Invalid category"** → Category must be mobile, laptop, or desktop
- **"Name and slug are required"** → Both fields are mandatory
- **"Brand with this slug already exists"** → Slug is unique per category
- **"Unauthorized"** → Must provide valid auth token
- **"Failed to fetch brands"** → Check network/server

### User Feedback

- ✅ **Success Messages**: Green alert with confirmation
- ❌ **Error Messages**: Red alert with specific issue
- ⏳ **Loading State**: Spinner during data fetch

## Mobile Responsiveness

### Mobile Layout (< 768px)

- Single column form inputs
- Full-width buttons
- Horizontal scroll for table (if needed)
- Tab-based category filtering
- Stacked model list items

### Tablet Layout (768px - 1024px)

- Two column form inputs
- Readable spacing
- Proper table scrolling

### Desktop Layout (> 1024px)

- Two column grid for form inputs
- Full table view
- Side-by-side category tabs
- Comfortable spacing

## Security

### Authentication

- Requires valid JWT token in Authorization header
- Token extracted from localStorage on client
- Server-side validation of auth token

### Authorization

- Admin role required (token validation)
- CSRF protection recommended
- Input sanitization applied

### Data Protection

- MongoDB injection prevention (Mongoose)
- XSS protection (React escaping)
- CORS headers configured

## Performance Considerations

### Database

- Indexes on `{ category, slug }` for fast lookups
- Indexes on `category` for filtering
- Efficient model querying within documents

### UI

- Client-side form state management
- Optimistic updates to table after save
- Loading states prevent double-submit

### API

- GET requests cached (consider adding cache headers)
- Batch updates possible (PUT includes all models)
- Pagination not required (brands < 1000 items typically)

## Seeding Data

Initial database can be populated using:

```bash
npm run seed:device-categories
# or
node scripts/seed-device-categories.js
```

This seeds 18 brands across 3 categories with 60+ models.

## Future Enhancements

1. **Bulk Operations**: Select multiple brands for batch actions
2. **Search & Filter**: Search brands by name in admin page
3. **Sort Options**: Sort brands by date, name, model count
4. **Model Management UI**: Dedicated model editing interface
5. **Logo Upload**: Direct image upload instead of URL
6. **Analytics**: Track brand popularity from product usage
7. **Import/Export**: Bulk import/export brand data
8. **Versioning**: Track brand/model history changes

## Troubleshooting

### Brands not appearing

- Check category filter (top tabs)
- Verify `isActive: true`
- Check browser console for API errors

### Models not saving

- Ensure model name is filled
- Check for duplicate models
- Verify all models have proper structure

### API calls failing

- Check Authorization token validity
- Verify admin role in token
- Check MongoDB connection
- Review server logs

## References

- [CategoryBrand Model](../lib/models/CategoryBrand.ts)
- [Device Categories API Route](../api/admin/device-categories/route.ts)
- [Product Model](../lib/models/Product.ts)
- [Product Creation Page](../technician/products/new/page.tsx)
