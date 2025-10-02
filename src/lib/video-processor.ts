/**
 * Video Processor - Main Thread Implementation
 * Handles video processing without Web Workers for better Next.js compatibility
 */

import { PoseResult } from './mediapipe';
import { SwingPhase } from './swing-phases';

export interface VideoProcessingOptions {
  slowMotionFactor: number; // 2-4x slower
  showOverlays: boolean;
  showGrades: boolean;
  showAdvice: boolean;
  showTimestamps: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface PhaseAdvice {
  grade: string;
  advice: string;
  color: string;
  score: number;
}

export interface ProcessedVideoFrame {
  frameNumber: number;
  timestamp: number;
  phase: SwingPhase | null;
  advice: PhaseAdvice | null;
  pose: PoseResult | null;
}

export interface VideoProcessingProgress {
  stage: 'initializing' | 'processing' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentFrame: number;
  totalFrames: number;
}

// Phase-specific advice and grading
const phaseAdvice: Record<string, PhaseAdvice> = {
  address: {
    grade: 'B+',
    advice: 'Good posture but weight could be more balanced',
    color: '#4CAF50',
    score: 85
  },
  backswing: {
    grade: 'A-',
    advice: 'Excellent shoulder turn but early wrist hinge',
    color: '#8BC34A',
    score: 90
  },
  top: {
    grade: 'B',
    advice: 'Good position but could maintain more width',
    color: '#FFC107',
    score: 80
  },
  downswing: {
    grade: 'A',
    advice: 'Perfect sequence with great hip rotation',
    color: '#4CAF50',
    score: 95
  },
  impact: {
    grade: 'A+',
    advice: 'Excellent impact position and ball contact',
    color: '#2196F3',
    score: 98
  },
  'follow-through': {
    grade: 'A-',
    advice: 'Great finish with good balance',
    color: '#8BC34A',
    score: 90
  }
};

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement;
  private options: VideoProcessingOptions;
  private onProgress: (progress: VideoProcessingProgress) => void;
  private isProcessing: boolean = false;
  private abortController: AbortController | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    options: VideoProcessingOptions,
    onProgress: (progress: VideoProcessingProgress) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.video = video;
    this.options = options;
    this.onProgress = onProgress;
  }

  async processVideo(
    poses: PoseResult[],
    phases: SwingPhase[],
    timestamps: number[]
  ): Promise<Blob> {
    if (this.isProcessing) {
      throw new Error('Video processing already in progress');
    }

    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      this.onProgress({
        stage: 'initializing',
        progress: 0,
        message: 'Initializing video processing...',
        currentFrame: 0,
        totalFrames: 0
      });

      // Calculate total frames for slow motion
      const originalDuration = this.video.duration;
      const slowMotionDuration = originalDuration * this.options.slowMotionFactor;
      const fps = 30; // Target FPS for output
      const totalFrames = Math.floor(slowMotionDuration * fps);

      this.onProgress({
        stage: 'processing',
        progress: 5,
        message: 'Processing video frames...',
        currentFrame: 0,
        totalFrames
      });

      // Set up MediaRecorder
      const stream = this.canvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: this.getBitrate()
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          this.onProgress({
            stage: 'complete',
            progress: 100,
            message: 'Video processing complete!',
            currentFrame: totalFrames,
            totalFrames
          });
          this.isProcessing = false;
          resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
          this.onProgress({
            stage: 'error',
            progress: 0,
            message: `Error: ${error}`,
            currentFrame: 0,
            totalFrames
          });
          this.isProcessing = false;
          reject(error);
        };

        // Start recording
        mediaRecorder.start();

        // Process frames
        this.processFrames(poses, phases, timestamps, totalFrames, fps)
          .then(() => {
            if (!this.abortController?.signal.aborted) {
              mediaRecorder.stop();
            }
          })
          .catch((error) => {
            this.isProcessing = false;
            reject(error);
          });
      });
    } catch (error) {
      this.isProcessing = false;
      this.onProgress({
        stage: 'error',
        progress: 0,
        message: `Processing error: ${error}`,
        currentFrame: 0,
        totalFrames: 0
      });
      throw error;
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isProcessing = false;
  }

  private async processFrames(
    poses: PoseResult[],
    phases: SwingPhase[],
    timestamps: number[],
    totalFrames: number,
    fps: number
  ): Promise<void> {
    const frameDuration = 1 / fps;
    const slowMotionFrameDuration = frameDuration / this.options.slowMotionFactor;

    for (let frame = 0; frame < totalFrames; frame++) {
      // Check for cancellation
      if (this.abortController?.signal.aborted) {
        throw new Error('Processing cancelled');
      }

      const currentTime = frame * slowMotionFrameDuration;
      const originalTime = currentTime / this.options.slowMotionFactor;

      // Seek video to current time
      this.video.currentTime = Math.min(originalTime, this.video.duration);

      // Wait for video to be ready
      await this.waitForVideoSeek();

      // Draw frame with overlays
      await this.drawFrameWithOverlays(poses, phases, timestamps, frame, currentTime);

      // Update progress
      const progress = Math.round((frame / totalFrames) * 90) + 5; // 5-95%
      this.onProgress({
        stage: 'processing',
        progress,
        message: `Processing frame ${frame + 1} of ${totalFrames}...`,
        currentFrame: frame + 1,
        totalFrames
      });

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps processing
    }
  }

  private async drawFrameWithOverlays(
    poses: PoseResult[],
    phases: SwingPhase[],
    timestamps: number[],
    frameNumber: number,
    currentTime: number
  ): Promise<void> {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw video frame
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    if (this.options.showOverlays) {
      // Find current phase
      const currentPhase = this.findCurrentPhase(phases, currentTime);
      
      // Find current pose
      const currentPose = this.findCurrentPose(poses, timestamps, currentTime);

      // Draw pose overlay
      if (currentPose && currentPose.landmarks) {
        this.drawPoseOverlay(currentPose);
      }

      // Draw phase information
      if (currentPhase) {
        this.drawPhaseOverlay(currentPhase, frameNumber, currentTime);
      }

      // Draw timestamps
      if (this.options.showTimestamps) {
        this.drawTimestampOverlay(currentTime, frameNumber);
      }
    }
  }

  private findCurrentPhase(phases: SwingPhase[], currentTime: number): SwingPhase | null {
    return phases.find(phase => 
      currentTime >= phase.startTime && currentTime <= phase.endTime
    ) || null;
  }

  private findCurrentPose(poses: PoseResult[], timestamps: number[], currentTime: number): PoseResult | null {
    // Find the closest pose by timestamp
    let closestIndex = 0;
    let minDiff = Math.abs(timestamps[0] - currentTime);

    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return poses[closestIndex] || null;
  }

  private drawPoseOverlay(pose: PoseResult): void {
    if (!pose.landmarks) return;

    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = '#FF0000';

    // Draw pose connections
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
      [11, 23], [12, 24], [23, 24], // Torso
      [23, 25], [25, 27], [24, 26], [26, 28], // Legs
      [15, 17], [17, 19], [19, 21], [16, 18], [18, 20], [20, 22] // Hands
    ];

    connections.forEach(([start, end]) => {
      const startPoint = pose.landmarks![start];
      const endPoint = pose.landmarks![end];
      
      if (startPoint && endPoint && startPoint.visibility && endPoint.visibility && startPoint.visibility > 0.1 && endPoint.visibility > 0.1) {
        this.ctx.beginPath();
        this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
        this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
        this.ctx.stroke();
      }
    });

    // Draw landmarks
    pose.landmarks.forEach(landmark => {
      if (landmark.visibility && landmark.visibility > 0.1) {
        this.ctx.beginPath();
        this.ctx.arc(
          landmark.x * this.canvas.width,
          landmark.y * this.canvas.height,
          3,
          0,
          2 * Math.PI
        );
        this.ctx.fill();
      }
    });
  }

  private drawPhaseOverlay(phase: SwingPhase, frameNumber: number, currentTime: number): void {
    const advice = phaseAdvice[phase.name] || {
      grade: 'B',
      advice: 'Good swing phase',
      color: '#FFC107',
      score: 80
    };

    // Phase background
    this.ctx.fillStyle = `${advice.color}20`; // 20% opacity
    this.ctx.fillRect(0, 0, this.canvas.width, 120);

    // Phase name
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(
      phase.name.charAt(0).toUpperCase() + phase.name.slice(1),
      20,
      40
    );

    // Grade
    if (this.options.showGrades) {
      this.ctx.fillStyle = advice.color;
      this.ctx.font = 'bold 32px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(advice.grade, this.canvas.width - 20, 40);
    }

    // Advice
    if (this.options.showAdvice) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(advice.advice, 20, 70);
    }

    // Confidence score
    this.ctx.fillStyle = '#CCCCCC';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      `Confidence: ${Math.round(phase.confidence * 100)}%`,
      this.canvas.width - 20,
      70
    );

    // Progress bar
    const phaseProgress = (currentTime - phase.startTime) / (phase.endTime - phase.startTime);
    this.ctx.fillStyle = advice.color;
    this.ctx.fillRect(20, 90, (this.canvas.width - 40) * Math.max(0, Math.min(1, phaseProgress)), 8);
  }

  private drawTimestampOverlay(currentTime: number, frameNumber: number): void {
    this.ctx.fillStyle = '#00000080';
    this.ctx.fillRect(this.canvas.width - 200, this.canvas.height - 60, 180, 50);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'right';

    const minutes = Math.floor(currentTime / 60);
    const seconds = (currentTime % 60).toFixed(1);
    this.ctx.fillText(
      `Time: ${minutes}:${seconds.padStart(4, '0')}`,
      this.canvas.width - 20,
      this.canvas.height - 35
    );

    this.ctx.fillText(
      `Frame: ${frameNumber}`,
      this.canvas.width - 20,
      this.canvas.height - 15
    );
  }

  private async waitForVideoSeek(): Promise<void> {
    return new Promise((resolve) => {
      const onSeeked = () => {
        this.video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      this.video.addEventListener('seeked', onSeeked);
    });
  }

  private getBitrate(): number {
    switch (this.options.quality) {
      case 'low': return 1000000; // 1 Mbps
      case 'medium': return 2500000; // 2.5 Mbps
      case 'high': return 5000000; // 5 Mbps
      default: return 2500000;
    }
  }
}
