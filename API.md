# SparesX API Documentation

This document provides comprehensive API documentation for the SparesX marketplace platform.

## Base URL

```
Production: https://api.sparesx.com/api/v1
Development: http://localhost:3001/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. **Sign Up**: `POST /auth/signup`
2. **Sign In**: `POST /auth/login`
3. **Refresh Token**: `POST /auth/refresh`

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "error": "Error message if success is false"
}
```

### Pagination

Paginated responses include pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Endpoints

### Authentication

#### Sign Up
```http
POST /auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "BUYER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "BUYER"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  },
  "message": "User created successfully"
}
```

#### Sign In
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "BUYER"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  },
  "message": "Login successful"
}
```

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  },
  "message": "Token refreshed successfully"
}
```

#### Logout
```http
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### Products

#### Get Products
```http
GET /products
```

**Query Parameters:**
- `search` (string): Search term
- `category` (string): Product category
- `condition` (string): Product condition (NEW, USED, REFURBISHED)
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `location` (string): Location filter
- `brand` (string): Brand filter
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

**Example:**
```http
GET /products?search=BMW&category=automotive&condition=USED&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-id",
      "title": "BMW E46 Engine Block",
      "description": "Used BMW engine block...",
      "price": 1200,
      "condition": "USED",
      "category": "automotive",
      "brand": "BMW",
      "model": "E46",
      "year": 2003,
      "location": "New York, NY",
      "isActive": true,
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "seller": {
        "id": "seller-id",
        "name": "Auto Parts Pro",
        "avatar": "https://..."
      },
      "images": [
        {
          "id": "image-id",
          "url": "https://res.cloudinary.com/...",
          "order": 0
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Single Product
```http
GET /products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-id",
    "title": "BMW E46 Engine Block",
    "description": "Used BMW engine block...",
    "price": 1200,
    "condition": "USED",
    "category": "automotive",
    "brand": "BMW",
    "model": "E46",
    "year": 2003,
    "location": "New York, NY",
    "isActive": true,
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "seller": {
      "id": "seller-id",
      "name": "Auto Parts Pro",
      "email": "seller@example.com",
      "phone": "+1234567890",
      "avatar": "https://...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "images": [
      {
        "id": "image-id",
        "url": "https://res.cloudinary.com/...",
        "order": 0
      }
    ]
  }
}
```

#### Create Product
```http
POST /products
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "BMW E46 Engine Block",
  "description": "Used BMW engine block in excellent condition...",
  "price": 1200,
  "condition": "USED",
  "category": "automotive",
  "brand": "BMW",
  "model": "E46",
  "year": 2003,
  "location": "New York, NY",
  "images": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/product1.jpg"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-product-id",
    "title": "BMW E46 Engine Block",
    "description": "Used BMW engine block in excellent condition...",
    "price": 1200,
    "condition": "USED",
    "category": "automotive",
    "brand": "BMW",
    "model": "E46",
    "year": 2003,
    "location": "New York, NY",
    "sellerId": "seller-id",
    "isActive": true,
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "seller": {
      "id": "seller-id",
      "name": "Auto Parts Pro"
    },
    "images": [
      {
        "id": "image-id",
        "url": "https://res.cloudinary.com/...",
        "order": 0
      }
    ]
  },
  "message": "Product created successfully"
}
```

#### Update Product
```http
PUT /products/:id
Authorization: Bearer <token>
```

**Request Body:** (All fields optional)
```json
{
  "title": "Updated BMW E46 Engine Block",
  "price": 1100,
  "isActive": false
}
```

#### Delete Product
```http
DELETE /products/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Messages

#### Get User Messages
```http
GET /messages
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "message-id",
      "content": "Is this part still available?",
      "senderId": "sender-id",
      "receiverId": "receiver-id",
      "productId": "product-id",
      "readAt": null,
      "createdAt": "2024-01-15T00:00:00.000Z",
      "sender": {
        "id": "sender-id",
        "name": "John Buyer",
        "avatar": "https://..."
      },
      "receiver": {
        "id": "receiver-id",
        "name": "Auto Parts Pro",
        "avatar": "https://..."
      },
      "product": {
        "id": "product-id",
        "title": "BMW E46 Engine Block",
        "price": 1200,
        "images": [
          {
            "url": "https://res.cloudinary.com/...",
            "order": 0
          }
        ]
      }
    }
  ]
}
```

#### Send Message
```http
POST /messages
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Is this part still available?",
  "receiverId": "receiver-id",
  "productId": "product-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-message-id",
    "content": "Is this part still available?",
    "senderId": "sender-id",
    "receiverId": "receiver-id",
    "productId": "product-id",
    "readAt": null,
    "createdAt": "2024-01-15T00:00:00.000Z",
    "sender": {
      "id": "sender-id",
      "name": "John Buyer",
      "avatar": "https://..."
    },
    "receiver": {
      "id": "receiver-id",
      "name": "Auto Parts Pro",
      "avatar": "https://..."
    },
    "product": {
      "id": "product-id",
      "title": "BMW E46 Engine Block",
      "price": 1200,
      "images": [
        {
          "url": "https://res.cloudinary.com/...",
          "order": 0
        }
      ]
    }
  },
  "message": "Message sent successfully"
}
```

#### Get Single Message
```http
GET /messages/:id
Authorization: Bearer <token>
```

#### Mark Message as Read
```http
PUT /messages/:id/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

### Orders

#### Get User Orders
```http
GET /orders
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-id",
      "productId": "product-id",
      "buyerId": "buyer-id",
      "sellerId": "seller-id",
      "status": "PENDING",
      "totalAmount": 1200,
      "shippingAddress": "123 Main St, New York, NY 10001",
      "notes": "Please package carefully",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "product": {
        "id": "product-id",
        "title": "BMW E46 Engine Block",
        "price": 1200,
        "images": [
          {
            "url": "https://res.cloudinary.com/...",
            "order": 0
          }
        ]
      },
      "buyer": {
        "id": "buyer-id",
        "name": "John Buyer",
        "email": "buyer@example.com",
        "phone": "+1234567890"
      },
      "seller": {
        "id": "seller-id",
        "name": "Auto Parts Pro",
        "email": "seller@example.com",
        "phone": "+1234567890"
      }
    }
  ]
}
```

#### Create Order
```http
POST /orders
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "product-id",
  "shippingAddress": "123 Main St, New York, NY 10001",
  "notes": "Please package carefully for shipping"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-order-id",
    "productId": "product-id",
    "buyerId": "buyer-id",
    "sellerId": "seller-id",
    "status": "PENDING",
    "totalAmount": 1200,
    "shippingAddress": "123 Main St, New York, NY 10001",
    "notes": "Please package carefully for shipping",
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "product": {
      "id": "product-id",
      "title": "BMW E46 Engine Block",
      "price": 1200,
      "images": [
        {
          "url": "https://res.cloudinary.com/...",
          "order": 0
        }
      ]
    },
    "buyer": {
      "id": "buyer-id",
      "name": "John Buyer",
      "email": "buyer@example.com",
      "phone": "+1234567890"
    },
    "seller": {
      "id": "seller-id",
      "name": "Auto Parts Pro",
      "email": "seller@example.com",
      "phone": "+1234567890"
    }
  },
  "message": "Order created successfully"
}
```

#### Get Single Order
```http
GET /orders/:id
Authorization: Bearer <token>
```

#### Update Order Status
```http
PUT /orders/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Valid Status Values:**
- `PENDING`
- `CONFIRMED`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

### Users

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "avatar": "https://res.cloudinary.com/...",
    "role": "BUYER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

#### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <token>
```

**Request Body:** (All fields optional)
```json
{
  "name": "John Smith",
  "phone": "+1987654321",
  "avatar": "https://res.cloudinary.com/..."
}
```

### Categories

#### Get Categories
```http
GET /categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "category-id",
      "name": "Automotive",
      "slug": "automotive",
      "description": "Car parts, engines, transmissions, and automotive accessories",
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "parent": null,
      "children": []
    }
  ]
}
```

#### Create Category (Admin Only)
```http
POST /categories
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "parentId": "parent-category-id"
}
```

#### Update Category (Admin Only)
```http
PUT /categories/:id
Authorization: Bearer <admin-token>
```

#### Delete Category (Admin Only)
```http
DELETE /categories/:id
Authorization: Bearer <admin-token>
```

### File Uploads

#### Get Signed Upload Parameters
```http
POST /uploads/sign
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "folder": "sparesx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cloudName": "your-cloud-name",
    "apiKey": "your-api-key",
    "timestamp": 1640995200,
    "signature": "generated-signature",
    "folder": "sparesx",
    "publicId": "sparesx_abc123"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes
- **General API endpoints**: 100 requests per 15 minutes
- **Upload endpoints**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

Webhooks are available for real-time notifications:

### Order Status Updates
```http
POST /webhooks/order-status
```

**Payload:**
```json
{
  "event": "order.status.updated",
  "data": {
    "orderId": "order-id",
    "status": "SHIPPED",
    "timestamp": "2024-01-15T00:00:00.000Z"
  }
}
```

### New Messages
```http
POST /webhooks/message
```

**Payload:**
```json
{
  "event": "message.created",
  "data": {
    "messageId": "message-id",
    "senderId": "sender-id",
    "receiverId": "receiver-id",
    "productId": "product-id",
    "timestamp": "2024-01-15T00:00:00.000Z"
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @sparesx/api-client
```

```typescript
import { SparesXClient } from '@sparesx/api-client';

const client = new SparesXClient({
  baseURL: 'https://api.sparesx.com',
  apiKey: 'your-api-key'
});

// Get products
const products = await client.products.list({
  search: 'BMW',
  category: 'automotive'
});

// Create product
const product = await client.products.create({
  title: 'BMW Engine',
  price: 1200,
  condition: 'USED',
  // ... other fields
});
```

### Python
```bash
pip install sparesx-python
```

```python
from sparesx import SparesXClient

client = SparesXClient(
    base_url='https://api.sparesx.com',
    api_key='your-api-key'
)

# Get products
products = client.products.list(
    search='BMW',
    category='automotive'
)

# Create product
product = client.products.create({
    'title': 'BMW Engine',
    'price': 1200,
    'condition': 'USED',
    # ... other fields
})
```

## Postman Collection

A Postman collection is available for testing the API:

1. Import the collection from `docs/postman/SparesX-API.postman_collection.json`
2. Set up environment variables:
   - `base_url`: `https://api.sparesx.com`
   - `access_token`: Your JWT token
3. Run the collection to test all endpoints

## OpenAPI Specification

The API follows OpenAPI 3.0 specification. The complete specification is available at:

```
GET /api-docs
```

Or download the specification file:
```
GET /api-docs.json
```

## Support

For API support:

1. Check the documentation
2. Review error messages and status codes
3. Check GitHub Issues
4. Contact the development team

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Product management
- Message system
- Order management
- File upload support





