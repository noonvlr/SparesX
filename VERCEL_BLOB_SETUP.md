# Vercel Blob Storage Setup Guide

## Overview

SparesX now uses **Vercel Blob** for image storage. This replaces the old data URL approach (base64 encoding) which was bloating the database.

## Setup Steps

### 1. **Local Development** (Optional)

For local development, image uploads are optional. You can test without Vercel Blob:

- Leave `BLOB_READ_WRITE_TOKEN` empty in `.env.local`
- Images will be stored as regular file uploads (or skipped)

### 2. **Production Setup** (Vercel)

#### Step 1: Create a Vercel Storage Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your SparesX project
3. Navigate to **Settings** → **Storage** → **Create Database**
4. Select **Blob** from the options
5. Click **Create** and name it "sparesx-images"
6. Once created, go to **.env.local** tab
7. Copy the `BLOB_READ_WRITE_TOKEN` value

#### Step 2: Add to Vercel Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (paste the token from Step 1)
3. Click **Save**

#### Step 3: Redeploy

1. Go to **Deployments**
2. Click **Redeploy** on the latest deployment
3. Wait for the build to complete

## How It Works

### Before (Data URLs - NOT RECOMMENDED)

- Images were converted to base64 strings
- Stored directly in MongoDB documents
- Large documents = slow queries & database bloat
- 100KB+ per image in the database

### After (Vercel Blob - RECOMMENDED)

- Images uploaded to Vercel's global blob storage
- Only the CDN URL stored in MongoDB
- Fast, scalable, optimized delivery
- Automatic image optimization

## Image Upload Flow

```
User selects images
    ↓
handleImageChange() stores File objects
    ↓
handleSubmit() triggered
    ↓
uploadImages() sends files to /api/upload
    ↓
/api/upload uses @vercel/blob to store files
    ↓
Returns CDN URLs (e.g., https://abc123.public.blob.vercel-storage.com/image.jpg)
    ↓
Product created/updated with CDN URLs in MongoDB
```

## API Routes

### **POST /api/upload**

Uploads images to Vercel Blob storage

**Request:**

```
FormData with "files" field containing File objects
```

**Response:**

```json
{
  "urls": [
    "https://abc123.public.blob.vercel-storage.com/image1.jpg",
    "https://abc123.public.blob.vercel-storage.com/image2.jpg"
  ]
}
```

## Hooks

### `useImageUpload()`

Custom hook for image uploads

**Usage:**

```typescript
const { uploadImages, uploading, uploadError } = useImageUpload();

// Upload images
const urls = await uploadImages(fileArray);
if (uploadError) {
  // Handle error
}
```

## Updated Pages

- ✅ `/technician/products/new` - Create product with images
- ✅ `/technician/products/edit/[id]` - Edit product and add more images

## Troubleshooting

### Images not uploading?

1. Check if `BLOB_READ_WRITE_TOKEN` is set in Vercel
2. Verify the token is valid and not expired
3. Check browser console for upload errors

### Build failing?

1. Make sure `@vercel/blob` package is installed
2. Run `npm install @vercel/blob`
3. Rebuild locally first: `npm run build`

## Cost

Vercel Blob is free with your Vercel plan. Storage and transfer are included in most plans.

## References

- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob CLI](https://vercel.com/docs/storage/vercel-blob/using-blob)
