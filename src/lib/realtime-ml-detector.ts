/**
 * Real-Time ML Phase Detection System
 * 
 * Replaces rule-based detection with trained LSTM models for live camera analysis.
 * Optimized for real-time performance with fallback systems.
 */

import { LSTMPhaseDetector, createLSTMPhaseDetector, LSTMPrediction } from './lstm-phase-detector';
import { PoseResult } from './mediapipe';

// 🎯 REAL-TIME DETECTION INTERFACES
export interface RealtimeMLConfig {
  modelPath: string;
  sequenceLength: number;
  confidenceThreshold: number;
  temporalSmoothing: boolean;
  smoothingWindow: number;
  enableFallback: boolean;
  performanceMode: 'fast' | 'balanced' | 'accurate';
}

export interface RealtimeMLResult {
  phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  confidence: number;
  method: 'ml' | 'fallback';
  timestamp: number;
  processingTime: number;
  features: {
    mlConfidence: number;
    temporalConsistency: number;
    poseQuality: number;
  };
}

export interface PerformanceStats {
  totalPredictions: number;
  mlPredictions: number;
  fallbackPredictions: number;
  averageConfidence: number;
  averageProcessingTime: number;
  accuracyScore: number;
}

// 🚀 REAL-TIME ML DETECTOR CLASS
export class RealtimeMLDetector {
  private lstmDetector: LSTMPhaseDetector;
  private config: RealtimeMLConfig;
  private performanceStats: PerformanceStats;
  private phaseHistory: string[] = [];
  private isInitialized = false;

  constructor(config: Partial<RealtimeMLConfig> = {}) {
    this.config = {
      modelPath: '/models/lstm-phase-detector.json',
      sequenceLength: 15,
      confidenceThreshold: 0.7,
      temporalSmoothing: true,
      smoothingWindow: 5,
      enableFallback: true,
      performanceMode: 'balanced',
      ...config
    };

    this.lstmDetector = createLSTMPhaseDetector({
      sequenceLength: this.config.sequenceLength,
      featureCount: 99,
      hiddenUnits: 128,
      dropoutRate: 0.3,
      learningRate: 0.001,
      batchSize: 1, // Real-time inference
      epochs: 1
    });

    this.performanceStats = {
      totalPredictions: 0,
      mlPredictions: 0,
      fallbackPredictions: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      accuracyScore: 0
    };
  }

  /**
   * Initialize the real-time ML detector
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 REALTIME ML: Initializing real-time ML detector...');
      
      // Initialize LSTM detector
      await this.lstmDetector.initialize();
      
      // Load pre-trained model
      try {
        await this.lstmDetector.loadModel(this.config.modelPath);
        console.log('✅ REALTIME ML: Pre-trained model loaded');
      } catch (error) {
        console.warn('⚠️ REALTIME ML: Pre-trained model not found, using untrained model');
      }
      
      this.isInitialized = true;
      console.log('✅ REALTIME ML: Real-time ML detector ready');
      
    } catch (error) {
      console.error('❌ REALTIME ML: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect swing phase in real-time
   */
  async detectPhase(poses: PoseResult[], currentFrame: number): Promise<RealtimeMLResult> {
    const startTime = performance.now();
    
    if (!this.isInitialized) {
      throw new Error('ML detector not initialized');
    }

    try {
      // Get ML prediction
      const mlResult = await this.lstmDetector.detectPhase(poses, currentFrame);
      
      // Update performance stats
      this.performanceStats.totalPredictions++;
      this.performanceStats.mlPredictions++;
      
      // Apply temporal smoothing if enabled
      let finalPhase = mlResult.phase;
      let finalConfidence = mlResult.confidence;
      
      if (this.config.temporalSmoothing) {
        const smoothed = this.applyTemporalSmoothing(mlResult.phase, mlResult.confidence);
        finalPhase = smoothed.phase;
        finalConfidence = smoothed.confidence;
      }
      
      // Update phase history
      this.phaseHistory.push(finalPhase);
      if (this.phaseHistory.length > this.config.smoothingWindow * 2) {
        this.phaseHistory.shift();
      }
      
      const processingTime = performance.now() - startTime;
      this.updatePerformanceStats(finalConfidence, processingTime);
      
      return {
        phase: finalPhase,
        confidence: finalConfidence,
        method: 'ml',
        timestamp: Date.now(),
        processingTime,
        features: {
          mlConfidence: mlResult.confidence,
          temporalConsistency: this.calculateTemporalConsistency(finalPhase),
          poseQuality: this.calculatePoseQuality(poses[currentFrame])
        }
      };
      
    } catch (error) {
      console.warn('⚠️ REALTIME ML: ML detection failed, using fallback:', error);
      
      // Fallback to simple rule-based detection
      return this.fallbackDetection(poses, currentFrame, startTime);
    }
  }

  /**
   * Apply temporal smoothing to reduce phase jitter
   */
  private applyTemporalSmoothing(phase: string, confidence: number): { phase: string; confidence: number } {
    if (this.phaseHistory.length < this.config.smoothingWindow) {
      return { phase, confidence };
    }
    
    // Get recent phases
    const recentPhases = this.phaseHistory.slice(-this.config.smoothingWindow);
    const phaseCounts: { [phase: string]: number } = {};
    
    recentPhases.forEach(p => {
      phaseCounts[p] = (phaseCounts[p] || 0) + 1;
    });
    
    // Find most common phase
    let mostCommonPhase = phase;
    let maxCount = 0;
    
    Object.entries(phaseCounts).forEach(([p, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPhase = p;
      }
    });
    
    // If current phase is inconsistent with recent history, smooth it
    const currentCount = phaseCounts[phase] || 0;
    const totalCount = recentPhases.length;
    
    if (currentCount / totalCount < 0.4 && confidence < 0.8) {
      return {
        phase: mostCommonPhase,
        confidence: confidence * 0.9 // Reduce confidence for smoothed result
      };
    }
    
    return { phase, confidence };
  }

  /**
   * Calculate temporal consistency
   */
  private calculateTemporalConsistency(phase: string): number {
    if (this.phaseHistory.length < 2) return 1.0;
    
    const recentPhases = this.phaseHistory.slice(-this.config.smoothingWindow);
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
   * Fallback detection using simple heuristics
   */
  private fallbackDetection(poses: PoseResult[], currentFrame: number, startTime: number): RealtimeMLResult {
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
    
    const processingTime = performance.now() - startTime;
    this.updatePerformanceStats(0.5, processingTime);
    
    return {
      phase,
      confidence: 0.5,
      method: 'fallback',
      timestamp: Date.now(),
      processingTime,
      features: {
        mlConfidence: 0,
        temporalConsistency: 0.5,
        poseQuality: this.calculatePoseQuality(poses[currentFrame])
      }
    };
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(confidence: number, processingTime: number): void {
    const total = this.performanceStats.totalPredictions;
    
    // Update average confidence
    this.performanceStats.averageConfidence = 
      (this.performanceStats.averageConfidence * (total - 1) + confidence) / total;
    
    // Update average processing time
    this.performanceStats.averageProcessingTime = 
      (this.performanceStats.averageProcessingTime * (total - 1) + processingTime) / total;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats };
  }

  /**
   * Get detector configuration
   */
  getConfig(): RealtimeMLConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RealtimeMLConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.phaseHistory = [];
    this.lstmDetector.reset();
    this.performanceStats = {
      totalPredictions: 0,
      mlPredictions: 0,
      fallbackPredictions: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      accuracyScore: 0
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.lstmDetector.dispose();
    this.reset();
  }
}

// 🎯 UTILITY FUNCTIONS

/**
 * Create a new real-time ML detector
 */
export function createRealtimeMLDetector(config?: Partial<RealtimeMLConfig>): RealtimeMLDetector {
  return new RealtimeMLDetector(config);
}

/**
 * Quick phase detection for simple use cases
 */
export async function detectPhaseQuick(
  poses: PoseResult[], 
  currentFrame: number,
  config?: Partial<RealtimeMLConfig>
): Promise<RealtimeMLResult> {
  const detector = createRealtimeMLDetector(config);
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

/**
 * Batch phase detection for video analysis
 */
export async function detectPhasesBatch(
  poses: PoseResult[],
  config?: Partial<RealtimeMLConfig>
): Promise<RealtimeMLResult[]> {
  const detector = createRealtimeMLDetector(config);
  await detector.initialize();
  
  const results: RealtimeMLResult[] = [];
  
  try {
    for (let i = 0; i < poses.length; i++) {
      const result = await detector.detectPhase(poses, i);
      results.push(result);
    }
    
    return results;
  } finally {
    detector.dispose();
  }
}

export default RealtimeMLDetector;
