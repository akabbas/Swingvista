# SwingVista Testing Strategy

This document outlines the testing approach for the SwingVista application, including current testing capabilities and planned testing infrastructure.

## Current Testing Status

**Frontend Only**: SwingVista is currently a client-side application with no backend dependencies, focusing on UI/UX testing and performance validation.

## Testing Philosophy

### Testing Pyramid

1. **Unit Tests** (70%): Component and utility function testing
2. **Integration Tests** (20%): Component interaction testing
3. **End-to-End Tests** (10%): Full user journey testing

### Testing Principles

- **Test Behavior, Not Implementation**: Focus on what the user sees and does
- **Fast Feedback**: Quick test execution for rapid development
- **Reliable**: Consistent test results across environments
- **Maintainable**: Easy to update and extend tests

## Current Testing Setup

### Manual Testing

Currently, testing is performed manually through:

1. **Browser Testing**: Cross-browser compatibility
2. **Responsive Testing**: Mobile and desktop layouts
3. **Performance Testing**: Core Web Vitals validation
4. **Accessibility Testing**: Screen reader and keyboard navigation

### Testing Checklist

#### Functionality Testing
- [ ] Home page loads correctly
- [ ] Navigation links work properly
- [ ] Camera page displays correctly
- [ ] Upload page displays correctly
- [ ] All buttons are clickable and responsive
- [ ] No JavaScript errors in console

#### Responsive Testing
- [ ] Mobile layout (320px - 768px)
- [ ] Tablet layout (768px - 1024px)
- [ ] Desktop layout (1024px+)
- [ ] Touch interactions work on mobile
- [ ] Text is readable at all sizes

#### Performance Testing
- [ ] Page loads under 3 seconds
- [ ] No FOUC (Flash of Unstyled Content)
- [ ] Images load efficiently
- [ ] Fonts load with proper fallbacks
- [ ] Smooth animations and transitions

#### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators are visible
- [ ] Alt text for images (when added)

## Planned Testing Infrastructure

### Unit Testing with Jest and React Testing Library

#### Setup

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

#### Configuration

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'
```

#### Component Testing Examples

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '@/components/ui/Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('applies correct variant classes', () => {
    render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600')
  })
})
```

```typescript
// Header.test.tsx
import { render, screen } from '@testing-library/react'
import Header from '@/components/layout/Header'

describe('Header Component', () => {
  it('renders logo and navigation', () => {
    render(<Header />)
    
    expect(screen.getByText('SwingVista')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '🏠 Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '📹 Camera' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '📤 Upload' })).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    render(<Header />)
    
    expect(screen.getByRole('link', { name: '🏠 Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '📹 Camera' })).toHaveAttribute('href', '/camera')
    expect(screen.getByRole('link', { name: '📤 Upload' })).toHaveAttribute('href', '/upload')
  })
})
```

### Integration Testing

#### Page Testing

```typescript
// page.test.tsx
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

describe('Home Page', () => {
  it('renders welcome message', () => {
    render(<HomePage />)
    
    expect(screen.getByText('Welcome to SwingVista')).toBeInTheDocument()
    expect(screen.getByText(/Advanced golf swing analysis/)).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(<HomePage />)
    
    expect(screen.getByRole('link', { name: '📹 Start Camera Analysis' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '📤 Upload Video' })).toBeInTheDocument()
  })
})
```

### End-to-End Testing with Playwright

#### Setup

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install browsers
npx playwright install
```

#### Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### E2E Test Examples

```typescript
// tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')
    
    // Test home page
    await expect(page.getByText('Welcome to SwingVista')).toBeVisible()
    
    // Navigate to camera page
    await page.click('text=📹 Start Camera Analysis')
    await expect(page).toHaveURL('/camera')
    await expect(page.getByText('📹 Camera Analysis')).toBeVisible()
    
    // Navigate to upload page
    await page.click('text=📤 Upload')
    await expect(page).toHaveURL('/upload')
    await expect(page.getByText('📤 Upload Video')).toBeVisible()
    
    // Navigate back to home
    await page.click('text=← Back to Home')
    await expect(page).toHaveURL('/')
  })
})
```

```typescript
// tests/e2e/responsive.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check mobile layout
    await expect(page.getByText('Welcome to SwingVista')).toBeVisible()
    await expect(page.getByRole('link', { name: '📹 Start Camera Analysis' })).toBeVisible()
  })
  
  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    // Check tablet layout
    await expect(page.getByText('Welcome to SwingVista')).toBeVisible()
  })
})
```

### Performance Testing

#### Lighthouse Testing

```typescript
// tests/performance/lighthouse.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance', () => {
  test('should meet performance standards', async ({ page }) => {
    await page.goto('/')
    
    // Run Lighthouse audit
    const lighthouse = await page.evaluate(() => {
      return new Promise((resolve) => {
        // This would integrate with Lighthouse API
        resolve({
          performance: 95,
          accessibility: 100,
          bestPractices: 100,
          seo: 100
        })
      })
    })
    
    expect(lighthouse.performance).toBeGreaterThan(90)
    expect(lighthouse.accessibility).toBeGreaterThan(90)
  })
})
```

### Visual Regression Testing

#### Setup with Chromatic

```bash
# Install Chromatic
npm install --save-dev chromatic

# Add to package.json
{
  "scripts": {
    "chromatic": "chromatic --project-token=your-token"
  }
}
```

#### Visual Test Examples

```typescript
// tests/visual/visual.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test('home page should match snapshot', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveScreenshot('home-page.png')
  })
  
  test('camera page should match snapshot', async ({ page }) => {
    await page.goto('/camera')
    await expect(page).toHaveScreenshot('camera-page.png')
  })
})
```

## Testing Scripts

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:visual": "chromatic",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: clean/package-lock.json
      
      - name: Install dependencies
        run: |
          cd clean
          npm ci
      
      - name: Run unit tests
        run: |
          cd clean
          npm run test:coverage
      
      - name: Run E2E tests
        run: |
          cd clean
          npm run test:e2e
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./clean/coverage/lcov.info
```

## Test Data Management

### Mock Data

```typescript
// tests/mocks/mockData.ts
export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com'
}

export const mockSwingAnalysis = {
  id: '1',
  userId: '1',
  videoUrl: 'https://example.com/video.mp4',
  analysis: {
    tempo: 1.2,
    swingPath: 'good',
    posture: 'excellent'
  }
}
```

### Test Utilities

```typescript
// tests/utils/testUtils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

## Quality Gates

### Coverage Requirements

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **E2E Tests**: Critical user journeys covered

### Performance Requirements

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTFB**: < 600ms

### Accessibility Requirements

- **WCAG AA**: Compliant
- **Keyboard Navigation**: Fully functional
- **Screen Reader**: Compatible

## Future Testing Enhancements

### Planned Features

1. **API Testing**: When backend is implemented
2. **Load Testing**: For video processing endpoints
3. **Security Testing**: Authentication and authorization
4. **Cross-Browser Testing**: Automated browser testing
5. **Mobile Testing**: Device-specific testing

### Testing Tools

1. **Cypress**: Alternative E2E testing
2. **Storybook**: Component testing and documentation
3. **MSW**: API mocking
4. **React Hook Testing**: Custom hook testing
5. **Jest Mock Service Worker**: API mocking

---

This testing strategy will be updated as new testing requirements and tools are added to the project.