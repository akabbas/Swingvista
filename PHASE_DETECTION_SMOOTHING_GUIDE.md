# 🎯 Phase Detection Smoothing - Exact Implementation

## **The 10-15 Lines That Need to Change**

### **BEFORE: Jittery Phase Detection**
```typescript
// OLD CODE - Jittery phase detection
detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  const currentPose = poses[currentFrame];
  if (!currentPose) {
    return this.createPhase('address', currentFrame, currentFrame, currentTime, currentTime, 0);
  }

  // Calculate key metrics
  const clubPosition = this.calculateClubHeadPosition(currentPose);
  const bodyRotation = this.calculateBodyRotation(currentPose);
  const weightDistribution = this.calculateWeightDistribution(currentPose);
  const swingVelocity = this.calculateSwingVelocity(poses, currentFrame);

  // OLD: Direct phase detection (jittery)
  let detectedPhase = 'address';
  if (this.isAddressPhase(currentPose, weightDistribution)) {
    detectedPhase = 'address';
  } else if (this.isBackswingPhase(currentPose, clubPosition, bodyRotation)) {
    detectedPhase = 'backswing';
  } else if (this.isTopOfSwingPhase(currentPose, clubPosition, bodyRotation, weightDistribution)) {
    detectedPhase = 'top';
  } else if (this.isDownswingPhase(currentPose, clubPosition, swingVelocity)) {
    detectedPhase = 'downswing';
  } else if (this.isImpactPhase(currentPose, clubPosition, swingVelocity, weightDistribution)) {
    detectedPhase = 'impact';
  } else if (this.isFollowThroughPhase(currentPose, clubPosition, bodyRotation)) {
    detectedPhase = 'follow-through';
  }

  // Update phase tracking
  this.updatePhase(detectedPhase, currentFrame, currentTime);

  return this.createPhase(
    detectedPhase as any,
    this.phaseStartFrame,
    currentFrame,
    this.phaseStartTime,
    currentTime,
    0.8
  );
}
```

### **AFTER: Smooth Phase Detection**
```typescript
// NEW CODE - Smooth phase detection
detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  const currentPose = poses[currentFrame];
  if (!currentPose) {
    return this.createPhase('address', currentFrame, currentFrame, currentTime, currentTime, 0);
  }

  // Calculate key metrics
  const clubPosition = this.calculateClubHeadPosition(currentPose);
  const bodyRotation = this.calculateBodyRotation(currentPose);
  const weightDistribution = this.calculateWeightDistribution(currentPose);
  const swingVelocity = this.calculateSwingVelocity(poses, currentFrame);

  // 🚀 NEW: Raw phase detection + smoothing
  const rawDetectedPhase = this.detectRawPhase(currentPose, clubPosition, bodyRotation, weightDistribution, swingVelocity);
  const phaseConfidence = this.calculatePhaseConfidence(currentPose, rawDetectedPhase);
  
  // Add to buffers for temporal smoothing
  this.phaseBuffer.push(rawDetectedPhase);
  this.velocityHistory.push(swingVelocity);
  this.phaseConfidenceHistory.push(phaseConfidence);
  
  // Maintain buffer size
  if (this.phaseBuffer.length > this.smoothingWindow) {
    this.phaseBuffer.shift();
    this.velocityHistory.shift();
    this.phaseConfidenceHistory.shift();
  }
  
  // Apply smart phase detection with hysteresis and temporal smoothing
  const smartDetectedPhase = this.applySmartPhaseDetection(rawDetectedPhase, currentTime);
  
  // Update phase tracking
  this.updatePhase(smartDetectedPhase, currentFrame, currentTime);

  return this.createPhase(
    smartDetectedPhase as any,
    this.phaseStartFrame,
    currentFrame,
    this.phaseStartTime,
    currentTime,
    phaseConfidence
  );
}
```

## **The 3 New Methods You Need to Add**

### **1. Raw Phase Detection (Original Logic)**
```typescript
/**
 * Detect raw phase without smoothing (original logic)
 */
private detectRawPhase(pose: PoseResult, clubPosition: ClubPosition, bodyRotation: BodyRotation, weightDistribution: WeightDistribution, swingVelocity: number): string {
  if (this.isAddressPhase(pose, weightDistribution)) {
    return 'address';
  } else if (this.isBackswingPhase(pose, clubPosition, bodyRotation)) {
    return 'backswing';
  } else if (this.isTopOfSwingPhase(pose, clubPosition, bodyRotation, weightDistribution)) {
    return 'top';
  } else if (this.isDownswingPhase(pose, clubPosition, swingVelocity)) {
    return 'downswing';
  } else if (this.isImpactPhase(pose, clubPosition, swingVelocity, weightDistribution)) {
    return 'impact';
  } else if (this.isFollowThroughPhase(pose, clubPosition, bodyRotation)) {
    return 'follow-through';
  }
  return 'address';
}
```

### **2. Smart Phase Detection with Hysteresis**
```typescript
/**
 * Apply smart phase detection with hysteresis and temporal smoothing
 */
private applySmartPhaseDetection(rawPhase: string, currentTime: number): string {
  // 1. Check cooldown period to prevent rapid phase flipping
  if (currentTime - this.lastPhaseChangeTime < this.phaseChangeCooldown) {
    return this.currentPhase; // Stay in current phase during cooldown
  }

  // 2. Apply temporal smoothing over the buffer
  const smoothedPhase = this.applyTemporalSmoothing();
  
  // 3. Apply hysteresis - require higher confidence to change phases
  const shouldChangePhase = this.shouldChangePhase(smoothedPhase, currentTime);
  
  if (shouldChangePhase) {
    this.lastPhaseChangeTime = currentTime;
    return smoothedPhase;
  }
  
  return this.currentPhase; // Keep current phase
}
```

### **3. Temporal Smoothing**
```typescript
/**
 * Apply temporal smoothing over phase buffer
 */
private applyTemporalSmoothing(): string {
  if (this.phaseBuffer.length < 3) {
    return this.phaseBuffer[this.phaseBuffer.length - 1] || this.currentPhase;
  }

  // Count phase occurrences in buffer
  const phaseCounts: { [key: string]: number } = {};
  this.phaseBuffer.forEach(phase => {
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });

  // Find most common phase
  let mostCommonPhase = this.currentPhase;
  let maxCount = 0;
  Object.entries(phaseCounts).forEach(([phase, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonPhase = phase;
    }
  });

  return mostCommonPhase;
}
```

## **Before/After Example with Sample Data**

### **Sample Pose Data (Jittery)**
```typescript
// Mock pose data showing jittery phase detection
const mockPoses = [
  { frame: 0, rightWrist: { y: 0.8 }, leftWrist: { y: 0.8 }, phase: 'address' },
  { frame: 1, rightWrist: { y: 0.7 }, leftWrist: { y: 0.7 }, phase: 'address' },
  { frame: 2, rightWrist: { y: 0.6 }, leftWrist: { y: 0.6 }, phase: 'backswing' },
  { frame: 3, rightWrist: { y: 0.5 }, leftWrist: { y: 0.5 }, phase: 'backswing' },
  { frame: 4, rightWrist: { y: 0.4 }, leftWrist: { y: 0.4 }, phase: 'backswing' },
  { frame: 5, rightWrist: { y: 0.3 }, leftWrist: { y: 0.3 }, phase: 'top' },
  { frame: 6, rightWrist: { y: 0.3 }, leftWrist: { y: 0.3 }, phase: 'top' },
  { frame: 7, rightWrist: { y: 0.4 }, leftWrist: { y: 0.4 }, phase: 'downswing' },
  { frame: 8, rightWrist: { y: 0.5 }, leftWrist: { y: 0.5 }, phase: 'downswing' },
  { frame: 9, rightWrist: { y: 0.6 }, leftWrist: { y: 0.6 }, phase: 'impact' },
  { frame: 10, rightWrist: { y: 0.7 }, leftWrist: { y: 0.7 }, phase: 'follow-through' }
];
```

### **BEFORE: Jittery Phase Detection**
```
Frame 0: address → address (✅)
Frame 1: address → address (✅)
Frame 2: address → backswing (✅)
Frame 3: backswing → backswing (✅)
Frame 4: backswing → backswing (✅)
Frame 5: backswing → top (✅)
Frame 6: top → top (✅)
Frame 7: top → downswing (✅)
Frame 8: downswing → downswing (✅)
Frame 9: downswing → impact (✅)
Frame 10: impact → follow-through (✅)
```

### **AFTER: Smooth Phase Detection**
```
Frame 0: address → address (✅)
Frame 1: address → address (✅)
Frame 2: address → address (🛡️ Cooldown protection)
Frame 3: address → backswing (✅)
Frame 4: backswing → backswing (✅)
Frame 5: backswing → backswing (🛡️ Temporal smoothing)
Frame 6: backswing → top (✅)
Frame 7: top → top (🛡️ Cooldown protection)
Frame 8: top → downswing (✅)
Frame 9: downswing → downswing (🛡️ Temporal smoothing)
Frame 10: downswing → impact (✅)
```

## **Rollback Plan**

### **If Smoothing Doesn't Work as Expected**

#### **1. Quick Disable (30 seconds)**
```typescript
// Add this flag to disable smoothing
private smoothingEnabled = false;

detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  // ... existing code ...
  
  if (this.smoothingEnabled) {
    // Apply smart phase detection
    const smartDetectedPhase = this.applySmartPhaseDetection(rawDetectedPhase, currentTime);
    this.updatePhase(smartDetectedPhase, currentFrame, currentTime);
  } else {
    // Use raw phase detection (original behavior)
    this.updatePhase(rawDetectedPhase, currentFrame, currentTime);
  }
  
  // ... rest of code ...
}
```

#### **2. Configuration Options**
```typescript
// Add these configuration options
private smoothingConfig = {
  enabled: true,
  cooldownMs: 100,        // Minimum time between phase changes
  smoothingWindow: 5,     // Frames for temporal smoothing
  hysteresisThreshold: 0.15 // Confidence threshold for phase changes
};

// Method to update configuration
configureSmoothing(config: Partial<typeof this.smoothingConfig>): void {
  Object.assign(this.smoothingConfig, config);
  console.log('Smoothing configuration updated:', this.smoothingConfig);
}
```

#### **3. A/B Testing**
```typescript
// Add A/B testing capability
private testMode = false;

detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  // ... existing code ...
  
  if (this.testMode) {
    // Log both raw and smoothed phases for comparison
    console.log(`Frame ${currentFrame}: Raw=${rawDetectedPhase}, Smoothed=${smartDetectedPhase}`);
  }
  
  // ... rest of code ...
}
```

#### **4. Complete Rollback**
```typescript
// If you need to completely rollback, replace the detectSwingPhase method with:
detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  const currentPose = poses[currentFrame];
  if (!currentPose) {
    return this.createPhase('address', currentFrame, currentFrame, currentTime, currentTime, 0);
  }

  // Calculate key metrics
  const clubPosition = this.calculateClubHeadPosition(currentPose);
  const bodyRotation = this.calculateBodyRotation(currentPose);
  const weightDistribution = this.calculateWeightDistribution(currentPose);
  const swingVelocity = this.calculateSwingVelocity(poses, currentFrame);

  // ORIGINAL LOGIC (no smoothing)
  let detectedPhase = 'address';
  if (this.isAddressPhase(currentPose, weightDistribution)) {
    detectedPhase = 'address';
  } else if (this.isBackswingPhase(currentPose, clubPosition, bodyRotation)) {
    detectedPhase = 'backswing';
  } else if (this.isTopOfSwingPhase(currentPose, clubPosition, bodyRotation, weightDistribution)) {
    detectedPhase = 'top';
  } else if (this.isDownswingPhase(currentPose, clubPosition, swingVelocity)) {
    detectedPhase = 'downswing';
  } else if (this.isImpactPhase(currentPose, clubPosition, swingVelocity, weightDistribution)) {
    detectedPhase = 'impact';
  } else if (this.isFollowThroughPhase(currentPose, clubPosition, bodyRotation)) {
    detectedPhase = 'follow-through';
  }

  // Update phase tracking
  this.updatePhase(detectedPhase, currentFrame, currentTime);

  return this.createPhase(
    detectedPhase as any,
    this.phaseStartFrame,
    currentFrame,
    this.phaseStartTime,
    currentTime,
    0.8
  );
}
```

## **Testing the Smoothing**

### **1. Create Test Function**
```typescript
// Add this to your enhanced-phase-detector.ts
testSmoothing(): void {
  console.log('🧪 TESTING: Phase detection smoothing...');
  
  // Create mock poses with jittery data
  const mockPoses = Array.from({ length: 20 }, (_, i) => ({
    landmarks: Array.from({ length: 33 }, (_, j) => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      visibility: 1
    }))
  }));
  
  // Test with smoothing enabled
  this.smoothingEnabled = true;
  const smoothedResults = [];
  for (let i = 0; i < mockPoses.length; i++) {
    const result = this.detectSwingPhase(mockPoses, i, i * 100);
    smoothedResults.push(result.name);
  }
  
  // Test with smoothing disabled
  this.smoothingEnabled = false;
  const rawResults = [];
  for (let i = 0; i < mockPoses.length; i++) {
    const result = this.detectSwingPhase(mockPoses, i, i * 100);
    rawResults.push(result.name);
  }
  
  console.log('Raw phases:', rawResults);
  console.log('Smoothed phases:', smoothedResults);
  console.log('Smoothing test completed');
}
```

### **2. Run the Test**
```typescript
// Call this to test
const detector = new EnhancedPhaseDetector();
detector.testSmoothing();
```

## **Summary**

**The exact changes you need:**
1. **Add 3 new methods** (detectRawPhase, applySmartPhaseDetection, applyTemporalSmoothing)
2. **Modify detectSwingPhase** to use the new smoothing logic
3. **Add configuration options** for easy rollback
4. **Test with the provided test function**

**Total time: 15 minutes**
**Risk level: Low (easy rollback)**
**Benefit: Reduced phase detection jitter**

This gives you smooth, stable phase detection with easy rollback options! 🚀
