/**
 * ML Phase Detection Usage Example
 * 
 * This file demonstrates how to use the new ML-powered phase detection system
 * to replace the old rule-based approach.
 */

import { createHybridPhaseDetector, HybridPhaseResult } from './hybrid-phase-detector';
import { PoseResult } from './mediapipe';

// 🎯 EXAMPLE: UPGRADING FROM RULE-BASED TO ML-POWERED

/**
 * OLD RULE-BASED APPROACH (what we're replacing):
 * 
 * ```typescript
 * // Manual threshold detection
 * if (rightWrist.y < leftShoulder.y && swingVelocity > 0.5) {
 *     return 'BACKSWING';
 * }
 * ```
 */

/**
 * NEW ML-POWERED APPROACH:
 */
export class MLPhaseDetectionExample {
  private hybridDetector: any;

  constructor() {
    // Initialize the hybrid detector with ML capabilities
    this.hybridDetector = createHybridPhaseDetector({
      enableML: true,           // Enable ML model
      enableRuleBased: true,    // Keep rule-based as fallback
      enableLearning: true,     // Allow model to learn from new data
      confidenceThreshold: 0.7, // High confidence threshold
      temporalSmoothing: true,  // Reduce phase jitter
      adaptiveThreshold: true   // Adjust thresholds based on performance
    });
  }

  /**
   * Initialize the ML system
   */
  async initialize(): Promise<void> {
    console.log('🚀 ML EXAMPLE: Initializing ML-powered phase detection...');
    await this.hybridDetector.initialize();
    console.log('✅ ML EXAMPLE: ML system ready!');
  }

  /**
   * Detect swing phase using ML (replaces rule-based logic)
   */
  async detectPhaseML(poses: PoseResult[], currentFrame: number): Promise<HybridPhaseResult> {
    try {
      // ML-powered detection with automatic fallback
      const result = await this.hybridDetector.detectPhase(poses, currentFrame);
      
      console.log(`🤖 ML DETECTION: Phase=${result.phase}, Confidence=${result.confidence.toFixed(3)}, Method=${result.method}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ ML DETECTION: Failed:', error);
      throw error;
    }
  }

  /**
   * Train the ML model with new swing data
   */
  async trainModel(poses: PoseResult[], phases: string[]): Promise<void> {
    console.log('🎓 ML EXAMPLE: Training model with new data...');
    
    try {
      await this.hybridDetector.trainModel(poses, phases);
      console.log('✅ ML EXAMPLE: Model training completed');
    } catch (error) {
      console.error('❌ ML EXAMPLE: Training failed:', error);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): any {
    return this.hybridDetector.getPerformanceStats();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.hybridDetector.dispose();
  }
}

// 🎯 COMPARISON: OLD vs NEW

/**
 * OLD RULE-BASED DETECTION:
 * - Manual thresholds: "if (rightWrist.y < leftShoulder.y)"
 * - Fixed logic that doesn't adapt
 * - Prone to false positives/negatives
 * - No learning capability
 */
function oldRuleBasedDetection(pose: PoseResult): string {
  // Manual threshold detection
  const rightWrist = pose.landmarks?.[16]; // Right wrist
  const leftShoulder = pose.landmarks?.[11]; // Left shoulder
  
  if (rightWrist && leftShoulder) {
    if (rightWrist.y < leftShoulder.y) {
      return 'BACKSWING';
    }
  }
  
  return 'ADDRESS';
}

/**
 * NEW ML-POWERED DETECTION:
 * - Learns from data patterns
 * - Adapts to different swing styles
 * - Combines multiple detection methods
 * - Continuous improvement
 */
async function newMLDetection(poses: PoseResult[], currentFrame: number): Promise<HybridPhaseResult> {
  const detector = createHybridPhaseDetector({
    enableML: true,
    enableRuleBased: true,
    enableLearning: true
  });
  
  await detector.initialize();
  
  try {
    const result = await detector.detectPhase(poses, currentFrame);
    return result;
  } finally {
    detector.dispose();
  }
}

// 🎯 REAL-WORLD USAGE EXAMPLE

/**
 * Example: Upgrading a swing analyzer component
 */
export async function upgradeSwingAnalyzer() {
  console.log('🔄 UPGRADING: Converting from rule-based to ML-powered detection...');
  
  // Create ML-powered detector
  const mlDetector = new MLPhaseDetectionExample();
  await mlDetector.initialize();
  
  // Example pose data (normally from camera/video)
  const examplePoses: PoseResult[] = [
    // This would be real pose data from MediaPipe
    // For demo purposes, we'll simulate it
  ];
  
  // Detect phases using ML
  for (let i = 0; i < examplePoses.length; i++) {
    try {
      const result = await mlDetector.detectPhaseML(examplePoses, i);
      
      console.log(`Frame ${i}: ${result.phase} (${result.confidence.toFixed(2)} confidence)`);
      
      // Use the result in your swing analysis
      if (result.phase === 'impact' && result.confidence > 0.8) {
        console.log('🎯 High-confidence impact detected!');
      }
      
    } catch (error) {
      console.warn(`Frame ${i}: Detection failed, using fallback`);
    }
  }
  
  // Get performance stats
  const stats = mlDetector.getPerformanceStats();
  console.log('📊 Performance Stats:', stats);
  
  // Clean up
  mlDetector.dispose();
  
  console.log('✅ UPGRADE: ML-powered detection system ready!');
}

// 🎯 BENEFITS OF ML-POWERED DETECTION

/**
 * Key improvements over rule-based detection:
 * 
 * 1. **Adaptive Learning**: Model improves with more data
 * 2. **Higher Accuracy**: ML patterns vs manual thresholds
 * 3. **Robust Fallbacks**: Multiple detection methods
 * 4. **Temporal Consistency**: Reduces phase jitter
 * 5. **Performance Monitoring**: Track accuracy over time
 * 6. **Easy Integration**: Drop-in replacement for rule-based
 */

export default MLPhaseDetectionExample;
