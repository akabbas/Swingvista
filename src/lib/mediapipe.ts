import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  worldLandmarks: PoseLandmark[];
}

export class MediaPipePoseDetector {
  private pose: Pose | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    await new Promise<void>((resolve) => {
      this.pose!.onResults((results) => {
        // Results will be handled by the callback
        resolve();
      });
    });

    this.isInitialized = true;
  }

  async detectPose(videoElement: HTMLVideoElement): Promise<PoseResult | null> {
    if (!this.pose || !this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      const onResults = (results: any) => {
        if (results.poseLandmarks) {
          resolve({
            landmarks: results.poseLandmarks,
            worldLandmarks: results.worldLandmarks || []
          });
        } else {
          resolve(null);
        }
      };

      this.pose!.onResults(onResults);
      this.pose!.send({ image: videoElement });
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
  }
}
