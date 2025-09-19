/**
 * Unified Golf Swing Analysis System
 * 
 * This is the single source of truth for golf swing analysis.
 * Consolidates all analysis methods into one reliable system.
 */

import { PoseResult } from './mediapipe';
import { analyzeRealGolfSwing, RealGolfAnalysis } from './real-golf-analysis';
import { extractPosesFromVideo } from './video-poses';

export interface UnifiedAnalysisResult {
  success: boolean;
  analysis?: RealGolfAnalysis;
  error?: string;
  processingTime: number;
  poseCount: number;
  videoInfo: {
    name: string;
    size: number;
    duration?: number;
  };
}

/**
 * Main analysis function - single entry point for all golf swing analysis
 */
export async function analyzeGolfSwing(
  videoInput: File | string,
  onProgress?: (step: string, progress: number) => void
): Promise<UnifiedAnalysisResult> {
  const startTime = Date.now();
  
  try {
    console.log('🏌️ UNIFIED ANALYSIS: Starting golf swing analysis...');
    
    // Handle both File objects and video URLs
    if (typeof videoInput === 'string') {
      console.log('🏌️ UNIFIED ANALYSIS: Video URL:', videoInput);
      // For sample videos, we'll need to fetch the video and create a File object
      const response = await fetch(videoInput);
      const blob = await response.blob();
      const videoFile = new File([blob], 'sample-video.mp4', { type: 'video/mp4' });
      console.log('🏌️ UNIFIED ANALYSIS: Created file from URL:', videoFile.name, 'Size:', videoFile.size);
      return analyzeGolfSwing(videoFile, onProgress);
    } else {
      console.log('🏌️ UNIFIED ANALYSIS: File:', videoInput.name, 'Size:', videoInput.size);
    }
    
    // Step 1: Extract poses from video
    onProgress?.('Extracting poses from video...', 10);
    const poses = await extractPosesFromVideo(videoInput, {
      sampleFps: 20,
      maxFrames: 200,
      minConfidence: 0.4,
      qualityThreshold: 0.3
    }, (progress) => {
      onProgress?.(progress.step, 10 + (progress.progress * 0.3));
    });
    
    console.log('🏌️ UNIFIED ANALYSIS: Extracted poses:', poses.length);
    
    if (poses.length < 10) {
      throw new Error('Could not detect enough pose frames. Try a clearer video with better lighting.');
    }
    
    // Step 2: Perform comprehensive analysis
    onProgress?.('Analyzing golf swing...', 40);
    const analysis = await analyzeRealGolfSwing(poses, videoInput.name || 'sample-video.mp4');
    
    console.log('🏌️ UNIFIED ANALYSIS: Analysis complete!');
    console.log('🏌️ UNIFIED ANALYSIS: Grade:', analysis.letterGrade, 'Score:', analysis.overallScore);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      analysis: {
        ...analysis,
        poses: poses // Include the actual pose data
      },
      processingTime,
      poseCount: poses.length,
      videoInfo: {
        name: videoInput.name || 'sample-video.mp4',
        size: videoInput.size || 0
      }
    };
    
  } catch (error) {
    console.error('❌ UNIFIED ANALYSIS: Analysis failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processingTime,
      poseCount: 0,
      videoInfo: {
        name: videoInput.name || 'sample-video.mp4',
        size: videoInput.size || 0
      }
    };
  }
}

/**
 * Validate video file before analysis
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported video format. Please use MP4, MOV, AVI, or WebM.'
    };
  }
  
  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Video file too large. Please use a file smaller than 100MB.'
    };
  }
  
  // Check minimum size (at least 1MB)
  const minSize = 1024 * 1024; // 1MB
  if (file.size < minSize) {
    return {
      valid: false,
      error: 'Video file too small. Please use a larger video file.'
    };
  }
  
  return { valid: true };
}

/**
 * Get analysis status for UI display
 */
export function getAnalysisStatus(progress: number): string {
  if (progress < 10) return 'Preparing analysis...';
  if (progress < 40) return 'Extracting poses from video...';
  if (progress < 70) return 'Analyzing golf swing...';
  if (progress < 90) return 'Generating AI feedback...';
  if (progress < 100) return 'Finalizing results...';
  return 'Analysis complete!';
}

/**
 * Format analysis results for display
 */
export function formatAnalysisResults(analysis: RealGolfAnalysis) {
  return {
    grade: analysis.letterGrade,
    score: analysis.overallScore,
    confidence: Math.round(analysis.confidence * 100),
    metrics: {
      tempo: analysis.metrics.tempo,
      rotation: analysis.metrics.rotation,
      weightTransfer: analysis.metrics.weightTransfer,
      swingPlane: analysis.metrics.swingPlane,
      clubPath: analysis.metrics.clubPath,
      impact: analysis.metrics.impact,
      bodyAlignment: analysis.metrics.bodyAlignment,
      followThrough: analysis.metrics.followThrough
    },
    feedback: analysis.feedback,
    keyImprovements: analysis.keyImprovements,
    aiInsights: analysis.aiInsights,
    professionalAIFeedback: analysis.professionalAIFeedback,
    phases: analysis.phases,
    visualizations: analysis.visualizations
  };
}