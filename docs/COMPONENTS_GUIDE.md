# SwingVista Components Guide

This guide provides detailed information about all UI components in the SwingVista application, their usage, props, and examples.

## Table of Contents

- [Layout Components](#layout-components)
- [UI Components](#ui-components)
- [Specialized Components](#specialized-components)
- [Component Patterns](#component-patterns)
- [Styling Guidelines](#styling-guidelines)

## Layout Components

### Header
**File**: `src/components/layout/Header.tsx`

Navigation header with responsive design and environment awareness.

**Features**:
- Responsive navigation menu
- Environment banner integration
- Mobile-friendly hamburger menu
- Theme toggle support

**Usage**:
```tsx
import Header from '@/components/layout/Header';

<Header />
```

### Footer
**File**: `src/components/layout/Footer.tsx`

Site footer with links and information.

**Features**:
- Social media links
- Copyright information
- Responsive design
- Accessibility compliance

**Usage**:
```tsx
import Footer from '@/components/layout/Footer';

<Footer />
```

## UI Components

### Button
**File**: `src/components/ui/Button.tsx`

Versatile button component with multiple variants and states.

**Props**:
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}
```

**Variants**:
- `primary`: Blue background, white text
- `secondary`: Gray background, white text
- `danger`: Red background, white text
- `success`: Green background, white text
- `outline`: Transparent background, bordered

**Sizes**:
- `sm`: Small padding and text
- `md`: Medium padding and text (default)
- `lg`: Large padding and text

**Usage**:
```tsx
import Button from '@/components/ui/Button';

// Basic button
<Button onClick={handleClick}>Click me</Button>

// Button with icon
<Button icon={<Icon />} variant="primary">
  Save
</Button>

// Loading button
<Button loading={isLoading} variant="success">
  Processing...
</Button>

// Full width button
<Button fullWidth variant="outline">
  Cancel
</Button>
```

### LoadingSpinner
**File**: `src/components/ui/LoadingSpinner.tsx`

Loading spinner component with customizable size and text.

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}
```

**Usage**:
```tsx
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// Spinner with text
<LoadingSpinner text="Loading analysis..." size="lg" />
```

### ProgressBar
**File**: `src/components/ui/ProgressBar.tsx`

Progress bar component with step indication.

**Props**:
```typescript
interface ProgressBarProps {
  progress: number;
  step?: string;
  className?: string;
  showPercentage?: boolean;
}
```

**Usage**:
```tsx
import ProgressBar from '@/components/ui/ProgressBar';

<ProgressBar 
  progress={75} 
  step="Analyzing swing..." 
  showPercentage={true} 
/>
```

### ErrorAlert
**File**: `src/components/ui/ErrorAlert.tsx`

Error alert component with dismiss functionality.

**Props**:
```typescript
interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  type?: 'error' | 'warning' | 'info';
}
```

**Usage**:
```tsx
import ErrorAlert from '@/components/ui/ErrorAlert';

<ErrorAlert 
  message="Analysis failed. Please try again." 
  onDismiss={() => setError(null)}
  type="error"
/>
```

### EnvironmentBanner
**File**: `src/components/ui/EnvironmentBanner.tsx`

Environment indicator banner for development/production.

**Features**:
- Automatic environment detection
- Connection status testing
- Development-only display
- Supabase connection validation

**Usage**:
```tsx
import EnvironmentBanner from '@/components/ui/EnvironmentBanner';

<EnvironmentBanner />
```

### Tooltip
**File**: `src/components/ui/Tooltip.tsx`

Tooltip component with customizable positioning and delay.

**Props**:
```typescript
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}
```

**Usage**:
```tsx
import Tooltip from '@/components/ui/Tooltip';

<Tooltip content="Real-time pose detection and analysis" position="top">
  <button>Live Analysis</button>
</Tooltip>
```

### ThemeToggle
**File**: `src/components/ui/ThemeToggle.tsx`

Theme toggle component for dark/light mode switching.

**Features**:
- System preference detection
- Local storage persistence
- Smooth transitions
- Accessible design

**Usage**:
```tsx
import ThemeToggle from '@/components/ui/ThemeToggle';

<ThemeToggle />
```

### Skeleton
**File**: `src/components/ui/Skeleton.tsx`

Loading skeleton component for better UX during data loading.

**Props**:
```typescript
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}
```

**Predefined Components**:
- `SkeletonCard`: Card-shaped skeleton
- `SkeletonTable`: Table-shaped skeleton
- `SkeletonList`: List-shaped skeleton

**Usage**:
```tsx
import Skeleton, { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';

// Basic skeleton
<Skeleton width={200} height={20} />

// Card skeleton
<SkeletonCard />

// Table skeleton
<SkeletonTable />
```

## Specialized Components

### ExportDialog
**File**: `src/components/ui/ExportDialog.tsx`

Modal dialog for export options with progress feedback.

**Props**:
```typescript
interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  swingData: ExportData;
  onExportComplete?: () => void;
}
```

**Features**:
- Export format selection (JSON/CSV)
- Data inclusion options
- Progress tracking
- Error handling

**Usage**:
```tsx
import ExportDialog from '@/components/ui/ExportDialog';

<ExportDialog
  isOpen={showExportDialog}
  onClose={() => setShowExportDialog(false)}
  swingData={swingData}
  onExportComplete={() => console.log('Export complete')}
/>
```

### MonitoringDashboard
**File**: `src/components/ui/MonitoringDashboard.tsx`

Monitoring dashboard for logs and performance metrics.

**Props**:
```typescript
interface MonitoringDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features**:
- Live log viewing
- Performance metrics display
- Log filtering and search
- Export capabilities

**Usage**:
```tsx
import MonitoringDashboard from '@/components/ui/MonitoringDashboard';

<MonitoringDashboard
  isOpen={showMonitoring}
  onClose={() => setShowMonitoring(false)}
/>
```

## Component Patterns

### Consistent Styling
All components follow consistent styling patterns:

```tsx
// Base classes for consistency
const baseClasses = 'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

// Variant-based styling
const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  // ...
};

// Size-based styling
const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};
```

### Accessibility
All components include proper accessibility features:

```tsx
// ARIA labels
<button aria-label="Close dialog" onClick={onClose}>

// Focus management
useEffect(() => {
  if (isOpen) {
    const firstFocusable = dialogRef.current?.querySelector('[tabindex="0"]');
    firstFocusable?.focus();
  }
}, [isOpen]);

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    onClose();
  }
};
```

### Error Boundaries
Components are wrapped in error boundaries for graceful error handling:

```tsx
<ErrorBoundary fallback={<ErrorAlert message="Something went wrong" />}>
  <ComponentThatMightError />
</ErrorBoundary>
```

## Styling Guidelines

### Tailwind CSS Classes
Use Tailwind CSS for consistent styling:

```tsx
// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// Hover states
<button className="hover:bg-blue-700 transition-colors">

// Focus states
<input className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
```

### Color Palette
Use the defined color palette for consistency:

```tsx
// Primary colors
'bg-blue-600', 'text-blue-600', 'border-blue-600'

// Success colors
'bg-green-600', 'text-green-600', 'border-green-600'

// Error colors
'bg-red-600', 'text-red-600', 'border-red-600'

// Warning colors
'bg-yellow-600', 'text-yellow-600', 'border-yellow-600'
```

### Spacing
Use consistent spacing scale:

```tsx
// Padding
'p-2', 'p-4', 'p-6', 'p-8'

// Margin
'm-2', 'm-4', 'm-6', 'm-8'

// Gap
'gap-2', 'gap-4', 'gap-6', 'gap-8'
```

## Best Practices

### Component Composition
- Use composition over inheritance
- Keep components small and focused
- Extract reusable logic into custom hooks

### Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Avoid unnecessary re-renders

### Testing
- Write tests for component behavior
- Test accessibility features
- Mock external dependencies

### Documentation
- Document all props and their types
- Provide usage examples
- Include accessibility notes

## Contributing

When adding new components:

1. Follow the established patterns
2. Include proper TypeScript types
3. Add accessibility features
4. Write comprehensive tests
5. Update this documentation
6. Follow the styling guidelines

For questions or suggestions, please open an issue or submit a pull request.
