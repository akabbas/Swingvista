# SwingVista Deployment Guide

This guide covers deploying the SwingVista application to various platforms and environments.

## Prerequisites

- Node.js 18+ installed
- Git repository access
- Platform-specific accounts (Vercel, Railway, Netlify, etc.)

## Current Application Status

**Frontend Only**: SwingVista is currently a static Next.js application with no backend dependencies, making deployment straightforward.

## Quick Deployment

### 1. Build the Application

```bash
cd clean
npm install
npm run build
```

### 2. Test Production Build Locally

```bash
npm run start
```

Visit `http://localhost:3000` to verify the production build works correctly.

## Platform-Specific Deployment

### Vercel (Recommended)

Vercel is the recommended platform for Next.js applications.

#### Automatic Deployment

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository

2. **Configure Build Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `clean`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)

3. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from clean directory
cd clean
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [Your account]
# - Link to existing project? N
# - Project name: swingvista
# - Directory: ./
# - Override settings? N
```

#### Environment Variables

Currently no environment variables are required. Future backend integration may require:

```bash
# Future environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Railway

Railway provides easy deployment with automatic builds.

#### Deploy to Railway

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure Project**
   - Select your repository
   - Set **Root Directory**: `clean`
   - Railway will auto-detect Next.js

3. **Deploy**
   - Railway will automatically build and deploy
   - Get your live URL from the dashboard

#### Railway Configuration

Create `railway.json` in the `clean` directory:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Netlify

Netlify supports Next.js with some configuration.

#### Deploy to Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "New site from Git"
   - Select your repository

2. **Configure Build Settings**
   - **Base directory**: `.` (root)
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

3. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy

#### Netlify Configuration

Create `netlify.toml` in the `clean` directory:

```toml
[build]
  base = "clean"
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### AWS Amplify

AWS Amplify provides full-stack deployment capabilities.

#### Deploy to AWS Amplify

1. **Connect Repository**
   - Go to [aws.amazon.com/amplify](https://aws.amazon.com/amplify)
   - Sign in to AWS Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - **App build specification**: Use default
   - **Root directory**: `clean`
   - **Build command**: `npm run build`
   - **Output directory**: `.next`

3. **Deploy**
   - Click "Save and deploy"
   - Amplify will build and deploy

### Docker Deployment

For containerized deployment or self-hosting.

#### Create Dockerfile

Create `Dockerfile` in the `clean` directory:

```dockerfile
# Use Node.js 18 Alpine
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run Docker Container

```bash
# Build Docker image
docker build -t swingvista .

# Run container
docker run -p 3000:3000 swingvista
```

## Environment Configuration

### Development Environment

```bash
# .env.local (for local development)
NODE_ENV=development
```

### Production Environment

```bash
# .env.production (for production)
NODE_ENV=production
```

## Performance Optimization

### Build Optimizations

The application includes several performance optimizations:

1. **Critical CSS**: Inlined to prevent FOUC
2. **Font Optimization**: Preloaded with `display: "swap"`
3. **Image Optimization**: Next.js automatic optimization
4. **Code Splitting**: Automatic bundle splitting
5. **Static Generation**: Pre-rendered pages

### Monitoring

#### Vercel Analytics

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Performance Monitoring

```bash
# Install Web Vitals
npm install web-vitals

# Add to layout.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### Environment Variables

```bash
# Check environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME
```

#### Domain Configuration

```bash
# Add custom domain in Vercel
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record pointing to your Vercel deployment
```

### Performance Issues

#### Bundle Size Analysis

```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

#### Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.com --output html --output-path ./lighthouse-report.html
```

## Security Considerations

### HTTPS

All deployment platforms provide HTTPS by default. Ensure:
- SSL certificates are valid
- HTTP redirects to HTTPS
- HSTS headers are set

### Headers

Configure security headers in `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: package-lock.json
      
      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./
```

## Rollback Strategy

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Railway Rollback

```bash
# List deployments
railway status

# Rollback to previous deployment
railway rollback
```

## Monitoring and Alerts

### Uptime Monitoring

- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring with alerts
- **StatusCake**: Comprehensive monitoring

### Error Tracking

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.ts
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'swingvista',
});
```

---

This deployment guide will be updated as new deployment options and configurations are added.