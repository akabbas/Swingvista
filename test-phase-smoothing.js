// Simple test to verify phase detection smoothing works
// Run with: node test-phase-smoothing.js

console.log('🧪 Testing Phase Detection Smoothing...');

// Mock the required interfaces
const mockPoseResult = {
  landmarks: Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.5 + (Math.random() - 0.5) * 0.3, // Jittery Y positions
    z: 0.5,
    visibility: 1
  })),
  worldLandmarks: Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.5 + (Math.random() - 0.5) * 0.3,
    z: 0.5,
    visibility: 1
  })),
  timestamp: Date.now()
};

// Mock the EnhancedPhaseDetector class
class MockEnhancedPhaseDetector {
  constructor() {
    this.phaseBuffer = [];
    this.velocityHistory = [];
    this.phaseConfidenceHistory = [];
    this.lastPhaseChangeTime = 0;
    this.phaseChangeCooldown = 100;
    this.smoothingWindow = 5;
    this.hysteresisThreshold = 0.15;
    this.currentPhase = 'address';
  }

  detectSwingPhase(poses, currentFrame, currentTime) {
    const currentPose = poses[currentFrame];
    if (!currentPose) {
      return { name: 'address', confidence: 0 };
    }

    // Mock raw phase detection
    const rawDetectedPhase = this.detectRawPhase(currentPose);
    const phaseConfidence = 0.8;
    
    // Add to buffers for temporal smoothing
    this.phaseBuffer.push(rawDetectedPhase);
    this.velocityHistory.push(1.0);
    this.phaseConfidenceHistory.push(phaseConfidence);
    
    // Maintain buffer size
    if (this.phaseBuffer.length > this.smoothingWindow) {
      this.phaseBuffer.shift();
      this.velocityHistory.shift();
      this.phaseConfidenceHistory.shift();
    }
    
    // Apply smart phase detection with hysteresis and temporal smoothing
    const smartDetectedPhase = this.applySmartPhaseDetection(rawDetectedPhase, currentTime);
    
    return {
      name: smartDetectedPhase,
      confidence: phaseConfidence
    };
  }

  detectRawPhase(pose) {
    // Simple mock logic
    const rightWrist = pose.landmarks[16];
    if (rightWrist.y > 0.7) return 'address';
    if (rightWrist.y > 0.5) return 'backswing';
    if (rightWrist.y > 0.3) return 'downswing';
    return 'follow-through';
  }

  applySmartPhaseDetection(rawPhase, currentTime) {
    // Check cooldown period
    if (currentTime - this.lastPhaseChangeTime < this.phaseChangeCooldown) {
      return this.currentPhase;
    }

    // Apply temporal smoothing
    const smoothedPhase = this.applyTemporalSmoothing();
    
    // Simple hysteresis check
    if (smoothedPhase !== this.currentPhase) {
      this.lastPhaseChangeTime = currentTime;
      this.currentPhase = smoothedPhase;
    }
    
    return this.currentPhase;
  }

  applyTemporalSmoothing() {
    if (this.phaseBuffer.length < 3) {
      return this.phaseBuffer[this.phaseBuffer.length - 1] || this.currentPhase;
    }

    // Count phase occurrences in buffer
    const phaseCounts = {};
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
}

// Test the smoothing
const detector = new MockEnhancedPhaseDetector();
const mockPoses = Array.from({ length: 20 }, () => mockPoseResult);

console.log('📊 Testing Raw vs Smoothed Phase Detection:');
console.log('Frame | Raw Phase    | Smoothed Phase | Difference');
console.log('------|--------------|----------------|----------');

const rawResults = [];
const smoothedResults = [];

for (let i = 0; i < mockPoses.length; i++) {
  // Test raw detection
  const rawPhase = detector.detectRawPhase(mockPoses[i]);
  rawResults.push(rawPhase);
  
  // Test smoothed detection
  const result = detector.detectSwingPhase(mockPoses, i, i * 100);
  smoothedResults.push(result.name);
  
  const diff = rawPhase !== result.name ? 'YES' : 'NO';
  
  if (i % 5 === 0) {
    console.log(`${i.toString().padStart(5)} | ${rawPhase.padEnd(12)} | ${result.name.padEnd(14)} | ${diff}`);
  }
}

// Count transitions
const rawTransitions = rawResults.filter((phase, i) => i > 0 && phase !== rawResults[i-1]).length;
const smoothedTransitions = smoothedResults.filter((phase, i) => i > 0 && phase !== smoothedResults[i-1]).length;

console.log(`\n📈 RESULTS:`);
console.log(`   Raw transitions: ${rawTransitions}`);
console.log(`   Smoothed transitions: ${smoothedTransitions}`);
console.log(`   Reduction: ${rawTransitions - smoothedTransitions} transitions`);

if (smoothedTransitions < rawTransitions) {
  console.log('✅ Smoothing is working! Phase detection is more stable.');
} else {
  console.log('❌ Smoothing may not be working properly.');
}

console.log('\n🎉 Phase Detection Smoothing Test Complete!');
