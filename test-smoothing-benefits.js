// Test to show the benefits of phase detection smoothing
console.log('🧪 Testing Phase Detection Smoothing Benefits...');

// Create jittery pose data that causes rapid phase changes
function createJitteryPoses() {
  const poses = [];
  for (let i = 0; i < 30; i++) {
    // Create jittery wrist positions that cause phase flipping
    let rightWristY = 0.5;
    
    if (i < 10) {
      // Address to backswing transition with jitter
      rightWristY = 0.8 - (i * 0.05) + (Math.random() - 0.5) * 0.3;
    } else if (i < 20) {
      // Backswing to downswing transition with jitter
      rightWristY = 0.3 + (Math.random() - 0.5) * 0.4; // High jitter
    } else {
      // Downswing to follow-through
      rightWristY = 0.2 + (i - 20) * 0.1 + (Math.random() - 0.5) * 0.2;
    }
    
    poses.push({
      landmarks: Array.from({ length: 33 }, (_, j) => ({
        x: 0.5,
        y: j === 16 ? rightWristY : 0.5, // Right wrist at index 16
        z: 0.5,
        visibility: 1
      })),
      worldLandmarks: Array.from({ length: 33 }, (_, j) => ({
        x: 0.5,
        y: j === 16 ? rightWristY : 0.5,
        z: 0.5,
        visibility: 1
      })),
      timestamp: i * 100
    });
  }
  return poses;
}

class PhaseDetector {
  constructor() {
    this.phaseBuffer = [];
    this.lastPhaseChangeTime = 0;
    this.phaseChangeCooldown = 100;
    this.smoothingWindow = 5;
    this.currentPhase = 'address';
  }

  // Raw detection (jittery)
  detectRawPhase(pose) {
    const rightWrist = pose.landmarks[16];
    if (rightWrist.y > 0.7) return 'address';
    if (rightWrist.y > 0.5) return 'backswing';
    if (rightWrist.y > 0.3) return 'downswing';
    return 'follow-through';
  }

  // Smoothed detection
  detectSmoothPhase(pose, currentTime) {
    const rawPhase = this.detectRawPhase(pose);
    
    // Add to buffer
    this.phaseBuffer.push(rawPhase);
    if (this.phaseBuffer.length > this.smoothingWindow) {
      this.phaseBuffer.shift();
    }
    
    // Apply smoothing
    const smoothedPhase = this.applySmoothing(rawPhase, currentTime);
    return smoothedPhase;
  }

  applySmoothing(rawPhase, currentTime) {
    // Cooldown check
    if (currentTime - this.lastPhaseChangeTime < this.phaseChangeCooldown) {
      return this.currentPhase;
    }

    // Temporal smoothing (majority voting)
    const phaseCounts = {};
    this.phaseBuffer.forEach(phase => {
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
    });

    let mostCommonPhase = this.currentPhase;
    let maxCount = 0;
    Object.entries(phaseCounts).forEach(([phase, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPhase = phase;
      }
    });

    // Only change if we have enough confidence
    if (mostCommonPhase !== this.currentPhase && maxCount >= 3) {
      this.lastPhaseChangeTime = currentTime;
      this.currentPhase = mostCommonPhase;
    }

    return this.currentPhase;
  }
}

// Test with jittery data
const detector = new PhaseDetector();
const jitteryPoses = createJitteryPoses();

console.log('📊 JITTERY DATA TEST:');
console.log('Frame | Wrist Y | Raw Phase    | Smoothed Phase | Difference');
console.log('------|---------|--------------|----------------|----------');

const rawResults = [];
const smoothedResults = [];

for (let i = 0; i < jitteryPoses.length; i++) {
  const pose = jitteryPoses[i];
  const rightWrist = pose.landmarks[16];
  
  const rawPhase = detector.detectRawPhase(pose);
  const smoothedPhase = detector.detectSmoothPhase(pose, i * 100);
  
  rawResults.push(rawPhase);
  smoothedResults.push(smoothedPhase);
  
  const diff = rawPhase !== smoothedPhase ? 'YES' : 'NO';
  
  if (i % 5 === 0) {
    console.log(`${i.toString().padStart(5)} | ${rightWrist.y.toFixed(2).padStart(7)} | ${rawPhase.padEnd(12)} | ${smoothedPhase.padEnd(14)} | ${diff}`);
  }
}

// Count transitions
const rawTransitions = rawResults.filter((phase, i) => i > 0 && phase !== rawResults[i-1]).length;
const smoothedTransitions = smoothedResults.filter((phase, i) => i > 0 && phase !== smoothedResults[i-1]).length;

console.log(`\n📈 SMOOTHING RESULTS:`);
console.log(`   Raw transitions: ${rawTransitions}`);
console.log(`   Smoothed transitions: ${smoothedTransitions}`);
console.log(`   Jitter reduction: ${rawTransitions - smoothedTransitions} transitions`);
console.log(`   Smoothing effectiveness: ${((rawTransitions - smoothedTransitions) / rawTransitions * 100).toFixed(1)}%`);

if (smoothedTransitions < rawTransitions) {
  console.log('✅ Smoothing is working! Reduced jitter significantly.');
} else {
  console.log('❌ Smoothing may need adjustment.');
}

console.log('\n🎉 Phase Detection Smoothing Test Complete!');
