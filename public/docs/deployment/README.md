# Deployment Guide

This guide covers deploying the Sybase to Oracle Migration Tool in various environments, from development to production.

## 📚 Table of Contents

- [Deployment Overview](#deployment-overview)
- [Environment Configurations](#environment-configurations)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Production Checklist](#production-checklist)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## 🌐 Deployment Overview

The application can be deployed in several ways:

1. **Static Hosting**: Netlify, Vercel, AWS S3 + CloudFront
2. **Container Deployment**: Docker, Kubernetes
3. **Cloud Platforms**: Google Cloud, AWS, Azure
4. **Self-Hosted**: Traditional web servers (Nginx, Apache)

### Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React SPA)   │◄──►│   (Supabase)    │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Storage   │    │   AI Services   │    │   File Storage  │
│   (Static)      │    │   (Gemini)      │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ⚙️ Environment Configurations

### Development Environment

```bash
# .env.development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your_dev_gemini_key
VITE_APP_MODE=development
VITE_DEBUG=true
```

### Staging Environment

```bash
# .env.staging
VITE_SUPABASE_URL=https://your-project-staging.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your_staging_gemini_key
VITE_APP_MODE=staging
VITE_DEBUG=false
VITE_SENTRY_DSN=https://your-sentry-dsn
```

### Production Environment

```bash
# .env.production
VITE_SUPABASE_URL=https://your-project-prod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your_prod_gemini_key
VITE_APP_MODE=production
VITE_DEBUG=false
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_ANALYTICS_ID=your_analytics_id
```

## 🐳 Docker Deployment

### Single Container Deployment

#### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy (if needed)
        location /api/ {
            proxy_pass https://your-api-endpoint.com/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Local Supabase for development
  supabase:
    image: supabase/supabase:latest
    ports:
      - "54321:8000"
    environment:
      - POSTGRES_PASSWORD=postgres
      - JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
      - ANON_KEY=your-anon-key
      - SERVICE_ROLE_KEY=your-service-role-key
    volumes:
      - supabase_data:/var/lib/postgresql/data

volumes:
  supabase_data:
```

### Building and Running

```bash
# Build the Docker image
docker build -t sybase-oracle-migration .

# Run the container
docker run -d \
  --name migration-app \
  -p 8080:80 \
  --env-file .env.production \
  sybase-oracle-migration

# Check logs
docker logs migration-app

# Stop and remove
docker stop migration-app
docker rm migration-app
```

### Docker Compose Deployment

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## ☁️ Cloud Deployment

### Netlify Deployment

#### netlify.toml

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Deployment Steps

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod --dir=dist

# Or use continuous deployment from Git
netlify init
```

### Vercel Deployment

#### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

#### Deployment Steps

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or use GitHub integration
vercel --github
```

### AWS S3 + CloudFront

#### Deployment Script

```bash
#!/bin/bash
# deploy-aws.sh

# Build the application
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

#### CloudFormation Template

```yaml
# infrastructure.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Sybase Oracle Migration Tool Infrastructure'

Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-app-bucket'
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: index.html
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.RegionalDomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: ''
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods: [GET, HEAD, OPTIONS]
          CachedMethods: [GET, HEAD]
          Compress: true
        Enabled: true
        DefaultRootObject: index.html
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html

Outputs:
  BucketName:
    Value: !Ref S3Bucket
  DistributionDomainName:
    Value: !GetAtt CloudFrontDistribution.DomainName
```

### Google Cloud Platform

#### app.yaml

```yaml
runtime: nodejs18

env_variables:
  NODE_ENV: production
  VITE_SUPABASE_URL: https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY: your-anon-key

handlers:
  - url: /static
    static_dir: dist/assets
    secure: always

  - url: /.*
    static_files: dist/index.html
    upload: dist/index.html
    secure: always

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

#### Deployment

```bash
# Deploy to Google App Engine
gcloud app deploy

# Deploy to Cloud Run
gcloud run deploy migration-tool \
  --image gcr.io/your-project/migration-tool \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## ✅ Production Checklist

### Pre-Deployment

- [ ] **Environment Variables**: All production environment variables configured
- [ ] **SSL Certificates**: HTTPS enabled and certificates valid
- [ ] **Database Migrations**: All migrations applied to production database
- [ ] **API Keys**: Production API keys configured (Gemini AI, etc.)
- [ ] **Error Tracking**: Sentry or similar error tracking configured
- [ ] **Analytics**: Google Analytics or similar tracking enabled
- [ ] **Backup Strategy**: Database and file backup procedures in place

### Security

- [ ] **Authentication**: Supabase auth properly configured
- [ ] **Authorization**: User roles and permissions working correctly
- [ ] **Rate Limiting**: API rate limiting configured
- [ ] **CORS**: Cross-origin requests properly restricted
- [ ] **CSP**: Content Security Policy headers configured
- [ ] **Input Validation**: All user inputs properly validated
- [ ] **File Upload Security**: File type and size restrictions enforced

### Performance

- [ ] **CDN**: Static assets served via CDN
- [ ] **Caching**: Appropriate cache headers set
- [ ] **Compression**: Gzip/Brotli compression enabled
- [ ] **Image Optimization**: Images optimized for web
- [ ] **Code Splitting**: JavaScript bundles split appropriately
- [ ] **Lazy Loading**: Non-critical components lazy loaded

### Monitoring

- [ ] **Health Checks**: Application health endpoints configured
- [ ] **Logging**: Comprehensive logging strategy implemented
- [ ] **Metrics**: Performance metrics collection enabled
- [ ] **Alerts**: Critical error alerts configured
- [ ] **Uptime Monitoring**: External uptime monitoring enabled

## 📊 Monitoring and Maintenance

### Health Monitoring

```javascript
// Health check endpoint
export const healthCheck = async () => {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    ai_service: await checkAIService(),
    timestamp: new Date().toISOString()
  };

  const allHealthy = Object.values(checks).every(check => 
    typeof check === 'boolean' ? check : check.status === 'healthy'
  );

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks
  };
};
```

### Performance Monitoring

```javascript
// Performance metrics collection
export const collectMetrics = () => {
  return {
    // Core Web Vitals
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    lcp: getLCP(),
    cls: getCLS(),
    fid: getFID(),
    
    // Application metrics
    conversionTime: getAverageConversionTime(),
    errorRate: getErrorRate(),
    activeUsers: getActiveUserCount()
  };
};
```

### Logging Strategy

```javascript
// Structured logging
const logger = {
  info: (message, context = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  },
  
  error: (error, context = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
};
```

### Maintenance Tasks

#### Daily
- [ ] Check error logs and alerts
- [ ] Monitor performance metrics
- [ ] Verify backup completion
- [ ] Review security alerts

#### Weekly
- [ ] Analyze user activity patterns
- [ ] Review conversion success rates
- [ ] Check storage usage and cleanup old files
- [ ] Update security patches

#### Monthly
- [ ] Performance optimization review
- [ ] Dependency security audit
- [ ] Backup restoration test
- [ ] Disaster recovery drill

### Scaling Considerations

#### Horizontal Scaling
- **Load Balancing**: Multiple application instances
- **Database Read Replicas**: Separate read and write operations
- **CDN Distribution**: Global content delivery
- **Microservices**: Split into smaller, independent services

#### Vertical Scaling
- **Database Resources**: Increase CPU, memory, and storage
- **Application Resources**: More powerful server instances
- **AI Processing**: Dedicated AI processing instances

### Backup and Recovery

#### Automated Backups
```bash
#!/bin/bash
# backup.sh - Daily backup script

# Database backup
pg_dump $DATABASE_URL > backups/db_$(date +%Y%m%d).sql

# File storage backup
aws s3 sync s3://your-storage-bucket backups/files/$(date +%Y%m%d)/

# Retention (keep 30 days)
find backups/ -type f -mtime +30 -delete
```

#### Recovery Procedures
1. **Database Recovery**: Restore from latest backup
2. **File Recovery**: Restore from S3 backup
3. **Application Recovery**: Redeploy from Git
4. **DNS Failover**: Switch to backup environment if needed

This deployment guide provides comprehensive coverage for deploying the Sybase to Oracle Migration Tool in production environments. Always test deployments in staging environments first and maintain proper backup and recovery procedures.