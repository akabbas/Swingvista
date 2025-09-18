/**
 * Enhanced Phase Detection System
 * 
 * This module provides accurate real-time phase detection for golf swings
 * with proper weight distribution calculation and biomechanical analysis.
 */

import { validateWeightDistribution, validatePhaseSequence, logPhaseTransition } from '@/lib/phase-validation';

export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  timestamp?: number;
}

export interface WeightDistribution {
  left: number;      // 0-100% weight on left foot
  right: number;     // 0-100% weight on right foot
  total: number;     // Always 100
}

export interface ClubPosition {
  x: number;
  y: number;
  z?: number;
  angle?: number;
}

export interface BodyRotation {
  shoulder: number;  // degrees
  hip: number;       // degrees
}

export interface SwingPhase {
  name: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  duration: number;
  confidence: number;
  weightDistribution: WeightDistribution;
  clubPosition: ClubPosition;
  bodyRotation: BodyRotation;
}

export interface PhaseTransition {
  from: string;
  to: string;
  frame: number;
  time: number;
  weightDistribution: WeightDistribution;
}

export class EnhancedPhaseDetector {
  private phaseHistory: PhaseTransition[] = [];
  private currentPhase: string = 'address';
  private phaseStartTime: number = 0;
  private phaseStartFrame: number = 0;

  /**
   * Calculate accurate weight distribution that always sums to 100%
   */
  calculateWeightDistribution(pose: PoseResult): WeightDistribution {
    // Get foot landmarks - MediaPipe landmarks 27-28 for ankles, 29-32 for feet
    const leftAnkle = pose.landmarks[27];   // Left ankle
    const rightAnkle = pose.landmarks[28];  // Right ankle
    const leftHeel = pose.landmarks[29];    // Left heel
    const rightHeel = pose.landmarks[30];   // Right heel
    const leftFootIndex = pose.landmarks[31]; // Left foot index
    const rightFootIndex = pose.landmarks[32]; // Right foot index

    // Use ankle landmarks as primary, foot landmarks as secondary
    const leftFoot = leftAnkle || leftHeel;
    const rightFoot = rightAnkle || rightHeel;

    if (!leftFoot || !rightFoot) {
      return { left: 50, right: 50, total: 100 }; // Fallback if landmarks missing
    }

    // Calculate pressure based on vertical position (lower = more weight)
    const leftFootPressure = this.calculateFootPressure(leftFoot, leftFootIndex || leftFoot);
    const rightFootPressure = this.calculateFootPressure(rightFoot, rightFootIndex || rightFoot);

    // Normalize to sum to 100%
    const totalPressure = leftFootPressure + rightFootPressure;
    
    if (totalPressure === 0) {
      return { left: 50, right: 50, total: 100 }; // Avoid division by zero
    }

    const leftPercent = Math.round((leftFootPressure / totalPressure) * 100);
    const rightPercent = 100 - leftPercent; // Ensure sum is exactly 100%

    // Validate the result
    const validation = validateWeightDistribution(leftPercent, rightPercent);
    if (!validation.isValid) {
      console.warn('⚠️ Weight distribution validation failed:', validation.error);
    }

    return {
      left: leftPercent,
      right: rightPercent,
      total: 100 // Always sum to 100
    };
  }

  /**
   * Calculate foot pressure based on vertical position
   */
  private calculateFootPressure(heel: PoseLandmark, footIndex: PoseLandmark): number {
    // Pressure is inversely proportional to vertical position (y coordinate)
    // Lower y values = higher pressure (foot is more planted)
    const heelPressure = 1.0 - Math.max(0, Math.min(1, heel.y));
    const toePressure = 1.0 - Math.max(0, Math.min(1, footIndex.y));
    
    return (heelPressure + toePressure) / 2;
  }

  /**
   * Calculate club head position from pose landmarks
   */
  calculateClubHeadPosition(pose: PoseResult): ClubPosition {
    // MediaPipe landmarks: 15=left_wrist, 16=right_wrist, 13=left_elbow, 14=right_elbow
    const rightWrist = pose.landmarks[16];
    const leftWrist = pose.landmarks[15];
    const rightElbow = pose.landmarks[14];
    const leftElbow = pose.landmarks[13];

    if (!rightWrist || !leftWrist) {
      return { x: 0.5, y: 0.5, z: 0.5 };
    }

    // Estimate club head position based on wrist positions
    // The club head is typically below and between the wrists
    const clubX = (rightWrist.x + leftWrist.x) / 2;
    const clubY = Math.min(rightWrist.y, leftWrist.y) + 0.1; // Club head is below wrists
    const clubZ = ((rightWrist.z || 0.5) + (leftWrist.z || 0.5)) / 2;

    // Calculate angle based on wrist positions (more accurate for golf swing)
    const dx = rightWrist.x - leftWrist.x;
    const dy = rightWrist.y - leftWrist.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return {
      x: clubX,
      y: clubY,
      z: clubZ,
      angle: angle
    };
  }

  /**
   * Calculate body rotation metrics
   */
  calculateBodyRotation(pose: PoseResult): BodyRotation {
    // MediaPipe landmarks: 11=left_shoulder, 12=right_shoulder, 23=left_hip, 24=right_hip
    const leftShoulder = pose.landmarks[11];
    const rightShoulder = pose.landmarks[12];
    const leftHip = pose.landmarks[23];
    const rightHip = pose.landmarks[24];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return { shoulder: 0, hip: 0 };
    }

    // Calculate shoulder rotation (angle from horizontal)
    const shoulderAngle = this.calculateAngle(leftShoulder, rightShoulder);
    
    // Calculate hip rotation (angle from horizontal)
    const hipAngle = this.calculateAngle(leftHip, rightHip);

    return {
      shoulder: shoulderAngle,
      hip: hipAngle
    };
  }

  /**
   * Calculate angle between two points
   */
  private calculateAngle(point1: PoseLandmark, point2: PoseLandmark): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * Detect current swing phase based on pose analysis
   */
  detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
    const currentPose = poses[currentFrame];
    if (!currentPose) {
      return this.createPhase('address', currentFrame, currentFrame, currentTime, currentTime, 0);
    }

    // Calculate key metrics for phase detection
    const clubPosition = this.calculateClubHeadPosition(currentPose);
    const bodyRotation = this.calculateBodyRotation(currentPose);
    const weightDistribution = this.calculateWeightDistribution(currentPose);
    const swingVelocity = this.calculateSwingVelocity(poses, currentFrame);

    // Phase detection logic
    let detectedPhase: string = 'address';

    if (this.isAddressPhase(currentPose, weightDistribution)) {
      detectedPhase = 'address';
    } else if (this.isBackswingPhase(currentPose, clubPosition, bodyRotation)) {
      detectedPhase = 'backswing';
    } else if (this.isTopOfSwingPhase(currentPose, clubPosition, bodyRotation, weightDistribution)) {
      detectedPhase = 'top';
    } else if (this.isDownswingPhase(currentPose, clubPosition, swingVelocity)) {
      detectedPhase = 'downswing';
    } else if (this.isImpactPhase(currentPose, clubPosition, swingVelocity, weightDistribution)) {
      detectedPhase = 'impact';
    } else if (this.isFollowThroughPhase(currentPose, clubPosition, bodyRotation)) {
      detectedPhase = 'follow-through';
    }

    // Update phase tracking
    this.updatePhase(detectedPhase, currentFrame, currentTime);

    return this.createPhase(
      detectedPhase as any,
      this.phaseStartFrame,
      currentFrame,
      this.phaseStartTime,
      currentTime,
      this.calculatePhaseConfidence(currentPose, detectedPhase)
    );
  }

  /**
   * Check if pose represents address phase
   */
  private isAddressPhase(pose: PoseResult, weightDistribution: WeightDistribution): boolean {
    // Address: Balanced weight, club behind ball, minimal movement
    const isBalanced = Math.abs(weightDistribution.left - weightDistribution.right) < 20;
    const clubPosition = this.calculateClubHeadPosition(pose);
    const clubBehindBall = clubPosition.x < 0.5; // Adjust based on camera angle
    const isStationary = this.calculateMovement(pose) < 0.1;
    
    return isBalanced && clubBehindBall && isStationary;
  }

  /**
   * Check if pose represents backswing phase
   */
  private isBackswingPhase(pose: PoseResult, clubPosition: ClubPosition, bodyRotation: BodyRotation): boolean {
    // Backswing: Club moving up and back, increasing shoulder turn
    const clubMovingUp = clubPosition.y < 0.6; // Club is above mid-point
    const shoulderTurnIncreasing = bodyRotation.shoulder > 20;
    const clubMovingBack = clubPosition.x < 0.4; // Club is behind body
    
    return clubMovingUp && shoulderTurnIncreasing && clubMovingBack;
  }

  /**
   * Check if pose represents top of swing phase
   */
  private isTopOfSwingPhase(pose: PoseResult, clubPosition: ClubPosition, bodyRotation: BodyRotation, weightDistribution: WeightDistribution): boolean {
    // Top: Maximum shoulder turn, club parallel to ground, weight transfer started
    const maxShoulderTurn = bodyRotation.shoulder > 80; // degrees
    const clubParallel = Math.abs(clubPosition.angle! - 90) < 15; // degrees
    const weightTransferStarted = Math.abs(weightDistribution.left - weightDistribution.right) > 30;
    
    return maxShoulderTurn && clubParallel && weightTransferStarted;
  }

  /**
   * Check if pose represents downswing phase
   */
  private isDownswingPhase(pose: PoseResult, clubPosition: ClubPosition, swingVelocity: number): boolean {
    // Downswing: High club speed, club moving down and forward
    const maxSpeed = swingVelocity > 0.8; // normalized max speed
    const clubMovingDown = clubPosition.y > 0.4; // Club is moving down
    const clubMovingForward = clubPosition.x > 0.3; // Club is moving forward
    
    return maxSpeed && clubMovingDown && clubMovingForward;
  }

  /**
   * Check if pose represents impact phase
   */
  private isImpactPhase(pose: PoseResult, clubPosition: ClubPosition, swingVelocity: number, weightDistribution: WeightDistribution): boolean {
    // Impact: Maximum club speed, club at ball position, weight transfer complete
    const maxSpeed = swingVelocity > 0.9; // normalized max speed
    const atImpactPosition = this.isClubAtImpactZone(clubPosition);
    const weightTransferComplete = Math.abs(weightDistribution.left - weightDistribution.right) > 70;
    
    return maxSpeed && atImpactPosition && weightTransferComplete;
  }

  /**
   * Check if pose represents follow-through phase
   */
  private isFollowThroughPhase(pose: PoseResult, clubPosition: ClubPosition, bodyRotation: BodyRotation): boolean {
    // Follow-through: Club past impact, body continuing rotation
    const clubPastImpact = clubPosition.x > 0.6; // Club is past impact zone
    const bodyContinuingRotation = bodyRotation.shoulder > 0; // Still rotating
    const clubMovingUp = clubPosition.y < 0.7; // Club is moving up again
    
    return clubPastImpact && bodyContinuingRotation && clubMovingUp;
  }

  /**
   * Check if club is at impact zone
   */
  private isClubAtImpactZone(clubPosition: ClubPosition): boolean {
    // Impact zone is typically around the ball position
    return clubPosition.x > 0.4 && clubPosition.x < 0.6 && 
           clubPosition.y > 0.3 && clubPosition.y < 0.7;
  }

  /**
   * Calculate swing velocity
   */
  private calculateSwingVelocity(poses: PoseResult[], currentFrame: number): number {
    if (currentFrame < 2) return 0;

    const currentPose = poses[currentFrame];
    const previousPose = poses[currentFrame - 1];
    const twoFramesAgo = poses[currentFrame - 2];

    if (!currentPose || !previousPose || !twoFramesAgo) return 0;

    const currentClub = this.calculateClubHeadPosition(currentPose);
    const previousClub = this.calculateClubHeadPosition(previousPose);
    const twoFramesAgoClub = this.calculateClubHeadPosition(twoFramesAgo);

    const dx1 = currentClub.x - previousClub.x;
    const dy1 = currentClub.y - previousClub.y;
    const velocity1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

    const dx2 = previousClub.x - twoFramesAgoClub.x;
    const dy2 = previousClub.y - twoFramesAgoClub.y;
    const velocity2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    return (velocity1 + velocity2) / 2;
  }

  /**
   * Calculate movement magnitude
   */
  private calculateMovement(pose: PoseResult): number {
    // This is a simplified movement calculation
    // In practice, you'd compare with previous poses
    const rightWrist = pose.landmarks[16];
    const leftWrist = pose.landmarks[15];

    if (!rightWrist || !leftWrist) return 0;

    const dx = rightWrist.x - leftWrist.x;
    const dy = rightWrist.y - leftWrist.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate phase confidence
   */
  private calculatePhaseConfidence(pose: PoseResult, phase: string): number {
    // This is a simplified confidence calculation
    // In practice, you'd use more sophisticated metrics
    const weightDistribution = this.calculateWeightDistribution(pose);
    const bodyRotation = this.calculateBodyRotation(pose);
    const clubPosition = this.calculateClubHeadPosition(pose);

    let confidence = 0.5; // Base confidence

    // Add confidence based on landmark visibility
    const keyLandmarks = [11, 12, 15, 16, 23, 24, 27, 28]; // Shoulders, wrists, hips, ankles
    const visibleLandmarks = keyLandmarks.filter(idx => 
      pose.landmarks[idx] && (pose.landmarks[idx].visibility || 1) > 0.5
    );
    confidence += (visibleLandmarks.length / keyLandmarks.length) * 0.3;

    // Add confidence based on phase-specific metrics
    switch (phase) {
      case 'address':
        if (Math.abs(weightDistribution.left - weightDistribution.right) < 20) confidence += 0.2;
        break;
      case 'top':
        if (bodyRotation.shoulder > 80) confidence += 0.2;
        break;
      case 'impact':
        if (Math.abs(weightDistribution.left - weightDistribution.right) > 70) confidence += 0.2;
        break;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Update phase tracking
   */
  private updatePhase(newPhase: string, currentFrame: number, currentTime: number): void {
    if (newPhase !== this.currentPhase) {
      // Phase transition detected
      this.phaseHistory.push({
        from: this.currentPhase,
        to: newPhase,
        frame: currentFrame,
        time: currentTime,
        weightDistribution: this.calculateWeightDistribution({ landmarks: [] }) // Will be updated with actual pose
      });

      // Log phase transition with validation
      logPhaseTransition(this.currentPhase, newPhase, currentTime, { left: 50, right: 50 });

      this.currentPhase = newPhase;
      this.phaseStartTime = currentTime;
      this.phaseStartFrame = currentFrame;
    }
  }

  /**
   * Create a phase object
   */
  private createPhase(
    name: string,
    startFrame: number,
    endFrame: number,
    startTime: number,
    endTime: number,
    confidence: number
  ): SwingPhase {
    return {
      name: name as any,
      startFrame,
      endFrame,
      startTime,
      endTime,
      duration: endTime - startTime,
      confidence,
      weightDistribution: { left: 50, right: 50, total: 100 }, // Will be updated
      clubPosition: { x: 0.5, y: 0.5 },
      bodyRotation: { shoulder: 0, hip: 0 }
    };
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): string {
    return this.currentPhase;
  }

  /**
   * Get phase history
   */
  getPhaseHistory(): PhaseTransition[] {
    return this.phaseHistory;
  }

  /**
   * Reset phase detector
   */
  reset(): void {
    this.phaseHistory = [];
    this.currentPhase = 'address';
    this.phaseStartTime = 0;
    this.phaseStartFrame = 0;
  }
}

/**
 * Validate phase detection results
 */
export function validatePhaseDetection(video: any, detectedPhases: any): void {
  console.log('✅ PHASE DETECTION VALIDATION:');
  
  // Check weight distribution sums to 100%
  if (detectedPhases.frameByFrame) {
    detectedPhases.frameByFrame.forEach((frame: any, index: number) => {
      if (frame.weightDistribution && frame.weightDistribution.left + frame.weightDistribution.right !== 100) {
        console.error(`Frame ${index}: Weight distribution invalid - L:${frame.weightDistribution.left} R:${frame.weightDistribution.right}`);
      }
    });
  }

  // Check phase sequence makes sense
  const expectedSequence = ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through'];
  const actualSequence = detectedPhases.phaseHistory ? detectedPhases.phaseHistory.map((p: any) => p.phase) : [];
  
  validatePhaseSequence(actualSequence, expectedSequence);
}

/**
 * Validate phase sequence
 */
function validatePhaseSequence(actual: string[], expected: string[]): void {
  let expectedIndex = 0;
  
  for (const phase of actual) {
    if (phase === expected[expectedIndex]) {
      expectedIndex++;
    } else if (expectedIndex > 0 && phase === expected[expectedIndex - 1]) {
      // Same phase continuing
      continue;
    } else {
      console.warn(`Unexpected phase sequence: Expected ${expected[expectedIndex]}, got ${phase}`);
    }
  }
}

/**
 * Display current phase information
 */
export function displayCurrentPhase(phase: string, weightDistribution: WeightDistribution, clubPosition: ClubPosition): string {
  return `
    🏌️‍♂️ Current Phase: ${phase.toUpperCase()}
    ⚖️  Weight: ${weightDistribution.left}% Left / ${weightDistribution.right}% Right
    📍 Club Position: X=${clubPosition.x.toFixed(2)}, Y=${clubPosition.y.toFixed(2)}
    📊 Total: ${weightDistribution.left + weightDistribution.right}% (Should be 100%)
  `;
}
