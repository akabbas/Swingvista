# HTML Structure and Component Architecture

This document outlines the improved HTML structure, component architecture, and environment awareness implemented in SwingVista.

## 🏗️ Component Architecture

### Layout Components

#### Header Component (`src/components/layout/Header.tsx`)
- **Purpose**: Navigation header with environment status indicator
- **Features**:
  - Responsive navigation with mobile menu
  - Environment connection status (development only)
  - Active page highlighting
  - Breadcrumb navigation

```tsx
<Header environment="development" />
```

#### Footer Component (`src/components/layout/Footer.tsx`)
- **Purpose**: Site footer with links and branding
- **Features**:
  - Quick links to main pages
  - Support links
  - Environment indicator
  - Social links and contact information

```tsx
<Footer environment="production" />
```

### UI Components

#### Button Component (`src/components/ui/Button.tsx`)
- **Purpose**: Consistent button styling across the application
- **Variants**: `primary`, `secondary`, `danger`, `success`, `outline`
- **Sizes**: `sm`, `md`, `lg`
- **Features**:
  - Loading states
  - Icon support
  - Full width option
  - AsChild support for Link components

```tsx
<Button 
  variant="primary" 
  size="lg" 
  loading={isLoading}
  icon={<Icon />}
  fullWidth
>
  Click Me
</Button>
```

#### LoadingSpinner Component (`src/components/ui/LoadingSpinner.tsx`)
- **Purpose**: Consistent loading indicators
- **Sizes**: `sm`, `md`, `lg`
- **Features**:
  - Optional text
  - Customizable styling

```tsx
<LoadingSpinner size="md" text="Loading..." />
```

#### ProgressBar Component (`src/components/ui/ProgressBar.tsx`)
- **Purpose**: Progress indication for long operations
- **Features**:
  - Step text display
  - Percentage display
  - Smooth animations

```tsx
<ProgressBar 
  progress={75} 
  step="Processing video..." 
  showPercentage={true}
/>
```

#### ErrorAlert Component (`src/components/ui/ErrorAlert.tsx`)
- **Purpose**: User-friendly error messages
- **Types**: `error`, `warning`, `info`
- **Features**:
  - Dismissible alerts
  - Icon indicators
  - Custom styling

```tsx
<ErrorAlert 
  message="Something went wrong" 
  onDismiss={() => setError(null)}
  type="error"
/>
```

## 🌍 Environment Awareness

### Environment Configuration (`src/lib/environment.ts`)

The environment system provides dynamic configuration based on the current environment:

```typescript
interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
  appName: string;
  version: string;
}
```

#### Features:
- **Dynamic API URLs**: Automatically switches between local and production endpoints
- **Connection Testing**: Validates Supabase and API connections
- **Environment Banners**: Development-only status indicators
- **Console Logging**: Debug information in development mode

#### Usage:
```typescript
import { getEnvironmentConfig, testEnvironmentConnection } from '@/lib/environment';

const config = getEnvironmentConfig();
const connectionTest = await testEnvironmentConnection();
```

### Environment Banner (`src/components/ui/EnvironmentBanner.tsx`)
- **Purpose**: Development environment status indicator
- **Features**:
  - Connection status display
  - Version information
  - Dismissible banner
  - Real-time connection testing

## 📱 Responsive Design

### Mobile-First Approach
All components are designed with mobile-first principles:

```css
/* Mobile first */
.grid-cols-1

/* Tablet */
.md:grid-cols-2

/* Desktop */
.lg:grid-cols-3
```

### Breakpoints
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

### Responsive Navigation
- **Desktop**: Horizontal navigation bar
- **Mobile**: Collapsible hamburger menu
- **Touch-friendly**: Large tap targets (44px minimum)

## ♿ Accessibility Features

### Semantic HTML5 Elements
- `<header>`: Page headers and navigation
- `<nav>`: Navigation sections
- `<main>`: Main content area
- `<section>`: Content sections
- `<article>`: Self-contained content
- `<aside>`: Sidebar content
- `<footer>`: Page footers

### ARIA Support
- **Labels**: Proper form labels with `for` attributes
- **Descriptions**: `aria-describedby` for help text
- **Live Regions**: `aria-live` for dynamic content
- **Roles**: `role` attributes for custom components
- **States**: `aria-expanded`, `aria-selected`, etc.

### Keyboard Navigation
- **Tab Order**: Logical tab sequence
- **Focus Management**: Visible focus indicators
- **Skip Links**: Jump to main content
- **Keyboard Shortcuts**: Common actions accessible via keyboard

### Screen Reader Support
- **Alt Text**: Descriptive image alternatives
- **Headings**: Proper heading hierarchy (h1 → h2 → h3)
- **Landmarks**: ARIA landmarks for navigation
- **Descriptions**: Context for interactive elements

## 🧪 Testing Strategy

### HTML Structure Tests (`src/__tests__/html-structure.test.ts`)
Comprehensive tests for:
- Semantic HTML5 elements
- Accessibility features
- Responsive design classes
- Form validation
- SEO and meta tags
- Performance optimizations

### Component Tests
Each component includes:
- **Unit Tests**: Individual component functionality
- **Accessibility Tests**: ARIA compliance
- **Responsive Tests**: Breakpoint behavior
- **Integration Tests**: Component interaction

### DOM Mocking
Proper DOM mocking for testing:
```typescript
const mockDocument = {
  createElement: vi.fn(),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
};
```

## 🎨 Styling Guidelines

### Tailwind CSS Classes
Consistent use of Tailwind utility classes:

```css
/* Layout */
.max-w-7xl .mx-auto .px-4 .sm:px-6 .lg:px-8

/* Spacing */
.space-y-4 .space-x-2 .py-8 .px-6

/* Colors */
.bg-blue-600 .text-white .hover:bg-blue-700

/* Responsive */
.grid .grid-cols-1 .md:grid-cols-2 .lg:grid-cols-3
```

### Component Styling
- **Consistent Spacing**: 4px grid system
- **Color Palette**: Semantic color usage
- **Typography**: Consistent font sizes and weights
- **Shadows**: Subtle depth indicators
- **Transitions**: Smooth state changes

## 📊 Performance Optimizations

### Image Optimization
```tsx
<img 
  src="/image.jpg" 
  alt="Descriptive text"
  loading="lazy"
  width={800}
  height={600}
/>
```

### Video Optimization
```tsx
<video 
  muted 
  playsInline 
  preload="metadata"
  controls
>
  <source src="/video.mp4" type="video/mp4" />
</video>
```

### Bundle Optimization
- **Code Splitting**: Dynamic imports for heavy components
- **Tree Shaking**: Unused code elimination
- **Lazy Loading**: Components loaded on demand

## 🔧 Development Guidelines

### Adding New Components
1. Create component in appropriate directory (`ui/` or `layout/`)
2. Add TypeScript interfaces
3. Include accessibility features
4. Add responsive design
5. Write comprehensive tests
6. Update documentation

### Environment Variables
Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=your_api_url (optional)
NEXT_PUBLIC_APP_VERSION=1.0.0 (optional)
```

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Standardized commit messages

## 🚀 Deployment Considerations

### Production Build
- **Environment Detection**: Automatic production/development detection
- **Asset Optimization**: Minified CSS and JavaScript
- **Image Optimization**: WebP format with fallbacks
- **CDN Integration**: Static asset delivery

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Bundle Analysis**: Size monitoring
- **Error Tracking**: Runtime error collection
- **User Analytics**: Usage pattern analysis

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/) - Color accessibility

---

This architecture ensures SwingVista is accessible, performant, and maintainable across all devices and environments.
