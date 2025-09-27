import type { PoseResult } from './mediapipe';
import type { EnhancedSwingPhase } from './enhanced-swing-phases';
import type { ProfessionalGolfMetrics } from './professional-golf-metrics';

export interface FrameSamplingConfig {
  maxFrames: number;
  samplingStrategy: 'uniform' | 'adaptive' | 'keyframe';
  qualityThreshold: number;
  motionThreshold: number;
}

export interface BackgroundProcessingJob {
  id: string;
  type: 'pose_detection' | 'phase_analysis' | 'metrics_calculation' | 'comparison';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  input: any;
  output?: any;
  error?: string;
}

export interface VideoCompressionConfig {
  quality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  bitrate: number;
  format: 'mp4' | 'webm' | 'mov';
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  size: number;
}

export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  frameRate: number;
  compressionRatio: number;
  cacheHitRate: number;
}

/**
 * Frame sampling for longer videos
 */
export class FrameSampler {
  private config: FrameSamplingConfig;

  constructor(config: Partial<FrameSamplingConfig> = {}) {
    this.config = {
      maxFrames: 1000,
      samplingStrategy: 'adaptive',
      qualityThreshold: 0.7,
      motionThreshold: 0.1,
      ...config
    };
  }

  /**
   * Sample frames from video based on strategy
   */
  async sampleFrames(
    video: HTMLVideoElement,
    totalFrames: number
  ): Promise<{ frameIndices: number[]; timestamps: number[] }> {
    const frameIndices: number[] = [];
    const timestamps: number[] = [];

    switch (this.config.samplingStrategy) {
      case 'uniform':
        return this.uniformSampling(totalFrames);
      
      case 'adaptive':
        return this.adaptiveSampling(video, totalFrames);
      
      case 'keyframe':
        return this.keyframeSampling(video, totalFrames);
      
      default:
        return this.uniformSampling(totalFrames);
    }
  }

  private uniformSampling(totalFrames: number): { frameIndices: number[]; timestamps: number[] } {
    const frameIndices: number[] = [];
    const timestamps: number[] = [];
    const step = Math.max(1, Math.floor(totalFrames / this.config.maxFrames));

    for (let i = 0; i < totalFrames; i += step) {
      frameIndices.push(i);
      timestamps.push(i / 30); // Assuming 30fps
    }

    return { frameIndices, timestamps };
  }

  private async adaptiveSampling(
    video: HTMLVideoElement,
    totalFrames: number
  ): Promise<{ frameIndices: number[]; timestamps: number[] }> {
    const frameIndices: number[] = [];
    const timestamps: number[] = [];
    const motionScores: number[] = [];

    // Calculate motion scores for each frame
    for (let i = 0; i < totalFrames; i += 10) {
      const motionScore = await this.calculateMotionScore(video, i);
      motionScores[i] = motionScore;
    }

    // Select frames based on motion and quality
    const sortedFrames = motionScores
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxFrames);

    sortedFrames.forEach(({ index }) => {
      frameIndices.push(index);
      timestamps.push(index / 30);
    });

    return { frameIndices, timestamps };
  }

  private async keyframeSampling(
    video: HTMLVideoElement,
    totalFrames: number
  ): Promise<{ frameIndices: number[]; timestamps: number[] }> {
    const frameIndices: number[] = [];
    const timestamps: number[] = [];

    // Detect keyframes (significant changes)
    const keyframes = await this.detectKeyframes(video, totalFrames);
    
    // Sample around keyframes
    keyframes.forEach(keyframe => {
      const start = Math.max(0, keyframe - 5);
      const end = Math.min(totalFrames - 1, keyframe + 5);
      
      for (let i = start; i <= end; i += 2) {
        if (frameIndices.length < this.config.maxFrames) {
          frameIndices.push(i);
          timestamps.push(i / 30);
        }
      }
    });

    return { frameIndices, timestamps };
  }

  private async calculateMotionScore(video: HTMLVideoElement, frameIndex: number): Promise<number> {
    // Seek to frame
    video.currentTime = frameIndex / 30;
    await this.waitForSeek(video);

    // Capture frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Calculate motion score (simplified)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let motionScore = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      motionScore += brightness;
    }

    return motionScore / (pixels.length / 4);
  }

  private async detectKeyframes(video: HTMLVideoElement, totalFrames: number): Promise<number[]> {
    const keyframes: number[] = [];
    const frameDifferences: number[] = [];

    // Calculate frame differences
    for (let i = 1; i < totalFrames; i += 10) {
      const diff = await this.calculateFrameDifference(video, i - 1, i);
      frameDifferences.push(diff);
    }

    // Find peaks (significant changes)
    const threshold = this.calculateThreshold(frameDifferences);
    
    frameDifferences.forEach((diff, index) => {
      if (diff > threshold) {
        keyframes.push(index * 10);
      }
    });

    return keyframes;
  }

  private async calculateFrameDifference(
    video: HTMLVideoElement,
    frame1: number,
    frame2: number
  ): Promise<number> {
    // Capture frame 1
    video.currentTime = frame1 / 30;
    await this.waitForSeek(video);
    const canvas1 = this.captureFrame(video);

    // Capture frame 2
    video.currentTime = frame2 / 30;
    await this.waitForSeek(video);
    const canvas2 = this.captureFrame(video);

    // Calculate difference
    return this.calculateImageDifference(canvas1, canvas2);
  }

  private captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return canvas;
  }

  private calculateImageDifference(canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement): number {
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    if (!ctx1 || !ctx2) return 0;

    const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
    const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);

    let totalDifference = 0;
    const pixels1 = imageData1.data;
    const pixels2 = imageData2.data;

    for (let i = 0; i < pixels1.length; i += 4) {
      const r1 = pixels1[i];
      const g1 = pixels1[i + 1];
      const b1 = pixels1[i + 2];
      
      const r2 = pixels2[i];
      const g2 = pixels2[i + 1];
      const b2 = pixels2[i + 2];

      const diff = Math.sqrt(
        Math.pow(r2 - r1, 2) + 
        Math.pow(g2 - g1, 2) + 
        Math.pow(b2 - b1, 2)
      );
      
      totalDifference += diff;
    }

    return totalDifference / (pixels1.length / 4);
  }

  private calculateThreshold(differences: number[]): number {
    const sorted = [...differences].sort((a, b) => b - a);
    const percentile = Math.floor(sorted.length * 0.1); // Top 10%
    return sorted[percentile] || 0;
  }

  private waitForSeek(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });
  }
}

/**
 * Background processing with progress indicators
 */
export class BackgroundProcessor {
  private jobs: Map<string, BackgroundProcessingJob> = new Map();
  private workers: Worker[] = [];
  private maxWorkers: number;

  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
  }

  /**
   * Add job to processing queue
   */
  async addJob(
    type: BackgroundProcessingJob['type'],
    input: any,
    onProgress?: (progress: number) => void,
    onComplete?: (result: any) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    const jobId = this.generateJobId();
    const job: BackgroundProcessingJob = {
      id: jobId,
      type,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      input
    };

    this.jobs.set(jobId, job);

    // Process job
    this.processJob(job, onProgress, onComplete, onError);

    return jobId;
  }

  private async processJob(
    job: BackgroundProcessingJob,
    onProgress?: (progress: number) => void,
    onComplete?: (result: any) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      job.status = 'processing';
      
      let result: any;
      
      switch (job.type) {
        case 'pose_detection':
          result = await this.processPoseDetection(job, onProgress);
          break;
        case 'phase_analysis':
          result = await this.processPhaseAnalysis(job, onProgress);
          break;
        case 'metrics_calculation':
          result = await this.processMetricsCalculation(job, onProgress);
          break;
        case 'comparison':
          result = await this.processComparison(job, onProgress);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date();
      job.output = result;
      
      onComplete?.(result);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      onError?.(job.error);
    }
  }

  private async processPoseDetection(
    job: BackgroundProcessingJob,
    onProgress?: (progress: number) => void
  ): Promise<PoseResult[]> {
    const { video, frameIndices } = job.input;
    const poses: PoseResult[] = [];
    
    for (let i = 0; i < frameIndices.length; i++) {
      const frameIndex = frameIndices[i];
      const progress = (i / frameIndices.length) * 100;
      
      onProgress?.(progress);
      
      // Simulate pose detection
      const pose = await this.detectPose(video, frameIndex);
      poses.push(pose);
      
      // Yield control to prevent blocking
      await this.yield();
    }
    
    return poses;
  }

  private async processPhaseAnalysis(
    job: BackgroundProcessingJob,
    onProgress?: (progress: number) => void
  ): Promise<EnhancedSwingPhase[]> {
    const { poses } = job.input;
    
    onProgress?.(50);
    
    // Simulate phase analysis
    const phases = await this.analyzePhases(poses);
    
    onProgress?.(100);
    
    return phases;
  }

  private async processMetricsCalculation(
    job: BackgroundProcessingJob,
    onProgress?: (progress: number) => void
  ): Promise<ProfessionalGolfMetrics> {
    const { poses, phases } = job.input;
    
    onProgress?.(25);
    
    // Simulate metrics calculation
    const metrics = await this.calculateMetrics(poses, phases);
    
    onProgress?.(100);
    
    return metrics;
  }

  private async processComparison(
    job: BackgroundProcessingJob,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const { userSwing, proSwing } = job.input;
    
    onProgress?.(50);
    
    // Simulate comparison
    const comparison = await this.compareSwings(userSwing, proSwing);
    
    onProgress?.(100);
    
    return comparison;
  }

  private async detectPose(video: HTMLVideoElement, frameIndex: number): Promise<PoseResult> {
    // Simulate pose detection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      landmarks: Array.from({ length: 33 }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        visibility: 0.9
      })),
      timestamp: frameIndex / 30,
      confidence: 0.9
    };
  }

  private async analyzePhases(poses: PoseResult[]): Promise<EnhancedSwingPhase[]> {
    // Simulate phase analysis
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      {
        name: 'address',
        startTime: 0,
        endTime: 1,
        startFrame: 0,
        endFrame: 30,
        duration: 1,
        confidence: 0.95,
        grade: 'A',
        color: '#00ff00',
        keyPoints: [0],
        metrics: { tempo: 0.8, balance: 0.9, posture: 0.85 },
        recommendations: ['Maintain steady posture']
      }
    ];
  }

  private async calculateMetrics(poses: PoseResult[], phases: EnhancedSwingPhase[]): Promise<ProfessionalGolfMetrics> {
    // Simulate metrics calculation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      clubPath: {
        pathType: 'straight',
        pathDeviation: 0.05,
        pathConsistency: 0.85,
        insideOutRatio: 0.3,
        outsideInRatio: 0.2,
        pathEfficiency: 0.82,
        recommendations: ['Excellent club path']
      },
      swingPlane: {
        planeAngle: 45,
        planeConsistency: 0.88,
        planeStability: 0.85,
        efficiencyScore: 0.86,
        idealPlaneDeviation: 2.5,
        planeRecommendations: ['Great swing plane']
      },
      weightTransfer: {
        pressureShift: 0.6,
        weightTransferSmoothness: 0.82,
        weightTransferTiming: 0.85,
        pressureDistribution: { leftFoot: 0.4, rightFoot: 0.6, centerOfPressure: 0.5 },
        transferEfficiency: 0.83,
        recommendations: ['Good weight transfer']
      },
      spineAngle: {
        averageSpineAngle: 12,
        spineAngleVariance: 2.5,
        consistencyScore: 0.87,
        spineStability: 0.85,
        maxDeviation: 5,
        spineRecommendations: ['Consistent spine angle']
      },
      headStability: {
        headPositionVariance: 0.002,
        headMovementRange: 0.05,
        stabilityScore: 0.89,
        headStillness: 0.87,
        movementPattern: 'stable',
        stabilityRecommendations: ['Excellent head stability']
      },
      overallProfessionalScore: 0.85,
      professionalGrade: 'A-',
      keyRecommendations: ['Great overall swing!']
    };
  }

  private async compareSwings(userSwing: any, proSwing: any): Promise<any> {
    // Simulate comparison
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return {
      similarityScore: 0.75,
      recommendations: ['Work on swing timing']
    };
  }

  private yield(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): BackgroundProcessingJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BackgroundProcessingJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'pending') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      return true;
    }
    return false;
  }
}

/**
 * Video compression for faster uploads
 */
export class VideoCompressor {
  private config: VideoCompressionConfig;

  constructor(config: Partial<VideoCompressionConfig> = {}) {
    this.config = {
      quality: 0.8,
      maxWidth: 1280,
      maxHeight: 720,
      bitrate: 1000000, // 1Mbps
      format: 'mp4',
      ...config
    };
  }

  /**
   * Compress video file
   */
  async compressVideo(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        // Calculate new dimensions
        const { width, height } = this.calculateDimensions(
          video.videoWidth,
          video.videoHeight
        );

        canvas.width = width;
        canvas.height = height;

        // Create media recorder
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: this.config.bitrate
        });

        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };

        // Start recording
        mediaRecorder.start();
        
        // Process video frames
        this.processVideoFrames(
          video,
          canvas,
          ctx,
          mediaRecorder,
          onProgress
        ).catch(reject);
      };

      video.onerror = () => reject(new Error('Video loading failed'));
      video.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(originalWidth: number, originalHeight: number): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = this.config.maxWidth;
    let height = this.config.maxHeight;
    
    if (aspectRatio > 1) {
      // Landscape
      height = width / aspectRatio;
    } else {
      // Portrait
      width = height * aspectRatio;
    }
    
    return { width, height };
  }

  private async processVideoFrames(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    mediaRecorder: MediaRecorder,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const duration = video.duration;
    const frameRate = 30;
    const totalFrames = Math.floor(duration * frameRate);
    
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / frameRate;
      video.currentTime = time;
      
      await this.waitForSeek(video);
      
      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Update progress
      const progress = (frame / totalFrames) * 100;
      onProgress?.(progress);
      
      // Yield control
      await this.yield();
    }
    
    mediaRecorder.stop();
  }

  private waitForSeek(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });
  }

  private yield(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Caching system for repeated analyses
 */
export class AnalysisCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private currentSize: number = 0;

  constructor(maxSize: number = 100 * 1024 * 1024) { // 100MB default
    this.maxSize = maxSize;
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl: number = 3600000): void { // 1 hour default
    const size = this.calculateSize(data);
    
    // Check if we need to evict
    while (this.currentSize + size > this.maxSize) {
      this.evictOldest();
    }
    
    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      ttl,
      size
    };
    
    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Generate cache key for analysis
   */
  generateKey(
    type: 'pose' | 'phase' | 'metrics' | 'comparison',
    input: any
  ): string {
    const inputHash = this.hashObject(input);
    return `${type}_${inputHash}`;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: number;
    hitRate: number;
  } {
    return {
      size: this.currentSize,
      entries: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp.getTime() < oldestTime) {
        oldestTime = entry.timestamp.getTime();
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.cache.delete(oldestKey);
        this.currentSize -= entry.size;
      }
    }
  }

  private hashObject(obj: any): string {
    return btoa(JSON.stringify(obj)).replace(/[^a-zA-Z0-9]/g, '');
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric({
          processingTime: 0,
          memoryUsage: memory.usedJSHeapSize,
          frameRate: 0,
          compressionRatio: 0,
          cacheHitRate: 0
        });
      }, 1000);
    }
  }

  /**
   * Record performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Get performance report
   */
  getReport(): {
    averageProcessingTime: number;
    averageMemoryUsage: number;
    averageFrameRate: number;
    averageCompressionRatio: number;
    averageCacheHitRate: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageProcessingTime: 0,
        averageMemoryUsage: 0,
        averageFrameRate: 0,
        averageCompressionRatio: 0,
        averageCacheHitRate: 0
      };
    }

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        processingTime: acc.processingTime + metric.processingTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        frameRate: acc.frameRate + metric.frameRate,
        compressionRatio: acc.compressionRatio + metric.compressionRatio,
        cacheHitRate: acc.cacheHitRate + metric.cacheHitRate
      }),
      { processingTime: 0, memoryUsage: 0, frameRate: 0, compressionRatio: 0, cacheHitRate: 0 }
    );

    const count = this.metrics.length;

    return {
      averageProcessingTime: totals.processingTime / count,
      averageMemoryUsage: totals.memoryUsage / count,
      averageFrameRate: totals.frameRate / count,
      averageCompressionRatio: totals.compressionRatio / count,
      averageCacheHitRate: totals.cacheHitRate / count
    };
  }
}
