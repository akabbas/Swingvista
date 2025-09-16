# SwingVista API Documentation

## Overview

SwingVista is currently a frontend-only application built with Next.js 15. This document outlines the current API structure and planned backend integration.

## Current Status

**Frontend Only**: The current version of SwingVista is a client-side application with no backend API endpoints. All functionality is implemented in the browser using:

- Next.js 15 with App Router
- React 19 components
- TypeScript for type safety
- Tailwind CSS for styling

## Planned API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
GET  /api/auth/me
```

### Swing Analysis
```
POST /api/swings/analyze
GET  /api/swings/:id
GET  /api/swings/user/:userId
PUT  /api/swings/:id
DELETE /api/swings/:id
```

### Video Processing
```
POST /api/videos/upload
GET  /api/videos/:id/status
GET  /api/videos/:id/analysis
DELETE /api/videos/:id
```

### User Management
```
GET  /api/users/profile
PUT  /api/users/profile
GET  /api/users/swings
```

## Current Frontend Routes

### Pages
- `/` - Home dashboard
- `/camera` - Camera analysis interface
- `/upload` - Video upload interface

### Components API

#### Layout Components
```typescript
// Header component
<Header />
// Props: None
// Features: Navigation, logo, responsive design

// Footer component  
<Footer />
// Props: None
// Features: Copyright, navigation links
```

#### UI Components
```typescript
// Button component
<Button 
  variant="primary" | "secondary" | "outline"
  size="sm" | "md" | "lg"
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
/>

// LoadingSpinner component
<LoadingSpinner 
  size?: "sm" | "md" | "lg"
  text?: string
/>

// ErrorAlert component
<ErrorAlert 
  message: string
  onDismiss?: () => void
/>

// ProgressBar component
<ProgressBar 
  progress: number // 0-100
  label?: string
/>
```

## Data Flow

### Current Implementation
1. **User Interaction** → React Component
2. **State Management** → React Hooks (useState, useEffect)
3. **UI Updates** → Re-render with new state
4. **Styling** → Tailwind CSS classes

### Planned Backend Integration
1. **User Action** → Frontend Component
2. **API Request** → Next.js API Route
3. **Processing** → Backend Service (Python/Node.js)
4. **Response** → Frontend State Update
5. **UI Update** → Component Re-render

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State**: React Hooks
- **HTTP Client**: Fetch API (planned)

### Planned Backend
- **Runtime**: Node.js or Python
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI Processing**: MediaPipe, TensorFlow.js

## Environment Variables

### Current
```bash
# No environment variables currently required
```

### Planned
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
API_BASE_URL=http://localhost:3000/api
UPLOAD_MAX_SIZE=100MB

# AI Processing
MEDIAPIPE_MODEL_PATH=/models/pose_landmarker.task
```

## Error Handling

### Current
- Client-side error boundaries
- Form validation
- Network error handling (planned)

### Planned
- API error responses
- Retry mechanisms
- User-friendly error messages
- Logging and monitoring

## Performance Considerations

### Current Optimizations
- Critical CSS inlined
- Font preloading
- Image optimization
- Code splitting

### Planned Optimizations
- API response caching
- Background processing
- Progressive loading
- CDN integration

## Security

### Current
- Client-side validation
- XSS protection via React
- CSRF protection via Next.js

### Planned
- JWT authentication
- API rate limiting
- Input sanitization
- File upload validation

## Development

### Local Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Testing
```bash
# Run linting
npm run lint

# Run tests (planned)
npm run test

# Run type checking
npx tsc --noEmit
```

## Deployment

### Current
- Static site generation
- Vercel/Netlify compatible
- No server requirements

### Planned
- Full-stack deployment
- Database migrations
- Environment configuration
- Monitoring and logging

## Future Enhancements

1. **Real-time Analysis**: WebSocket connections for live camera feed
2. **AI Integration**: MediaPipe pose detection
3. **User Accounts**: Authentication and data persistence
4. **Mobile App**: React Native version
5. **Analytics**: User behavior tracking
6. **Social Features**: Share analysis results

---

**Note**: This API documentation will be updated as backend functionality is implemented. Currently, SwingVista is a frontend-only application focused on UI/UX and performance optimization.