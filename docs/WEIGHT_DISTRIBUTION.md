# Weight Distribution Analysis

SwingVista's advanced weight distribution analysis provides real-time tracking of weight distribution throughout the golf swing, with camera-angle compensation and dynamic feedback.

## 🎯 Overview

The weight distribution analysis system monitors how weight shifts between the left and right feet during the golf swing, providing crucial insights for swing improvement. This system is designed to work accurately regardless of camera angle and provides real-time feedback to help golfers improve their balance and weight transfer.

## ⚖️ Key Features

### Camera-Angle Compensation
- **Automatic Detection**: Detects face-on, side-view, down-the-line, diagonal, and unknown camera angles
- **Rotation Compensation**: Adjusts analysis based on body orientation relative to camera
- **Tilt Compensation**: Accounts for camera tilt up/down for accurate analysis
- **Distance Estimation**: Determines if camera is close, medium, or far for optimal analysis
- **Confidence Scoring**: Rates accuracy of angle detection (0-1 scale)

### Real-Time Weight Tracking
- **Frame-by-Frame Analysis**: Tracks weight distribution for every frame of the swing
- **Multi-Method Detection**: Uses ankle height, hip position, and knee flex for accurate analysis
- **Confidence Weighting**: Only uses high-confidence detections for reliable results
- **Phase-Aware Analysis**: Adjusts analysis based on current swing phase

### Visual Indicators
- **Weight Distribution Bars**: Visual bars showing left/right foot weight percentages
- **Center of Gravity**: Yellow circle showing body's center of mass
- **Balance Arrows**: Arrows showing forward/back and lateral balance
- **Stability Indicator**: Color-coded stability percentage
- **Phase Display**: Shows current swing phase
- **Confidence Indicator**: Shows analysis confidence level

## 🔧 Technical Implementation

### Weight Distribution Analyzer

```typescript
class WeightDistributionAnalyzer {
  // Detect camera angle from pose landmarks
  detectCameraAngle(landmarks: any[]): CameraAngle
  
  // Analyze weight distribution with camera angle compensation
  analyzeWeightDistribution(landmarks: any[], frameIndex: number, totalFrames: number): WeightDistribution
  
  // Analyze complete swing metrics
  analyzeSwingMetrics(poses: any[]): SwingMetrics
}
```

### Weight Distribution Interface

```typescript
interface WeightDistribution {
  leftFoot: number;      // 0-100% weight on left foot
  rightFoot: number;     // 0-100% weight on right foot
  centerOfGravity: {
    x: number;           // 0-1 horizontal position
    y: number;           // 0-1 vertical position
    z: number;           // 0-1 depth position
  };
  balance: {
    forward: number;     // -100 to +100 (negative = leaning back)
    lateral: number;     // -100 to +100 (negative = leaning left)
    stability: number;   // 0-100 (100 = perfectly stable)
  };
  phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  confidence: number;    // 0-1 confidence in analysis
}
```

### Camera Angle Detection

```typescript
interface CameraAngle {
  type: 'down-the-line' | 'face-on' | 'side-view' | 'diagonal' | 'unknown';
  rotation: number;      // degrees of rotation from standard view
  tilt: number;          // degrees of tilt up/down
  distance: 'close' | 'medium' | 'far';
  confidence: number;    // 0-1 confidence in angle detection
}
```

## 📊 Analysis Methods

### Method 1: Ankle Height Analysis
- **Principle**: Higher ankle = more weight on that foot
- **Calculation**: Compares left and right ankle heights
- **Accuracy**: High for face-on and side-view angles
- **Compensation**: Adjusted based on camera angle and tilt

### Method 2: Hip Position Analysis
- **Principle**: Hip shifted toward one foot = more weight on that foot
- **Calculation**: Compares hip center to ankle center
- **Accuracy**: High for all camera angles
- **Compensation**: Minimal compensation needed

### Method 3: Knee Flex Analysis
- **Principle**: More knee flex = more weight on that foot
- **Calculation**: Measures knee bend angle
- **Accuracy**: Medium for all angles
- **Compensation**: Moderate compensation for diagonal angles

## 🎯 Swing Phase Analysis

### Address Phase
- **Expected Weight Distribution**: 50-50 or slightly favoring lead foot
- **Feedback**: Warns if too much weight on back foot
- **Visual Indicator**: Green/red bars at bottom of screen

### Backswing Phase
- **Expected Weight Distribution**: Weight shifts to back foot
- **Feedback**: Warns if insufficient weight shift
- **Visual Indicator**: Arrow pointing to back foot

### Top Phase
- **Expected Weight Distribution**: Most weight on back foot
- **Feedback**: Warns if insufficient weight transfer
- **Visual Indicator**: Circle on back foot area

### Downswing Phase
- **Expected Weight Distribution**: Weight shifts to lead foot
- **Feedback**: Warns if weight not shifting properly
- **Visual Indicator**: Arrow pointing to lead foot

### Impact Phase
- **Expected Weight Distribution**: Most weight on lead foot
- **Feedback**: Warns if insufficient weight transfer at impact
- **Visual Indicator**: Circle on lead foot area

### Follow-through Phase
- **Expected Weight Distribution**: Weight mostly on lead foot
- **Feedback**: Warns if incomplete weight transfer
- **Visual Indicator**: Arrow pointing to finish position

## 🎨 Visual Feedback System

### Weight Distribution Bars
- **Location**: Bottom of video overlay
- **Colors**: Green (left foot), Red (right foot)
- **Opacity**: Based on weight percentage
- **Labels**: L/R with percentage values

### Center of Gravity
- **Visual**: Yellow circle with white border
- **Size**: 8px radius
- **Position**: Calculated from body landmarks
- **Updates**: Real-time with pose detection

### Balance Arrows
- **Forward/Back**: Vertical arrows showing lean
- **Lateral**: Horizontal arrows showing side-to-side balance
- **Colors**: Red (excessive), Blue (insufficient)
- **Threshold**: Only shows when balance exceeds 5% deviation

### Stability Indicator
- **Location**: Top-right corner
- **Colors**: Green (>80%), Yellow (60-80%), Red (<60%)
- **Calculation**: Based on weight balance consistency
- **Updates**: Real-time with each frame

## 🔍 Debug and Validation

### Console Output
```javascript
// Weight Distribution Analysis
"⚖️ Weight Distribution: {leftFoot: '45.2%', rightFoot: '54.8%', balance: {...}, phase: 'downswing', confidence: '0.87'}"

// Swing Metrics
"📊 Swing Metrics: {weightTransfer: {...}, tempo: {...}, balance: {...}}"

// Swing Feedback
"💬 Swing Feedback: {realTime: 2, phaseSpecific: {...}, overall: 1, recommendations: 3}"
```

### Validation Checks
- **Confidence Threshold**: Only processes detections with >50% confidence
- **Landmark Validation**: Ensures required landmarks are present
- **Range Validation**: Ensures weight percentages are within 0-100%
- **Phase Validation**: Verifies phase detection is accurate

## 🚀 Usage

### Basic Implementation
```typescript
import { WeightDistributionAnalyzer } from '@/lib/weight-distribution-analysis';

const analyzer = new WeightDistributionAnalyzer();

// Analyze current pose
const weightDist = analyzer.analyzeWeightDistribution(landmarks, frameIndex, totalFrames);

// Get swing metrics
const metrics = analyzer.analyzeSwingMetrics(poses);
```

### Integration with Overlay System
```typescript
// In OverlaySystem component
const weightDist = analyzeCurrentWeightDistribution(landmarks, frameIndex);

if (weightDist && weightDist.confidence > 0.5) {
  drawWeightDistribution(ctx, weightDist);
  drawBalanceIndicators(ctx, weightDist);
}
```

## 📈 Performance Considerations

### Optimization Strategies
- **Confidence Filtering**: Only processes high-confidence detections
- **Frame Skipping**: Processes every 2-3 frames during real-time analysis
- **Caching**: Caches camera angle detection results
- **Throttling**: Limits updates to 30fps for smooth performance

### Memory Management
- **Trajectory Caching**: Stores weight distribution history
- **Cleanup**: Removes old data after analysis completion
- **Efficient Calculations**: Optimized algorithms for real-time performance

## 🎯 Best Practices

### Camera Setup
- **Face-on View**: Best for lateral weight shifts
- **Side View**: Best for forward/back weight shifts
- **Down-the-line**: Good for both lateral and forward/back
- **Distance**: Medium distance (3-5 feet) for optimal accuracy

### Analysis Quality
- **Good Lighting**: Ensures landmark detection accuracy
- **Stable Camera**: Minimizes false weight shift detection
- **Full Body Visible**: Ensures all required landmarks are detected
- **Consistent Angle**: Maintains same camera angle throughout swing

## 🔧 Troubleshooting

### Common Issues
1. **Low Confidence Scores**: Check lighting and landmark visibility
2. **Inaccurate Weight Distribution**: Verify camera angle detection
3. **Missing Visual Indicators**: Ensure overlay mode is set to 'analysis'
4. **Erratic Balance Arrows**: Check for camera movement or poor lighting

### Debug Tools
- **Console Logging**: Detailed analysis information
- **Debug Overlay**: Real-time status monitoring
- **Validation Suite**: Automated testing of all components
- **Export Data**: Save analysis data for offline review

## 📚 Related Documentation

- **[Debug System](./DEBUG_SYSTEM.md)** - Developer monitoring tools
- **[Components Guide](./COMPONENTS_GUIDE.md)** - UI component usage
- **[API Documentation](./API.md)** - API endpoints and data flow
- **[Technical Fixes](./TECHNICAL_FIXES.md)** - Recent improvements and fixes

---

**Weight Distribution Analysis** - Providing precise, camera-angle compensated weight tracking for optimal golf swing improvement. ⚖️

*Last updated: December 2024*

