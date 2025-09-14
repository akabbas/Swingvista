# Deployment Guide

## Overview

This guide covers deploying SwingVista to various platforms including Railway, Vercel, and self-hosted options.

## Railway Deployment

### Prerequisites

- Railway account
- GitHub repository
- Supabase project

### Steps

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your SwingVista repository

2. **Configure Environment Variables**
   - Go to your project settings
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be available at `https://your-app.railway.app`

### Railway Configuration

Railway will automatically detect this is a Next.js project and use the appropriate build settings.

## Vercel Deployment

### Prerequisites

- Vercel account
- GitHub repository
- Supabase project

### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment Variables**
   - Go to your project dashboard
   - Navigate to Settings > Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Redeploy**
   ```bash
   vercel --prod
   ```

## Self-Hosted Deployment

### Using Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   
   # Install dependencies
   COPY package.json package-lock.json ./
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

2. **Build and Run**
   ```bash
   docker build -t swingvista .
   docker run -p 3000:3000 swingvista
   ```

### Using PM2

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Create ecosystem file**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'swingvista',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   ```

4. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   ```

## Environment Variables

### Required

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional

- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For AI features
- `NODE_ENV` - Environment (development/production)

## Database Setup

### Supabase

1. Create a new Supabase project
2. Run the SQL from the main README to create tables
3. Get your project URL and anon key from the API settings

### Alternative Databases

The application can be adapted to work with other databases by modifying the database client in `src/lib/supabase.ts`.

## Performance Optimization

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Ensure all required environment variables are set in production.

### CDN Configuration

For better performance, consider using a CDN for static assets.

## Monitoring

### Health Checks

The application includes basic health check endpoints:

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

### Logging

Configure logging for production:

```javascript
// next.config.js
module.exports = {
  // ... other config
  logging: {
    fetches: {
      fullUrl: true
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (requires 18+)
   - Ensure all dependencies are installed
   - Verify environment variables

2. **Runtime Errors**
   - Check database connectivity
   - Verify API keys
   - Check browser console for errors

3. **Performance Issues**
   - Enable gzip compression
   - Use a CDN for static assets
   - Optimize images and videos

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=swingvista:*
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use secure key management
   - Rotate keys regularly

2. **API Security**
   - Implement rate limiting
   - Add authentication
   - Validate all inputs

3. **Database Security**
   - Use connection pooling
   - Enable SSL
   - Regular backups

## Scaling

### Horizontal Scaling

- Use load balancers
- Implement session storage
- Database connection pooling

### Vertical Scaling

- Increase server resources
- Optimize database queries
- Use caching strategies
