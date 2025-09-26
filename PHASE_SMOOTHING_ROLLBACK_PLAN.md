# 🛡️ Phase Detection Smoothing - Rollback Plan

## **Quick Rollback Options**

### **Option 1: Disable Smoothing (30 seconds)**
```typescript
// In enhanced-phase-detector.ts, add this flag
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

// To disable smoothing:
detector.smoothingEnabled = false;
```

### **Option 2: Configuration Rollback (1 minute)**
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

// To rollback to original behavior:
detector.configureSmoothing({
  enabled: false,
  cooldownMs: 0,
  smoothingWindow: 1,
  hysteresisThreshold: 0.0
});
```

### **Option 3: Complete Method Replacement (2 minutes)**
```typescript
// Replace the entire detectSwingPhase method with original logic
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

## **Testing Rollback**

### **1. Test Current Behavior**
```typescript
// Run this to test current smoothing
import { runAllPhaseSmoothingTests } from '@/lib/phase-smoothing-test';

runAllPhaseSmoothingTests();
```

### **2. Test Rollback**
```typescript
// Test rollback functionality
import { testRollback } from '@/lib/phase-smoothing-test';

testRollback();
```

### **3. A/B Testing**
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

// Enable A/B testing
detector.testMode = true;
```

## **Emergency Rollback (30 seconds)**

### **Step 1: Disable Smoothing**
```typescript
// Add this line anywhere in your code
const detector = new EnhancedPhaseDetector();
detector.smoothingEnabled = false;
```

### **Step 2: Verify Rollback**
```typescript
// Check that smoothing is disabled
console.log('Smoothing enabled:', detector.smoothingEnabled);
```

### **Step 3: Test Phase Detection**
```typescript
// Test that phase detection still works
const result = detector.detectSwingPhase(poses, 0, 0);
console.log('Phase detection working:', result.name);
```

## **Configuration Options**

### **Conservative Settings (Less Smoothing)**
```typescript
detector.configureSmoothing({
  smoothingWindow: 3,      // Smaller window
  cooldownMs: 50,          // Shorter cooldown
  hysteresisThreshold: 0.1  // Lower threshold
});
```

### **Aggressive Settings (More Smoothing)**
```typescript
detector.configureSmoothing({
  smoothingWindow: 7,      // Larger window
  cooldownMs: 200,         // Longer cooldown
  hysteresisThreshold: 0.2  // Higher threshold
});
```

### **Original Behavior (No Smoothing)**
```typescript
detector.configureSmoothing({
  smoothingWindow: 1,      // No smoothing
  cooldownMs: 0,           // No cooldown
  hysteresisThreshold: 0.0  // No hysteresis
});
```

## **Monitoring and Debugging**

### **1. Enable Debug Logging**
```typescript
// Add debug logging
private debugMode = false;

detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  // ... existing code ...
  
  if (this.debugMode) {
    console.log(`Frame ${currentFrame}:`);
    console.log(`  Raw phase: ${rawDetectedPhase}`);
    console.log(`  Smoothed phase: ${smartDetectedPhase}`);
    console.log(`  Confidence: ${phaseConfidence}`);
    console.log(`  Buffer: [${this.phaseBuffer.join(', ')}]`);
  }
  
  // ... rest of code ...
}

// Enable debug mode
detector.debugMode = true;
```

### **2. Performance Monitoring**
```typescript
// Add performance monitoring
detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  const startTime = performance.now();
  
  // ... existing code ...
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 10) { // Log if takes more than 10ms
    console.warn(`Phase detection took ${duration.toFixed(2)}ms`);
  }
  
  // ... rest of code ...
}
```

### **3. Quality Metrics**
```typescript
// Add quality metrics
private qualityMetrics = {
  totalFrames: 0,
  phaseChanges: 0,
  smoothingApplied: 0
};

detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
  // ... existing code ...
  
  this.qualityMetrics.totalFrames++;
  
  if (smartDetectedPhase !== rawDetectedPhase) {
    this.qualityMetrics.smoothingApplied++;
  }
  
  if (smartDetectedPhase !== this.currentPhase) {
    this.qualityMetrics.phaseChanges++;
  }
  
  // ... rest of code ...
}

// Get quality metrics
getQualityMetrics() {
  return {
    ...this.qualityMetrics,
    smoothingRate: this.qualityMetrics.smoothingApplied / this.qualityMetrics.totalFrames,
    phaseChangeRate: this.qualityMetrics.phaseChanges / this.qualityMetrics.totalFrames
  };
}
```

## **Summary**

**Rollback options (in order of speed):**
1. **30 seconds**: Disable smoothing flag
2. **1 minute**: Configuration rollback
3. **2 minutes**: Complete method replacement

**Testing options:**
1. **A/B testing**: Compare raw vs smoothed
2. **Debug logging**: See what's happening
3. **Performance monitoring**: Check for slowdowns
4. **Quality metrics**: Measure effectiveness

**The smoothing is designed to be easily rollback-able with minimal risk!** 🛡️
