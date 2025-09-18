# Debug System

SwingVista's comprehensive debug system provides real-time monitoring and validation of all analysis components, designed specifically for developers to diagnose issues and ensure optimal performance.

## 🛠️ Overview

The debug system monitors all 6 key aspects of golf swing analysis in real-time, providing visual indicators, performance metrics, and automated validation to help developers quickly identify and resolve issues.

## 🎯 Monitored Components

### 1. Stick Figure Overlay
- **Landmark Detection**: Number of landmarks detected (0-33)
- **Confidence Score**: Average confidence of landmark detection (0-1)
- **Rendering Status**: Canvas rendering functionality (ok/error)
- **Issues**: Missing landmarks, low confidence, rendering failures

### 2. Swing Plane Visualization
- **Plane Calculation**: Whether swing plane is calculated (boolean)
- **Angle**: Swing plane angle in degrees (0-90)
- **Consistency**: How consistent the swing plane is (0-1)
- **Deviation**: Standard deviation of swing plane (0-1)
- **Issues**: Calculation failures, invalid angles, low consistency

### 3. Club Path Tracking
- **Points Tracked**: Number of club path points (0+)
- **Smoothness**: How smooth the path is (0-1)
- **Accuracy**: How accurate the path is (0-1)
- **Frame Accuracy**: Frame-by-frame accuracy (0-1)
- **Issues**: Insufficient points, jagged path, low accuracy

### 4. Phase Detection
- **Phases Detected**: Number of swing phases detected (0-6)
- **Phase Sequence**: Whether phase sequence is valid (valid/invalid)
- **Current Phase**: Currently detected phase
- **Phase Timing**: Average phase duration
- **Issues**: Missing phases, invalid sequence, timing problems

### 5. Metrics Calculation
- **Tempo Calculated**: Whether tempo is calculated (boolean)
- **Balance Calculated**: Whether balance is calculated (boolean)
- **Metrics Range**: Whether metrics are in valid range (valid/invalid)
- **Calculation Time**: Time taken for calculations (ms)
- **Issues**: Calculation failures, invalid ranges, performance issues

### 6. Grading System
- **Scores Calculated**: Whether scores are calculated (boolean)
- **Score Range**: Whether scores are in valid range (valid/invalid)
- **Grading Consistency**: How consistent grading is (0-1)
- **Overall Score**: Overall swing score (0-100)
- **Issues**: Calculation failures, invalid scores, consistency problems

## 🎨 Visual Debug Interface

### Debug Overlay (Top Right)
```
🛠️ Swing Analysis Debugger
✅ EXCELLENT (5/6 OK)
Performance: 87.3%

✅ Stick Figure        OK
⚠️ Swing Plane        WARNING  
✅ Club Path          OK
✅ Phase Detection    OK
⚠️ Metrics Calc       WARNING
❌ Grading System     ERROR
```

### Status Indicators
- **✅ Green (OK)**: Component working correctly
- **⚠️ Orange (Warning)**: Component has minor issues
- **❌ Red (Error)**: Component has critical issues
- **❓ Gray (Unknown)**: Component status not determined

### Debug Controls (Bottom Left)
```
🛠️ Debug Controls
[🔍 Toggle Debug] [✅ Validate All]
[💾 Export Data]  [📊 Summary]
[🗑️ Clear Errors] [🔄 Refresh]
```

## 🔧 Technical Implementation

### Core Debug System

```typescript
class SwingAnalysisDebugger {
  // Register analysis components for monitoring
  registerComponent(name: string, initialMetrics: Record<string, any>): void
  
  // Update component status
  updateComponentStatus(name: string, status: 'ok' | 'warning' | 'error' | 'unknown', details?: any, metrics?: Record<string, any>): void
  
  // Add errors and warnings
  addError(componentName: string, error: string): void
  addWarning(componentName: string, warning: string): void
  
  // Run validation suite
  runValidationSuite(): Promise<ValidationResult[]>
  
  // Export debug data
  exportDebugData(): string
}
```

### Debug Component Interface

```typescript
interface DebugComponent {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'unknown';
  lastUpdate: number;
  metrics: Record<string, any>;
  details?: any;
  errors: string[];
  warnings: string[];
}
```

### Validation Test Interface

```typescript
interface ValidationTest {
  name: string;
  test: () => boolean | Promise<boolean>;
  description: string;
  critical: boolean;
}
```

## 📊 Performance Metrics

### Real-Time Monitoring
- **Frame Rate**: Current processing frame rate (fps)
- **Processing Time**: Time taken for analysis (ms)
- **Confidence Score**: Average confidence across all components (0-1)
- **Data Quality**: Overall data quality score (0-100%)
- **Memory Usage**: Current memory consumption (MB)

### System Health
- **Total Components**: Number of registered components
- **OK Components**: Number of components working correctly
- **Warning Components**: Number of components with warnings
- **Error Components**: Number of components with errors
- **Overall Health**: excellent/good/warning/critical

## 🔍 Validation Suite

### Automated Testing
The validation suite runs comprehensive tests on all analysis components:

```typescript
const validationTests = {
  stickFigure: [
    { name: 'landmarksDetected', test: () => landmarks.length === 33, critical: true },
    { name: 'confidenceScore', test: () => confidence > 0.6, critical: true },
    { name: 'renderingStatus', test: () => canvas.isRenderable, critical: true }
  ],
  swingPlane: [
    { name: 'planeCalculated', test: () => !!swingPlane, critical: true },
    { name: 'angleRange', test: () => angle > 0 && angle < 90, critical: false },
    { name: 'consistency', test: () => consistency > 0.7, critical: false }
  ],
  // ... more component tests
};
```

### Test Categories
- **Critical Tests**: Must pass for component to function
- **Non-Critical Tests**: Performance and quality indicators
- **Automated Execution**: Runs every 2 seconds in debug mode
- **Manual Execution**: Available via debug controls

## 🎯 Debug Features

### Real-Time Monitoring
- **Component Status**: Live updates of all component statuses
- **Performance Tracking**: Real-time performance metrics
- **Error Detection**: Automatic issue identification
- **Warning System**: Proactive issue prevention

### Visual Indicators
- **Color-Coded Status**: Instant visual feedback
- **Performance Metrics**: Real-time system health
- **Error Details**: Specific issue information
- **Validation Results**: Test pass/fail status

### Export Capabilities
- **Debug Data Export**: Complete system state
- **Performance Logs**: Detailed performance metrics
- **Error Reports**: Comprehensive error information
- **Validation Results**: Test execution results

## 🚀 Usage

### Basic Setup
```typescript
import { DebugProvider, useDebugger } from '@/contexts/DebugContext';

// Wrap your app with DebugProvider
<DebugProvider enableDebug={true}>
  <YourApp />
</DebugProvider>

// Use debugger in components
const debugger = useDebugger();
```

### Component Monitoring
```typescript
// Register component for monitoring
debugger.registerComponent('stickFigure', {
  landmarksDetected: 0,
  confidenceScore: 0,
  renderingStatus: 'unknown'
});

// Update component status
debugger.updateComponentStatus('stickFigure', 'ok', {
  landmarksDetected: 33,
  confidenceScore: 0.85
}, {
  landmarksDetected: 33,
  confidenceScore: 0.85,
  renderingStatus: 'ok'
});
```

### Error Handling
```typescript
// Add errors
debugger.addError('clubPath', 'Insufficient trajectory data');

// Add warnings
debugger.addWarning('swingPlane', 'Low consistency detected');

// Clear issues
debugger.clearIssues('clubPath');
```

## 📱 Debug Interface Components

### DebugOverlay Component
- **Location**: Top-right corner of screen
- **Features**: Real-time status display, performance metrics, validation results
- **Controls**: Toggle visibility, auto-refresh, export data
- **Responsive**: Adapts to different screen sizes

### DebugControls Component
- **Location**: Bottom-left corner of screen
- **Features**: Debug controls, validation suite, system info
- **Actions**: Toggle debug, run validation, export data, clear errors
- **Settings**: Verbose logging, auto-refresh options

### DebugProvider Context
- **Purpose**: Global debug state management
- **Features**: Component registration, status updates, performance tracking
- **Integration**: Works with all analysis components
- **Configuration**: Enable/disable debug mode

## 🔧 Console Output

### Debug Logging
```javascript
🔧 Debug: Debugger initialized with all components
🎯 Building precise club trajectory from 100 poses...
⚖️ Weight Distribution: {leftFoot: '45.2%', rightFoot: '54.8%', ...}
📊 Swing Metrics: {weightTransfer: {...}, tempo: {...}, ...}
🔧 Debug: stickFigure status changed: ❓ → ✅
🔧 Debug: clubPath status changed: ❓ → ⚠️
⚠️ Debug: clubPath WARNING: Insufficient trajectory data
❌ Debug: gradingSystem ERROR: Score calculation failed
```

### Verbose Logging
When enabled, provides detailed information about:
- Component initialization
- Status changes
- Performance metrics
- Error details
- Validation results

## 🎯 Best Practices

### Development Workflow
1. **Enable Debug Mode**: Use debug overlay during development
2. **Monitor Performance**: Watch for performance issues
3. **Validate Components**: Run validation suite regularly
4. **Export Data**: Save debug data for analysis
5. **Clear Issues**: Reset error states when fixed

### Production Considerations
- **Debug Mode**: Disabled by default in production
- **Performance Impact**: Minimal when disabled
- **Error Handling**: Graceful degradation when debug unavailable
- **User Experience**: Completely hidden from end users

## 🔍 Troubleshooting

### Common Issues
1. **Debug Overlay Not Showing**: Check if debug mode is enabled
2. **Components Not Updating**: Verify component registration
3. **Validation Failures**: Check component implementation
4. **Performance Issues**: Monitor frame rate and processing time

### Debug Tools
- **Console Logging**: Detailed debug information
- **Visual Indicators**: Real-time status display
- **Export Data**: Save system state for analysis
- **Validation Suite**: Automated testing framework

## 📚 Related Documentation

- **[Weight Distribution Analysis](./WEIGHT_DISTRIBUTION.md)** - Weight tracking system
- **[Components Guide](./COMPONENTS_GUIDE.md)** - UI component usage
- **[API Documentation](./API.md)** - API endpoints and data flow
- **[Technical Fixes](./TECHNICAL_FIXES.md)** - Recent improvements and fixes

---

**Debug System** - Comprehensive monitoring and validation tools for optimal golf swing analysis development. 🛠️

*Last updated: December 2024*

