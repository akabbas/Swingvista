/**
 * Phase Detection Smoothing Test
 * 
 * This file demonstrates the before/after comparison of phase detection smoothing
 * with actual sample data showing reduced jitter.
 */

import { EnhancedPhaseDetector } from './enhanced-phase-detector';
import { PoseResult } from './mediapipe';

/**
 * Create mock pose data that simulates jittery phase detection
 */
function createMockPoses(): PoseResult[] {
  // Simulate a golf swing with some jittery data
  const poses: PoseResult[] = [];
  
  for (let i = 0; i < 30; i++) {
    const frame = i;
    const time = i * 100; // 100ms per frame
    
    // Simulate wrist positions that cause phase jitter
    let rightWristY = 0.8;
    let leftWristY = 0.8;
    
    if (i < 5) {
      // Address phase - stable
      rightWristY = 0.8 + (Math.random() - 0.5) * 0.1;
      leftWristY = 0.8 + (Math.random() - 0.5) * 0.1;
    } else if (i < 10) {
      // Backswing phase - some jitter
      rightWristY = 0.7 - (i - 5) * 0.1 + (Math.random() - 0.5) * 0.2;
      leftWristY = 0.7 - (i - 5) * 0.1 + (Math.random() - 0.5) * 0.2;
    } else if (i < 15) {
      // Top of swing - more jitter
      rightWristY = 0.3 + (Math.random() - 0.5) * 0.3;
      leftWristY = 0.3 + (Math.random() - 0.5) * 0.3;
    } else if (i < 20) {
      // Downswing - some jitter
      rightWristY = 0.3 + (i - 15) * 0.1 + (Math.random() - 0.5) * 0.2;
      leftWristY = 0.3 + (i - 15) * 0.1 + (Math.random() - 0.5) * 0.2;
    } else {
      // Follow-through - stable
      rightWristY = 0.7 + (Math.random() - 0.5) * 0.1;
      leftWristY = 0.7 + (Math.random() - 0.5) * 0.1;
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
      timestamp: time
    });
  }
  
  return poses;
}

/**
 * Test phase detection without smoothing (original behavior)
 */
function testRawPhaseDetection(): string[] {
  console.log('🧪 TESTING: Raw phase detection (jittery)...');
  
  const detector = new EnhancedPhaseDetector();
  const poses = createMockPoses();
  const results: string[] = [];
  
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
 * Test phase detection with smoothing (new behavior)
 */
function testSmoothedPhaseDetection(): string[] {
  console.log('🧪 TESTING: Smoothed phase detection...');
  
  const detector = new EnhancedPhaseDetector();
  const poses = createMockPoses();
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
export function comparePhaseDetection(): void {
  console.log('🎯 PHASE DETECTION COMPARISON: Raw vs Smoothed\n');
  
  // Test raw detection
  const rawResults = testRawPhaseDetection();
  console.log('\n');
  
  // Test smoothed detection
  const smoothedResults = testSmoothedPhaseDetection();
  console.log('\n');
  
  // Compare results
  console.log('📊 COMPARISON RESULTS:');
  console.log('Frame | Raw Phase      | Smoothed Phase | Difference');
  console.log('------|----------------|----------------|----------');
  
  let differences = 0;
  for (let i = 0; i < rawResults.length; i++) {
    const raw = rawResults[i];
    const smoothed = smoothedResults[i];
    const diff = raw !== smoothed ? 'YES' : 'NO';
    
    if (raw !== smoothed) differences++;
    
    if (i % 5 === 0) {
      console.log(`${i.toString().padStart(5)} | ${raw.padEnd(14)} | ${smoothed.padEnd(14)} | ${diff}`);
    }
  }
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total frames: ${rawResults.length}`);
  console.log(`   Differences: ${differences}`);
  console.log(`   Smoothing effectiveness: ${((differences / rawResults.length) * 100).toFixed(1)}%`);
  
  // Analyze phase transitions
  const rawTransitions = countPhaseTransitions(rawResults);
  const smoothedTransitions = countPhaseTransitions(smoothedResults);
  
  console.log(`\n🔄 PHASE TRANSITIONS:`);
  console.log(`   Raw transitions: ${rawTransitions}`);
  console.log(`   Smoothed transitions: ${smoothedTransitions}`);
  console.log(`   Reduction: ${rawTransitions - smoothedTransitions} transitions`);
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
 * Test smoothing configuration options
 */
export function testSmoothingConfiguration(): void {
  console.log('🧪 TESTING: Smoothing configuration options...\n');
  
  const poses = createMockPoses();
  
  // Test different smoothing windows
  const smoothingWindows = [3, 5, 7];
  const cooldowns = [50, 100, 200];
  
  for (const window of smoothingWindows) {
    for (const cooldown of cooldowns) {
      console.log(`\n📊 Testing: Window=${window}, Cooldown=${cooldown}ms`);
      
      const detector = new EnhancedPhaseDetector();
      detector.configureSmartDetection({
        smoothingWindow: window,
        hysteresisThreshold: 0.15,
        phaseChangeCooldown: cooldown,
      });
      
      const results: string[] = [];
      for (let i = 0; i < poses.length; i++) {
        const result = detector.detectSwingPhase(poses, i, i * 100);
        results.push(result.name);
      }
      
      const transitions = countPhaseTransitions(results);
      console.log(`   Transitions: ${transitions}`);
    }
  }
}

/**
 * Test rollback functionality
 */
export function testRollback(): void {
  console.log('🧪 TESTING: Rollback functionality...\n');
  
  const detector = new EnhancedPhaseDetector();
  const poses = createMockPoses();
  
  // Test with smoothing enabled
  detector.configureSmartDetection({
    smoothingWindow: 5,
    hysteresisThreshold: 0.15,
    phaseChangeCooldown: 100,
  });
  
  const smoothedResults: string[] = [];
  for (let i = 0; i < poses.length; i++) {
    const result = detector.detectSwingPhase(poses, i, i * 100);
    smoothedResults.push(result.name);
  }
  
  // Test with smoothing disabled (rollback)
  detector.configureSmartDetection({
    smoothingWindow: 1, // Disable smoothing
    hysteresisThreshold: 0.0, // Disable hysteresis
    phaseChangeCooldown: 0, // Disable cooldown
  });
  
  const rawResults: string[] = [];
  for (let i = 0; i < poses.length; i++) {
    const result = detector.detectSwingPhase(poses, i, i * 100);
    rawResults.push(result.name);
  }
  
  console.log('📊 ROLLBACK TEST:');
  console.log(`   Smoothed transitions: ${countPhaseTransitions(smoothedResults)}`);
  console.log(`   Raw transitions: ${countPhaseTransitions(rawResults)}`);
  console.log(`   Rollback successful: ${countPhaseTransitions(rawResults) > countPhaseTransitions(smoothedResults)}`);
}

/**
 * Run all tests
 */
export function runAllPhaseSmoothingTests(): void {
  console.log('🧪 RUNNING ALL PHASE SMOOTHING TESTS...\n');
  
  comparePhaseDetection();
  console.log('\n' + '='.repeat(50) + '\n');
  
  testSmoothingConfiguration();
  console.log('\n' + '='.repeat(50) + '\n');
  
  testRollback();
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('🎉 ALL PHASE SMOOTHING TESTS COMPLETED');
}

// Export for easy testing
export default {
  comparePhaseDetection,
  testSmoothingConfiguration,
  testRollback,
  runAllPhaseSmoothingTests
};
