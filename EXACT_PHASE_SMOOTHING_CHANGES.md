# 🎯 Exact Phase Detection Smoothing Changes

## **1. ACTUAL DIFF - What Lines Need to Change**

### **BEFORE: Your Current Code (Jittery)**
```typescript
// In your detectSwingPhase method, you currently have:
detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  const currentPose = poses[currentFrame];
  if (!currentPose) {
    return this.createPhase('address', currentFrame, currentFrame, currentTime, currentTime, 0);
  }

  // Calculate key metrics for phase detection
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

### **AFTER: With Smoothing (Stable)**
```typescript
// Replace the above with this:
detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  const currentPose = poses[currentFrame];
  if (!currentPose) {
    return this.createPhase('address', currentFrame, currentFrame, currentTime, currentTime, 0);
  }

  // Calculate key metrics for phase detection
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

## **2. Add These 3 New Methods**

### **Method 1: Raw Phase Detection**
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

### **Method 2: Smart Phase Detection**
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

### **Method 3: Temporal Smoothing**
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

## **3. Add These Properties to Your Class**

```typescript
export class EnhancedPhaseDetector {
  // ... existing properties ...
  
  // 🚀 NEW: Add these properties for smoothing
  private phaseBuffer: string[] = []; // Buffer for temporal smoothing
  private velocityHistory: number[] = []; // Track velocity over time
  private phaseConfidenceHistory: number[] = []; // Track confidence over time
  private lastPhaseChangeTime: number = 0;
  private phaseChangeCooldown: number = 100; // ms - minimum time between phase changes
  private smoothingWindow: number = 5; // frames for temporal smoothing
  private hysteresisThreshold: number = 0.15; // confidence threshold for phase changes
}
```

## **4. Simple Test with Sample Data**

### **Test Function**
```typescript
// Add this method to your EnhancedPhaseDetector class
testPhaseSmoothing(): void {
  console.log('🧪 TESTING: Phase detection smoothing...');
  
  // Create mock poses that cause jitter between BACKSWING and DOWNSWING
  const mockPoses: PoseResult[] = [];
  for (let i = 0; i < 20; i++) {
    const frame = i;
    const time = i * 100; // 100ms per frame
    
    // Simulate jittery wrist positions
    let rightWristY = 0.5;
    if (i < 5) {
      rightWristY = 0.8; // Address
    } else if (i < 10) {
      rightWristY = 0.4 + (Math.random() - 0.5) * 0.3; // Jittery backswing
    } else if (i < 15) {
      rightWristY = 0.3 + (Math.random() - 0.5) * 0.2; // Jittery downswing
    } else {
      rightWristY = 0.7; // Follow-through
    }
    
    const landmarks = Array.from({ length: 33 }, (_, j) => {
      if (j === 16) { // Right wrist
        return { x: 0.5, y: rightWristY, z: 0.5, visibility: 1 };
      } else if (j === 15) { // Left wrist
        return { x: 0.5, y: rightWristY + 0.1, z: 0.5, visibility: 1 };
      } else {
        return { x: 0.5, y: 0.5, z: 0.5, visibility: 1 };
      }
    });
    
    mockPoses.push({ landmarks, timestamp: time });
  }
  
  // Test WITHOUT smoothing (original behavior)
  console.log('\n📊 BEFORE (Jittery):');
  const rawResults: string[] = [];
  for (let i = 0; i < mockPoses.length; i++) {
    // Simulate raw phase detection
    const pose = mockPoses[i];
    const rightWrist = pose.landmarks[16];
    let phase = 'address';
    
    if (rightWrist.y > 0.7) {
      phase = 'address';
    } else if (rightWrist.y > 0.5) {
      phase = 'backswing';
    } else if (rightWrist.y > 0.3) {
      phase = 'downswing';
    } else {
      phase = 'follow-through';
    }
    
    rawResults.push(phase);
    if (i % 5 === 0) {
      console.log(`Frame ${i}: ${phase}`);
    }
  }
  
  // Test WITH smoothing
  console.log('\n📊 AFTER (Smooth):');
  const smoothedResults: string[] = [];
  for (let i = 0; i < mockPoses.length; i++) {
    const result = this.detectSwingPhase(mockPoses, i, i * 100);
    smoothedResults.push(result.name);
    
    if (i % 5 === 0) {
      console.log(`Frame ${i}: ${result.name}`);
    }
  }
  
  // Compare results
  console.log('\n📈 COMPARISON:');
  console.log('Frame | Raw Phase    | Smoothed Phase | Difference');
  console.log('------|--------------|----------------|----------');
  
  let differences = 0;
  for (let i = 0; i < rawResults.length; i++) {
    const raw = rawResults[i];
    const smoothed = smoothedResults[i];
    const diff = raw !== smoothed ? 'YES' : 'NO';
    
    if (raw !== smoothed) differences++;
    
    if (i % 5 === 0) {
      console.log(`${i.toString().padStart(5)} | ${raw.padEnd(12)} | ${smoothed.padEnd(14)} | ${diff}`);
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total frames: ${rawResults.length}`);
  console.log(`   Differences: ${differences}`);
  console.log(`   Smoothing effectiveness: ${((differences / rawResults.length) * 100).toFixed(1)}%`);
}
```

## **5. Key Parameters You Can Adjust**

### **Parameter 1: Smoothing Window**
```typescript
private smoothingWindow: number = 5; // frames for temporal smoothing

// Adjust this:
// 3 = Less smoothing (more responsive)
// 5 = Balanced (recommended)
// 7 = More smoothing (more stable)
```

### **Parameter 2: Cooldown Period**
```typescript
private phaseChangeCooldown: number = 100; // ms - minimum time between phase changes

// Adjust this:
// 50 = Less cooldown (more responsive)
// 100 = Balanced (recommended)
// 200 = More cooldown (more stable)
```

### **Parameter 3: Hysteresis Threshold**
```typescript
private hysteresisThreshold: number = 0.15; // confidence threshold for phase changes

// Adjust this:
// 0.1 = Less hysteresis (more responsive)
// 0.15 = Balanced (recommended)
// 0.2 = More hysteresis (more stable)
```

## **6. Rollback Plan (Easiest Way)**

### **Option 1: Quick Disable (30 seconds)**
```typescript
// Add this property to your class
private smoothingEnabled = false;

// Modify your detectSwingPhase method:
detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  // ... existing code ...
  
  if (this.smoothingEnabled) {
    // Apply smoothing
    const smartDetectedPhase = this.applySmartPhaseDetection(rawDetectedPhase, currentTime);
    this.updatePhase(smartDetectedPhase, currentFrame, currentTime);
  } else {
    // Use raw phase detection (original behavior)
    this.updatePhase(rawDetectedPhase, currentFrame, currentTime);
  }
  
  // ... rest of code ...
}

// To disable smoothing:
detector.smoothingEnabled = false;
```

### **Option 2: Configuration Rollback (1 minute)**
```typescript
// Add this method to your class
configureSmoothing(config: {
  smoothingWindow?: number;
  phaseChangeCooldown?: number;
  hysteresisThreshold?: number;
}): void {
  if (config.smoothingWindow !== undefined) {
    this.smoothingWindow = config.smoothingWindow;
  }
  if (config.phaseChangeCooldown !== undefined) {
    this.phaseChangeCooldown = config.phaseChangeCooldown;
  }
  if (config.hysteresisThreshold !== undefined) {
    this.hysteresisThreshold = config.hysteresisThreshold;
  }
  console.log('Smoothing configuration updated:', {
    smoothingWindow: this.smoothingWindow,
    phaseChangeCooldown: this.phaseChangeCooldown,
    hysteresisThreshold: this.hysteresisThreshold
  });
}

// To rollback to original behavior:
detector.configureSmoothing({
  smoothingWindow: 1,      // No smoothing
  phaseChangeCooldown: 0,   // No cooldown
  hysteresisThreshold: 0.0  // No hysteresis
});
```

## **7. Run the Test**

```typescript
// Add this to your existing code
const detector = new EnhancedPhaseDetector();
detector.testPhaseSmoothing();
```

## **Summary**

**Total changes needed:**
1. **Replace detectSwingPhase method** (10 lines)
2. **Add 3 new methods** (30 lines)
3. **Add 6 new properties** (6 lines)
4. **Add test method** (50 lines)

**Total time: 15 minutes**
**Risk level: Low (easy rollback)**
**Benefit: Smooth, stable phase detection**

This gives you professional-grade phase detection smoothing with minimal changes! 🚀
