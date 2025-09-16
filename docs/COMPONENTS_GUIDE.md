# SwingVista Components Guide

This guide documents all the React components available in the SwingVista application, their props, usage examples, and styling guidelines.

## Component Architecture

SwingVista uses a component-based architecture with:
- **Layout Components**: Structure and navigation
- **UI Components**: Reusable interface elements
- **Page Components**: Full page layouts
- **Feature Components**: Specific functionality (planned)

## Layout Components

### Header

**Location**: `src/components/layout/Header.tsx`

The main navigation header with logo and navigation links.

```typescript
<Header />
```

**Features**:
- Responsive design with mobile-friendly navigation
- Logo with gradient background
- Navigation links with hover effects
- Consistent spacing and typography

**Styling**:
- Fixed height (56px)
- White background with bottom border
- Green-to-blue gradient logo
- Hover states for navigation links

### Footer

**Location**: `src/components/layout/Footer.tsx`

The application footer with copyright and navigation links.

```typescript
<Footer />
```

**Features**:
- Dynamic copyright year
- Navigation links
- Clean, minimal design
- Responsive layout

**Styling**:
- Top border separator
- White background
- Gray text for secondary information
- Hover effects on links

## UI Components

### Button

**Location**: `src/components/ui/Button.tsx`

A versatile button component with multiple variants and states.

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

**Usage Examples**:

```typescript
// Primary button
<Button variant="primary" size="md">
  Click me
</Button>

// Button with loading state
<Button loading={true}>
  Processing...
</Button>

// Button with icon
<Button icon={<Icon />}>
  Save
</Button>

// Full width button
<Button fullWidth={true}>
  Submit
</Button>

// Outline button
<Button variant="outline">
  Cancel
</Button>
```

**Variants**:
- `primary`: Blue background, white text
- `secondary`: Gray background, white text
- `danger`: Red background, white text
- `success`: Green background, white text
- `outline`: Transparent background, border

**Sizes**:
- `sm`: Small padding, small text
- `md`: Medium padding, base text
- `lg`: Large padding, large text

### LoadingSpinner

**Location**: `src/components/ui/LoadingSpinner.tsx`

A loading indicator with optional text.

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}
```

**Usage Examples**:

```typescript
// Basic spinner
<LoadingSpinner />

// Spinner with text
<LoadingSpinner text="Loading..." />

// Large spinner
<LoadingSpinner size="lg" text="Processing video..." />
```

**Sizes**:
- `sm`: 16px × 16px
- `md`: 24px × 24px
- `lg`: 32px × 32px

### ErrorAlert

**Location**: `src/components/ui/ErrorAlert.tsx`

An alert component for displaying error messages.

```typescript
interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  type?: 'error' | 'warning' | 'info';
}
```

**Usage Examples**:

```typescript
// Error alert
<ErrorAlert message="Something went wrong!" />

// Dismissible warning
<ErrorAlert 
  type="warning" 
  message="Please check your input"
  onDismiss={() => setShowAlert(false)}
/>

// Info alert
<ErrorAlert 
  type="info" 
  message="Analysis complete!"
/>
```

**Types**:
- `error`: Red styling with error icon
- `warning`: Yellow styling with warning icon
- `info`: Blue styling with info icon

### ProgressBar

**Location**: `src/components/ui/ProgressBar.tsx`

A progress bar component for showing completion status.

```typescript
interface ProgressBarProps {
  progress: number;
  step?: string;
  className?: string;
  showPercentage?: boolean;
}
```

**Usage Examples**:

```typescript
// Basic progress bar
<ProgressBar progress={75} />

// With step description
<ProgressBar 
  progress={50} 
  step="Processing video..."
  showPercentage={true}
/>
```

**Features**:
- Smooth animations
- Optional step description
- Percentage display
- Responsive design

### Tooltip

**Location**: `src/components/ui/Tooltip.tsx`

A tooltip component for providing additional information.

```typescript
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}
```

**Usage Examples**:

```typescript
// Basic tooltip
<Tooltip content="Click to start recording">
  <Button>Record</Button>
</Tooltip>

// Tooltip with custom position
<Tooltip 
  content="Upload your golf swing video"
  position="bottom"
  delay={500}
>
  <Button>Upload</Button>
</Tooltip>
```

**Positions**:
- `top`: Above the element
- `bottom`: Below the element
- `left`: To the left of the element
- `right`: To the right of the element

## Page Components

### Home Page

**Location**: `src/app/page.tsx`

The main dashboard page with navigation to key features.

**Features**:
- Welcome message
- Feature navigation buttons
- Responsive design
- Call-to-action buttons

### Camera Page

**Location**: `src/app/camera/page.tsx`

The camera analysis interface page.

**Features**:
- Camera access interface
- Recording controls
- Settings options
- Navigation back to home

### Upload Page

**Location**: `src/app/upload/page.tsx`

The video upload interface page.

**Features**:
- File upload area
- Analysis controls
- Navigation back to home

## Styling Guidelines

### Design System

**Colors**:
- Primary: `#10B981` (Green)
- Secondary: `#3B82F6` (Blue)
- Success: `#10B981` (Green)
- Danger: `#EF4444` (Red)
- Warning: `#F59E0B` (Yellow)
- Info: `#3B82F6` (Blue)

**Typography**:
- Font Family: Inter (Google Fonts)
- Headings: Font weights 600-700
- Body: Font weight 400-500
- Small text: Font weight 400

**Spacing**:
- Consistent use of Tailwind spacing scale
- 4px base unit (0.25rem)
- Responsive spacing with `sm:`, `md:`, `lg:` prefixes

**Shadows**:
- Subtle shadows for depth
- Hover effects with enhanced shadows
- Consistent shadow patterns across components

### Responsive Design

All components are built with mobile-first responsive design:

```typescript
// Example responsive classes
className="flex flex-col sm:flex-row gap-4 sm:gap-6"
```

**Breakpoints**:
- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

### Accessibility

All components include accessibility features:

- **ARIA labels**: Screen reader support
- **Keyboard navigation**: Tab and focus management
- **Color contrast**: WCAG AA compliant
- **Semantic HTML**: Proper element usage

### Animation

Consistent animation patterns:

```typescript
// Hover effects
className="transition-all duration-200 hover:shadow-lg"

// Loading states
className="animate-spin"

// Transform effects
className="transform hover:-translate-y-1"
```

## Usage Best Practices

### Component Composition

```typescript
// Good: Composing components
<div className="space-y-4">
  <ErrorAlert message="Error occurred" />
  <Button variant="primary">Retry</Button>
</div>

// Good: Using props for customization
<Button 
  variant="success" 
  size="lg" 
  fullWidth={true}
  loading={isLoading}
>
  Save Changes
</Button>
```

### State Management

```typescript
// Good: Local state for UI
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Good: Conditional rendering
{error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
{isLoading && <LoadingSpinner text="Processing..." />}
```

### Error Handling

```typescript
// Good: Error boundaries and user feedback
try {
  await processVideo();
} catch (error) {
  setError('Failed to process video. Please try again.');
}
```

## Future Components

### Planned Components

1. **VideoPlayer**: Custom video player with analysis overlays
2. **SwingAnalysis**: Display swing metrics and feedback
3. **UserProfile**: User account management
4. **SettingsPanel**: Application settings
5. **NotificationToast**: Toast notifications
6. **Modal**: Modal dialog component
7. **Form**: Form components with validation
8. **Chart**: Data visualization components

### Component Development Guidelines

1. **TypeScript**: Always use TypeScript interfaces
2. **Props**: Use descriptive prop names
3. **Default Values**: Provide sensible defaults
4. **Accessibility**: Include ARIA attributes
5. **Responsive**: Mobile-first design
6. **Testing**: Include test cases
7. **Documentation**: Document all props and usage

---

This components guide will be updated as new components are added and existing ones are modified.