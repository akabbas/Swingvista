'use client';

import { MediaPipePoseDetector, PoseResult } from './mediapipe';

export type VideoPosesProgress = (step: string, progress: number) => void;

export interface VideoToPoseOptions {
  sampleFps?: number;
  maxFrames?: number;
  minConfidence?: number;
  qualityThreshold?: number;
}

/**
 * Extract pose landmarks from a local video file using MediaPipe Pose in the browser.
 * Prioritizes requestVideoFrameCallback when available; falls back to time-based seeking otherwise.
 */
export async function extractPosesFromVideo(
  file: File,
  options: VideoToPoseOptions = {},
  onProgress?: VideoPosesProgress
): Promise<PoseResult[]> {
  const { sampleFps = 30, maxFrames, minConfidence = 0.7, qualityThreshold = 0.6 } = options;
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = objectUrl;
  video.muted = true;
  (video as any).playsInline = true;
  video.preload = 'auto';

  await waitForEvent(video, 'loadedmetadata');
  const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;

  // Use singleton detector to prevent memory leaks
  const detector = MediaPipePoseDetector.getInstance();
  await detector.initialize();

  // Implement memory limits for pose data
  const MAX_POSES = maxFrames || 600; // Limit to prevent memory issues
  const poses: PoseResult[] = [];
  const qualityWarnings: string[] = [];
  
  // Validate video duration and size
  if (duration > 20) {
    throw new Error('Video is too long. Please use a video under 20 seconds.');
  }

  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > 50) {
    throw new Error('Video file is too large. Please use a video under 50MB.');
  }

  // Initialize MediaPipe with timeout
  console.log('Initializing MediaPipe...');
  const initTimeoutMs = 10000; // 10 second timeout for initialization
  const initPromise = Promise.race([
    detector.initialize(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('MediaPipe initialization timed out. Please refresh and try again.')), initTimeoutMs))
  ]);

  try {
    await initPromise;
    console.log('MediaPipe initialized successfully');
  } catch (error) {
    console.error('MediaPipe initialization failed:', error);
    throw new Error('Failed to initialize video processing. Please refresh and try again.');
  }

  // Add frame processing timeout
  const frameTimeoutMs = Math.max(15000, duration * 1000 + 5000); // 15s minimum or video duration + 5s
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      console.error(`Frame processing timeout after ${frameTimeoutMs}ms for ${duration}s video`);
      reject(new Error('Video processing is taking too long. Please try again or use a shorter video.'));
    }, frameTimeoutMs);
  });

  try {
    // Race between video processing and timeout
    const processVideo = async () => {
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        console.log('Using modern video frame callback');
        // Modern path: process frames while playing
        video.currentTime = 0;
        try {
          await video.play();
          console.log('Video playback started');
        } catch (error) {
          console.error('Video playback failed:', error);
          // Continue even if autoplay fails - we can still process frames
        }

      let lastProcessedMediaTime = -1;
      const minDelta = 1 / sampleFps;
      let isStopped = false;

      await new Promise<void>((resolve) => {
        const handler = async (_now: number, metadata: any) => {
          if (isStopped) return;
          const mediaTime: number = (metadata && typeof metadata.mediaTime === 'number') ? metadata.mediaTime : video.currentTime;

          const shouldProcess = lastProcessedMediaTime < 0 || (mediaTime - lastProcessedMediaTime) >= minDelta;
          const withinFrameLimit = poses.length < MAX_POSES;
          
          if (shouldProcess) {
            console.log(`Processing frame at ${mediaTime.toFixed(2)}s (${poses.length + 1}/${MAX_POSES})`);
          }

          if (shouldProcess && withinFrameLimit) {
        const result = await detector.detectPose(video);
        if (result && isPoseQualityGood(result, minConfidence, qualityThreshold)) {
          // Override timestamp with mediaTime in ms for consistency
          result.timestamp = Math.round(mediaTime * 1000);
          poses.push(result);
        } else if (result) {
          // Log quality issues for user feedback
          const quality = assessPoseQuality(result, minConfidence);
          if (quality?.score && quality.score < qualityThreshold) {
            qualityWarnings.push(`Frame ${poses.length}: ${quality.issues?.join(', ') ?? 'Unknown quality issues'}`);
          }
        }
            lastProcessedMediaTime = mediaTime;

            const progress = duration > 0 ? Math.min(99, (mediaTime / duration) * 100) : Math.min(99, poses.length);
            onProgress?.('Reading video frames...', progress);
          }

          if (video.ended || poses.length >= MAX_POSES) {
            isStopped = true;
            video.pause();
            resolve();
            return;
          }

          (video as any).requestVideoFrameCallback(handler);
        };

        (video as any).requestVideoFrameCallback(handler);
      });
    } else {
      // Fallback path: seek in fixed increments
      const step = 1 / sampleFps;
      for (let t = 0; t <= duration; t += step) {
        if (poses.length >= MAX_POSES) break;
        // Guard against NaN duration videos
        if (!(duration > 0)) break;
        video.currentTime = t;
        await waitForSeeked(video);
        const result = await detector.detectPose(video);
        if (result && isPoseQualityGood(result, minConfidence, qualityThreshold)) {
          result.timestamp = Math.round(t * 1000);
          poses.push(result);
        } else if (result) {
          const quality = assessPoseQuality(result, minConfidence);
          if (quality?.score && quality.score < qualityThreshold) {
            qualityWarnings.push(`Frame ${poses.length}: ${quality.issues?.join(', ') ?? 'Unknown quality issues'}`);
          }
        }
        const progress = Math.min(99, (t / duration) * 100);
        onProgress?.('Reading video frames...', progress);
      }
    }
  } finally {
    // Clean up resources properly
    clearTimeout(timeoutHandle);
    detector.destroy();
    URL.revokeObjectURL(objectUrl);
    video.src = '';
    video.remove();
  }

  // Process video and handle timeout
  await Promise.race([processVideo(), timeoutPromise]);

  onProgress?.('Frames captured', 100);

  // Filter out any accidental nulls and ensure we have enough frames for analysis pipeline
  const valid = poses.filter(Boolean);
  
  // Add quality assessment to the result
  (valid as any).qualityWarnings = qualityWarnings;
  (valid as any).recordingAngle = detectRecordingAngle(valid);
  (valid as any).overallQuality = assessOverallQuality(valid);
  
  return valid;
}

function waitForEvent(target: HTMLMediaElement, eventName: string): Promise<void> {
  return new Promise((resolve) => {
    const onEvent = () => {
      target.removeEventListener(eventName, onEvent);
      resolve();
    };
    target.addEventListener(eventName, onEvent, { once: true });
  });
}

function waitForSeeked(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked, { once: true });
  });
}

function isPoseQualityGood(pose: PoseResult, minConfidence: number, qualityThreshold: number): boolean {
  const quality = assessPoseQuality(pose, minConfidence);
  return quality.score >= qualityThreshold;
}

function assessPoseQuality(pose: PoseResult, minConfidence: number): { score: number; issues: string[] } {
  const issues: string[] = [];
  let totalScore = 0;
  let validLandmarks = 0;
  
  // Critical landmarks for golf swing analysis
  const criticalLandmarks = [11, 12, 13, 14, 15, 16, 23, 24]; // shoulders, arms, hips
  
  for (const index of criticalLandmarks) {
    const landmark = pose.landmarks[index];
    if (landmark && landmark.visibility && landmark.visibility > minConfidence) {
      totalScore += landmark.visibility;
      validLandmarks++;
    } else {
      issues.push(`Landmark ${index} (${getLandmarkName(index)}) not visible`);
    }
  }
  
  const avgScore = validLandmarks > 0 ? totalScore / validLandmarks : 0;
  
  // Check for reasonable body proportions (golf-specific)
  if (validLandmarks >= 4) {
    const shoulderWidth = calculateDistance(pose.landmarks[11], pose.landmarks[12]);
    const hipWidth = calculateDistance(pose.landmarks[23], pose.landmarks[24]);
    
    if (shoulderWidth > 0 && hipWidth > 0) {
      const ratio = shoulderWidth / hipWidth;
      if (ratio < 0.5 || ratio > 2.0) {
        issues.push('Unrealistic body proportions detected');
      }
    }
  }
  
  return { score: avgScore, issues };
}

function detectRecordingAngle(poses: PoseResult[]): string {
  if (poses.length === 0) return 'unknown';
  
  // Use first few frames to determine angle
  const sampleFrames = poses.slice(0, Math.min(5, poses.length));
  let totalShoulderAngle = 0;
  let validFrames = 0;
  
  for (const pose of sampleFrames) {
    const leftShoulder = pose.landmarks[11];
    const rightShoulder = pose.landmarks[12];
    
    if (leftShoulder && rightShoulder && 
        leftShoulder.visibility && leftShoulder.visibility > 0.7 &&
        rightShoulder.visibility && rightShoulder.visibility > 0.7) {
      
      const angle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      );
      totalShoulderAngle += angle;
      validFrames++;
    }
  }
  
  if (validFrames === 0) return 'unknown';
  
  const avgAngle = totalShoulderAngle / validFrames;
  const degrees = Math.abs(avgAngle * 180 / Math.PI);
  
  if (degrees < 20) return 'face-on';
  if (degrees > 70) return 'down-the-line';
  return 'angled';
}

function assessOverallQuality(poses: PoseResult[]): { score: number; recommendations: string[] } {
  const recommendations: string[] = [];
  let totalScore = 0;
  
  for (const pose of poses) {
    const quality = assessPoseQuality(pose, 0.5);
    totalScore += quality.score;
  }
  
  const avgScore = poses.length > 0 ? totalScore / poses.length : 0;
  
  if (avgScore < 0.6) {
    recommendations.push('Consider recording in better lighting');
    recommendations.push('Ensure full body is visible in frame');
    recommendations.push('Try recording from face-on or down-the-line angle');
  } else if (avgScore < 0.8) {
    recommendations.push('Good quality - minor improvements possible');
  } else {
    recommendations.push('Excellent recording quality');
  }
  
  return { score: avgScore, recommendations };
}

function getLandmarkName(index: number): string {
  const names: { [key: number]: string } = {
    11: 'left-shoulder', 12: 'right-shoulder',
    13: 'left-elbow', 14: 'right-elbow',
    15: 'left-wrist', 16: 'right-wrist',
    23: 'left-hip', 24: 'right-hip'
  };
  return names[index] || `landmark-${index}`;
}

function calculateDistance(p1: any, p2: any): number {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}


