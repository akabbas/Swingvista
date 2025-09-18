# SwingVista Components Guide

This guide documents all the React components available in the SwingVista application, their props, usage examples, and styling guidelines.

## Component Architecture

SwingVista uses a component-based architecture with:
- **Layout Components**: Structure and navigation
- **UI Components**: Reusable interface elements
- **Page Components**: Full page layouts
- **Analysis Components**: Golf swing analysis and visualization
- **Feature Components**: Specific functionality
- **Debug Components**: Developer monitoring and validation tools
- **Weight Distribution Components**: Advanced weight tracking and analysis

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

## Analysis Components

### VideoAnalysisPlayer

**Location**: `src/components/analysis/VideoAnalysisPlayer.tsx`

Displays video with analysis overlays including pose detection and swing phase visualization.

```typescript
<VideoAnalysisPlayer
  videoUrl={string}
  poses={PoseResult[]}
  metrics={SwingMetrics}
  phases={SwingPhase[]}
  className?: string
/>
```

**Features**:
- Video playback with controls
- Stick figure overlay showing body landmarks
- Swing phase timeline visualization
- Metrics display overlay
- Toggle for showing/hiding overlays

### GolfGradeCard

**Location**: `src/components/analysis/GolfGradeCard.tsx`

Displays golf swing grading information with letter grades and scores.

```typescript
<GolfGradeCard
  grade={string}
  score={number}
  category={string}
  description={string}
  className?: string
/>
```

**Features**:
- Letter grade display (A+ to F)
- Numerical score (0-100)
- Category-specific styling
- Responsive design

### SwingFeedback

**Location**: `src/components/analysis/SwingFeedback.tsx`

Shows AI-powered swing analysis feedback and recommendations.

```typescript
<SwingFeedback
  analysis={{
    overallAssessment: string;
    strengths: string[];
    improvements: string[];
    keyTip: string;
    recordingTips: string[];
  }}
  className?: string
/>
```

**Features**:
- Structured feedback display
- Strengths and improvements sections
- Key tips highlighting
- Recording recommendations

### DrillRecommendations

**Location**: `src/components/analysis/DrillRecommendations.tsx`

Displays personalized drill recommendations based on swing analysis.

```typescript
<DrillRecommendations
  recommendations={DrillRecommendation[]}
  skillLevel={string}
  className?: string
/>
```

**Features**:
- Progressive difficulty levels
- Detailed drill instructions
- Equipment requirements
- Duration guidelines

### ProgressChart

**Location**: `src/components/analysis/ProgressChart.tsx`

Visualizes swing improvement over time with interactive charts.

```typescript
<ProgressChart
  data={ProgressData[]}
  metric={string}
  timeRange={string}
  className?: string
/>
```

**Features**:
- Interactive line charts
- Multiple metric support
- Time range selection
- Trend analysis

### PoseOverlay

**Location**: `src/components/analysis/PoseOverlay.tsx`

Renders pose landmarks and swing phase information on video.

```typescript
<PoseOverlay
  pose={PoseResult}
  phase={SwingPhase}
  showSwingPlane={boolean}
  className?: string
/>
```

**Features**:
- Real-time pose rendering
- Swing phase highlighting
- Swing plane visualization
- Confidence scoring

## Future Components

### Planned Components

1. **UserProfile**: User account management
2. **SettingsPanel**: Application settings
3. **NotificationToast**: Toast notifications
4. **Modal**: Modal dialog component
5. **Form**: Form components with validation
6. **Chart**: Data visualization components

### Component Development Guidelines

1. **TypeScript**: Always use TypeScript interfaces
2. **Props**: Use descriptive prop names
3. **Default Values**: Provide sensible defaults
4. **Accessibility**: Include ARIA attributes
5. **Responsive**: Mobile-first design
6. **Testing**: Include test cases
7. **Documentation**: Document all props and usage

## Debug Components

### DebugOverlay

**Location**: `src/components/debug/DebugOverlay.tsx`

Real-time debug monitoring overlay for developers.

```typescript
<DebugOverlay
  debugger={debugger}
  className="optional-class"
/>
```

**Props**:
- `debugger`: SwingAnalysisDebugger instance
- `className`: Optional CSS class

**Features**:
- Real-time component status monitoring
- Performance metrics display
- Error and warning indicators
- Validation results
- System health summary
- Auto-refresh capability
- Export functionality

**Status Indicators**:
- ✅ Green (OK): Component working correctly
- ⚠️ Orange (Warning): Component has minor issues
- ❌ Red (Error): Component has critical issues
- ❓ Gray (Unknown): Component status not determined

### DebugControls

**Location**: `src/components/debug/DebugControls.tsx`

Debug control panel for developers.

```typescript
<DebugControls
  debugger={debugger}
  className="optional-class"
/>
```

**Props**:
- `debugger`: SwingAnalysisDebugger instance
- `className`: Optional CSS class

**Features**:
- Toggle debug mode
- Run validation suite
- Export debug data
- Clear errors and warnings
- Force refresh components
- Verbose logging toggle
- System information display

### DebugProvider

**Location**: `src/contexts/DebugContext.tsx`

Context provider for debug system state management.

```typescript
<DebugProvider enableDebug={true}>
  <YourApp />
</DebugProvider>
```

**Props**:
- `enableDebug`: Whether to enable debug mode by default
- `children`: React children components

**Features**:
- Global debug state management
- Component registration
- Status updates
- Performance tracking
- Error handling

## Weight Distribution Components

### WeightDistributionAnalyzer

**Location**: `src/lib/weight-distribution-analysis.ts`

Core analyzer for weight distribution tracking.

```typescript
const analyzer = new WeightDistributionAnalyzer();

// Analyze current pose
const weightDist = analyzer.analyzeWeightDistribution(landmarks, frameIndex, totalFrames);

// Get swing metrics
const metrics = analyzer.analyzeSwingMetrics(poses);
```

**Features**:
- Camera angle detection and compensation
- Multi-method weight distribution calculation
- Real-time confidence scoring
- Phase-aware analysis
- Performance optimization

### SwingFeedbackSystem

**Location**: `src/lib/swing-feedback-system.ts`

Dynamic feedback generation system.

```typescript
const feedbackSystem = new SwingFeedbackSystem(weightAnalyzer);

// Generate feedback
const feedback = feedbackSystem.generateFeedback(weightDist, cameraAngle, swingMetrics, currentPhase);
```

**Features**:
- Phase-specific feedback generation
- Priority-based recommendation system
- Visual indicator generation
- Improvement tip suggestions
- Scoring system integration

## Enhanced OverlaySystem

The OverlaySystem component has been significantly enhanced with new weight distribution and debug features:

### New Weight Distribution Features
- **Weight Distribution Bars**: Visual bars showing left/right foot percentages
- **Center of Gravity**: Yellow circle showing body's center of mass
- **Balance Arrows**: Arrows showing forward/back and lateral balance
- **Stability Indicator**: Color-coded stability percentage
- **Phase Display**: Shows current swing phase
- **Confidence Indicator**: Shows analysis confidence level

### New Debug Features
- **Real-time Monitoring**: Tracks all 6 analysis components
- **Performance Metrics**: Frame rate, processing time, confidence scores
- **Error Detection**: Automatic issue identification and reporting
- **Validation Suite**: Automated testing of all components

---

This components guide will be updated as new components are added and existing ones are modified.