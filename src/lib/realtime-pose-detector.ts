/**
 * Real-time pose detection using TensorFlow.js PoseNet
 * Optimized for live camera feed with reliable stick figure overlay
 */

import * as poseDetection from '@tensorflow-models/pose-detection';

export interface RealtimePoseResult {
  landmarks: Array<{
    x: number;
    y: number;
    visibility: number;
  }>;
  score: number;
  timestamp: number;
}

export class RealtimePoseDetector {
  private model: poseDetection.PoseDetector | null = null;
  private isInitialized = false;
  private isRunning = false;
  private animationFrame: number | null = null;
  private onPoseDetected: ((pose: RealtimePoseResult) => void) | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🎯 Initializing MoveNet for real-time detection...');
      
      // Load MoveNet model - faster and more accurate than PoseNet
      this.model = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });

      this.isInitialized = true;
      console.log('✅ MoveNet initialized for real-time detection');
    } catch (error) {
      console.error('❌ Failed to initialize MoveNet:', error);
      throw error;
    }
  }

  startDetection(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onPoseDetected: (pose: RealtimePoseResult) => void
  ): void {
    if (!this.isInitialized || !this.model) {
      throw new Error('Detector not initialized');
    }

    if (this.isRunning) {
      this.stopDetection();
    }

    this.onPoseDetected = onPoseDetected;
    this.isRunning = true;

    console.log('🎬 Starting real-time pose detection...');
    this.detectPose(video, canvas);
  }

  private async detectPose(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<void> {
    if (!this.isRunning || !this.model) return;

    try {
      // Detect pose in current video frame
      const poses = await this.model.estimatePoses(video);
      
      if (poses && poses.length > 0) {
        const pose = poses[0]; // Use first detected pose
        
        if (pose && pose.keypoints && pose.keypoints.length > 0) {
          // Convert keypoints to our format
          const landmarks = this.convertKeypointsToLandmarks(pose.keypoints);
          
          const poseResult: RealtimePoseResult = {
            landmarks,
            score: pose.keypoints.reduce((sum, kp) => sum + (kp.score || 0), 0) / pose.keypoints.length,
            timestamp: Date.now()
          };

          // Draw stick figure overlay
          this.drawStickFigure(canvas, landmarks, video.videoWidth, video.videoHeight);
          
          // Notify callback
          if (this.onPoseDetected) {
            this.onPoseDetected(poseResult);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Pose detection error:', error);
    }

    // Continue detection loop
    if (this.isRunning) {
      this.animationFrame = requestAnimationFrame(() => this.detectPose(video, canvas));
    }
  }

  private convertKeypointsToLandmarks(keypoints: poseDetection.Keypoint[]): Array<{x: number, y: number, visibility: number}> {
    // Convert keypoints to normalized coordinates
    return keypoints.map(kp => ({
      x: kp.x, // Will be normalized by canvas size
      y: kp.y,
      visibility: kp.score || 0
    }));
  }

  private drawStickFigure(
    canvas: HTMLCanvasElement, 
    landmarks: Array<{x: number, y: number, visibility: number}>, 
    videoWidth: number, 
    videoHeight: number
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stick figure with thick, visible lines
    ctx.strokeStyle = '#00FF00'; // Bright green
    ctx.fillStyle = '#00FF00';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Define connections for stick figure (PoseNet keypoints)
    const connections = [
      // Head and shoulders
      [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
      // Torso
      [5, 6], [5, 11], [6, 12], [11, 12],
      // Arms
      [5, 7], [7, 9], [6, 8], [8, 10],
      // Legs
      [11, 13], [13, 15], [12, 14], [14, 16]
    ];

    // Draw connections
    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && start.visibility > 0.3 && end.visibility > 0.3) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    });

    // Draw key points
    landmarks.forEach((landmark) => {
      if (landmark.visibility > 0.3) {
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Add status indicator
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('LIVE POSE TRACKING', 10, 30);
  }

  stopDetection(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    console.log('🛑 Stopped real-time pose detection');
  }

  dispose(): void {
    this.stopDetection();
    this.model = null;
    this.isInitialized = false;
    this.onPoseDetected = null;
  }
}
