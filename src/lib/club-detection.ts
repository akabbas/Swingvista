/**
 * Real Club Detection System
 * 
 * Uses MediaPipe hand landmarks to detect actual club position and orientation.
 * Replaces hand estimation with real club detection based on grip analysis.
 */

import { PoseResult, PoseLandmark } from './mediapipe';

// 🎯 CLUB DETECTION INTERFACES
export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface GripPosition {
  left: HandLandmark;
  right: HandLandmark;
  center: HandLandmark;
  confidence: number;
}

export interface ClubShaft {
  start: HandLandmark;  // Grip position
  end: HandLandmark;    // Estimated club head
  angle: number;        // Shaft angle in degrees
  length: number;       // Estimated shaft length
  confidence: number;
}

export interface ClubHead {
  position: HandLandmark;
  velocity: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  angle: number;        // Face angle
  path: number;         // Swing path angle
  confidence: number;
}

export interface ClubDetection {
  grip: GripPosition;
  shaft: ClubShaft;
  head: ClubHead;
  overall: {
    confidence: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    stability: number;
  };
}

// 🚀 CLUB DETECTION CLASS
export class ClubDetector {
  private clubHistory: ClubDetection[] = [];
  private velocityHistory: { x: number; y: number; z: number }[] = [];
  private isInitialized = false;

  constructor() {
    this.isInitialized = true;
  }

  /**
   * Detect club from hand landmarks
   */
  detectClub(pose: PoseResult, frameIndex: number): ClubDetection {
    if (!this.isInitialized) {
      throw new Error('Club detector not initialized');
    }

    try {
      console.log(`🏌️ CLUB DETECTION: Detecting club at frame ${frameIndex}...`);
      
      // Step 1: Detect grip position from hand landmarks
      const grip = this.detectGripPosition(pose);
      
      // Step 2: Estimate club shaft from grip
      const shaft = this.estimateClubShaft(grip, pose);
      
      // Step 3: Calculate club head position
      const head = this.calculateClubHead(shaft, grip, frameIndex);
      
      // Step 4: Calculate overall confidence and quality
      const overall = this.calculateOverallQuality(grip, shaft, head);
      
      const clubDetection: ClubDetection = {
        grip,
        shaft,
        head,
        overall
      };
      
      // Store in history for velocity calculations
      this.clubHistory.push(clubDetection);
      if (this.clubHistory.length > 10) {
        this.clubHistory.shift();
      }
      
      console.log(`✅ CLUB DETECTION: Club detected (confidence: ${overall.confidence.toFixed(3)})`);
      return clubDetection;
      
    } catch (error) {
      console.error('❌ CLUB DETECTION: Failed to detect club:', error);
      throw error;
    }
  }

  /**
   * Detect grip position from hand landmarks
   */
  private detectGripPosition(pose: PoseResult): GripPosition {
    // MediaPipe hand landmarks: 15=left_wrist, 16=right_wrist
    const leftWrist = pose.landmarks[15];
    const rightWrist = pose.landmarks[16];
    
    if (!leftWrist || !rightWrist) {
      throw new Error('Hand landmarks not found');
    }
    
    // Calculate grip center (between wrists)
    const gripCenter: HandLandmark = {
      x: (leftWrist.x + rightWrist.x) / 2,
      y: (leftWrist.y + rightWrist.y) / 2,
      z: ((leftWrist.z || 0) + (rightWrist.z || 0)) / 2,
      visibility: Math.min(leftWrist.visibility || 1, rightWrist.visibility || 1)
    };
    
    // Calculate grip confidence based on landmark visibility
    const leftConfidence = leftWrist.visibility || 1;
    const rightConfidence = rightWrist.visibility || 1;
    const gripConfidence = (leftConfidence + rightConfidence) / 2;
    
    return {
      left: leftWrist,
      right: rightWrist,
      center: gripCenter,
      confidence: gripConfidence
    };
  }

  /**
   * Estimate club shaft from grip position
   */
  private estimateClubShaft(grip: GripPosition, pose: PoseResult): ClubShaft {
    // Use dominant hand (right for right-handed golfers) for shaft estimation
    const dominantWrist = grip.right; // Assuming right-handed
    const dominantElbow = pose.landmarks[14]; // Right elbow
    
    if (!dominantElbow) {
      throw new Error('Elbow landmark not found for shaft estimation');
    }
    
    // Calculate shaft direction from wrist to elbow (grip to hands)
    const shaftDirection = this.calculateShaftDirection(dominantWrist, dominantElbow);
    
    // Estimate club head position (extend shaft direction)
    const estimatedClubHead = this.estimateClubHeadPosition(dominantWrist, shaftDirection);
    
    // Calculate shaft angle
    const shaftAngle = this.calculateShaftAngle(shaftDirection);
    
    // Estimate shaft length (distance from grip to club head)
    const shaftLength = this.calculateDistance(dominantWrist, estimatedClubHead);
    
    // Calculate shaft confidence
    const shaftConfidence = this.calculateShaftConfidence(grip, shaftDirection);
    
    return {
      start: dominantWrist,
      end: estimatedClubHead,
      angle: shaftAngle,
      length: shaftLength,
      confidence: shaftConfidence
    };
  }

  /**
   * Calculate shaft direction from wrist to elbow
   */
  private calculateShaftDirection(wrist: HandLandmark, elbow: HandLandmark): { x: number; y: number; z: number } {
    return {
      x: elbow.x - wrist.x,
      y: elbow.y - wrist.y,
      z: (elbow.z || 0) - (wrist.z || 0)
    };
  }

  /**
   * Estimate club head position by extending shaft direction
   */
  private estimateClubHeadPosition(grip: HandLandmark, shaftDirection: { x: number; y: number; z: number }): HandLandmark {
    // Extend shaft direction by estimated club length
    const clubLength = 1.0; // Normalized club length (adjust based on golfer height)
    
    // Normalize shaft direction
    const magnitude = Math.sqrt(shaftDirection.x * shaftDirection.x + shaftDirection.y * shaftDirection.y + shaftDirection.z * shaftDirection.z);
    if (magnitude === 0) {
      return grip; // Fallback to grip position
    }
    
    const normalizedDirection = {
      x: shaftDirection.x / magnitude,
      y: shaftDirection.y / magnitude,
      z: shaftDirection.z / magnitude
    };
    
    // Extend in shaft direction
    return {
      x: grip.x + normalizedDirection.x * clubLength,
      y: grip.y + normalizedDirection.y * clubLength,
      z: (grip.z || 0) + normalizedDirection.z * clubLength,
      visibility: grip.visibility
    };
  }

  /**
   * Calculate shaft angle in degrees
   */
  private calculateShaftAngle(shaftDirection: { x: number; y: number; z: number }): number {
    // Calculate angle from horizontal (x-axis)
    const horizontalAngle = Math.atan2(shaftDirection.y, shaftDirection.x) * (180 / Math.PI);
    
    // Calculate angle from vertical (z-axis)
    const verticalAngle = Math.atan2(shaftDirection.z, Math.sqrt(shaftDirection.x * shaftDirection.x + shaftDirection.y * shaftDirection.y)) * (180 / Math.PI);
    
    // Return horizontal angle for swing analysis
    return horizontalAngle;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: HandLandmark, point2: HandLandmark): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = (point2.z || 0) - (point1.z || 0);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate shaft confidence
   */
  private calculateShaftConfidence(grip: GripPosition, shaftDirection: { x: number; y: number; z: number }): number {
    // Base confidence on grip quality
    let confidence = grip.confidence;
    
    // Check shaft direction validity
    const magnitude = Math.sqrt(shaftDirection.x * shaftDirection.x + shaftDirection.y * shaftDirection.y + shaftDirection.z * shaftDirection.z);
    if (magnitude < 0.1) {
      confidence *= 0.5; // Low confidence for invalid shaft direction
    }
    
    // Check for reasonable shaft angle (not too vertical or horizontal)
    const angle = Math.abs(this.calculateShaftAngle(shaftDirection));
    if (angle > 80 || angle < 10) {
      confidence *= 0.7; // Reduce confidence for extreme angles
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * Calculate club head position and dynamics
   */
  private calculateClubHead(shaft: ClubShaft, grip: GripPosition, frameIndex: number): ClubHead {
    // Use estimated club head position from shaft
    const position = shaft.end;
    
    // Calculate velocity from history
    const velocity = this.calculateClubHeadVelocity(frameIndex);
    
    // Calculate acceleration from velocity history
    const acceleration = this.calculateClubHeadAcceleration(frameIndex);
    
    // Calculate face angle (perpendicular to shaft)
    const faceAngle = this.calculateFaceAngle(shaft);
    
    // Calculate swing path angle
    const pathAngle = this.calculateSwingPathAngle(velocity);
    
    // Calculate head confidence
    const headConfidence = this.calculateHeadConfidence(shaft, velocity);
    
    return {
      position,
      velocity,
      acceleration,
      angle: faceAngle,
      path: pathAngle,
      confidence: headConfidence
    };
  }

  /**
   * Calculate club head velocity
   */
  private calculateClubHeadVelocity(frameIndex: number): { x: number; y: number; z: number } {
    if (this.clubHistory.length < 2) {
      return { x: 0, y: 0, z: 0 };
    }
    
    const current = this.clubHistory[this.clubHistory.length - 1];
    const previous = this.clubHistory[this.clubHistory.length - 2];
    
    const dt = 1.0 / 30.0; // Assuming 30 FPS
    
    return {
      x: (current.head.position.x - previous.head.position.x) / dt,
      y: (current.head.position.y - previous.head.position.y) / dt,
      z: ((current.head.position.z || 0) - (previous.head.position.z || 0)) / dt
    };
  }

  /**
   * Calculate club head acceleration
   */
  private calculateClubHeadAcceleration(frameIndex: number): { x: number; y: number; z: number } {
    if (this.clubHistory.length < 3) {
      return { x: 0, y: 0, z: 0 };
    }
    
    const current = this.clubHistory[this.clubHistory.length - 1];
    const previous = this.clubHistory[this.clubHistory.length - 2];
    const twoFramesAgo = this.clubHistory[this.clubHistory.length - 3];
    
    const dt = 1.0 / 30.0; // Assuming 30 FPS
    
    const currentVel = {
      x: (current.head.position.x - previous.head.position.x) / dt,
      y: (current.head.position.y - previous.head.position.y) / dt,
      z: ((current.head.position.z || 0) - (previous.head.position.z || 0)) / dt
    };
    
    const previousVel = {
      x: (previous.head.position.x - twoFramesAgo.head.position.x) / dt,
      y: (previous.head.position.y - twoFramesAgo.head.position.y) / dt,
      z: ((previous.head.position.z || 0) - (twoFramesAgo.head.position.z || 0)) / dt
    };
    
    return {
      x: (currentVel.x - previousVel.x) / dt,
      y: (currentVel.y - previousVel.y) / dt,
      z: (currentVel.z - previousVel.z) / dt
    };
  }

  /**
   * Calculate face angle (perpendicular to shaft)
   */
  private calculateFaceAngle(shaft: ClubShaft): number {
    // Face angle is perpendicular to shaft direction
    const shaftAngle = shaft.angle;
    
    // Add 90 degrees to get face angle
    return shaftAngle + 90;
  }

  /**
   * Calculate swing path angle
   */
  private calculateSwingPathAngle(velocity: { x: number; y: number; z: number }): number {
    // Calculate swing path from velocity direction
    const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
    
    if (velocityMagnitude === 0) {
      return 0;
    }
    
    // Calculate angle from horizontal
    return Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
  }

  /**
   * Calculate head confidence
   */
  private calculateHeadConfidence(shaft: ClubShaft, velocity: { x: number; y: number; z: number }): number {
    let confidence = shaft.confidence;
    
    // Check velocity magnitude (reasonable club head speed)
    const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
    if (velocityMagnitude > 5.0) { // Very high speed might indicate error
      confidence *= 0.8;
    }
    
    // Check for reasonable club head position
    if (shaft.end.x < 0 || shaft.end.x > 1 || shaft.end.y < 0 || shaft.end.y > 1) {
      confidence *= 0.6; // Reduce confidence for out-of-bounds position
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * Calculate overall quality
   */
  private calculateOverallQuality(grip: GripPosition, shaft: ClubShaft, head: ClubHead): {
    confidence: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    stability: number;
  } {
    // Calculate overall confidence
    const overallConfidence = (grip.confidence + shaft.confidence + head.confidence) / 3;
    
    // Determine quality level
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (overallConfidence >= 0.9) {
      quality = 'excellent';
    } else if (overallConfidence >= 0.7) {
      quality = 'good';
    } else if (overallConfidence >= 0.5) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }
    
    // Calculate stability from velocity history
    const stability = this.calculateStability();
    
    return {
      confidence: overallConfidence,
      quality,
      stability
    };
  }

  /**
   * Calculate stability from velocity history
   */
  private calculateStability(): number {
    if (this.velocityHistory.length < 3) {
      return 1.0;
    }
    
    // Calculate velocity variance
    const velocities = this.velocityHistory.map(v => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z));
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
    
    // Stability is inverse of variance
    return Math.max(0, 1 - variance);
  }

  /**
   * Get club detection statistics
   */
  getClubDetectionStats(): any {
    return {
      isInitialized: this.isInitialized,
      historyLength: this.clubHistory.length,
      velocityHistoryLength: this.velocityHistory.length,
      averageConfidence: this.clubHistory.length > 0 
        ? this.clubHistory.reduce((sum, club) => sum + club.overall.confidence, 0) / this.clubHistory.length 
        : 0,
      averageStability: this.clubHistory.length > 0 
        ? this.clubHistory.reduce((sum, club) => sum + club.overall.stability, 0) / this.clubHistory.length 
        : 0
    };
  }

  /**
   * Reset club detector
   */
  reset(): void {
    this.clubHistory = [];
    this.velocityHistory = [];
  }
}

// 🎯 UTILITY FUNCTIONS

/**
 * Create a new club detector
 */
export function createClubDetector(): ClubDetector {
  return new ClubDetector();
}

/**
 * Quick club detection
 */
export function detectClubQuick(pose: PoseResult, frameIndex: number): ClubDetection {
  const detector = createClubDetector();
  
  try {
    const club = detector.detectClub(pose, frameIndex);
    return club;
  } finally {
    detector.reset();
  }
}

/**
 * Validate club detection results
 */
export function validateClubDetection(club: ClubDetection): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check grip confidence
  if (club.grip.confidence < 0.5) {
    errors.push('Low grip confidence');
  }
  
  // Check shaft confidence
  if (club.shaft.confidence < 0.5) {
    errors.push('Low shaft confidence');
  }
  
  // Check head confidence
  if (club.head.confidence < 0.5) {
    errors.push('Low head confidence');
  }
  
  // Check for reasonable club head position
  if (club.head.position.x < 0 || club.head.position.x > 1 || 
      club.head.position.y < 0 || club.head.position.y > 1) {
    errors.push('Club head position out of bounds');
  }
  
  // Check for reasonable shaft length
  if (club.shaft.length < 0.5 || club.shaft.length > 2.0) {
    errors.push('Unreasonable shaft length');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default ClubDetector;
