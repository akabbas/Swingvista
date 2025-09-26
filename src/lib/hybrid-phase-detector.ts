/**
 * Hybrid Phase Detection System
 * 
 * Combines ML-powered detection with rule-based fallback:
 * - Primary: ML model for accurate phase detection
 * - Fallback: Rule-based detection when ML fails
 * - Adaptive: Learns from user data to improve accuracy
 * - Real-time: Optimized for live camera analysis
 */

import { MLPhaseDetector, MLPhaseDetectionResult, createMLPhaseDetector } from './ml-phase-detector';
import { EnhancedPhaseDetector } from './enhanced-phase-detector';
import { PoseResult } from './mediapipe';

// 🎯 HYBRID DETECTOR INTERFACES
export interface HybridPhaseResult {
  phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  confidence: number;
  method: 'ml' | 'rule-based' | 'fallback';
  timestamp: number;
  features: {
    mlConfidence?: number;
    ruleBasedConfidence?: number;
    temporalConsistency: number;
    poseQuality: number;
  };
}

export interface HybridDetectorConfig {
  enableML: boolean;
  enableRuleBased: boolean;
  enableLearning: boolean;
  confidenceThreshold: number;
  temporalSmoothing: boolean;
  adaptiveThreshold: boolean;
}

// 🚀 HYBRID PHASE DETECTOR CLASS
export class HybridPhaseDetector {
  private mlDetector: MLPhaseDetector;
  private ruleBasedDetector: EnhancedPhaseDetector;
  private config: HybridDetectorConfig;
  private phaseHistory: HybridPhaseResult[] = [];
  private performanceStats = {
    mlPredictions: 0,
    ruleBasedPredictions: 0,
    fallbackPredictions: 0,
    averageConfidence: 0,
    accuracyScore: 0
  };

  constructor(config: Partial<HybridDetectorConfig> = {}) {
    this.config = {
      enableML: true,
      enableRuleBased: true,
      enableLearning: true,
      confidenceThreshold: 0.7,
      temporalSmoothing: true,
      adaptiveThreshold: true,
      ...config
    };

    // Initialize detectors
    this.mlDetector = createMLPhaseDetector({
      sequenceLength: 10,
      featureCount: 99, // 33 landmarks * 3 features
      confidenceThreshold: this.config.confidenceThreshold,
      enableFallback: true,
      learningMode: this.config.enableLearning
    });

    this.ruleBasedDetector = new EnhancedPhaseDetector();
  }

  /**
   * Initialize the hybrid detection system
   */
  async initialize(): Promise<void> {
    console.log('🚀 HYBRID DETECTOR: Initializing hybrid phase detection system...');
    
    try {
      // Initialize ML detector
      if (this.config.enableML) {
        await this.mlDetector.initialize();
        console.log('✅ HYBRID DETECTOR: ML detector initialized');
      }

      // Initialize rule-based detector
      if (this.config.enableRuleBased) {
        console.log('✅ HYBRID DETECTOR: Rule-based detector ready');
      }

      console.log('🎉 HYBRID DETECTOR: System fully initialized');
      
    } catch (error) {
      console.error('❌ HYBRID DETECTOR: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect swing phase using hybrid approach
   */
  async detectPhase(poses: PoseResult[], currentFrame: number): Promise<HybridPhaseResult> {
    const startTime = performance.now();
    
    try {
      let mlResult: MLPhaseDetectionResult | null = null;
      let ruleBasedResult: any = null;
      let finalResult: HybridPhaseResult;

      // Try ML detection first
      if (this.config.enableML) {
        try {
          mlResult = await this.mlDetector.detectPhase(poses, currentFrame);
          this.performanceStats.mlPredictions++;
          
          console.log(`🤖 ML DETECTION: Phase=${mlResult.phase}, Confidence=${mlResult.confidence.toFixed(3)}`);
        } catch (error) {
          console.warn('⚠️ ML DETECTION: Failed, falling back to rule-based:', error);
        }
      }

      // Try rule-based detection
      if (this.config.enableRuleBased) {
        try {
          ruleBasedResult = this.ruleBasedDetector.detectSwingPhase(poses, currentFrame, Date.now());
          this.performanceStats.ruleBasedPredictions++;
          
          console.log(`📏 RULE-BASED: Phase=${ruleBasedResult.name}, Confidence=${ruleBasedResult.confidence.toFixed(3)}`);
        } catch (error) {
          console.warn('⚠️ RULE-BASED DETECTION: Failed:', error);
        }
      }

      // Combine results using hybrid logic
      finalResult = this.combineResults(mlResult, ruleBasedResult, poses, currentFrame);
      
      // Apply temporal smoothing if enabled
      if (this.config.temporalSmoothing) {
        finalResult = this.applyTemporalSmoothing(finalResult);
      }

      // Update performance stats
      this.updatePerformanceStats(finalResult);
      
      // Add to history
      this.phaseHistory.push(finalResult);
      if (this.phaseHistory.length > 50) {
        this.phaseHistory.shift();
      }

      const processingTime = performance.now() - startTime;
      console.log(`⚡ HYBRID DETECTION: Completed in ${processingTime.toFixed(2)}ms - Phase=${finalResult.phase}, Method=${finalResult.method}, Confidence=${finalResult.confidence.toFixed(3)}`);

      return finalResult;

    } catch (error) {
      console.error('❌ HYBRID DETECTION: Complete failure:', error);
      
      // Emergency fallback
      return this.createEmergencyFallback(poses, currentFrame);
    }
  }

  /**
   * Combine ML and rule-based results
   */
  private combineResults(
    mlResult: MLPhaseDetectionResult | null,
    ruleBasedResult: any | null,
    poses: PoseResult[],
    currentFrame: number
  ): HybridPhaseResult {
    
    // Both methods available - use weighted combination
    if (mlResult && ruleBasedResult) {
      const mlWeight = this.calculateMLWeight(mlResult.confidence);
      const ruleWeight = this.calculateRuleWeight(ruleBasedResult.confidence);
      const totalWeight = mlWeight + ruleWeight;
      
      // Weighted phase selection
      const mlPhaseScore = this.phaseToScore(mlResult.phase) * mlWeight;
      const rulePhaseScore = this.phaseToScore(ruleBasedResult.name) * ruleWeight;
      
      const finalPhase = this.scoreToPhase((mlPhaseScore + rulePhaseScore) / totalWeight);
      const finalConfidence = (mlResult.confidence * mlWeight + ruleBasedResult.confidence * ruleWeight) / totalWeight;
      
      return {
        phase: finalPhase,
        confidence: finalConfidence,
        method: 'ml',
        timestamp: Date.now(),
        features: {
          mlConfidence: mlResult.confidence,
          ruleBasedConfidence: ruleBasedResult.confidence,
          temporalConsistency: this.calculateTemporalConsistency(finalPhase),
          poseQuality: this.calculatePoseQuality(poses[currentFrame])
        }
      };
    }
    
    // Only ML available
    if (mlResult) {
      return {
        phase: mlResult.phase,
        confidence: mlResult.confidence,
        method: 'ml',
        timestamp: Date.now(),
        features: {
          mlConfidence: mlResult.confidence,
          temporalConsistency: this.calculateTemporalConsistency(mlResult.phase),
          poseQuality: this.calculatePoseQuality(poses[currentFrame])
        }
      };
    }
    
    // Only rule-based available
    if (ruleBasedResult) {
      return {
        phase: ruleBasedResult.name,
        confidence: ruleBasedResult.confidence,
        method: 'rule-based',
        timestamp: Date.now(),
        features: {
          ruleBasedConfidence: ruleBasedResult.confidence,
          temporalConsistency: this.calculateTemporalConsistency(ruleBasedResult.name),
          poseQuality: this.calculatePoseQuality(poses[currentFrame])
        }
      };
    }
    
    // No methods available - emergency fallback
    return this.createEmergencyFallback(poses, currentFrame);
  }

  /**
   * Calculate ML weight based on confidence and context
   */
  private calculateMLWeight(confidence: number): number {
    let weight = confidence;
    
    // Boost weight for high confidence
    if (confidence > 0.8) weight *= 1.2;
    
    // Reduce weight for low confidence
    if (confidence < 0.5) weight *= 0.7;
    
    return Math.max(0.1, Math.min(1.0, weight));
  }

  /**
   * Calculate rule-based weight
   */
  private calculateRuleWeight(confidence: number): number {
    let weight = confidence;
    
    // Rule-based is more reliable for certain phases
    const phaseReliability = {
      'address': 0.9,
      'impact': 0.8,
      'follow-through': 0.7,
      'backswing': 0.6,
      'top': 0.6,
      'downswing': 0.6
    };
    
    return weight * 0.8; // Slightly lower weight for rule-based
  }

  /**
   * Convert phase to numeric score for combination
   */
  private phaseToScore(phase: string): number {
    const phaseScores = {
      'address': 0,
      'backswing': 1,
      'top': 2,
      'downswing': 3,
      'impact': 4,
      'follow-through': 5
    };
    return phaseScores[phase as keyof typeof phaseScores] || 0;
  }

  /**
   * Convert score back to phase
   */
  private scoreToPhase(score: number): 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through' {
    const phases = ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through'];
    const index = Math.round(score);
    return phases[Math.max(0, Math.min(5, index))] as any;
  }

  /**
   * Apply temporal smoothing to reduce jitter
   */
  private applyTemporalSmoothing(result: HybridPhaseResult): HybridPhaseResult {
    if (this.phaseHistory.length < 3) {
      return result;
    }

    // Get recent phases
    const recentPhases = this.phaseHistory.slice(-5).map(r => r.phase);
    const currentPhase = result.phase;
    
    // Count occurrences
    const phaseCounts: { [key: string]: number } = {};
    recentPhases.forEach(phase => {
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
    });
    
    // If current phase is inconsistent with recent history, smooth it
    const currentCount = phaseCounts[currentPhase] || 0;
    const totalCount = recentPhases.length;
    
    if (currentCount / totalCount < 0.4 && result.confidence < 0.8) {
      // Find most common recent phase
      let mostCommonPhase = currentPhase;
      let maxCount = 0;
      
      Object.entries(phaseCounts).forEach(([phase, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonPhase = phase;
        }
      });
      
      return {
        ...result,
        phase: mostCommonPhase as any,
        confidence: result.confidence * 0.8 // Reduce confidence for smoothed result
      };
    }
    
    return result;
  }

  /**
   * Calculate temporal consistency
   */
  private calculateTemporalConsistency(phase: string): number {
    if (this.phaseHistory.length < 2) return 1.0;
    
    const recentPhases = this.phaseHistory.slice(-5).map(r => r.phase);
    const samePhaseCount = recentPhases.filter(p => p === phase).length;
    
    return samePhaseCount / recentPhases.length;
  }

  /**
   * Calculate pose quality score
   */
  private calculatePoseQuality(pose: PoseResult): number {
    if (!pose.landmarks || pose.landmarks.length === 0) return 0;
    
    const visibleLandmarks = pose.landmarks.filter(l => l.visibility && l.visibility > 0.5);
    return visibleLandmarks.length / pose.landmarks.length;
  }

  /**
   * Create emergency fallback result
   */
  private createEmergencyFallback(poses: PoseResult[], currentFrame: number): HybridPhaseResult {
    this.performanceStats.fallbackPredictions++;
    
    // Simple heuristic based on frame position
    const totalFrames = poses.length;
    const frameRatio = currentFrame / totalFrames;
    
    let phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
    if (frameRatio < 0.1) phase = 'address';
    else if (frameRatio < 0.4) phase = 'backswing';
    else if (frameRatio < 0.5) phase = 'top';
    else if (frameRatio < 0.8) phase = 'downswing';
    else if (frameRatio < 0.9) phase = 'impact';
    else phase = 'follow-through';
    
    return {
      phase,
      confidence: 0.3,
      method: 'fallback',
      timestamp: Date.now(),
      features: {
        temporalConsistency: 0.5,
        poseQuality: this.calculatePoseQuality(poses[currentFrame])
      }
    };
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(result: HybridPhaseResult): void {
    const totalPredictions = this.performanceStats.mlPredictions + 
                           this.performanceStats.ruleBasedPredictions + 
                           this.performanceStats.fallbackPredictions;
    
    if (totalPredictions > 0) {
      this.performanceStats.averageConfidence = 
        (this.performanceStats.averageConfidence * (totalPredictions - 1) + result.confidence) / totalPredictions;
    }
  }

  /**
   * Train the ML model with new data
   */
  async trainModel(poses: PoseResult[], phases: string[]): Promise<void> {
    if (!this.config.enableLearning) {
      console.log('⚠️ HYBRID DETECTOR: Learning disabled');
      return;
    }

    try {
      console.log('🎓 HYBRID DETECTOR: Training ML model with new data...');
      
      // Create training sequences
      const sequences = this.createTrainingSequences(poses, phases);
      
      // Train the ML detector
      await this.mlDetector.trainModel(sequences);
      
      console.log('✅ HYBRID DETECTOR: Training completed');
      
    } catch (error) {
      console.error('❌ HYBRID DETECTOR: Training failed:', error);
    }
  }

  /**
   * Create training sequences from pose and phase data
   */
  private createTrainingSequences(poses: PoseResult[], phases: string[]): any[] {
    const sequences = [];
    const sequenceLength = 10;
    
    for (let i = sequenceLength; i < poses.length; i++) {
      sequences.push({
        poses: poses.slice(i - sequenceLength, i),
        phases: phases.slice(i - sequenceLength, i),
        features: poses.slice(i - sequenceLength, i).map(pose => {
          const features: number[] = [];
          if (pose.landmarks) {
            for (let j = 0; j < 33; j++) {
              const landmark = pose.landmarks[j];
              features.push(landmark?.x || 0, landmark?.y || 0, landmark?.visibility || 0);
            }
          } else {
            features.push(...new Array(99).fill(0));
          }
          return features;
        }),
        timestamps: poses.slice(i - sequenceLength, i).map(p => p.timestamp || 0)
      });
    }
    
    return sequences;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): typeof this.performanceStats {
    return { ...this.performanceStats };
  }

  /**
   * Get detector configuration
   */
  getConfig(): HybridDetectorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HybridDetectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.phaseHistory = [];
    this.mlDetector.reset();
    this.performanceStats = {
      mlPredictions: 0,
      ruleBasedPredictions: 0,
      fallbackPredictions: 0,
      averageConfidence: 0,
      accuracyScore: 0
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.mlDetector.dispose();
    this.reset();
  }
}

// 🎯 UTILITY FUNCTIONS

/**
 * Create a new hybrid phase detector
 */
export function createHybridPhaseDetector(config?: Partial<HybridDetectorConfig>): HybridPhaseDetector {
  return new HybridPhaseDetector(config);
}

/**
 * Quick phase detection for simple use cases
 */
export async function detectSwingPhaseQuick(
  poses: PoseResult[], 
  currentFrame: number,
  config?: Partial<HybridDetectorConfig>
): Promise<HybridPhaseResult> {
  const detector = createHybridPhaseDetector(config);
  await detector.initialize();
  
  try {
    const result = await detector.detectPhase(poses, currentFrame);
    detector.dispose();
    return result;
  } catch (error) {
    detector.dispose();
    throw error;
  }
}

export default HybridPhaseDetector;
