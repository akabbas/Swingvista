/**
 * Professional Training Data Collection System
 * 
 * Collects and processes professional golf swing data for LSTM model training.
 * Handles data annotation, validation, and preparation for ML training.
 */

import { PoseResult } from './mediapipe';
import { TrainingData, createTrainingData } from './lstm-phase-detector';

// 🎯 TRAINING DATA INTERFACES
export interface SwingAnnotation {
  frameIndex: number;
  phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  confidence: number;
  annotator: string;
  timestamp: number;
}

export interface ProfessionalSwingData {
  videoId: string;
  golferName: string;
  golferLevel: 'amateur' | 'professional' | 'tour';
  swingType: 'driver' | 'iron' | 'wedge' | 'putt';
  poses: PoseResult[];
  annotations: SwingAnnotation[];
  metadata: {
    videoUrl: string;
    frameRate: number;
    duration: number;
    cameraAngle: string;
    lighting: string;
    quality: 'high' | 'medium' | 'low';
  };
}

export interface TrainingDataset {
  swings: ProfessionalSwingData[];
  totalFrames: number;
  phaseDistribution: { [phase: string]: number };
  qualityMetrics: {
    averageConfidence: number;
    annotationConsistency: number;
    dataCompleteness: number;
  };
}

// 🚀 TRAINING DATA COLLECTOR CLASS
export class TrainingDataCollector {
  private dataset: TrainingDataset;
  private validationRules: any;

  constructor() {
    this.dataset = {
      swings: [],
      totalFrames: 0,
      phaseDistribution: {},
      qualityMetrics: {
        averageConfidence: 0,
        annotationConsistency: 0,
        dataCompleteness: 0
      }
    };

    this.initializeValidationRules();
  }

  /**
   * Initialize data validation rules
   */
  private initializeValidationRules(): void {
    this.validationRules = {
      minFrames: 30,           // Minimum frames per swing
      maxFrames: 300,          // Maximum frames per swing
      minConfidence: 0.7,      // Minimum annotation confidence
      requiredPhases: ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through'],
      phaseOrder: ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through']
    };
  }

  /**
   * Add professional swing data
   */
  addSwingData(swingData: ProfessionalSwingData): boolean {
    try {
      console.log(`📊 TRAINING COLLECTOR: Adding swing data for ${swingData.golferName}`);
      
      // Validate swing data
      if (!this.validateSwingData(swingData)) {
        console.warn('⚠️ TRAINING COLLECTOR: Invalid swing data, skipping');
        return false;
      }

      // Process and clean data
      const processedData = this.processSwingData(swingData);
      
      // Add to dataset
      this.dataset.swings.push(processedData);
      
      // Update statistics
      this.updateDatasetStatistics();
      
      console.log('✅ TRAINING COLLECTOR: Swing data added successfully');
      return true;
      
    } catch (error) {
      console.error('❌ TRAINING COLLECTOR: Failed to add swing data:', error);
      return false;
    }
  }

  /**
   * Validate swing data quality
   */
  private validateSwingData(swingData: ProfessionalSwingData): boolean {
    const { poses, annotations } = swingData;
    
    // Check frame count
    if (poses.length < this.validationRules.minFrames || poses.length > this.validationRules.maxFrames) {
      console.warn(`⚠️ VALIDATION: Invalid frame count: ${poses.length}`);
      return false;
    }

    // Check annotation coverage
    const annotationCoverage = annotations.length / poses.length;
    if (annotationCoverage < 0.8) {
      console.warn(`⚠️ VALIDATION: Low annotation coverage: ${(annotationCoverage * 100).toFixed(1)}%`);
      return false;
    }

    // Check phase completeness
    const annotatedPhases = new Set(annotations.map(a => a.phase));
    const missingPhases = this.validationRules.requiredPhases.filter(phase => !annotatedPhases.has(phase));
    if (missingPhases.length > 0) {
      console.warn(`⚠️ VALIDATION: Missing phases: ${missingPhases.join(', ')}`);
      return false;
    }

    // Check phase sequence
    if (!this.validatePhaseSequence(annotations)) {
      console.warn('⚠️ VALIDATION: Invalid phase sequence');
      return false;
    }

    return true;
  }

  /**
   * Validate phase sequence order
   */
  private validatePhaseSequence(annotations: SwingAnnotation[]): boolean {
    const sortedAnnotations = annotations.sort((a, b) => a.frameIndex - b.frameIndex);
    const phaseSequence = sortedAnnotations.map(a => a.phase);
    
    // Check if phases follow expected order
    let currentPhaseIndex = 0;
    for (const phase of phaseSequence) {
      const phaseIndex = this.validationRules.phaseOrder.indexOf(phase);
      if (phaseIndex >= currentPhaseIndex) {
        currentPhaseIndex = phaseIndex;
      } else {
        // Phase goes backward - might be valid for some cases
        if (phaseIndex < currentPhaseIndex - 1) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Process and clean swing data
   */
  private processSwingData(swingData: ProfessionalSwingData): ProfessionalSwingData {
    // Sort annotations by frame index
    const sortedAnnotations = swingData.annotations.sort((a, b) => a.frameIndex - b.frameIndex);
    
    // Fill missing annotations with interpolation
    const filledAnnotations = this.interpolateMissingAnnotations(
      swingData.poses, 
      sortedAnnotations
    );
    
    // Smooth phase transitions
    const smoothedAnnotations = this.smoothPhaseTransitions(filledAnnotations);
    
    return {
      ...swingData,
      annotations: smoothedAnnotations
    };
  }

  /**
   * Interpolate missing annotations
   */
  private interpolateMissingAnnotations(
    poses: PoseResult[], 
    annotations: SwingAnnotation[]
  ): SwingAnnotation[] {
    const filledAnnotations: SwingAnnotation[] = [];
    const annotationMap = new Map(annotations.map(a => [a.frameIndex, a]));
    
    for (let i = 0; i < poses.length; i++) {
      if (annotationMap.has(i)) {
        filledAnnotations.push(annotationMap.get(i)!);
      } else {
        // Find nearest annotations
        const before = annotations.filter(a => a.frameIndex < i).pop();
        const after = annotations.filter(a => a.frameIndex > i).shift();
        
        if (before && after) {
          // Interpolate between annotations
          const interpolatedPhase = this.interpolatePhase(before.phase, after.phase, i, before.frameIndex, after.frameIndex);
          filledAnnotations.push({
            frameIndex: i,
            phase: interpolatedPhase,
            confidence: Math.min(before.confidence, after.confidence) * 0.8,
            annotator: 'interpolated',
            timestamp: poses[i].timestamp || Date.now()
          });
        } else if (before) {
          // Use previous annotation
          filledAnnotations.push({
            ...before,
            frameIndex: i,
            confidence: before.confidence * 0.9
          });
        } else if (after) {
          // Use next annotation
          filledAnnotations.push({
            ...after,
            frameIndex: i,
            confidence: after.confidence * 0.9
          });
        }
      }
    }
    
    return filledAnnotations;
  }

  /**
   * Interpolate phase between two annotations
   */
  private interpolatePhase(
    beforePhase: string, 
    afterPhase: string, 
    currentFrame: number, 
    beforeFrame: number, 
    afterFrame: number
  ): 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through' {
    const phaseOrder = this.validationRules.phaseOrder;
    const beforeIndex = phaseOrder.indexOf(beforePhase);
    const afterIndex = phaseOrder.indexOf(afterPhase);
    
    // If phases are the same, return that phase
    if (beforeIndex === afterIndex) {
      return beforePhase as any;
    }
    
    // If phases are consecutive, interpolate
    if (Math.abs(beforeIndex - afterIndex) === 1) {
      const progress = (currentFrame - beforeFrame) / (afterFrame - beforeFrame);
      if (progress < 0.5) {
        return beforePhase as any;
      } else {
        return afterPhase as any;
      }
    }
    
    // Default to before phase
    return beforePhase as any;
  }

  /**
   * Smooth phase transitions to reduce noise
   */
  private smoothPhaseTransitions(annotations: SwingAnnotation[]): SwingAnnotation[] {
    const smoothed: SwingAnnotation[] = [];
    const windowSize = 3;
    
    for (let i = 0; i < annotations.length; i++) {
      const window = annotations.slice(Math.max(0, i - windowSize), i + windowSize + 1);
      const phaseCounts: { [phase: string]: number } = {};
      
      window.forEach(ann => {
        phaseCounts[ann.phase] = (phaseCounts[ann.phase] || 0) + 1;
      });
      
      // Find most common phase in window
      let mostCommonPhase = annotations[i].phase;
      let maxCount = 0;
      
      Object.entries(phaseCounts).forEach(([phase, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonPhase = phase;
        }
      });
      
      smoothed.push({
        ...annotations[i],
        phase: mostCommonPhase as any,
        confidence: Math.min(annotations[i].confidence, 0.95)
      });
    }
    
    return smoothed;
  }

  /**
   * Update dataset statistics
   */
  private updateDatasetStatistics(): void {
    this.dataset.totalFrames = this.dataset.swings.reduce((total, swing) => total + swing.poses.length, 0);
    
    // Calculate phase distribution
    const phaseCounts: { [phase: string]: number } = {};
    this.dataset.swings.forEach(swing => {
      swing.annotations.forEach(ann => {
        phaseCounts[ann.phase] = (phaseCounts[ann.phase] || 0) + 1;
      });
    });
    
    this.dataset.phaseDistribution = phaseCounts;
    
    // Calculate quality metrics
    const allConfidences = this.dataset.swings.flatMap(swing => 
      swing.annotations.map(ann => ann.confidence)
    );
    
    this.dataset.qualityMetrics = {
      averageConfidence: allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length,
      annotationConsistency: this.calculateAnnotationConsistency(),
      dataCompleteness: this.calculateDataCompleteness()
    };
  }

  /**
   * Calculate annotation consistency
   */
  private calculateAnnotationConsistency(): number {
    // This would compare annotations from multiple annotators
    // For now, return a default value
    return 0.85;
  }

  /**
   * Calculate data completeness
   */
  private calculateDataCompleteness(): number {
    const totalPossibleAnnotations = this.dataset.swings.reduce((total, swing) => total + swing.poses.length, 0);
    const totalAnnotations = this.dataset.swings.reduce((total, swing) => total + swing.annotations.length, 0);
    
    return totalAnnotations / totalPossibleAnnotations;
  }

  /**
   * Export training data for LSTM model
   */
  exportTrainingData(): TrainingData[] {
    console.log('📤 TRAINING COLLECTOR: Exporting training data...');
    
    const trainingData: TrainingData[] = [];
    
    this.dataset.swings.forEach(swing => {
      const phases = swing.annotations.map(ann => ann.phase);
      const trainingDataItem = createTrainingData(swing.poses, phases, {
        videoId: swing.videoId,
        golferLevel: swing.golferLevel,
        swingType: swing.swingType,
        frameRate: swing.metadata.frameRate
      });
      
      trainingData.push(trainingDataItem);
    });
    
    console.log(`✅ TRAINING COLLECTOR: Exported ${trainingData.length} training sequences`);
    return trainingData;
  }

  /**
   * Get dataset statistics
   */
  getDatasetStats(): any {
    return {
      totalSwings: this.dataset.swings.length,
      totalFrames: this.dataset.totalFrames,
      phaseDistribution: this.dataset.phaseDistribution,
      qualityMetrics: this.dataset.qualityMetrics,
      golferLevels: this.getGolferLevelDistribution(),
      swingTypes: this.getSwingTypeDistribution()
    };
  }

  /**
   * Get golfer level distribution
   */
  private getGolferLevelDistribution(): { [level: string]: number } {
    const distribution: { [level: string]: number } = {};
    
    this.dataset.swings.forEach(swing => {
      distribution[swing.golferLevel] = (distribution[swing.golferLevel] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Get swing type distribution
   */
  private getSwingTypeDistribution(): { [type: string]: number } {
    const distribution: { [type: string]: number } = {};
    
    this.dataset.swings.forEach(swing => {
      distribution[swing.swingType] = (distribution[swing.swingType] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Clear all training data
   */
  clearDataset(): void {
    this.dataset = {
      swings: [],
      totalFrames: 0,
      phaseDistribution: {},
      qualityMetrics: {
        averageConfidence: 0,
        annotationConsistency: 0,
        dataCompleteness: 0
      }
    };
    
    console.log('🗑️ TRAINING COLLECTOR: Dataset cleared');
  }
}

// 🎯 UTILITY FUNCTIONS

/**
 * Create a new training data collector
 */
export function createTrainingDataCollector(): TrainingDataCollector {
  return new TrainingDataCollector();
}

/**
 * Create professional swing data from video
 */
export function createProfessionalSwingData(
  videoId: string,
  golferName: string,
  golferLevel: 'amateur' | 'professional' | 'tour',
  swingType: 'driver' | 'iron' | 'wedge' | 'putt',
  poses: PoseResult[],
  annotations: SwingAnnotation[],
  metadata: any = {}
): ProfessionalSwingData {
  return {
    videoId,
    golferName,
    golferLevel,
    swingType,
    poses,
    annotations,
    metadata: {
      videoUrl: metadata.videoUrl || '',
      frameRate: metadata.frameRate || 30,
      duration: metadata.duration || 0,
      cameraAngle: metadata.cameraAngle || 'side',
      lighting: metadata.lighting || 'outdoor',
      quality: metadata.quality || 'high',
      ...metadata
    }
  };
}

/**
 * Create swing annotation
 */
export function createSwingAnnotation(
  frameIndex: number,
  phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through',
  confidence: number,
  annotator: string,
  timestamp: number
): SwingAnnotation {
  return {
    frameIndex,
    phase,
    confidence,
    annotator,
    timestamp
  };
}

export default TrainingDataCollector;
