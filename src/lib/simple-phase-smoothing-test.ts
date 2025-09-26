/**
 * Simple Phase Detection Smoothing Test
 * 
 * This demonstrates the before/after comparison with sample pose data
 * showing reduced jitter between BACKSWING and DOWNSWING phases.
 */

import { EnhancedPhaseDetector } from './enhanced-phase-detector';
import { PoseResult } from './mediapipe';

/**
 * Create sample pose data that causes jitter between BACKSWING and DOWNSWING
 */
function createJitteryPoseData(): PoseResult[] {
  const poses: PoseResult[] = [];
  
  // Simulate a golf swing with jittery wrist positions
  for (let i = 0; i < 25; i++) {
    const frame = i;
    const time = i * 100; // 100ms per frame
    
    // Simulate jittery wrist positions that cause phase jitter
    let rightWristY = 0.8;
    let leftWristY = 0.8;
    
    if (i < 5) {
      // Address phase - stable
      rightWristY = 0.8;
      leftWristY = 0.8;
    } else if (i < 10) {
      // Backswing phase - some jitter
      rightWristY = 0.7 - (i - 5) * 0.1 + (Math.random() - 0.5) * 0.2;
      leftWristY = 0.7 - (i - 5) * 0.1 + (Math.random() - 0.5) * 0.2;
    } else if (i < 15) {
      // Transition zone - HIGH JITTER between backswing and downswing
      rightWristY = 0.4 + (Math.random() - 0.5) * 0.3; // This causes jitter
      leftWristY = 0.4 + (Math.random() - 0.5) * 0.3;
    } else if (i < 20) {
      // Downswing phase - some jitter
      rightWristY = 0.3 + (i - 15) * 0.1 + (Math.random() - 0.5) * 0.2;
      leftWristY = 0.3 + (i - 15) * 0.1 + (Math.random() - 0.5) * 0.2;
    } else {
      // Follow-through - stable
      rightWristY = 0.7;
      leftWristY = 0.7;
    }
    
    // Create pose with landmarks
    const landmarks = Array.from({ length: 33 }, (_, j) => {
      if (j === 16) { // Right wrist
        return { x: 0.5, y: rightWristY, z: 0.5, visibility: 1 };
      } else if (j === 15) { // Left wrist
        return { x: 0.5, y: leftWristY, z: 0.5, visibility: 1 };
      } else if (j === 12) { // Right shoulder
        return { x: 0.6, y: 0.3, z: 0.5, visibility: 1 };
      } else if (j === 11) { // Left shoulder
        return { x: 0.4, y: 0.3, z: 0.5, visibility: 1 };
      } else if (j === 24) { // Right hip
        return { x: 0.6, y: 0.6, z: 0.5, visibility: 1 };
      } else if (j === 23) { // Left hip
        return { x: 0.4, y: 0.6, z: 0.5, visibility: 1 };
      } else {
        return { x: 0.5, y: 0.5, z: 0.5, visibility: 1 };
      }
    });
    
    poses.push({
      landmarks,
      worldLandmarks: landmarks,
      timestamp: time
    });
  }
  
  return poses;
}

/**
 * Test raw phase detection (jittery behavior)
 */
function testRawPhaseDetection(poses: PoseResult[]): string[] {
  console.log('🧪 TESTING: Raw phase detection (jittery)...');
  
  const results: string[] = [];
  
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];
    const rightWrist = pose.landmarks[16];
    const leftWrist = pose.landmarks[15];
    
    // Simple phase detection logic (causes jitter)
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
    
    results.push(phase);
    
    if (i % 5 === 0) {
      console.log(`Frame ${i}: ${phase} (Wrist Y: ${rightWrist.y.toFixed(2)})`);
    }
  }
  
  return results;
}

/**
 * Test smoothed phase detection
 */
function testSmoothedPhaseDetection(poses: PoseResult[]): string[] {
  console.log('🧪 TESTING: Smoothed phase detection...');
  
  const detector = new EnhancedPhaseDetector();
  const results: string[] = [];
  
  // Configure smoothing
  detector.configureSmartDetection({
    smoothingWindow: 5,
    hysteresisThreshold: 0.15,
    phaseChangeCooldown: 100,
  });
  
  for (let i = 0; i < poses.length; i++) {
    const result = detector.detectSwingPhase(poses, i, i * 100);
    results.push(result.name);
    
    if (i % 5 === 0) {
      console.log(`Frame ${i}: ${result.name} (Conf: ${result.confidence.toFixed(2)})`);
    }
  }
  
  return results;
}

/**
 * Compare raw vs smoothed phase detection
 */
export function comparePhaseSmoothing(): void {
  console.log('🎯 PHASE SMOOTHING COMPARISON: Before vs After\n');
  
  // Create jittery pose data
  const poses = createJitteryPoseData();
  
  // Test raw detection
  const rawResults = testRawPhaseDetection(poses);
  console.log('\n');
  
  // Test smoothed detection
  const smoothedResults = testSmoothedPhaseDetection(poses);
  console.log('\n');
  
  // Compare results
  console.log('📊 COMPARISON RESULTS:');
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
  
  // Analyze phase transitions
  const rawTransitions = countPhaseTransitions(rawResults);
  const smoothedTransitions = countPhaseTransitions(smoothedResults);
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total frames: ${rawResults.length}`);
  console.log(`   Raw transitions: ${rawTransitions}`);
  console.log(`   Smoothed transitions: ${smoothedTransitions}`);
  console.log(`   Reduction: ${rawTransitions - smoothedTransitions} transitions`);
  console.log(`   Smoothing effectiveness: ${((differences / rawResults.length) * 100).toFixed(1)}%`);
  
  // Show specific jitter reduction
  const jitterFrames = findJitterFrames(rawResults);
  const smoothedJitterFrames = findJitterFrames(smoothedResults);
  
  console.log(`\n🔄 JITTER ANALYSIS:`);
  console.log(`   Jittery frames (raw): ${jitterFrames.length}`);
  console.log(`   Jittery frames (smoothed): ${smoothedJitterFrames.length}`);
  console.log(`   Jitter reduction: ${jitterFrames.length - smoothedJitterFrames.length} frames`);
}

/**
 * Count phase transitions in a sequence
 */
function countPhaseTransitions(phases: string[]): number {
  let transitions = 0;
  for (let i = 1; i < phases.length; i++) {
    if (phases[i] !== phases[i - 1]) {
      transitions++;
    }
  }
  return transitions;
}

/**
 * Find frames with jitter (rapid phase changes)
 */
function findJitterFrames(phases: string[]): number[] {
  const jitterFrames: number[] = [];
  
  for (let i = 1; i < phases.length - 1; i++) {
    // Check for rapid phase changes (3 different phases in 3 frames)
    if (phases[i-1] !== phases[i] && phases[i] !== phases[i+1]) {
      jitterFrames.push(i);
    }
  }
  
  return jitterFrames;
}

/**
 * Test different smoothing parameters
 */
export function testSmoothingParameters(): void {
  console.log('🧪 TESTING: Different smoothing parameters...\n');
  
  const poses = createJitteryPoseData();
  
  // Test different configurations
  const configurations = [
    { name: 'No Smoothing', window: 1, cooldown: 0, threshold: 0.0 },
    { name: 'Light Smoothing', window: 3, cooldown: 50, threshold: 0.1 },
    { name: 'Balanced Smoothing', window: 5, cooldown: 100, threshold: 0.15 },
    { name: 'Heavy Smoothing', window: 7, cooldown: 200, threshold: 0.2 }
  ];
  
  for (const config of configurations) {
    console.log(`\n📊 Testing: ${config.name}`);
    console.log(`   Window: ${config.window}, Cooldown: ${config.cooldown}ms, Threshold: ${config.threshold}`);
    
    const detector = new EnhancedPhaseDetector();
    detector.configureSmartDetection({
      smoothingWindow: config.window,
      phaseChangeCooldown: config.cooldown,
      hysteresisThreshold: config.threshold,
    });
    
    const results: string[] = [];
    for (let i = 0; i < poses.length; i++) {
      const result = detector.detectSwingPhase(poses, i, i * 100);
      results.push(result.name);
    }
    
    const transitions = countPhaseTransitions(results);
    const jitterFrames = findJitterFrames(results);
    
    console.log(`   Transitions: ${transitions}`);
    console.log(`   Jittery frames: ${jitterFrames.length}`);
    console.log(`   Effectiveness: ${((jitterFrames.length / poses.length) * 100).toFixed(1)}% jitter`);
  }
}

/**
 * Test rollback functionality
 */
export function testRollback(): void {
  console.log('🧪 TESTING: Rollback functionality...\n');
  
  const poses = createJitteryPoseData();
  
  // Test with smoothing enabled
  const detector1 = new EnhancedPhaseDetector();
  detector1.configureSmartDetection({
    smoothingWindow: 5,
    hysteresisThreshold: 0.15,
    phaseChangeCooldown: 100,
  });
  
  const smoothedResults: string[] = [];
  for (let i = 0; i < poses.length; i++) {
    const result = detector1.detectSwingPhase(poses, i, i * 100);
    smoothedResults.push(result.name);
  }
  
  // Test with smoothing disabled (rollback)
  const detector2 = new EnhancedPhaseDetector();
  detector2.configureSmartDetection({
    smoothingWindow: 1,      // No smoothing
    phaseChangeCooldown: 0,   // No cooldown
    hysteresisThreshold: 0.0  // No hysteresis
  });
  
  const rawResults: string[] = [];
  for (let i = 0; i < poses.length; i++) {
    const result = detector2.detectSwingPhase(poses, i, i * 100);
    rawResults.push(result.name);
  }
  
  console.log('📊 ROLLBACK TEST:');
  console.log(`   Smoothed transitions: ${countPhaseTransitions(smoothedResults)}`);
  console.log(`   Raw transitions: ${countPhaseTransitions(rawResults)}`);
  console.log(`   Rollback successful: ${countPhaseTransitions(rawResults) > countPhaseTransitions(smoothedResults)}`);
  
  // Show that rollback gives us back the original behavior
  const smoothedJitter = findJitterFrames(smoothedResults);
  const rawJitter = findJitterFrames(rawResults);
  
  console.log(`   Smoothed jitter: ${smoothedJitter.length} frames`);
  console.log(`   Raw jitter: ${rawJitter.length} frames`);
  console.log(`   Jitter increased after rollback: ${rawJitter.length > smoothedJitter.length}`);
}

/**
 * Run all tests
 */
export function runAllSmoothingTests(): void {
  console.log('🧪 RUNNING ALL PHASE SMOOTHING TESTS...\n');
  
  comparePhaseSmoothing();
  console.log('\n' + '='.repeat(50) + '\n');
  
  testSmoothingParameters();
  console.log('\n' + '='.repeat(50) + '\n');
  
  testRollback();
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('🎉 ALL PHASE SMOOTHING TESTS COMPLETED');
}

// Export for easy testing
export default {
  comparePhaseSmoothing,
  testSmoothingParameters,
  testRollback,
  runAllSmoothingTests
};
