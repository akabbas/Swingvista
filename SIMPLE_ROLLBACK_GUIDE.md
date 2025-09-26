# 🛡️ Simple Rollback Guide - Phase Detection Smoothing

## **Quick Rollback Options (30 seconds to 2 minutes)**

### **Option 1: Quick Disable (30 seconds)**
```typescript
// Add this property to your EnhancedPhaseDetector class
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
// Add this method to your EnhancedPhaseDetector class
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

### **Option 3: Complete Method Replacement (2 minutes)**
```typescript
// Replace your entire detectSwingPhase method with this:
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

## **Test Rollback**

### **1. Run the Test**
```typescript
import { runAllSmoothingTests } from '@/lib/simple-phase-smoothing-test';

runAllSmoothingTests();
```

### **2. Test Rollback**
```typescript
import { testRollback } from '@/lib/simple-phase-smoothing-test';

testRollback();
```

### **3. Verify Rollback**
```typescript
// Check that smoothing is disabled
const detector = new EnhancedPhaseDetector();
detector.configureSmoothing({
  smoothingWindow: 1,
  phaseChangeCooldown: 0,
  hysteresisThreshold: 0.0
});

// Test that phase detection still works
const result = detector.detectSwingPhase(poses, 0, 0);
console.log('Phase detection working:', result.name);
```

## **Configuration Options**

### **Conservative Settings (Less Smoothing)**
```typescript
detector.configureSmoothing({
  smoothingWindow: 3,      // Smaller window
  phaseChangeCooldown: 50,   // Shorter cooldown
  hysteresisThreshold: 0.1    // Lower threshold
});
```

### **Aggressive Settings (More Smoothing)**
```typescript
detector.configureSmoothing({
  smoothingWindow: 7,      // Larger window
  phaseChangeCooldown: 200,   // Longer cooldown
  hysteresisThreshold: 0.2    // Higher threshold
});
```

### **Original Behavior (No Smoothing)**
```typescript
detector.configureSmoothing({
  smoothingWindow: 1,      // No smoothing
  phaseChangeCooldown: 0,     // No cooldown
  hysteresisThreshold: 0.0    // No hysteresis
});
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

## **Summary**

**Rollback options (in order of speed):**
1. **30 seconds**: Disable smoothing flag
2. **1 minute**: Configuration rollback
3. **2 minutes**: Complete method replacement

**The smoothing is designed to be easily rollback-able with minimal risk!** 🛡️
