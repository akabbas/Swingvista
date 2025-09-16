// Lazy load MediaPipe with dynamic imports
let Pose: unknown;
let POSE_CONNECTIONS: unknown;
let mediaPipePromise: Promise<any> | null = null;

async function loadMediaPipe() {
  if (!mediaPipePromise) {
    mediaPipePromise = import('@mediapipe/pose').then(mp => {
      Pose = mp.Pose;
      POSE_CONNECTIONS = mp.POSE_CONNECTIONS;
      return { Pose, POSE_CONNECTIONS };
    });
  }
  return mediaPipePromise;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  worldLandmarks: PoseLandmark[];
  timestamp?: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  frame: number;
}

export interface SwingTrajectory {
  rightWrist: TrajectoryPoint[];
  leftWrist: TrajectoryPoint[];
  rightShoulder: TrajectoryPoint[];
  leftShoulder: TrajectoryPoint[];
  rightHip: TrajectoryPoint[];
  leftHip: TrajectoryPoint[];
  clubhead: TrajectoryPoint[];
}

interface MediaPipePoseOptions {
  modelComplexity: number;
  smoothLandmarks: boolean;
  enableSegmentation: boolean;
  smoothSegmentation: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

interface MediaPipePoseInstance {
  setOptions: (opts: MediaPipePoseOptions) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  send: (args: { image: HTMLVideoElement }) => void;
  close: () => void;
}

interface MediaPipeResults {
  poseLandmarks?: PoseLandmark[];
  poseWorldLandmarks?: PoseLandmark[];
}

export class MediaPipePoseDetector {
  private static instance: MediaPipePoseDetector | null = null;
  private pose: MediaPipePoseInstance | null = null;
  private isInitialized = false;
  private options: MediaPipePoseOptions;
  private pendingResolves: ((result: PoseResult | null) => void)[] = [];
  private refCount = 0;

  constructor(options?: Partial<MediaPipePoseOptions>) {
    this.options = {
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      ...options
    };
  }

  static getInstance(options?: Partial<MediaPipePoseOptions>): MediaPipePoseDetector {
    if (!MediaPipePoseDetector.instance) {
      MediaPipePoseDetector.instance = new MediaPipePoseDetector(options);
    }
    MediaPipePoseDetector.instance.refCount++;
    return MediaPipePoseDetector.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const { Pose } = await loadMediaPipe();
      const PoseCtor = Pose as any;
      this.pose = new PoseCtor({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      this.pose!.setOptions({
        modelComplexity: this.options.modelComplexity,
        smoothLandmarks: this.options.smoothLandmarks,
        enableSegmentation: this.options.enableSegmentation,
        smoothSegmentation: this.options.smoothSegmentation,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence
      });
      this.pose!.onResults((results: MediaPipeResults) => {
        const resolve = this.pendingResolves.shift();
        if (resolve) {
          if (results.poseLandmarks && results.poseLandmarks.length > 0) {
            resolve({
              landmarks: results.poseLandmarks,
              worldLandmarks: results.poseWorldLandmarks || [],
              timestamp: Date.now()
            });
          } else {
            resolve(null);
          }
        }
      });
      // Small init wait
      this.isInitialized = true;
      console.log('MediaPipe Pose initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      throw new Error('Failed to initialize MediaPipe Pose');
    }
  }

  async detectPose(videoElement: HTMLVideoElement): Promise<PoseResult | null> {
    if (!this.pose || !this.isInitialized) {
      await this.initialize();
    }
    return new Promise((resolve) => {
      this.pendingResolves.push(resolve);
      try {
        this.pose!.send({ image: videoElement });
      } catch (error) {
        console.error('Error sending frame to MediaPipe:', error);
        const r = this.pendingResolves.shift();
        if (r) r(null);
      }
    });
  }

  getPoseConnections() { return POSE_CONNECTIONS; }

  destroy() {
    this.refCount--;
    if (this.refCount <= 0) {
      if (this.pose) { 
        this.pose.close(); 
        this.pose = null; 
      }
      this.isInitialized = false;
      this.pendingResolves = [];
      MediaPipePoseDetector.instance = null;
    }
  }
}


