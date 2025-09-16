/**
 * Video Processing Utilities
 * Helper functions for video processing, optimization, and error handling
 */

export interface VideoProcessingConfig {
  maxWidth: number;
  maxHeight: number;
  quality: 'low' | 'medium' | 'high';
  frameRate: number;
  bitrate: number;
}

export const VIDEO_CONFIGS: Record<string, VideoProcessingConfig> = {
  low: {
    maxWidth: 640,
    maxHeight: 480,
    quality: 'low',
    frameRate: 15,
    bitrate: 1000000 // 1 Mbps
  },
  medium: {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 'medium',
    frameRate: 30,
    bitrate: 2500000 // 2.5 Mbps
  },
  high: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 'high',
    frameRate: 30,
    bitrate: 5000000 // 5 Mbps
  }
};

export class VideoProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VideoProcessingError';
  }
}

// Simplified utility functions for video processing
export function validateVideoElement(video: HTMLVideoElement): void {
  if (!video.videoWidth || !video.videoHeight) {
    throw new VideoProcessingError(
      'Video dimensions not available',
      'VIDEO_DIMENSIONS_UNAVAILABLE'
    );
  }

  if (video.duration === 0 || isNaN(video.duration)) {
    throw new VideoProcessingError(
      'Video duration not available',
      'VIDEO_DURATION_UNAVAILABLE'
    );
  }

  if (video.readyState < 2) {
    throw new VideoProcessingError(
      'Video metadata not loaded',
      'VIDEO_METADATA_NOT_LOADED',
      { readyState: video.readyState }
    );
  }
}

export function validateInputs(
  poses: any[],
  phases: any[],
  timestamps: number[],
  options: any
): void {
  if (!poses || poses.length === 0) {
    throw new VideoProcessingError(
      'No poses provided for processing',
      'NO_POSES'
    );
  }

  if (!phases || phases.length === 0) {
    throw new VideoProcessingError(
      'No phases provided for processing',
      'NO_PHASES'
    );
  }

  if (!timestamps || timestamps.length === 0) {
    throw new VideoProcessingError(
      'No timestamps provided for processing',
      'NO_TIMESTAMPS'
    );
  }

  if (options.slowMotionFactor < 1 || options.slowMotionFactor > 10) {
    throw new VideoProcessingError(
      'Invalid slow motion factor',
      'INVALID_SLOW_MOTION_FACTOR',
      { factor: options.slowMotionFactor }
    );
  }

  if (!['low', 'medium', 'high'].includes(options.quality)) {
    throw new VideoProcessingError(
      'Invalid quality setting',
      'INVALID_QUALITY',
      { quality: options.quality }
    );
  }
}

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function estimateProcessingTime(
  videoDuration: number,
  slowMotionFactor: number,
  quality: 'low' | 'medium' | 'high'
): number {
  const config = VIDEO_CONFIGS[quality];
  const processingTimePerSecond = config.frameRate * 0.1; // 100ms per frame
  const totalDuration = videoDuration * slowMotionFactor;
  
  return Math.ceil(totalDuration * processingTimePerSecond);
}

export function getOptimalQuality(
  videoWidth: number,
  videoHeight: number,
  availableMemory: number = 4 * 1024 * 1024 * 1024 // 4GB default
): 'low' | 'medium' | 'high' {
  const pixelCount = videoWidth * videoHeight;
  const memoryPerFrame = pixelCount * 4; // RGBA
  const estimatedFrames = 30 * 10; // 10 seconds at 30fps
  const estimatedMemory = memoryPerFrame * estimatedFrames;

  if (estimatedMemory > availableMemory * 0.8) {
    return 'low';
  } else if (estimatedMemory > availableMemory * 0.5) {
    return 'medium';
  } else {
    return 'high';
  }
}
