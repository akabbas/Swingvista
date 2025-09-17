# Golf Swing Visualization Overlay System

## Overview

The SwingVista overlay system provides comprehensive golf swing visualization with real-time pose detection, swing analysis, and interactive overlays. The system is designed to work seamlessly with both real-time camera analysis and uploaded video analysis.

## Components

### Core Overlay Components

#### 1. StickFigureOverlay (`src/components/ui/StickFigureOverlay.tsx`)
- **Purpose**: Renders pose detection data as stick figures with golf-specific visualizations
- **Features**:
  - Real-time stick figure skeleton rendering
  - Individual landmark visualization with color coding
  - Swing plane visualization
  - Phase-specific markers
  - Live metrics display
  - Apex point highlighting

#### 2. SwingPlaneVisualization (`src/components/ui/SwingPlaneVisualization.tsx`)
- **Purpose**: Specialized golf swing visualizations
- **Features**:
  - Swing plane line with angle measurements
  - Club path tracking and visualization
  - Impact zone indicators
  - Weight transfer visualization
  - Spine angle indicators
  - Phase-specific visualizations

#### 3. PhaseMarkers (`src/components/ui/PhaseMarkers.tsx`)
- **Purpose**: Visual indicators for swing phases
- **Features**:
  - Phase timeline bars
  - Phase names and grades
  - Phase recommendations
  - Progress indicators
  - Phase metrics display

### Container Components

#### 4. CameraOverlayContainer (`src/components/ui/CameraOverlayContainer.tsx`)
- **Purpose**: Real-time camera analysis overlay system
- **Features**:
  - Interactive overlay controls
  - Real-time pose detection integration
  - Live feedback display
  - Swing status indicators
  - Customizable overlay settings

#### 5. VideoOverlayContainer (`src/components/ui/VideoOverlayContainer.tsx`)
- **Purpose**: Video upload analysis overlay system
- **Features**:
  - Video playback integration
  - Timeline visualization
  - Playback speed controls
  - Phase progress tracking
  - Interactive overlay controls

## Key Features

### Real-time Pose Detection
- **MediaPipe Integration**: Primary pose detection using MediaPipe
- **Fallback Support**: TensorFlow.js and mock data fallbacks
- **Performance Optimization**: Throttled rendering for smooth 60fps performance
- **Responsive Design**: Adapts to different video aspect ratios and screen sizes

### Golf-Specific Visualizations
- **Swing Plane**: Red dashed line showing swing plane angle
- **Club Path**: Cyan trail showing club movement
- **Impact Zone**: Yellow circle highlighting impact area
- **Weight Transfer**: Orange line showing weight distribution
- **Spine Angle**: Green line showing spine alignment
- **Apex Points**: Yellow markers at top of backswing

### Phase Detection and Analysis
- **Enhanced Phase Detection**: Uses `EnhancedSwingPhaseDetector` for accurate phase identification
- **Phase Markers**: Visual indicators for each swing phase
- **Phase Grades**: A-F grading system for each phase
- **Recommendations**: Phase-specific improvement suggestions
- **Progress Tracking**: Real-time phase progress indicators

### Interactive Controls
- **Overlay Toggle**: Show/hide all overlays
- **Individual Controls**: Toggle specific overlay types
- **Playback Controls**: Speed adjustment and timeline scrubbing
- **Settings Reset**: Restore default overlay settings

## Usage

### Camera Page Integration

```tsx
import CameraOverlayContainer from '@/components/ui/CameraOverlayContainer';

<CameraOverlayContainer
  videoRef={videoRef}
  poses={poseHistory}
  phases={enhancedPhases}
  currentTime={currentTime}
  isSwinging={isSwinging}
  swingPhase={currentPhase}
  liveFeedback={liveFeedback}
/>
```

### Upload Page Integration

```tsx
import VideoOverlayContainer from '@/components/ui/VideoOverlayContainer';

<VideoOverlayContainer
  videoRef={videoRef}
  poses={poses}
  phases={phases}
  currentTime={videoCurrentTime}
  isPlaying={isVideoPlaying}
  duration={videoDuration}
/>
```

### Individual Component Usage

```tsx
import StickFigureOverlay from '@/components/ui/StickFigureOverlay';
import SwingPlaneVisualization from '@/components/ui/SwingPlaneVisualization';
import PhaseMarkers from '@/components/ui/PhaseMarkers';

// Stick figure overlay
<StickFigureOverlay
  videoRef={videoRef}
  poses={poses}
  currentTime={currentTime}
  phases={phases}
  showSkeleton={true}
  showLandmarks={true}
  showSwingPlane={true}
  showPhaseMarkers={true}
  showMetrics={true}
/>

// Swing plane visualization
<SwingPlaneVisualization
  videoRef={videoRef}
  poses={poses}
  currentTime={currentTime}
  phases={phases}
  showSwingPlane={true}
  showClubPath={true}
  showImpactZone={true}
  showWeightTransfer={true}
  showSpineAngle={true}
/>

// Phase markers
<PhaseMarkers
  videoRef={videoRef}
  phases={phases}
  currentTime={currentTime}
  showPhaseBars={true}
  showPhaseNames={true}
  showPhaseGrades={true}
  showPhaseRecommendations={true}
/>
```

## Technical Implementation

### Canvas Rendering
- **HTML5 Canvas**: All overlays rendered using HTML5 Canvas for optimal performance
- **Responsive Scaling**: Canvas automatically scales to match video dimensions
- **Memory Management**: Proper cleanup of animation frames and event listeners

### Performance Optimization
- **Throttled Rendering**: 60fps rendering with requestAnimationFrame
- **Efficient Calculations**: Optimized pose detection and phase calculations
- **Memory Cleanup**: Proper disposal of resources and event listeners

### TypeScript Support
- **Full Type Safety**: Comprehensive TypeScript interfaces for all components
- **Pose Data Types**: Proper typing for MediaPipe pose detection data
- **Phase Data Types**: Enhanced swing phase interfaces with metrics

### Responsive Design
- **Video Aspect Ratios**: Adapts to different video dimensions
- **Screen Sizes**: Works on mobile, tablet, and desktop
- **Touch Support**: Touch-friendly controls for mobile devices

## Configuration

### Overlay Settings
Each overlay component supports extensive configuration options:

```tsx
interface OverlaySettings {
  showStickFigure: boolean;
  showSwingPlane: boolean;
  showPhaseMarkers: boolean;
  showLandmarks: boolean;
  showSkeleton: boolean;
  showClubPath: boolean;
  showImpactZone: boolean;
  showWeightTransfer: boolean;
  showSpineAngle: boolean;
  showMetrics: boolean;
  showRecommendations: boolean;
}
```

### Phase Detection
The system uses the `EnhancedSwingPhaseDetector` for accurate phase identification:

```tsx
const phaseDetector = new EnhancedSwingPhaseDetector();
const phases = phaseDetector.detectPhases(landmarks, trajectory, timestamps);
```

## Troubleshooting

### Common Issues

1. **Overlays Not Displaying**
   - Check if video element is properly loaded
   - Verify pose data is available
   - Ensure canvas dimensions match video dimensions

2. **Performance Issues**
   - Reduce overlay complexity by disabling unused features
   - Check for memory leaks in animation loops
   - Verify proper cleanup of event listeners

3. **Pose Detection Issues**
   - Ensure good lighting conditions
   - Check camera permissions
   - Verify MediaPipe initialization

### Debug Mode
Enable debug logging by setting `console.log` statements in overlay components to track:
- Pose detection success/failure
- Canvas rendering performance
- Phase detection accuracy
- Overlay visibility states

## Future Enhancements

### Planned Features
- **3D Visualization**: Three-dimensional swing analysis
- **Advanced Metrics**: More detailed swing metrics and analysis
- **Custom Overlays**: User-defined overlay configurations
- **Export Functionality**: Save overlay configurations and analysis results

### Performance Improvements
- **WebGL Rendering**: Hardware-accelerated rendering for better performance
- **Worker Threads**: Move heavy calculations to worker threads
- **Caching**: Cache pose detection results for faster playback

## Contributing

When adding new overlay features:

1. **Follow TypeScript**: Use proper typing for all new interfaces
2. **Performance First**: Optimize for 60fps rendering
3. **Responsive Design**: Ensure compatibility with all screen sizes
4. **Accessibility**: Add proper ARIA labels and keyboard support
5. **Testing**: Test with real camera feeds and uploaded videos

## Dependencies

- **React**: Component framework
- **TypeScript**: Type safety
- **MediaPipe**: Pose detection
- **HTML5 Canvas**: Overlay rendering
- **Tailwind CSS**: Styling and responsive design

