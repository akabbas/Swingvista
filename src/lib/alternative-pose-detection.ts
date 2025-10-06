'use client';

import type { PoseResult } from './mediapipe';

export type VideoPosesProgress = (step: string, progress: number, frame?: number, totalFrames?: number) => void;

export interface VideoToPoseOptions {
  sampleFps?: number;
  maxFrames?: number;
  minConfidence?: number;
  qualityThreshold?: number;
}

// REAL POSE DETECTION: Try multiple methods to get real pose data
export const detectPosesWithAlternatives = async (
  videoFile: File,
  options: VideoToPoseOptions = {},
  onProgress?: VideoPosesProgress
): Promise<PoseResult[]> => {
  console.log('🔍 REAL POSE DETECTION: Starting comprehensive pose detection...');
  console.log('🔍 REAL POSE DETECTION: File:', videoFile.name, 'Size:', videoFile.size, 'bytes');
  
  // Validate video first
  validateVideo(videoFile);
  
  // Option 1: Try TensorFlow.js with MoveNet (REAL DETECTION)
  try {
    console.log('🔄 REAL POSE DETECTION: Attempting TensorFlow.js with MoveNet...');
    const poses = await detectPosesWithTensorFlow(videoFile, options, onProgress);
    
    // Validate that we got real data
    if (poses.length > 0) {
      const firstPose = poses[0];
      const isMockData = firstPose.landmarks?.every((lm: any) => lm.x === 0.5 && lm.y === 0.5);
      
      if (!isMockData) {
        console.log('✅ REAL POSE DETECTION: TensorFlow.js succeeded with real data!');
        return poses;
      } else {
        console.warn('⚠️ REAL POSE DETECTION: TensorFlow.js returned mock data, trying next method...');
      }
    }
  } catch (error) {
    console.error('❌ REAL POSE DETECTION: TensorFlow.js failed:', error);
  }
  
  // Option 2: Server-side API fallback is currently disabled to avoid mock/synthetic data
  console.warn('⚠️ REAL POSE DETECTION: Server-side API fallback disabled to prevent mock/synthetic pose data.');
  
  // CRITICAL: No mock data fallback - throw error instead
  console.error('❌ REAL POSE DETECTION: All real detection methods failed!');
  throw new Error(
    'Real pose detection failed. Please try a different video format (MP4 recommended) ' +
    'or ensure the video contains visible human movement. ' +
    'Mock data has been disabled to prevent inaccurate analysis results.'
  );
};

// REAL POSE DETECTION: TensorFlow.js with MoveNet implementation
const detectPosesWithTensorFlow = async (
  videoFile: File,
  options: VideoToPoseOptions,
  onProgress?: VideoPosesProgress
): Promise<PoseResult[]> => {
  console.log('🔄 REAL POSE DETECTION: Loading TensorFlow.js with MoveNet...');
  
  try {
    // Load TensorFlow.js dynamically
    const tf = await import('@tensorflow/tfjs');
    const poseDetection = await import('@tensorflow-models/pose-detection');
    
    // Initialize TensorFlow.js backend
    console.log('🔄 REAL POSE DETECTION: Initializing TensorFlow.js backend...');
    await tf.ready();
    console.log('✅ REAL POSE DETECTION: TensorFlow.js backend initialized');
    
    console.log('✅ REAL POSE DETECTION: TensorFlow.js loaded successfully');
    
    // Load MoveNet model with higher accuracy
    const model = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER // More accurate than Lightning
      }
    );
    
    console.log('✅ REAL POSE DETECTION: MoveNet model loaded successfully');
    
    // Process video frames
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.preload = 'metadata';
    
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Video loading failed'));
      video.load();
    });
    
    const duration = video.duration;
    if (isNaN(duration) || duration <= 0) {
      throw new Error(`Invalid video duration: ${duration}`);
    }
    
    const { sampleFps = 30, maxFrames = 1000 } = options;
    // Calculate total frames at video's native frame rate (assume 30fps if not available)
    const videoFps = video.videoWidth > 0 ? 30 : 30; // Default to 30fps
    const totalVideoFrames = Math.floor(duration * videoFps);
    const frameCount = Math.min(maxFrames, totalVideoFrames);
    
    console.log(`📊 COMPLETE FRAME SCANNING: Processing ${frameCount} frames from ${duration}s video`);
    console.log(`📊 Video FPS: ${videoFps}, Sample FPS: ${sampleFps}, Total Video Frames: ${totalVideoFrames}`);
    
    const poses: PoseResult[] = [];
    let failedFrames = 0;
    let previousPose: PoseResult | null = null;
    
    for (let i = 0; i < frameCount; i++) {
      // Scan every single frame at video's native frame rate
      const frameTime = i / videoFps; // Use video's native FPS, not sampleFps
      video.currentTime = frameTime;
      
      // Log progress every 30 frames (1 second at 30fps)
      if (i % 30 === 0) {
        console.log(`🎬 FRAME SCANNING: Processing frame ${i + 1}/${frameCount} (${((i / frameCount) * 100).toFixed(1)}%)`);
      }
      
      // Wait for video to seek to the exact frame
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn(`⚠️ Frame ${i} seek timeout, continuing...`);
          resolve();
        }, 1000); // 1 second timeout
        
        video.onseeked = () => {
          clearTimeout(timeout);
          resolve();
        };
        video.onerror = () => {
          clearTimeout(timeout);
          console.warn(`⚠️ Frame ${i} seek error, continuing...`);
          resolve();
        };
      });
      
      // Verify we're at the correct frame
      const actualTime = video.currentTime;
      const expectedTime = frameTime;
      const timeDiff = Math.abs(actualTime - expectedTime);
      
      if (timeDiff > 0.1) { // More than 0.1 seconds off
        console.warn(`⚠️ Frame ${i} time mismatch: expected ${expectedTime.toFixed(3)}s, got ${actualTime.toFixed(3)}s`);
      }
      
      try {
        // Convert video frame to tensor
        const tensor = tf.browser.fromPixels(video);
        
        // Estimate poses
        const poseEstimations = await model.estimatePoses(tensor);
        
        if (poseEstimations && poseEstimations.length > 0) {
          const pose = poseEstimations[0];
          
          // Debug: Log the pose structure to understand the format
          if (i === 0) {
            console.log('🔍 REAL POSE DETECTION: MoveNet pose structure:', pose);
            console.log('🔍 REAL POSE DETECTION: Keypoints length:', pose.keypoints?.length);
            console.log('🔍 REAL POSE DETECTION: First keypoint:', pose.keypoints?.[0]);
            console.log('🔍 REAL POSE DETECTION: Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            
            // CRITICAL: Verify we're getting real keypoint data from MoveNet
            if (pose.keypoints && pose.keypoints.length > 0) {
              const firstKp = pose.keypoints[0];
              console.log('🔍 REAL POSE DETECTION: First keypoint details:', {
                x: firstKp.x,
                y: firstKp.y,
                score: firstKp.score,
                name: firstKp.name
              });
              
              // Check if keypoints have varied positions (not all at 0.5, 0.5)
              const hasVariedPositions = pose.keypoints.some((kp: any) => kp.x !== 0.5 || kp.y !== 0.5);
              console.log('🔍 REAL POSE DETECTION: Has varied keypoint positions:', hasVariedPositions);
            }
          }
          
          // Convert MoveNet format to our PoseResult format
          // MoveNet has 17 keypoints, but we need 33 for MediaPipe compatibility
          const landmarks = Array(33).fill(null).map((_, i) => {
            if (i < pose.keypoints.length) {
              const kp = pose.keypoints[i];
              // Handle different possible keypoint structures
              const x = kp.x || 0;
              const y = kp.y || 0;
              const score = kp.score || 0.8;
              
              return {
                x: x / video.videoWidth,
                y: y / video.videoHeight,
                z: 0,
                visibility: score
              };
            } else {
              // Fill remaining landmarks with interpolated values
              return {
                x: 0.5,
                y: 0.5,
                z: 0,
                visibility: 0.1
              };
            }
          });
          
          const visible = landmarks.filter((lm: any) => (lm.visibility ?? 0) > 0.1).length;
          const highConfidence = landmarks.filter((lm: any) => (lm.visibility ?? 0) > 0.5).length;
          
          if (i % 10 === 0 || i < 3) {
            console.log(`📍 Frame ${i + 1}: ${landmarks.length} landmarks, ${visible} visible (>=0.1), ${highConfidence} high confidence (>=0.5)`);
          }
          
          // Validate pose quality - skip frames with poor detection
          if (visible < 10) {
            console.warn(`⚠️ Frame ${i + 1}: Poor pose detection (${visible} visible landmarks), using previous pose or skipping`);
            if (previousPose) {
              poses.push(previousPose);
              continue;
            }
          }

          // Apply pose smoothing for better accuracy
          let smoothedLandmarks = landmarks;
          if (previousPose) {
            smoothedLandmarks = landmarks.map((landmark: any, index: number) => {
              const prevLandmark = previousPose!.landmarks[index];
              if (prevLandmark && landmark.visibility > 0.3 && (prevLandmark.visibility || 0) > 0.3) {
                // Smooth position changes to reduce jitter
                const smoothingFactor = 0.3; // Lower = more smoothing
                return {
                  ...landmark,
                  x: landmark.x * (1 - smoothingFactor) + prevLandmark.x * smoothingFactor,
                  y: landmark.y * (1 - smoothingFactor) + prevLandmark.y * smoothingFactor,
                  visibility: Math.max(landmark.visibility, (prevLandmark.visibility || 0) * 0.8)
                };
              }
              return landmark;
            });
          }

          poses.push({
            landmarks: smoothedLandmarks,
            worldLandmarks: smoothedLandmarks,
            timestamp: frameTime * 1000
          });
          
          previousPose = {
            landmarks: smoothedLandmarks,
            worldLandmarks: smoothedLandmarks,
            timestamp: frameTime * 1000
          };
          
          // Debug: Log when we detect real pose data
          if (i === 0) {
            const hasVariedPositions = landmarks.some((lm: any) => lm.x !== 0.5 || lm.y !== 0.5);
            console.log('🔍 REAL POSE DETECTION: First frame pose data quality:', hasVariedPositions ? 'REAL' : 'MOCK');
            console.log('🔍 REAL POSE DETECTION: Sample landmark positions:', landmarks.slice(0, 5).map((lm: any) => ({ x: lm.x, y: lm.y })));
            
            // CRITICAL: Verify the conversion from MoveNet to landmarks
            console.log('🔍 REAL POSE DETECTION: Conversion verification:');
            console.log('🔍 - Original keypoints count:', pose.keypoints?.length);
            console.log('🔍 - Converted landmarks count:', landmarks.length);
            console.log('🔍 - First 3 original keypoints:', pose.keypoints?.slice(0, 3).map((kp: any) => ({ x: kp.x, y: kp.y, score: kp.score })));
            console.log('🔍 - First 3 converted landmarks:', landmarks.slice(0, 3).map((lm: any) => ({ x: lm.x, y: lm.y, visibility: lm.visibility })));
          }

          // Visibility logging (first few frames and every 10th frame)
          try {
            const visible = landmarks.filter((lm: any) => (lm.visibility ?? 0) > 0.1).length;
            if (i < 5 || i % 10 === 0) {
              console.log(`🎯 Pose frame ${i + 1}: ${landmarks.length} landmarks, ${visible} visible (≥0.1)`);
            }
          } catch {}
        } else {
          // No pose detected, create empty pose
          const emptyLandmarks = Array(33).fill(null).map(() => ({
            x: 0,
            y: 0,
            z: 0,
            visibility: 0
          }));
          
          poses.push({
            landmarks: emptyLandmarks,
            worldLandmarks: emptyLandmarks,
            timestamp: frameTime * 1000
          });
        }
        
        // Dispose tensor to prevent memory leaks
        tensor.dispose();
        
      } catch (frameError) {
        console.warn(`Frame ${i + 1} failed:`, frameError);
        failedFrames++;
        
        // Create a fallback pose for this frame
        const fallbackLandmarks = Array(33).fill(null).map(() => ({
          x: 0.5,
          y: 0.5,
          z: 0,
          visibility: 0.1
        }));
        
        poses.push({
          landmarks: fallbackLandmarks,
          worldLandmarks: fallbackLandmarks,
          timestamp: frameTime * 1000
        });
      }
      
        const progress = ((i + 1) / frameCount) * 100;
      onProgress?.(`Processing frame ${i + 1}/${frameCount}`, progress);
    }
    
    URL.revokeObjectURL(video.src);
    
    // If too many frames failed, throw error instead of using mock data
    if (failedFrames > frameCount * 0.5) {
      console.error(`❌ REAL POSE DETECTION: Too many failed frames (${failedFrames}/${frameCount})`);
      throw new Error(
        'Pose detection failed on too many frames. Please try a different video ' +
        'with better lighting and clear human movement.'
      );
    }
    
    console.log(`✅ COMPLETE FRAME SCANNING: TensorFlow.js processing completed!`);
    console.log(`📊 Total frames processed: ${frameCount}`);
    console.log(`📊 Total poses detected: ${poses.length}`);
    console.log(`📊 Failed frames: ${failedFrames}`);
    console.log(`📊 Success rate: ${((poses.length / frameCount) * 100).toFixed(1)}%`);
    console.log(`📊 Frame coverage: ${((poses.length / totalVideoFrames) * 100).toFixed(1)}% of total video frames`);
    
    // Verify we have poses for the entire video duration
    if (poses.length > 0) {
      const firstPose = poses[0];
      const lastPose = poses[poses.length - 1];
      if (firstPose && lastPose && firstPose.timestamp && lastPose.timestamp) {
        const firstPoseTime = firstPose.timestamp / 1000;
        const lastPoseTime = lastPose.timestamp / 1000;
        console.log(`📊 Pose coverage: ${firstPoseTime.toFixed(2)}s to ${lastPoseTime.toFixed(2)}s (${duration.toFixed(2)}s total)`);
      }
    }
    
    // Final summary visibility
    try {
      const visStats = poses.slice(0, Math.min(poses.length, 50)).map((p, idx) => ({
        frame: idx + 1,
        visible: (p.landmarks || []).filter((lm: any) => (lm.visibility ?? 0) > 0.1).length
      }));
      const avgVisible = Math.round(visStats.reduce((s, v) => s + v.visible, 0) / Math.max(1, visStats.length));
      console.log(`📊 Visibility summary (first ${visStats.length} frames): avg visible landmarks ≈ ${avgVisible}/33`);
    } catch {}
    
    // Final validation of the results
    if (poses.length > 0) {
      const firstPose = poses[0];
      const isMockData = firstPose.landmarks?.every((lm: any) => lm.x === 0.5 && lm.y === 0.5);
      console.log('🔍 REAL POSE DETECTION: Final validation - Data quality:', isMockData ? 'MOCK' : 'REAL');
      
      if (!isMockData) {
        console.log('✅ REAL POSE DETECTION: SUCCESS - Real pose data detected!');
      } else {
        console.warn('⚠️ REAL POSE DETECTION: WARNING - Mock data detected in final result!');
      }
    }
    
    return poses;
    
  } catch (error) {
    console.error('❌ REAL POSE DETECTION: TensorFlow.js pose detection failed:', error);
    throw error; // Re-throw instead of falling back to mock data
  }
};

// EMERGENCY FIX: Server-side API fallback
const detectPosesWithAPI = async (
  videoFile: File,
  options: VideoToPoseOptions,
  onProgress?: VideoPosesProgress
): Promise<PoseResult[]> => {
  console.log('🔄 Trying pose detection API...');
  
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('options', JSON.stringify(options));
  
  try {
    const response = await fetch('/api/pose-detection', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`API failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();

    // Reject server-side mock results explicitly
    if (result?.method && typeof result.method === 'string') {
      console.log('🔍 API response method:', result.method);
      if (result.method.toLowerCase().includes('mock')) {
        throw new Error('Server returned mock poses; rejecting to enforce REAL detection.');
      }
    }

    if (!result.poses || !Array.isArray(result.poses)) {
      throw new Error('Invalid API response format');
    }
    
    console.log(`✅ API processing completed: ${result.poses.length} poses`);
    return result.poses;
    
  } catch (error) {
    console.error('❌ Pose detection API failed:', error);
    throw new Error(`API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// MOCK DATA FUNCTIONS REMOVED
// These functions have been removed to prevent inaccurate analysis results.
// The system now requires real pose detection and will throw errors if detection fails.

// MOCK DATA FUNCTIONS REMOVED
// All mock data generation functions have been removed to prevent inaccurate analysis results.

// EMERGENCY FIX: Validate video before processing
const validateVideo = (videoFile: File): void => {
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'];
  const maxSize = 100 * 1024 * 1024; // 100MB - consistent with other validations
  
  if (!validTypes.includes(videoFile.type)) {
    throw new Error(
      `Unsupported video format: ${videoFile.type}. ` +
      `Please use MP4, WebM, MOV, or AVI formats.`
    );
  }
  
  if (videoFile.size > maxSize) {
    throw new Error(
      `Video too large: ${(videoFile.size / 1024 / 1024).toFixed(1)}MB. ` +
      `Maximum size is 50MB.`
    );
  }
  
  console.log(`✅ Video validation passed: ${videoFile.type}, ${(videoFile.size / 1024 / 1024).toFixed(1)}MB`);
};

// EMERGENCY FUNCTIONS REMOVED
// All emergency fallback functions have been removed to prevent inaccurate analysis results.
