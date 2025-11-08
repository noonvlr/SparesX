# SparesX - Spare Parts Marketplace

A modern, scalable marketplace platform for buying and selling spare parts. Built with Next.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- **User Authentication**: NextAuth.js with Google OAuth and credentials
- **Product Management**: Create, update, and manage spare parts listings
- **Image Upload**: Cloudinary integration for image storage and optimization
- **Real-time Messaging**: Communication between buyers and sellers
- **Order Management**: Complete order lifecycle management
- **Search & Filtering**: Advanced product search with filters
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Testing**: Jest for API testing, Playwright for E2E testing

## 🏗️ Architecture

```
sparesx/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express.js backend
├── packages/
│   ├── ui/           # Shared UI components
│   ├── shared/       # Shared types and utilities
│   ├── eslint-config/
│   └── typescript-config/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **NextAuth.js** - Authentication
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **MongoDB** - NoSQL database
- **Redis** - Caching and session storage
- **Bull** - Job queue processing
- **Cloudinary** - Image storage and optimization

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Turborepo** - Monorepo build system
- **pnpm** - Package manager

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (optional)
- MongoDB Atlas account (or local MongoDB)
- Redis instance (optional locally if `SKIP_REDIS=true`)
- Cloudinary account

### 1. Clone and Install

```bash
git clone <repository-url>
cd sparesx
pnpm install
```

### 2. Environment Setup

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/sparesx"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate strong secrets)
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Seed database
pnpm db:seed
```

### 4. Development

```bash
# Start all services
pnpm dev

# Or start individually
pnpm dev --filter=@sparesx/web    # Frontend only
pnpm dev --filter=@sparesx/api    # Backend only
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

### Local Messaging / Chat

The chat experience needs MongoDB and a running API server. Redis and Bull queues are optional during development:

- Start MongoDB (e.g. `docker compose -f docker-compose.dev.yml up mongodb` or use any local instance).
- Ensure `JWT_SECRET` and `NEXT_PUBLIC_API_URL` in your `.env` match the API server.
- Set `SKIP_REDIS=true` in `.env` if you do not have Redis locally. The API will skip Redis/Bull while keeping sockets active.
- Run the API with `pnpm dev --filter=@sparesx/api` and the web app with `pnpm dev --filter=@sparesx/web`.
- Visit `http://localhost:3000/chat/<chatId>` to test real-time messaging between authenticated users.

### 5. Docker Development

```bash
# Start with Docker Compose
pnpm docker:dev

# Or manually
docker-compose -f docker-compose.dev.yml up
```

## 📚 API Documentation

### Authentication Endpoints

```bash
# Sign up
POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "BUYER"
}

# Sign in
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Refresh token
POST /api/v1/auth/refresh
{
  "refreshToken": "your-refresh-token"
}
```

### Product Endpoints

```bash
# Get products with filters
GET /api/v1/products?search=engine&category=automotive&page=1&limit=10

# Get single product
GET /api/v1/products/:id

# Create product (requires authentication)
POST /api/v1/products
{
  "title": "BMW Engine Part",
  "description": "Used BMW engine part in good condition",
  "price": 500,
  "condition": "USED",
  "category": "automotive",
  "brand": "BMW",
  "location": "New York",
  "images": ["https://cloudinary.com/image1.jpg"]
}

# Update product
PUT /api/v1/products/:id

# Delete product
DELETE /api/v1/products/:id
```

### Message Endpoints

```bash
# Get user messages
GET /api/v1/messages

# Send message
POST /api/v1/messages
{
  "content": "Is this part still available?",
  "receiverId": "user-id",
  "productId": "product-id"
}

# Mark message as read
PUT /api/v1/messages/:id/read
```

### Upload Endpoints

```bash
# Get signed upload parameters
POST /api/v1/uploads/sign
{
  "folder": "sparesx"
}
```

## 🧪 Testing

### API Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Run Playwright tests
pnpm test:e2e

# Run tests in headed mode
pnpm test:e2e --headed

# Run specific test
pnpm test:e2e --grep "homepage"
```

## 🚀 Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

### Docker Production

```bash
# Build and start production containers
pnpm docker:prod

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

### Deployment Options

1. **Vercel** (Frontend)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy automatically on push to main

2. **Railway/Render** (Backend)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy automatically

3. **Docker** (Full Stack)
   - Use the provided Docker Compose files
   - Deploy to any Docker-compatible platform

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes (skip with `SKIP_REDIS=true`) |
| `SKIP_REDIS` | Skip Redis/Bull integration in development | No |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |

### Database Schema

The application uses MongoDB with the following main collections:

- **users** - User accounts and profiles
- **products** - Spare parts listings
- **listing_images** - Product images
- **messages** - User communications
- **orders** - Purchase orders
- **categories** - Product categories

## 🔒 Security

- **Rate Limiting** - API rate limiting with express-rate-limit
- **CORS** - Configured CORS policies
- **Helmet** - Security headers
- **Input Validation** - Zod schema validation
- **Authentication** - JWT-based authentication
- **File Upload** - Secure file upload with Cloudinary

## 📈 Monitoring

### Health Checks

- API Health: `GET /health`
- Database connectivity
- Redis connectivity

### Logging

- Structured logging with Morgan
- Error tracking (Sentry integration ready)
- Request/response logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue
4. Contact the development team

## 🗺️ Roadmap

- [ ] Mobile app with React Native
- [ ] Advanced search with Elasticsearch
- [ ] Payment integration (Stripe)
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API rate limiting per user
- [ ] Advanced image processing
- [ ] Email notifications
- [ ] Admin dashboard





