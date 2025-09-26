/**
 * LSTM-Based Golf Swing Phase Detection
 * 
 * Professional ML approach using TensorFlow.js LSTM for sequence-based
 * phase classification. Replaces rule-based detection with trained models.
 */

import * as tf from '@tensorflow/tfjs';
import { PoseResult, PoseLandmark } from './mediapipe';

// 🎯 ML DETECTION INTERFACES
export interface LSTMPrediction {
  phase: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  confidence: number;
  probabilities: number[];
  features: number[];
  timestamp: number;
}

export interface TrainingData {
  sequences: number[][][]; // [batch, sequence_length, features]
  labels: number[][];     // [batch, num_classes]
  metadata: {
    videoId: string;
    golferLevel: string;
    swingType: string;
    frameRate: number;
  };
}

export interface LSTMModelConfig {
  sequenceLength: number;
  featureCount: number;
  hiddenUnits: number;
  dropoutRate: number;
  learningRate: number;
  batchSize: number;
  epochs: number;
}

// 🚀 LSTM PHASE DETECTOR CLASS
export class LSTMPhaseDetector {
  private model: tf.LayersModel | null = null;
  private config: LSTMModelConfig;
  private featureBuffer: number[][] = [];
  private isModelLoaded = false;
  private trainingHistory: any[] = [];

  constructor(config: Partial<LSTMModelConfig> = {}) {
    this.config = {
      sequenceLength: 15,        // 15 frames for temporal context
      featureCount: 99,          // 33 landmarks × 3 features
      hiddenUnits: 128,          // LSTM hidden units
      dropoutRate: 0.3,          // Dropout for regularization
      learningRate: 0.001,       // Adam optimizer learning rate
      batchSize: 32,             // Training batch size
      epochs: 50,                // Training epochs
      ...config
    };
  }

  /**
   * Initialize the LSTM model
   */
  async initialize(): Promise<void> {
    try {
      console.log('🤖 LSTM DETECTOR: Initializing LSTM model...');
      
      // Try to load pre-trained model
      const modelPath = '/models/lstm-phase-detector.json';
      try {
        this.model = await tf.loadLayersModel(modelPath);
        this.isModelLoaded = true;
        console.log('✅ LSTM DETECTOR: Pre-trained model loaded');
      } catch (error) {
        console.log('🏗️ LSTM DETECTOR: Creating new LSTM model...');
        await this.createLSTMModel();
      }

    } catch (error) {
      console.error('❌ LSTM DETECTOR: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new LSTM model architecture
   */
  private async createLSTMModel(): Promise<void> {
    console.log('🏗️ LSTM DETECTOR: Building LSTM architecture...');
    
    const model = tf.sequential({
      layers: [
        // Input layer for pose sequences
        tf.layers.lstm({
          units: this.config.hiddenUnits,
          returnSequences: true,
          inputShape: [this.config.sequenceLength, this.config.featureCount],
          dropout: this.config.dropoutRate,
          recurrentDropout: this.config.dropoutRate,
          name: 'lstm_1'
        }),
        
        // Second LSTM layer for deeper temporal understanding
        tf.layers.lstm({
          units: this.config.hiddenUnits / 2,
          returnSequences: false,
          dropout: this.config.dropoutRate,
          recurrentDropout: this.config.dropoutRate,
          name: 'lstm_2'
        }),
        
        // Dense layers for feature extraction
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
          name: 'dense_1'
        }),
        
        tf.layers.dropout({ 
          rate: this.config.dropoutRate,
          name: 'dropout_1'
        }),
        
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          name: 'dense_2'
        }),
        
        // Output layer for 6 phase classes
        tf.layers.dense({
          units: 6,
          activation: 'softmax',
          name: 'phase_output'
        })
      ]
    });

    // Compile with professional ML settings
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });

    this.model = model;
    this.isModelLoaded = true;
    
    console.log('✅ LSTM DETECTOR: LSTM model created successfully');
    console.log('📊 LSTM DETECTOR: Model summary:', this.model.summary());
  }

  /**
   * Extract features from pose landmarks
   */
  private extractPoseFeatures(pose: PoseResult): number[] {
    if (!pose.landmarks || pose.landmarks.length === 0) {
      return new Array(this.config.featureCount).fill(0);
    }

    const features: number[] = [];
    
    // Extract normalized landmark coordinates and confidence
    for (let i = 0; i < 33; i++) {
      const landmark = pose.landmarks[i];
      if (landmark) {
        // Normalize coordinates to [0, 1]
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
   * Detect swing phase using LSTM model
   */
  async detectPhase(poses: PoseResult[], currentFrame: number): Promise<LSTMPrediction> {
    if (!this.isModelLoaded || !this.model) {
      throw new Error('LSTM model not initialized');
    }

    try {
      // Extract features for current pose
      const currentPose = poses[currentFrame];
      if (!currentPose) {
        throw new Error('No pose data for current frame');
      }

      const currentFeatures = this.extractPoseFeatures(currentPose);
      
      // Add to feature buffer
      this.featureBuffer.push(currentFeatures);
      
      // Maintain sequence length
      if (this.featureBuffer.length > this.config.sequenceLength) {
        this.featureBuffer.shift();
      }

      // Need minimum sequence for prediction
      if (this.featureBuffer.length < this.config.sequenceLength) {
        return this.createFallbackPrediction(currentFeatures);
      }

      // Prepare input tensor
      const inputTensor = tf.tensor3d([this.featureBuffer]);
      
      // Make prediction
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const predictionArray = await prediction.data();
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      // Map prediction to phase
      const phaseIndex = this.getPhaseIndex(predictionArray);
      const confidence = Math.max(...predictionArray);
      const phase = this.indexToPhase(phaseIndex);

      return {
        phase,
        confidence,
        probabilities: Array.from(predictionArray),
        features: currentFeatures,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ LSTM DETECTOR: Prediction failed:', error);
      throw error;
    }
  }

  /**
   * Train the LSTM model with professional golf data
   */
  async trainModel(trainingData: TrainingData[]): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      console.log('🎓 LSTM DETECTOR: Training model with professional data...');
      
      // Prepare training data
      const allSequences: number[][][] = [];
      const allLabels: number[][] = [];
      
      trainingData.forEach(data => {
        allSequences.push(...data.sequences);
        allLabels.push(...data.labels);
      });

      if (allSequences.length === 0) {
        throw new Error('No training data provided');
      }

      console.log(`📊 LSTM DETECTOR: Training on ${allSequences.length} sequences`);

      // Convert to tensors
      const featureTensor = tf.tensor3d(allSequences);
      const labelTensor = tf.tensor2d(allLabels);

      // Train the model
      const history = await this.model.fit(featureTensor, labelTensor, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`📈 LSTM DETECTOR: Epoch ${epoch + 1}/${this.config.epochs}`);
            console.log(`   Loss: ${logs?.loss?.toFixed(4)}`);
            console.log(`   Accuracy: ${logs?.acc?.toFixed(4)}`);
            console.log(`   Val Loss: ${logs?.val_loss?.toFixed(4)}`);
            console.log(`   Val Accuracy: ${logs?.val_acc?.toFixed(4)}`);
            
            this.trainingHistory.push({
              epoch: epoch + 1,
              loss: logs?.loss,
              accuracy: logs?.acc,
              valLoss: logs?.val_loss,
              valAccuracy: logs?.val_acc
            });
          }
        }
      });

      // Clean up tensors
      featureTensor.dispose();
      labelTensor.dispose();

      console.log('✅ LSTM DETECTOR: Training completed successfully');
      
      // Save the trained model
      await this.saveModel();
      
    } catch (error) {
      console.error('❌ LSTM DETECTOR: Training failed:', error);
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
   * Create fallback prediction for insufficient data
   */
  private createFallbackPrediction(features: number[]): LSTMPrediction {
    return {
      phase: 'address',
      confidence: 0.5,
      probabilities: [0.5, 0.1, 0.1, 0.1, 0.1, 0.1],
      features,
      timestamp: Date.now()
    };
  }

  /**
   * Save the trained model
   */
  private async saveModel(): Promise<void> {
    if (!this.model) return;
    
    try {
      // In production, save to server or local storage
      console.log('💾 LSTM DETECTOR: Model saved (simulated)');
      
      // For demo purposes, we'll simulate saving
      const modelData = await this.model.save('localstorage://lstm-phase-detector');
      console.log('✅ LSTM DETECTOR: Model saved successfully');
      
    } catch (error) {
      console.error('❌ LSTM DETECTOR: Failed to save model:', error);
    }
  }

  /**
   * Load pre-trained model
   */
  async loadModel(modelPath: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(modelPath);
      this.isModelLoaded = true;
      console.log('✅ LSTM DETECTOR: Model loaded from', modelPath);
    } catch (error) {
      console.error('❌ LSTM DETECTOR: Failed to load model:', error);
      throw error;
    }
  }

  /**
   * Get model statistics
   */
  getModelStats(): any {
    return {
      isLoaded: this.isModelLoaded,
      sequenceLength: this.config.sequenceLength,
      featureCount: this.config.featureCount,
      hiddenUnits: this.config.hiddenUnits,
      trainingHistory: this.trainingHistory
    };
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.featureBuffer = [];
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
 * Create training data from swing sequences
 */
export function createTrainingData(
  poses: PoseResult[], 
  phases: string[], 
  metadata: any = {}
): TrainingData {
  const sequences: number[][][] = [];
  const labels: number[][] = [];
  
  // Create overlapping sequences
  for (let i = this.config.sequenceLength; i < poses.length; i++) {
    const sequence = poses.slice(i - this.config.sequenceLength, i);
    const sequenceFeatures = sequence.map(pose => extractPoseFeatures(pose));
    const phaseIndex = phases[i] ? phaseToIndex(phases[i]) : 0;
    
    sequences.push(sequenceFeatures);
    labels.push(oneHotEncode(phaseIndex));
  }
  
  return {
    sequences,
    labels,
    metadata: {
      videoId: metadata.videoId || 'unknown',
      golferLevel: metadata.golferLevel || 'amateur',
      swingType: metadata.swingType || 'full',
      frameRate: metadata.frameRate || 30,
      ...metadata
    }
  };
}

/**
 * Extract pose features for training
 */
function extractPoseFeatures(pose: PoseResult): number[] {
  if (!pose.landmarks || pose.landmarks.length === 0) {
    return new Array(99).fill(0);
  }

  const features: number[] = [];
  
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
 * Convert phase name to index
 */
function phaseToIndex(phase: string): number {
  const phases = ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through'];
  return phases.indexOf(phase);
}

/**
 * One-hot encode phase index
 */
function oneHotEncode(index: number): number[] {
  const encoded = new Array(6).fill(0);
  encoded[index] = 1;
  return encoded;
}

/**
 * Create a new LSTM phase detector
 */
export function createLSTMPhaseDetector(config?: Partial<LSTMModelConfig>): LSTMPhaseDetector {
  return new LSTMPhaseDetector(config);
}

export default LSTMPhaseDetector;
