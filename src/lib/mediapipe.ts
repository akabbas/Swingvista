// Lazy load MediaPipe
let Pose: any;
let POSE_CONNECTIONS: any;

async function loadMediaPipe() {
  if (!Pose) {
    const module = await import('@mediapipe/pose');
    Pose = module.Pose;
    POSE_CONNECTIONS = module.POSE_CONNECTIONS;
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
  private pose: any = null; // Type is dynamic due to lazy loading
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
      this.pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.pose.setOptions({
        modelComplexity: this.options.modelComplexity,
        smoothLandmarks: this.options.smoothLandmarks,
        enableSegmentation: this.options.enableSegmentation,
        smoothSegmentation: this.options.smoothSegmentation,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence
      });

      // Set up results handler
      this.pose.onResults((results: { poseLandmarks?: any[], poseWorldLandmarks?: any[] }) => {
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

      // Wait for initialization
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MediaPipe initialization timeout'));
        }, 10000);

        this.pose!.onResults(() => {
          clearTimeout(timeout);
          resolve();
        });
      });

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
        const resolve = this.pendingResolves.shift();
        if (resolve) resolve(null);
      }
    });
  }

  getPoseConnections() {
    return POSE_CONNECTIONS;
  }

  destroy() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
    this.pendingResolves = [];
  }
}
