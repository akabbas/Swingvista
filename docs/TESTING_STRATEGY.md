# SwingVista Testing Strategy

This document outlines the comprehensive testing strategy for SwingVista, covering unit tests, integration tests, end-to-end tests, and performance testing.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Testing Tools](#testing-tools)
- [Test Structure](#test-structure)
- [Coverage Requirements](#coverage-requirements)
- [Performance Testing](#performance-testing)
- [Accessibility Testing](#accessibility-testing)
- [Mobile Testing](#mobile-testing)
- [CI/CD Integration](#cicd-integration)

## Testing Philosophy

### Core Principles
1. **Test Early and Often**: Tests are written alongside code, not after
2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **Maintainable Tests**: Tests should be easy to read, understand, and maintain
4. **Fast Feedback**: Tests should run quickly and provide immediate feedback
5. **Reliable Tests**: Tests should be stable and not flaky

### Testing Pyramid
```
    /\
   /  \     E2E Tests (Few, Slow, Expensive)
  /____\    
 /      \   Integration Tests (Some, Medium Speed)
/________\  
/          \ Unit Tests (Many, Fast, Cheap)
/____________\
```

## Test Types

### 1. Unit Tests
**Purpose**: Test individual functions and components in isolation

**Coverage**:
- All utility functions
- Component rendering and behavior
- Business logic functions
- Data transformation functions

**Tools**: Vitest, React Testing Library

**Example**:
```typescript
// src/__tests__/utils.test.ts
import { calculateSwingMetrics } from '@/lib/metrics';

describe('calculateSwingMetrics', () => {
  it('should calculate correct tempo ratio', () => {
    const poses = generateMockPoses();
    const result = calculateSwingMetrics(poses);
    expect(result.tempoRatio).toBeCloseTo(2.1, 1);
  });
});
```

### 2. Integration Tests
**Purpose**: Test how different parts of the system work together

**Coverage**:
- API endpoints
- Database operations
- Component interactions
- Worker communication

**Tools**: Vitest, MSW (Mock Service Worker)

**Example**:
```typescript
// src/__tests__/api.test.ts
import { POST } from '@/app/api/swings/route';

describe('/api/swings', () => {
  it('should create a new swing record', async () => {
    const request = new Request('http://localhost/api/swings', {
      method: 'POST',
      body: JSON.stringify(mockSwingData),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

### 3. End-to-End Tests
**Purpose**: Test complete user workflows

**Coverage**:
- User registration and login
- Video upload and analysis
- Live camera recording
- Swing comparison
- Export functionality

**Tools**: Playwright, Cypress

**Example**:
```typescript
// e2e/swing-analysis.spec.ts
import { test, expect } from '@playwright/test';

test('complete swing analysis workflow', async ({ page }) => {
  await page.goto('/camera');
  await page.click('[data-testid="start-recording"]');
  await page.waitForTimeout(2000); // Record for 2 seconds
  await page.click('[data-testid="stop-recording"]');
  await page.click('[data-testid="analyze-swing"]');
  
  await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
  await expect(page.locator('[data-testid="report-card"]')).toBeVisible();
});
```

### 4. Visual Regression Tests
**Purpose**: Ensure UI consistency across changes

**Coverage**:
- Component screenshots
- Page layouts
- Responsive design
- Dark/light mode

**Tools**: Playwright, Chromatic

## Testing Tools

### Primary Tools
- **Vitest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **MSW**: API mocking
- **Jest DOM**: Additional matchers

### Supporting Tools
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: DOM matchers
- **jsdom**: DOM environment for tests
- **supertest**: API testing utilities

## Test Structure

### File Organization
```
src/
├── __tests__/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   ├── components/     # Component tests
│   └── utils/          # Utility tests
├── e2e/               # End-to-end tests
├── __mocks__/         # Mock files
└── test-utils/        # Test utilities
```

### Test Naming Convention
```typescript
// Component tests
describe('Button Component', () => {
  describe('when rendered', () => {
    it('should display the correct text');
    it('should apply the correct variant styles');
  });
  
  describe('when clicked', () => {
    it('should call the onClick handler');
    it('should not call onClick when disabled');
  });
});

// Utility tests
describe('calculateSwingMetrics', () => {
  it('should return correct metrics for valid input');
  it('should handle empty pose array');
  it('should throw error for invalid input');
});
```

## Coverage Requirements

### Minimum Coverage Targets
- **Unit Tests**: 90% line coverage
- **Integration Tests**: 80% line coverage
- **E2E Tests**: 100% critical user paths
- **Components**: 85% line coverage

### Coverage Exclusions
- Configuration files
- Type definitions
- Test files themselves
- Build scripts

### Coverage Reporting
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
npm run test:coverage:open
```

## Performance Testing

### Metrics to Track
- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1

### Performance Test Tools
- **Lighthouse**: Automated performance auditing
- **WebPageTest**: Detailed performance analysis
- **Playwright**: Performance testing in CI/CD

### Performance Test Examples
```typescript
// performance/camera-page.spec.ts
import { test, expect } from '@playwright/test';

test('camera page performance', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/camera');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000);
  
  // Test pose detection performance
  const fps = await page.evaluate(() => {
    return window.performanceMetrics?.fps || 0;
  });
  
  expect(fps).toBeGreaterThan(15);
});
```

## Accessibility Testing

### WCAG Compliance
- **Level AA**: Minimum compliance level
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: Minimum 4.5:1 ratio for normal text

### Testing Tools
- **axe-core**: Automated accessibility testing
- **@testing-library/jest-dom**: Accessibility matchers
- **Manual Testing**: Screen reader testing

### Accessibility Test Examples
```typescript
// accessibility/button.test.ts
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from '@/components/ui/Button';

expect.extend(toHaveNoViolations);

test('button should not have accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('button should be keyboard accessible', () => {
  render(<Button>Click me</Button>);
  const button = screen.getByRole('button');
  expect(button).toHaveFocus();
});
```

## Mobile Testing

### Device Testing
- **iOS Safari**: iPhone 12, 13, 14
- **Android Chrome**: Pixel 6, Samsung Galaxy S21
- **Responsive Design**: 320px to 1920px width

### Mobile-Specific Tests
```typescript
// mobile/camera-functionality.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test('camera works on mobile', async ({ page }) => {
  await page.goto('/camera');
  
  // Test camera permission
  await page.click('[data-testid="start-recording"]');
  await expect(page.locator('[data-testid="camera-feed"]')).toBeVisible();
  
  // Test touch interactions
  await page.tap('[data-testid="stop-recording"]');
  await expect(page.locator('[data-testid="analyze-button"]')).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Test Environments
- **Development**: Local development with hot reload
- **Staging**: Production-like environment for integration tests
- **Production**: Smoke tests and monitoring

## Test Data Management

### Mock Data
```typescript
// test-utils/mockData.ts
export const mockSwingData = {
  id: 'test-swing-1',
  club: 'driver',
  metrics: {
    swingPlaneAngle: 12.5,
    tempoRatio: 2.1,
    hipRotation: 30.0,
    shoulderRotation: 45.0,
  },
  feedback: ['Good tempo', 'Rotate more'],
  created_at: new Date().toISOString(),
};
```

### Test Database
- **In-Memory Database**: For unit tests
- **Test Database**: For integration tests
- **Mock APIs**: For E2E tests

## Debugging Tests

### Common Issues
1. **Flaky Tests**: Use proper waits and assertions
2. **Slow Tests**: Optimize test data and setup
3. **Environment Issues**: Ensure consistent test environment

### Debugging Tools
```typescript
// Debug test failures
test('debug test', async ({ page }) => {
  await page.goto('/camera');
  
  // Add debugging
  await page.screenshot({ path: 'debug.png' });
  console.log(await page.content());
  
  // Pause execution
  await page.pause();
});
```

## Best Practices

### Test Writing
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Single Responsibility**: One test, one behavior
3. **Descriptive Names**: Test names should describe the behavior
4. **Independent Tests**: Tests should not depend on each other

### Test Maintenance
1. **Regular Updates**: Keep tests up to date with code changes
2. **Remove Dead Tests**: Delete tests for removed functionality
3. **Refactor Tests**: Keep tests clean and maintainable

### Performance
1. **Parallel Execution**: Run tests in parallel when possible
2. **Selective Testing**: Run only relevant tests during development
3. **Test Caching**: Cache test results and dependencies

## Conclusion

This testing strategy ensures SwingVista maintains high quality, reliability, and performance. Regular review and updates of this strategy will help maintain testing effectiveness as the application evolves.

For questions or suggestions about testing, please open an issue or contact the development team.
