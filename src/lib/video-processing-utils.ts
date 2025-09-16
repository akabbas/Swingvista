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

export class VideoProcessorManager {
  private static instance: VideoProcessorManager;
  private workers: Map<string, Worker> = new Map();
  private processingJobs: Map<string, AbortController> = new Map();

  static getInstance(): VideoProcessorManager {
    if (!VideoProcessorManager.instance) {
      VideoProcessorManager.instance = new VideoProcessorManager();
    }
    return VideoProcessorManager.instance;
  }

  async processVideo(
    videoElement: HTMLVideoElement,
    poses: any[],
    phases: any[],
    timestamps: number[],
    options: {
      slowMotionFactor: number;
      quality: 'low' | 'medium' | 'high';
      showOverlays: boolean;
      showGrades: boolean;
      showAdvice: boolean;
      showTimestamps: boolean;
    },
    onProgress?: (progress: number, message: string) => void
  ): Promise<Blob> {
    const jobId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create abort controller for cancellation
      const abortController = new AbortController();
      this.processingJobs.set(jobId, abortController);

      // Check if video is ready
      if (videoElement.readyState < 2) {
        throw new VideoProcessingError(
          'Video not ready for processing',
          'VIDEO_NOT_READY',
          { readyState: videoElement.readyState }
        );
      }

      // Validate inputs
      this.validateInputs(poses, phases, timestamps, options);

      // Create worker
      const worker = await this.createWorker();
      this.workers.set(jobId, worker);

      // Set up progress tracking
      const progressHandler = (event: MessageEvent) => {
        if (event.data.type === 'progress') {
          const { progress, message } = event.data.data;
          onProgress?.(progress, message);
        }
      };

      worker.addEventListener('message', progressHandler);

      // Create offscreen canvas
      const config = VIDEO_CONFIGS[options.quality];
      const canvas = new OffscreenCanvas(config.maxWidth, config.maxHeight);

      // Process video
      const result = await this.processVideoWithWorker(
        worker,
        canvas,
        videoElement,
        poses,
        phases,
        timestamps,
        options,
        abortController.signal
      );

      // Cleanup
      this.cleanup(jobId);
      worker.removeEventListener('message', progressHandler);

      return result;
    } catch (error) {
      this.cleanup(jobId);
      
      if (error instanceof VideoProcessingError) {
        throw error;
      }
      
      throw new VideoProcessingError(
        'Video processing failed',
        'PROCESSING_FAILED',
        { originalError: error }
      );
    }
  }

  cancelProcessing(jobId: string): void {
    const abortController = this.processingJobs.get(jobId);
    if (abortController) {
      abortController.abort();
      this.cleanup(jobId);
    }
  }

  private async createWorker(): Promise<Worker> {
    if (typeof Worker === 'undefined') {
      throw new VideoProcessingError(
        'Web Workers not supported',
        'WORKERS_NOT_SUPPORTED'
      );
    }

    try {
      return new Worker(new URL('../workers/video-processor.worker.ts', import.meta.url));
    } catch (error) {
      throw new VideoProcessingError(
        'Failed to create video processing worker',
        'WORKER_CREATION_FAILED',
        { originalError: error }
      );
    }
  }

  private async processVideoWithWorker(
    worker: Worker,
    canvas: OffscreenCanvas,
    videoElement: HTMLVideoElement,
    poses: any[],
    phases: any[],
    timestamps: number[],
    options: any,
    signal: AbortSignal
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Handle abort signal
      if (signal.aborted) {
        reject(new VideoProcessingError('Processing cancelled', 'CANCELLED'));
        return;
      }

      const abortHandler = () => {
        worker.terminate();
        reject(new VideoProcessingError('Processing cancelled', 'CANCELLED'));
      };

      signal.addEventListener('abort', abortHandler);

      // Set up worker message handlers
      const messageHandler = (event: MessageEvent) => {
        switch (event.data.type) {
          case 'complete':
            signal.removeEventListener('abort', abortHandler);
            resolve(event.data.data.blob);
            break;
          case 'error':
            signal.removeEventListener('abort', abortHandler);
            reject(new VideoProcessingError(
              'Worker processing error',
              'WORKER_ERROR',
              event.data.data
            ));
            break;
        }
      };

      worker.addEventListener('message', messageHandler);

      // Start processing
      worker.postMessage({
        type: 'processVideo',
        data: {
          canvas,
          video: videoElement,
          options,
          poses,
          phases,
          timestamps
        }
      });
    });
  }

  private validateInputs(
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

  private cleanup(jobId: string): void {
    const worker = this.workers.get(jobId);
    if (worker) {
      worker.terminate();
      this.workers.delete(jobId);
    }

    this.processingJobs.delete(jobId);
  }

  // Cleanup all workers and jobs
  destroy(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    this.processingJobs.clear();
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
