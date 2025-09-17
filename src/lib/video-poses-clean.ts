// Clean video-poses.ts without MediaPipe - using only TensorFlow.js
import { PoseResult } from './mediapipe';

export interface VideoToPoseOptions {
  sampleFps?: number;
  maxFrames?: number;
  minConfidence?: number;
  qualityThreshold?: number;
}

export type VideoPosesProgress = (step: string, progress: number, frame?: number, totalFrames?: number) => void;

// Main function - uses only TensorFlow.js (MoveNet)
export async function extractPosesFromVideo(
  file: File,
  options: VideoToPoseOptions = {},
  onProgress?: VideoPosesProgress
): Promise<PoseResult[]> {
  console.log('🔍 POSE DETECTION: Starting TensorFlow.js pose detection...');
  console.log('🔍 POSE DETECTION: File:', file.name, 'Size:', file.size, 'bytes');
  
  try {
    console.log('🔄 POSE DETECTION: Loading TensorFlow.js (MoveNet)...');
    const { detectPosesWithAlternatives } = await import('./alternative-pose-detection');
    
    const poses = await detectPosesWithAlternatives(file, options, onProgress);
    
    if (poses && poses.length > 0) {
      console.log('✅ POSE DETECTION: TensorFlow.js succeeded with real data!');
      return poses;
    } else {
      throw new Error('No poses detected');
    }
  } catch (error) {
    console.error('❌ POSE DETECTION: TensorFlow.js failed:', error);
    throw error;
  }
}

// Utility function to validate pose data
export function validatePoseData(poses: PoseResult[]): boolean {
  if (!poses || poses.length === 0) {
    return false;
  }
  
  const firstPose = poses[0];
  if (!firstPose.landmarks || firstPose.landmarks.length === 0) {
    return false;
  }
  
  // Check if landmarks have realistic values (not all 0.5, 0.5)
  const hasRealisticValues = firstPose.landmarks.some(
    (lm) => lm.x !== 0.5 || lm.y !== 0.5 || (lm.visibility && lm.visibility > 0.1)
  );
  
  return hasRealisticValues;
}

// Utility function to get pose statistics
export function getPoseStatistics(poses: PoseResult[]): {
  totalPoses: number;
  averageConfidence: number;
  validPoses: number;
  qualityScore: number;
} {
  if (!poses || poses.length === 0) {
    return { totalPoses: 0, averageConfidence: 0, validPoses: 0, qualityScore: 0 };
  }
  
  // Calculate quality based on landmark visibility instead of confidence
  const validPoses = poses.filter(p => {
    if (!p.landmarks || p.landmarks.length === 0) return false;
    const visibleLandmarks = p.landmarks.filter(lm => lm.visibility && lm.visibility > 0.1);
    return visibleLandmarks.length > 10; // At least 10 visible landmarks
  });
  
  const averageVisibility = poses.reduce((sum, p) => {
    if (!p.landmarks || p.landmarks.length === 0) return sum;
    const avgVis = p.landmarks.reduce((visSum, lm) => visSum + (lm.visibility || 0), 0) / p.landmarks.length;
    return sum + avgVis;
  }, 0) / poses.length;
  
  const qualityScore = Math.min(100, (validPoses.length / poses.length) * 100);
  
  return {
    totalPoses: poses.length,
    averageConfidence: Math.round(averageVisibility * 100) / 100,
    validPoses: validPoses.length,
    qualityScore: Math.round(qualityScore)
  };
}
