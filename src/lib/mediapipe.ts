// Lazy load MediaPipe
let Pose: unknown;
let POSE_CONNECTIONS: unknown;

async function loadMediaPipe() {
  if (!Pose) {
    const mp: any = await import('@mediapipe/pose');
    Pose = mp.Pose;
    POSE_CONNECTIONS = mp.POSE_CONNECTIONS;
  }
  return { Pose, POSE_CONNECTIONS };
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

export class MediaPipePoseDetector {
  private pose: { setOptions: (opts: any) => void; onResults: (cb: (r: any) => void) => void; send: (args: any) => void; close: () => void } | null = null;
  private isInitialized = false;
  private options: any;
  private pendingResolves: ((result: PoseResult | null) => void)[] = [];

  constructor(options?: any) {
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
      this.pose!.onResults((results: { poseLandmarks?: any[]; poseWorldLandmarks?: any[] }) => {
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
    if (this.pose) { this.pose.close(); this.pose = null; }
    this.isInitialized = false;
    this.pendingResolves = [];
  }
}


