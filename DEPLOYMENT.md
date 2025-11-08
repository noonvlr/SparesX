# SparesX Deployment Guide

This guide covers deploying SparesX to various platforms and environments.

## 🚀 Quick Deployment Options

### Option 1: Vercel + Railway (Recommended)

**Frontend (Vercel)**
1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/web`
3. Configure environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
4. Deploy automatically on push to main

**Backend (Railway)**
1. Connect your GitHub repository to Railway
2. Set the root directory to `apps/api`
3. Configure environment variables:
   ```
   DATABASE_URL=mongodb+srv://...
   REDIS_URL=redis://...
   JWT_SECRET=your-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Deploy automatically on push to main

### Option 2: Docker Deployment

**Using Docker Compose (Production)**

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sparesx
   ```

2. Create production environment file:
   ```bash
   cp env.example .env.production
   ```

3. Update environment variables in `.env.production`

4. Deploy with Docker Compose:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

**Using Docker Swarm**

1. Initialize Docker Swarm:
   ```bash
   docker swarm init
   ```

2. Deploy the stack:
   ```bash
   docker stack deploy -c docker-compose.prod.yml sparesx
   ```

### Option 3: Kubernetes Deployment

**Prerequisites:**
- Kubernetes cluster
- kubectl configured
- Helm (optional)

**Deploy with kubectl:**

1. Create namespace:
   ```bash
   kubectl create namespace sparesx
   ```

2. Apply configurations:
   ```bash
   kubectl apply -f k8s/ -n sparesx
   ```

**Deploy with Helm:**

1. Add Helm repository (if using custom charts)
2. Install the chart:
   ```bash
   helm install sparesx ./helm-chart -n sparesx
   ```

## 🔧 Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/sparesx` |
| `REDIS_URL` | Redis connection string | `redis://user:pass@redis-host:6379` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `JWT_REFRESH_SECRET` | JWT refresh secret | `your-super-secret-refresh-key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-cloudinary-secret` |
| `NEXTAUTH_URL` | Frontend URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth.js secret | `your-nextauth-secret` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-google-client-id` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-google-client-secret` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | API server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `API_URL` | API URL for frontend | `http://localhost:3001` |
| `SMTP_HOST` | Email SMTP host | - |
| `SMTP_PORT` | Email SMTP port | - |
| `SMTP_USER` | Email SMTP user | - |
| `SMTP_PASS` | Email SMTP password | - |
| `SENTRY_DSN` | Sentry error tracking | - |

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses
5. Get the connection string
6. Update `DATABASE_URL` in your environment

### Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Create database and user
4. Update `DATABASE_URL` to point to local instance

### Database Initialization

After deployment, run the following commands:

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed database (optional)
pnpm db:seed
```

## 🔄 CI/CD Pipeline

### GitHub Actions

The repository includes GitHub Actions workflows for:

- **CI Pipeline** (`.github/workflows/ci.yml`):
  - Lint and type checking
  - Unit tests
  - Build verification

- **Deploy Pipeline** (`.github/workflows/deploy.yml`):
  - Staging deployment
  - Production deployment
  - Environment-specific configurations

### Manual Deployment

1. **Build the application:**
   ```bash
   pnpm build
   ```

2. **Start production server:**
   ```bash
   pnpm start
   ```

3. **Or use Docker:**
   ```bash
   docker build -t sparesx-api ./apps/api
   docker build -t sparesx-web ./apps/web
   ```

## 📊 Monitoring and Logging

### Health Checks

- **API Health**: `GET /health`
- **Frontend Health**: Root endpoint

### Logging

- **Structured Logging**: Morgan for HTTP requests
- **Error Tracking**: Sentry integration ready
- **Application Logs**: Console output with timestamps

### Monitoring Setup

1. **Sentry Error Tracking:**
   ```bash
   # Install Sentry
   npm install @sentry/node @sentry/nextjs
   
   # Configure in your app
   SENTRY_DSN=your-sentry-dsn
   ```

2. **Uptime Monitoring:**
   - Use services like UptimeRobot or Pingdom
   - Monitor health check endpoints
   - Set up alerts for downtime

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use strong, unique secrets for JWT and NextAuth
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure CORS properly for production domains
- [ ] Set up rate limiting
- [ ] Enable security headers (Helmet)
- [ ] Use environment variables for all secrets
- [ ] Regularly update dependencies
- [ ] Monitor for security vulnerabilities
- [ ] Set up proper backup strategies
- [ ] Configure firewall rules

### SSL/TLS Configuration

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Your application configuration
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   - Check MongoDB connection string
   - Verify network connectivity
   - Check authentication credentials

2. **Redis Connection Issues:**
   - Verify Redis URL
   - Check Redis server status
   - Verify authentication if required

3. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

4. **Authentication Issues:**
   - Verify OAuth provider configuration
   - Check JWT secrets
   - Verify NextAuth configuration

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# API
DEBUG=sparesx:* npm start

# Frontend
NODE_ENV=development npm run dev
```

### Logs

Check application logs:

```bash
# Docker logs
docker logs sparesx-api
docker logs sparesx-web

# Kubernetes logs
kubectl logs -f deployment/sparesx-api -n sparesx
kubectl logs -f deployment/sparesx-web -n sparesx
```

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use nginx or cloud load balancer
2. **Multiple Instances**: Deploy multiple API instances
3. **Database Scaling**: Use MongoDB replica sets
4. **Redis Clustering**: Set up Redis cluster for high availability

### Performance Optimization

1. **Caching**: Implement Redis caching strategies
2. **CDN**: Use Cloudinary CDN for images
3. **Database Indexing**: Optimize MongoDB indexes
4. **API Optimization**: Implement pagination and filtering

### Monitoring

1. **Metrics**: Set up application metrics
2. **Alerting**: Configure alerts for critical issues
3. **Logging**: Centralized logging with ELK stack
4. **APM**: Application Performance Monitoring

## 🔄 Backup and Recovery

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=backup/

# Restore
mongorestore --uri="mongodb+srv://..." backup/
```

### Application Backup

1. **Code**: Git repository (already backed up)
2. **Images**: Cloudinary provides automatic backups
3. **Configuration**: Store in version control
4. **Secrets**: Use secure secret management

### Disaster Recovery

1. **RTO (Recovery Time Objective)**: < 1 hour
2. **RPO (Recovery Point Objective)**: < 15 minutes
3. **Backup Frequency**: Daily database backups
4. **Testing**: Regular disaster recovery drills

## 📞 Support

For deployment issues:

1. Check the troubleshooting section
2. Review application logs
3. Check GitHub Issues
4. Contact the development team

## 🔄 Updates and Maintenance

### Regular Maintenance

1. **Dependency Updates**: Monthly security updates
2. **Database Maintenance**: Weekly optimization
3. **Log Rotation**: Daily log cleanup
4. **Backup Verification**: Weekly backup tests

### Update Process

1. **Staging Deployment**: Test changes in staging
2. **Production Deployment**: Deploy to production
3. **Monitoring**: Monitor for issues post-deployment
4. **Rollback Plan**: Have rollback procedures ready





