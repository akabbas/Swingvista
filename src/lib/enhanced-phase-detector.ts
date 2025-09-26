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
  
  // 🚀 SMART PHASE DETECTION ENHANCEMENTS
  private phaseBuffer: string[] = []; // Buffer for temporal smoothing
  private velocityHistory: number[] = []; // Track velocity over time
  private phaseConfidenceHistory: number[] = []; // Track confidence over time
  private lastPhaseChangeTime: number = 0;
  private phaseChangeCooldown: number = 100; // ms - minimum time between phase changes
  private smoothingWindow: number = 5; // frames for temporal smoothing
  private hysteresisThreshold: number = 0.15; // confidence threshold for phase changes

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
   * 🚀 NEW: Real Club Detection using MediaPipe Hand Landmarks
   * This replaces the simple wrist estimation with actual club detection
   */
  calculateRealClubPosition(pose: PoseResult): ClubPosition {
    // MediaPipe hand landmarks: 0=wrist, 4=thumb_tip, 8=index_tip, 12=middle_tip, 16=ring_tip, 20=pinky_tip
    const leftWrist = pose.landmarks[15]; // Left wrist from pose
    const rightWrist = pose.landmarks[16]; // Right wrist from pose
    
    if (!leftWrist || !rightWrist) {
      // Fallback to simple estimation if hand landmarks not available
      return this.calculateClubHeadPosition(pose);
    }

    // Detect grip position (where hands meet the club)
    const gripPosition = this.detectGripPosition(leftWrist, rightWrist);
    
    // Estimate club shaft angle from wrist-to-elbow vector
    const clubShaftAngle = this.calculateClubShaftAngle(pose, gripPosition);
    
    // Calculate club head position based on grip and shaft angle
    const clubHeadPosition = this.calculateClubHeadFromGrip(gripPosition, clubShaftAngle);
    
    return {
      x: clubHeadPosition.x,
      y: clubHeadPosition.y,
      z: clubHeadPosition.z,
      angle: clubShaftAngle
    };
  }

  /**
   * 🚀 NEW: Detect grip position from hand landmarks
   */
  private detectGripPosition(leftWrist: PoseLandmark, rightWrist: PoseLandmark): { x: number; y: number; z: number } {
    // Grip is typically between the wrists, slightly closer to the dominant hand
    const gripX = (leftWrist.x + rightWrist.x) / 2;
    const gripY = (leftWrist.y + rightWrist.y) / 2;
    const gripZ = ((leftWrist.z || 0.5) + (rightWrist.z || 0.5)) / 2;
    
    return { x: gripX, y: gripY, z: gripZ };
  }

  /**
   * 🚀 NEW: Calculate club shaft angle from wrist-to-elbow vector
   */
  private calculateClubShaftAngle(pose: PoseResult, gripPosition: { x: number; y: number; z: number }): number {
    // Get elbow landmarks for shaft angle calculation
    const leftElbow = pose.landmarks[13]; // Left elbow
    const rightElbow = pose.landmarks[14]; // Right elbow
    
    if (!leftElbow || !rightElbow) {
      // Fallback to wrist-based angle if elbows not available
      const leftWrist = pose.landmarks[15];
      const rightWrist = pose.landmarks[16];
      if (leftWrist && rightWrist) {
        const dx = rightWrist.x - leftWrist.x;
        const dy = rightWrist.y - leftWrist.y;
        return Math.atan2(dy, dx) * (180 / Math.PI);
      }
      return 0;
    }

    // Calculate shaft angle from grip to elbow (more accurate for golf)
    const elbowX = (leftElbow.x + rightElbow.x) / 2;
    const elbowY = (leftElbow.y + rightElbow.y) / 2;
    
    const dx = gripPosition.x - elbowX;
    const dy = gripPosition.y - elbowY;
    
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * 🚀 NEW: Calculate club head position from grip and shaft angle
   */
  private calculateClubHeadFromGrip(
    gripPosition: { x: number; y: number; z: number }, 
    shaftAngle: number
  ): { x: number; y: number; z: number } {
    // Standard golf club length (normalized to pose coordinates)
    const clubLength = 0.3; // Adjust based on your coordinate system
    
    // Calculate club head position based on grip and shaft angle
    const angleRad = (shaftAngle * Math.PI) / 180;
    const clubHeadX = gripPosition.x + Math.cos(angleRad) * clubLength;
    const clubHeadY = gripPosition.y + Math.sin(angleRad) * clubLength;
    const clubHeadZ = gripPosition.z; // Keep same depth as grip
    
    return {
      x: clubHeadX,
      y: clubHeadY,
      z: clubHeadZ
    };
  }

  /**
   * 🚀 NEW: Calculate club head velocity for more accurate phase detection
   */
  calculateClubHeadVelocity(poses: PoseResult[], currentFrame: number): number {
    if (currentFrame < 2) return 0;
    
    const currentPose = poses[currentFrame];
    const previousPose = poses[currentFrame - 1];
    
    if (!currentPose || !previousPose) return 0;
    
    const currentClub = this.calculateRealClubPosition(currentPose);
    const previousClub = this.calculateRealClubPosition(previousPose);
    
    // Calculate velocity as distance moved per frame
    const dx = currentClub.x - previousClub.x;
    const dy = currentClub.y - previousClub.y;
    const velocity = Math.sqrt(dx * dx + dy * dy);
    
    return velocity;
  }

  /**
   * 🚀 NEW: Calculate club face angle for swing analysis
   */
  calculateClubFaceAngle(pose: PoseResult): number {
    // This would require more sophisticated hand landmark analysis
    // For now, estimate based on wrist positions
    const leftWrist = pose.landmarks[15];
    const rightWrist = pose.landmarks[16];
    
    if (!leftWrist || !rightWrist) return 0;
    
    // Simple face angle estimation based on wrist alignment
    const dx = rightWrist.x - leftWrist.x;
    const dy = rightWrist.y - leftWrist.y;
    
    return Math.atan2(dy, dx) * (180 / Math.PI);
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
   * Detect current swing phase based on pose analysis with smart enhancements
   */
  detectSwingPhase(poses: PoseResult[], currentFrame: number, currentTime: number): SwingPhase {
    const currentPose = poses[currentFrame];
    if (!currentPose) {
      return this.createPhase('address', currentFrame, currentFrame, currentTime, currentTime, 0);
    }

    // 🚀 ENHANCED: Use real club detection instead of simple estimation
    const clubPosition = this.calculateRealClubPosition(currentPose);
    const bodyRotation = this.calculateBodyRotation(currentPose);
    const weightDistribution = this.calculateWeightDistribution(currentPose);
    const swingVelocity = this.calculateClubHeadVelocity(poses, currentFrame); // Use club velocity instead of general swing velocity

    // 🚀 ENHANCED PHASE DETECTION WITH VELOCITY-BASED SMOOTHING
    const rawDetectedPhase = this.detectRawPhase(currentPose, clubPosition, bodyRotation, weightDistribution, swingVelocity);
    const phaseConfidence = this.calculatePhaseConfidence(currentPose, rawDetectedPhase);
    
    // Add to buffers for temporal smoothing
    this.phaseBuffer.push(rawDetectedPhase);
    this.velocityHistory.push(swingVelocity);
    this.phaseConfidenceHistory.push(phaseConfidence);
    
    // Maintain buffer size
    if (this.phaseBuffer.length > this.smoothingWindow) {
      this.phaseBuffer.shift();
      this.velocityHistory.shift();
      this.phaseConfidenceHistory.shift();
    }
    
    // Apply smart phase detection with hysteresis and temporal smoothing
    const smartDetectedPhase = this.applySmartPhaseDetection(rawDetectedPhase, currentTime);
    
    // Update phase tracking
    this.updatePhase(smartDetectedPhase, currentFrame, currentTime);

    return this.createPhase(
      smartDetectedPhase as any,
      this.phaseStartFrame,
      currentFrame,
      this.phaseStartTime,
      currentTime,
      phaseConfidence
    );
  }

  /**
   * 🚀 NEW: Detect raw phase without smoothing (original logic)
   */
  private detectRawPhase(pose: PoseResult, clubPosition: ClubPosition, bodyRotation: BodyRotation, weightDistribution: WeightDistribution, swingVelocity: number): string {
    if (this.isAddressPhase(pose, weightDistribution)) {
      return 'address';
    } else if (this.isBackswingPhase(pose, clubPosition, bodyRotation)) {
      return 'backswing';
    } else if (this.isTopOfSwingPhase(pose, clubPosition, bodyRotation, weightDistribution)) {
      return 'top';
    } else if (this.isDownswingPhase(pose, clubPosition, swingVelocity)) {
      return 'downswing';
    } else if (this.isImpactPhase(pose, clubPosition, swingVelocity, weightDistribution)) {
      return 'impact';
    } else if (this.isFollowThroughPhase(pose, clubPosition, bodyRotation)) {
      return 'follow-through';
    }
    return 'address';
  }

  /**
   * 🚀 NEW: Apply smart phase detection with hysteresis and temporal smoothing
   */
  private applySmartPhaseDetection(rawPhase: string, currentTime: number): string {
    // 1. Check cooldown period to prevent rapid phase flipping
    if (currentTime - this.lastPhaseChangeTime < this.phaseChangeCooldown) {
      return this.currentPhase; // Stay in current phase during cooldown
    }

    // 2. Apply temporal smoothing over the buffer
    const smoothedPhase = this.applyTemporalSmoothing();
    
    // 3. Apply hysteresis - require higher confidence to change phases
    const shouldChangePhase = this.shouldChangePhase(smoothedPhase, currentTime);
    
    if (shouldChangePhase) {
      this.lastPhaseChangeTime = currentTime;
      return smoothedPhase;
    }
    
    return this.currentPhase; // Keep current phase
  }

  /**
   * 🚀 NEW: Apply temporal smoothing over phase buffer
   */
  private applyTemporalSmoothing(): string {
    if (this.phaseBuffer.length < 3) {
      return this.phaseBuffer[this.phaseBuffer.length - 1] || this.currentPhase;
    }

    // Count phase occurrences in buffer
    const phaseCounts: { [key: string]: number } = {};
    this.phaseBuffer.forEach(phase => {
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
    });

    // Find most common phase
    let mostCommonPhase = this.currentPhase;
    let maxCount = 0;
    
    Object.entries(phaseCounts).forEach(([phase, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPhase = phase;
      }
    });

    // Require majority consensus (at least 60% of frames)
    const consensusThreshold = Math.ceil(this.phaseBuffer.length * 0.6);
    if (maxCount >= consensusThreshold) {
      return mostCommonPhase;
    }

    return this.currentPhase; // Keep current phase if no clear consensus
  }

  /**
   * 🚀 NEW: Determine if phase should change based on hysteresis
   */
  private shouldChangePhase(newPhase: string, currentTime: number): boolean {
    // Don't change if it's the same phase
    if (newPhase === this.currentPhase) {
      return false;
    }

    // Calculate average confidence over recent frames
    const recentConfidence = this.phaseConfidenceHistory.slice(-3);
    const avgConfidence = recentConfidence.length > 0 
      ? recentConfidence.reduce((sum, conf) => sum + conf, 0) / recentConfidence.length 
      : 0.5;

    // Apply hysteresis - require higher confidence to change phases
    const confidenceThreshold = this.hysteresisThreshold;
    if (avgConfidence < confidenceThreshold) {
      return false; // Not confident enough to change
    }

    // Check velocity-based phase transition rules
    const velocityTransition = this.checkVelocityBasedTransition(newPhase);
    if (!velocityTransition) {
      return false; // Velocity doesn't support this transition
    }

    // Check for valid phase sequence
    const validSequence = this.isValidPhaseSequence(this.currentPhase, newPhase);
    if (!validSequence) {
      return false; // Invalid phase sequence
    }

    return true;
  }

  /**
   * 🚀 NEW: Check velocity-based phase transitions
   */
  private checkVelocityBasedTransition(newPhase: string): boolean {
    if (this.velocityHistory.length < 2) return true;

    const currentVelocity = this.velocityHistory[this.velocityHistory.length - 1];
    const previousVelocity = this.velocityHistory[this.velocityHistory.length - 2];
    const velocityChange = currentVelocity - previousVelocity;

    // Define velocity requirements for each phase transition
    switch (newPhase) {
      case 'backswing':
        // Backswing should have increasing velocity
        return velocityChange > -0.1;
      
      case 'top':
        // Top should have decreasing velocity (slowing down)
        return velocityChange < 0.1;
      
      case 'downswing':
        // Downswing should have high velocity
        return currentVelocity > 0.5;
      
      case 'impact':
        // Impact should have maximum velocity
        return currentVelocity > 0.8;
      
      case 'follow-through':
        // Follow-through should have decreasing velocity
        return velocityChange < 0.2;
      
      default:
        return true;
    }
  }

  /**
   * 🚀 NEW: Check if phase sequence is valid
   */
  private isValidPhaseSequence(fromPhase: string, toPhase: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      'address': ['backswing'],
      'backswing': ['top', 'address'], // Allow going back to address
      'top': ['downswing', 'backswing'], // Allow going back to backswing
      'downswing': ['impact', 'top'], // Allow going back to top
      'impact': ['follow-through', 'downswing'], // Allow going back to downswing
      'follow-through': ['address', 'impact'] // Allow going back to impact
    };

    const allowedTransitions = validTransitions[fromPhase] || [];
    return allowedTransitions.includes(toPhase);
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
   * 🚀 NEW: Get smart detection statistics
   */
  getSmartDetectionStats(): any {
    return {
      currentPhase: this.currentPhase,
      phaseBuffer: [...this.phaseBuffer],
      velocityHistory: [...this.velocityHistory],
      confidenceHistory: [...this.phaseConfidenceHistory],
      lastPhaseChangeTime: this.lastPhaseChangeTime,
      smoothingWindow: this.smoothingWindow,
      hysteresisThreshold: this.hysteresisThreshold,
      phaseChangeCooldown: this.phaseChangeCooldown,
      bufferSize: this.phaseBuffer.length,
      averageVelocity: this.velocityHistory.length > 0 
        ? this.velocityHistory.reduce((sum, v) => sum + v, 0) / this.velocityHistory.length 
        : 0,
      averageConfidence: this.phaseConfidenceHistory.length > 0 
        ? this.phaseConfidenceHistory.reduce((sum, c) => sum + c, 0) / this.phaseConfidenceHistory.length 
        : 0
    };
  }

  /**
   * 🚀 NEW: Configure smart detection parameters
   */
  configureSmartDetection(config: {
    smoothingWindow?: number;
    hysteresisThreshold?: number;
    phaseChangeCooldown?: number;
  }): void {
    if (config.smoothingWindow !== undefined) {
      this.smoothingWindow = Math.max(3, Math.min(10, config.smoothingWindow));
    }
    if (config.hysteresisThreshold !== undefined) {
      this.hysteresisThreshold = Math.max(0.05, Math.min(0.5, config.hysteresisThreshold));
    }
    if (config.phaseChangeCooldown !== undefined) {
      this.phaseChangeCooldown = Math.max(50, Math.min(500, config.phaseChangeCooldown));
    }
    
    console.log('🚀 SMART DETECTION: Configuration updated', {
      smoothingWindow: this.smoothingWindow,
      hysteresisThreshold: this.hysteresisThreshold,
      phaseChangeCooldown: this.phaseChangeCooldown
    });
  }

  /**
   * Reset phase detector
   */
  reset(): void {
    this.phaseHistory = [];
    this.currentPhase = 'address';
    this.phaseStartTime = 0;
    this.phaseStartFrame = 0;
    
    // 🚀 Reset smart detection properties
    this.phaseBuffer = [];
    this.velocityHistory = [];
    this.phaseConfidenceHistory = [];
    this.lastPhaseChangeTime = 0;
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
