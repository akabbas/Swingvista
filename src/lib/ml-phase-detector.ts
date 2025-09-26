/**
 * ML-Powered Golf Swing Phase Detection
 * 
 * Replaces rule-based detection with machine learning models:
 * - TensorFlow.js LSTM for temporal sequence analysis
 * - Pose landmark feature engineering
 * - Real-time inference with fallback to rule-based
 * - Progressive learning from user data
 */

import * as tf from '@tensorflow/tfjs';
import { PoseResult, PoseLandmark } from './mediapipe';

// 🎯 ML PHASE DETECTION INTERFACES
export interface MLPhaseDetectionResult {
  phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  confidence: number;
  features: number[];
  timestamp: number;
}

export interface MLPhaseDetectorConfig {
  modelPath?: string;
  sequenceLength: number;
  featureCount: number;
  confidenceThreshold: number;
  enableFallback: boolean;
  learningMode: boolean;
}

export interface SwingSequence {
  poses: PoseResult[];
  phases: string[];
  features: number[][];
  timestamps: number[];
}

// 🚀 ML PHASE DETECTOR CLASS
export class MLPhaseDetector {
  private model: tf.LayersModel | null = null;
  private config: MLPhaseDetectorConfig;
  private featureBuffer: number[][] = [];
  private phaseHistory: string[] = [];
  private isModelLoaded = false;
  private fallbackDetector: any = null;

  constructor(config: Partial<MLPhaseDetectorConfig> = {}) {
    this.config = {
      modelPath: '/models/golf-phase-detector.json',
      sequenceLength: 10,
      featureCount: 33 * 3, // 33 landmarks * (x, y, confidence)
      confidenceThreshold: 0.7,
      enableFallback: true,
      learningMode: false,
      ...config
    };
  }

  /**
   * Initialize the ML model
   */
  async initialize(): Promise<void> {
    try {
      console.log('🤖 ML PHASE DETECTOR: Initializing ML model...');
      
      // Try to load pre-trained model
      if (this.config.modelPath) {
        try {
          this.model = await tf.loadLayersModel(this.config.modelPath);
          this.isModelLoaded = true;
          console.log('✅ ML PHASE DETECTOR: Pre-trained model loaded successfully');
        } catch (error) {
          console.warn('⚠️ ML PHASE DETECTOR: Pre-trained model not found, creating new model');
          await this.createNewModel();
        }
      } else {
        await this.createNewModel();
      }

      // Initialize fallback detector if enabled
      if (this.config.enableFallback) {
        const { EnhancedPhaseDetector } = await import('./enhanced-phase-detector');
        this.fallbackDetector = new EnhancedPhaseDetector();
      }

    } catch (error) {
      console.error('❌ ML PHASE DETECTOR: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new LSTM model for phase detection
   */
  private async createNewModel(): Promise<void> {
    console.log('🏗️ ML PHASE DETECTOR: Creating new LSTM model...');
    
    const model = tf.sequential({
      layers: [
        // Input layer for pose sequences
        tf.layers.lstm({
          units: 64,
          returnSequences: true,
          inputShape: [this.config.sequenceLength, this.config.featureCount],
          dropout: 0.2,
          recurrentDropout: 0.2
        }),
        
        // Second LSTM layer
        tf.layers.lstm({
          units: 32,
          returnSequences: false,
          dropout: 0.2,
          recurrentDropout: 0.2
        }),
        
        // Dense layers for classification
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }),
        
        tf.layers.dropout({ rate: 0.3 }),
        
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        
        // Output layer for 6 phases
        tf.layers.dense({
          units: 6,
          activation: 'softmax'
        })
      ]
    });

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
    this.isModelLoaded = true;
    console.log('✅ ML PHASE DETECTOR: New LSTM model created successfully');
  }

  /**
   * Extract features from pose landmarks
   */
  private extractFeatures(pose: PoseResult): number[] {
    if (!pose.landmarks || pose.landmarks.length === 0) {
      // Return zero features if no landmarks
      return new Array(this.config.featureCount).fill(0);
    }

    const features: number[] = [];
    
    // Extract normalized landmark coordinates and confidence
    for (let i = 0; i < 33; i++) {
      const landmark = pose.landmarks[i];
      if (landmark) {
        features.push(landmark.x || 0);
        features.push(landmark.y || 0);
        features.push(landmark.visibility || 0);
      } else {
        features.push(0, 0, 0);
      }
    }

    return features;
  }

  /**
   * Detect swing phase using ML model
   */
  async detectPhase(poses: PoseResult[], currentFrame: number): Promise<MLPhaseDetectionResult> {
    if (!this.isModelLoaded) {
      throw new Error('ML model not initialized');
    }

    try {
      // Extract features for current pose
      const currentPose = poses[currentFrame];
      if (!currentPose) {
        throw new Error('No pose data for current frame');
      }

      const currentFeatures = this.extractFeatures(currentPose);
      
      // Add to feature buffer
      this.featureBuffer.push(currentFeatures);
      
      // Maintain sequence length
      if (this.featureBuffer.length > this.config.sequenceLength) {
        this.featureBuffer.shift();
      }

      // Need minimum sequence for prediction
      if (this.featureBuffer.length < this.config.sequenceLength) {
        return {
          phase: 'address',
          confidence: 0.5,
          features: currentFeatures,
          timestamp: Date.now()
        };
      }

      // Prepare input tensor
      const inputTensor = tf.tensor3d([this.featureBuffer]);
      
      // Make prediction
      const prediction = this.model!.predict(inputTensor) as tf.Tensor;
      const predictionArray = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      // Map prediction to phase
      const phaseIndex = this.getPhaseIndex(predictionArray);
      const confidence = Math.max(...predictionArray);
      const phase = this.indexToPhase(phaseIndex);

      // Update phase history
      this.phaseHistory.push(phase);
      if (this.phaseHistory.length > 10) {
        this.phaseHistory.shift();
      }

      // Apply temporal smoothing
      const smoothedPhase = this.applyTemporalSmoothing(phase, confidence);

      return {
        phase: smoothedPhase,
        confidence,
        features: currentFeatures,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ ML PHASE DETECTOR: Prediction failed:', error);
      
      // Fallback to rule-based detection
      if (this.config.enableFallback && this.fallbackDetector) {
        return this.fallbackToRuleBased(poses, currentFrame);
      }
      
      throw error;
    }
  }

  /**
   * Get phase index from prediction array
   */
  private getPhaseIndex(predictionArray: Float32Array): number {
    let maxIndex = 0;
    let maxValue = predictionArray[0];
    
    for (let i = 1; i < predictionArray.length; i++) {
      if (predictionArray[i] > maxValue) {
        maxValue = predictionArray[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  /**
   * Convert index to phase name
   */
  private indexToPhase(index: number): 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through' {
    const phases = ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through'];
    return phases[index] as any;
  }

  /**
   * Apply temporal smoothing to reduce phase jitter
   */
  private applyTemporalSmoothing(currentPhase: string, confidence: number): 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through' {
    if (confidence < this.config.confidenceThreshold) {
      // Low confidence - use most common phase from history
      const phaseCounts: { [key: string]: number } = {};
      this.phaseHistory.forEach(phase => {
        phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
      });
      
      let mostCommonPhase = currentPhase;
      let maxCount = 0;
      
      Object.entries(phaseCounts).forEach(([phase, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonPhase = phase;
        }
      });
      
      return mostCommonPhase as any;
    }
    
    return currentPhase as any;
  }

  /**
   * Fallback to rule-based detection
   */
  private async fallbackToRuleBased(poses: PoseResult[], currentFrame: number): Promise<MLPhaseDetectionResult> {
    console.log('🔄 ML PHASE DETECTOR: Falling back to rule-based detection');
    
    try {
      const ruleBasedPhase = this.fallbackDetector.detectSwingPhase(poses, currentFrame, Date.now());
      
      return {
        phase: ruleBasedPhase.name as any,
        confidence: ruleBasedPhase.confidence,
        features: this.extractFeatures(poses[currentFrame]),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ ML PHASE DETECTOR: Fallback also failed:', error);
      
      return {
        phase: 'address',
        confidence: 0.3,
        features: this.extractFeatures(poses[currentFrame]),
        timestamp: Date.now()
      };
    }
  }

  /**
   * Train the model on new data
   */
  async trainModel(sequences: SwingSequence[]): Promise<void> {
    if (!this.model || !this.config.learningMode) {
      console.log('⚠️ ML PHASE DETECTOR: Model not available for training or learning disabled');
      return;
    }

    try {
      console.log('🎓 ML PHASE DETECTOR: Training model on new data...');
      
      // Prepare training data
      const features: number[][][] = [];
      const labels: number[][] = [];
      
      sequences.forEach(sequence => {
        for (let i = this.config.sequenceLength; i < sequence.poses.length; i++) {
          const sequenceFeatures = sequence.features.slice(i - this.config.sequenceLength, i);
          const phaseIndex = this.phaseToIndex(sequence.phases[i]);
          
          features.push(sequenceFeatures);
          labels.push(this.oneHotEncode(phaseIndex));
        }
      });

      if (features.length === 0) {
        console.log('⚠️ ML PHASE DETECTOR: No training data available');
        return;
      }

      // Convert to tensors
      const featureTensor = tf.tensor3d(features);
      const labelTensor = tf.tensor2d(labels);

      // Train the model
      const history = await this.model.fit(featureTensor, labelTensor, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`📊 ML PHASE DETECTOR: Epoch ${epoch + 1} - Loss: ${logs?.loss?.toFixed(4)}, Accuracy: ${logs?.acc?.toFixed(4)}`);
          }
        }
      });

      // Clean up tensors
      featureTensor.dispose();
      labelTensor.dispose();

      console.log('✅ ML PHASE DETECTOR: Model training completed');
      
      // Save the updated model
      await this.saveModel();
      
    } catch (error) {
      console.error('❌ ML PHASE DETECTOR: Training failed:', error);
      throw error;
    }
  }

  /**
   * Convert phase name to index
   */
  private phaseToIndex(phase: string): number {
    const phases = ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through'];
    return phases.indexOf(phase);
  }

  /**
   * One-hot encode phase index
   */
  private oneHotEncode(index: number): number[] {
    const encoded = new Array(6).fill(0);
    encoded[index] = 1;
    return encoded;
  }

  /**
   * Save the trained model
   */
  private async saveModel(): Promise<void> {
    if (!this.model) return;
    
    try {
      // In a real implementation, you'd save to a server or local storage
      console.log('💾 ML PHASE DETECTOR: Model saved (simulated)');
    } catch (error) {
      console.error('❌ ML PHASE DETECTOR: Failed to save model:', error);
    }
  }

  /**
   * Get model statistics
   */
  getModelStats(): { isLoaded: boolean; sequenceLength: number; featureCount: number } {
    return {
      isLoaded: this.isModelLoaded,
      sequenceLength: this.config.sequenceLength,
      featureCount: this.config.featureCount
    };
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.featureBuffer = [];
    this.phaseHistory = [];
  }

  /**
   * Dispose of the model and clean up memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isModelLoaded = false;
    this.reset();
  }
}

// 🎯 UTILITY FUNCTIONS

/**
 * Create a new ML phase detector instance
 */
export function createMLPhaseDetector(config?: Partial<MLPhaseDetectorConfig>): MLPhaseDetector {
  return new MLPhaseDetector(config);
}

/**
 * Extract features from a sequence of poses for training
 */
export function extractSequenceFeatures(poses: PoseResult[]): number[][] {
  return poses.map(pose => {
    const features: number[] = [];
    
    if (pose.landmarks && pose.landmarks.length > 0) {
      for (let i = 0; i < 33; i++) {
        const landmark = pose.landmarks[i];
        if (landmark) {
          features.push(landmark.x || 0);
          features.push(landmark.y || 0);
          features.push(landmark.visibility || 0);
        } else {
          features.push(0, 0, 0);
        }
      }
    } else {
      features.push(...new Array(33 * 3).fill(0));
    }
    
    return features;
  });
}

/**
 * Create training sequences from swing data
 */
export function createTrainingSequences(
  poses: PoseResult[], 
  phases: string[], 
  sequenceLength: number = 10
): SwingSequence[] {
  const sequences: SwingSequence[] = [];
  const features = extractSequenceFeatures(poses);
  
  for (let i = sequenceLength; i < poses.length; i++) {
    sequences.push({
      poses: poses.slice(i - sequenceLength, i),
      phases: phases.slice(i - sequenceLength, i),
      features: features.slice(i - sequenceLength, i),
      timestamps: poses.slice(i - sequenceLength, i).map(p => p.timestamp || 0)
    });
  }
  
  return sequences;
}

export default MLPhaseDetector;
