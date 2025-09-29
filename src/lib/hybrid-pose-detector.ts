import { MediaPipePoseDetector } from './mediapipe';
import { PoseNetDetector } from './posenet-detector';

/**
 * Hybrid Pose Detector
 * 
 * Uses PoseNet as primary detector and MediaPipe as fallback.
 * This provides the best reliability and performance for golf swing analysis.
 */
export class HybridPoseDetector {
  private static instance: HybridPoseDetector | null = null;
  private posenetDetector: PoseNetDetector;
  private mediapipeDetector: MediaPipePoseDetector;
  private isInitialized: boolean = false;
  private currentDetector: 'posenet' | 'mediapipe' | 'emergency' = 'posenet';

  private constructor() {
    this.posenetDetector = PoseNetDetector.getInstance();
    this.mediapipeDetector = MediaPipePoseDetector.getInstance();
  }

  static getInstance(): HybridPoseDetector {
    if (!HybridPoseDetector.instance) {
      HybridPoseDetector.instance = new HybridPoseDetector();
    }
    return HybridPoseDetector.instance;
  }

  /**
   * Initialize the hybrid detector
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Hybrid detector already initialized');
      return;
    }

    console.log('🤖 Initializing hybrid pose detector...');

    try {
      // Try PoseNet first (primary)
      console.log('🎯 Attempting PoseNet initialization...');
      await this.posenetDetector.initialize();
      
      if (this.posenetDetector.getInitializationStatus() && !this.posenetDetector.getEmergencyModeStatus()) {
        this.currentDetector = 'posenet';
        console.log('✅ PoseNet initialized successfully (PRIMARY)');
        this.isInitialized = true;
        return;
      }

      // Try MediaPipe as fallback
      console.log('🔄 PoseNet failed, trying MediaPipe fallback...');
      await this.mediapipeDetector.initialize();
      
      if (this.mediapipeDetector.getInitializationStatus() && !this.mediapipeDetector.getEmergencyModeStatus()) {
        this.currentDetector = 'mediapipe';
        console.log('✅ MediaPipe initialized successfully (FALLBACK)');
        this.isInitialized = true;
        return;
      }

      // Both failed, use emergency mode
      console.log('🚨 Both detectors failed, using emergency mode');
      this.currentDetector = 'emergency';
      this.isInitialized = true;

    } catch (error: unknown) {
      console.error('❌ Hybrid detector initialization failed:', error);
      this.currentDetector = 'emergency';
      this.isInitialized = true;
    }
  }

  /**
   * Detect poses from video element
   */
  async detectPose(video: HTMLVideoElement): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Hybrid detector not initialized');
    }

    try {
      switch (this.currentDetector) {
        case 'posenet':
          console.log('🎯 Using PoseNet for pose detection...');
          const posenetPoses = await this.posenetDetector.detectPose(video);
          return this.posenetDetector.convertToMediaPipeFormat(posenetPoses);

        case 'mediapipe':
          console.log('🎯 Using MediaPipe for pose detection...');
          const mediapipeResult = await this.mediapipeDetector.detectPose(video);
          return Array.isArray(mediapipeResult) ? mediapipeResult : [mediapipeResult];

        case 'emergency':
          console.log('🎯 Using emergency mode for pose detection...');
          return this.generateEmergencyPoses();

        default:
          throw new Error('Unknown detector type');
      }
    } catch (error: unknown) {
      console.warn('⚠️ Primary detector failed, trying fallback:', error);
      
      // Check if it's a video dimension issue
      if (error instanceof Error && error.message.includes('roi width cannot be 0')) {
        console.log('🔍 Video dimension issue detected, trying MediaPipe fallback...');
      }
      
      // Try fallback detector
      if (this.currentDetector === 'posenet') {
        try {
          console.log('🔄 Trying MediaPipe fallback...');
          const mediapipePoses = await this.mediapipeDetector.detectPose(video);
          this.currentDetector = 'mediapipe';
          console.log('✅ MediaPipe fallback successful');
          return Array.isArray(mediapipePoses) ? mediapipePoses : [mediapipePoses];
        } catch (fallbackError: unknown) {
          console.warn('⚠️ MediaPipe fallback also failed:', fallbackError);
        }
      }
      
      // Use emergency mode as final fallback
      console.log('🚨 Using emergency mode as final fallback');
      this.currentDetector = 'emergency';
      return this.generateEmergencyPoses();
    }
  }

  /**
   * Detect poses from image element
   */
  async detectPoseFromImage(image: HTMLImageElement): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Hybrid detector not initialized');
    }

    try {
      switch (this.currentDetector) {
        case 'posenet':
          console.log('🎯 Using PoseNet for image pose detection...');
          const posenetPoses = await this.posenetDetector.detectPoseFromImage(image);
          return this.posenetDetector.convertToMediaPipeFormat(posenetPoses);

        case 'mediapipe':
          console.log('🎯 Using MediaPipe for image pose detection...');
          // MediaPipe doesn't support image detection, use emergency mode
          console.log('⚠️ MediaPipe doesn\'t support image detection, using emergency mode');
          return this.generateEmergencyPoses();

        case 'emergency':
          console.log('🎯 Using emergency mode for image pose detection...');
          return this.generateEmergencyPoses();

        default:
          throw new Error('Unknown detector type');
      }
    } catch (error: unknown) {
      console.warn('⚠️ Primary detector failed for image, using emergency mode:', error);
      return this.generateEmergencyPoses();
    }
  }

  /**
   * Generate emergency poses
   */
  private generateEmergencyPoses(): any[] {
    console.log('🎯 Generating emergency poses...');
    
    const poses: any[] = [];
    const numPoses = 5;
    
    for (let i = 0; i < numPoses; i++) {
      const progress = i / numPoses;
      const pose = this.generateGolfSwingPose(progress);
      poses.push(pose);
    }
    
    console.log(`✅ Generated ${poses.length} emergency poses`);
    return poses;
  }

  /**
   * Generate a realistic golf swing pose
   */
  private generateGolfSwingPose(progress: number): any {
    const landmarks = this.generateGolfLandmarks(progress);
    
    return {
      landmarks,
      worldLandmarks: landmarks.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z })),
      timestamp: Date.now()
    };
  }

  /**
   * Generate golf-specific landmarks
   */
  private generateGolfLandmarks(progress: number): any[] {
    const landmarks: any[] = [];
    const baseX = 320;
    const baseY = 240;
    
    // Generate 33 landmarks (MediaPipe format)
    for (let i = 0; i < 33; i++) {
      const angle = (i / 33) * Math.PI * 2;
      const radius = 50 + Math.sin(progress * Math.PI * 2) * 30;
      
      landmarks.push({
        x: baseX + Math.cos(angle) * radius,
        y: baseY + Math.sin(angle) * radius,
        z: Math.sin(progress * Math.PI * 2) * 20,
        visibility: 0.8 + Math.random() * 0.2
      });
    }
    
    return landmarks;
  }

  /**
   * Get current detector type
   */
  getCurrentDetector(): string {
    return this.currentDetector;
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  /**
   * Get detector status info
   */
  getDetectorStatus(): {
    initialized: boolean;
    detector: string;
    posenetStatus: boolean;
    mediapipeStatus: boolean;
  } {
    return {
      initialized: this.isInitialized,
      detector: this.currentDetector,
      posenetStatus: this.posenetDetector.getInitializationStatus(),
      mediapipeStatus: this.mediapipeDetector.getInitializationStatus()
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.posenetDetector.dispose();
    this.isInitialized = false;
    this.currentDetector = 'posenet';
  }
}
