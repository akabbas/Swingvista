export interface ClubHeadPosition {
  x: number;           // 0-1 normalized position
  y: number;           // 0-1 normalized position
  z: number;           // 0-1 depth position
  confidence: number;  // 0-1 confidence score
  frame: number;       // Frame index
  timestamp: number;   // Timestamp in ms
  handedness: 'left' | 'right';
  clubLength: number;  // Estimated club length
  swingPhase: string;  // Current swing phase
}

export interface ClubHeadTrajectory {
  positions: ClubHeadPosition[];
  totalFrames: number;
  duration: number;    // Total duration in ms
  handedness: 'left' | 'right';
  averageConfidence: number;
  smoothness: number;  // 0-1 smoothness score
  completeness: number; // 0-1 how complete the trajectory is
}

export interface TracerConfig {
  minConfidence: number;     // Minimum confidence threshold
  smoothingFactor: number;   // 0-1 smoothing factor
  interpolationFrames: number; // Frames to interpolate for gaps
  maxGapFrames: number;      // Maximum gap frames to interpolate
  clubLengthMultiplier: number; // Multiplier for arm length to get club length
}

export class ClubHeadTracer {
  private config: TracerConfig;
  private trajectory: ClubHeadPosition[] = [];
  private lastValidPosition: ClubHeadPosition | null = null;

  constructor(config: Partial<TracerConfig> = {}) {
    this.config = {
      minConfidence: 0.3,
      smoothingFactor: 0.2,
      interpolationFrames: 3,
      maxGapFrames: 5,
      clubLengthMultiplier: 2.5,
      ...config
    };
  }

  // Detect club head position from pose landmarks using advanced methods
  detectClubHeadPosition(landmarks: any[], frameIndex: number, timestamp: number): ClubHeadPosition | null {
    if (!landmarks || landmarks.length < 33) return null;

    // Get key landmarks for club head detection
    const rightWrist = landmarks[16];
    const leftWrist = landmarks[15];
    const rightElbow = landmarks[14];
    const leftElbow = landmarks[13];
    const rightShoulder = landmarks[12];
    const leftShoulder = landmarks[11];
    const nose = landmarks[0];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!rightWrist || !leftWrist || !rightElbow || !leftElbow) return null;

    // Use multiple methods to detect club head position
    const methods = this.calculateClubHeadMethods(landmarks, frameIndex);
    
    // Weight methods based on confidence and swing phase
    const weights = this.calculateMethodWeights(methods, frameIndex);
    
    // Combine methods with weighted average
    let finalPosition = { x: 0.5, y: 0.5, z: 0.5 };
    let totalWeight = 0;
    let handedness: 'left' | 'right' = 'right';
    let clubLength = 0.3;
    let confidence = 0;

    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];
      const weight = weights[i];
      
      finalPosition.x += method.position.x * weight;
      finalPosition.y += method.position.y * weight;
      finalPosition.z += method.position.z * weight;
      handedness = method.handedness;
      clubLength += method.clubLength * weight;
      confidence += method.confidence * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      finalPosition.x /= totalWeight;
      finalPosition.y /= totalWeight;
      finalPosition.z /= totalWeight;
      clubLength /= totalWeight;
      confidence /= totalWeight;
    }

    // Apply historical smoothing
    if (this.trajectory.length > 0) {
      const lastPosition = this.trajectory[this.trajectory.length - 1];
      const smoothingFactor = Math.min(0.3, confidence * 0.5);
      
      finalPosition.x = finalPosition.x * (1 - smoothingFactor) + lastPosition.x * smoothingFactor;
      finalPosition.y = finalPosition.y * (1 - smoothingFactor) + lastPosition.y * smoothingFactor;
      finalPosition.z = finalPosition.z * (1 - smoothingFactor) + lastPosition.z * smoothingFactor;
    }

    // Clamp to valid range
    const clampedPosition = {
      x: Math.max(0, Math.min(1, finalPosition.x)),
      y: Math.max(0, Math.min(1, finalPosition.y)),
      z: Math.max(0, Math.min(1, finalPosition.z))
    };

    // Determine swing phase
    const swingPhase = this.determineSwingPhase(frameIndex, this.trajectory.length);

    return {
      x: clampedPosition.x,
      y: clampedPosition.y,
      z: clampedPosition.z,
      confidence,
      frame: frameIndex,
      timestamp,
      handedness,
      clubLength,
      swingPhase
    };
  }

  // Calculate club head position using multiple methods
  private calculateClubHeadMethods(landmarks: any[], frameIndex: number): Array<{
    position: { x: number; y: number; z: number };
    handedness: 'left' | 'right';
    clubLength: number;
    confidence: number;
    method: string;
  }> {
    const methods = [];
    const rightWrist = landmarks[16];
    const leftWrist = landmarks[15];
    const rightElbow = landmarks[14];
    const leftElbow = landmarks[13];
    const rightShoulder = landmarks[12];
    const leftShoulder = landmarks[11];
    const nose = landmarks[0];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Method 1: Arm extension analysis (most reliable for club head)
    const rightArmLength = Math.sqrt(
      Math.pow(rightWrist.x - rightElbow.x, 2) + 
      Math.pow(rightWrist.y - rightElbow.y, 2)
    );
    const leftArmLength = Math.sqrt(
      Math.pow(leftWrist.x - leftElbow.x, 2) + 
      Math.pow(leftWrist.y - leftElbow.y, 2)
    );

    // Determine handedness based on arm extension and position
    const isRightHanded = this.determineAdvancedHandedness(landmarks, frameIndex);
    const dominantWrist = isRightHanded ? rightWrist : leftWrist;
    const dominantElbow = isRightHanded ? rightElbow : leftElbow;
    const dominantShoulder = isRightHanded ? rightShoulder : leftShoulder;

    // Calculate arm vector
    const armVector = {
      x: dominantWrist.x - dominantElbow.x,
      y: dominantWrist.y - dominantElbow.y,
      z: (dominantWrist.z || 0) - (dominantElbow.z || 0)
    };

    const armLength = Math.sqrt(armVector.x * armVector.x + armVector.y * armVector.y);
    const armAngle = Math.atan2(armVector.y, armVector.x);

    // Method 1: Direct arm extension
    const clubLength1 = armLength * 2.2; // More conservative estimate
    const clubAngle1 = armAngle + (isRightHanded ? Math.PI / 3 : -Math.PI / 3); // 60 degrees
    const swingPlaneOffset1 = 0.08; // Reduced offset
    
    methods.push({
      position: {
        x: dominantWrist.x + Math.cos(clubAngle1) * clubLength1,
        y: dominantWrist.y + Math.sin(clubAngle1) * clubLength1 + swingPlaneOffset1,
        z: (dominantWrist.z || 0) + (dominantElbow.z || 0) * 0.3
      },
      handedness: isRightHanded ? 'right' : 'left',
      clubLength: clubLength1,
      confidence: Math.min(dominantWrist.visibility || 1, dominantElbow.visibility || 1) * 0.9,
      method: 'arm_extension'
    });

    // Method 2: Shoulder-wrist line extension
    const shoulderWristVector = {
      x: dominantWrist.x - dominantShoulder.x,
      y: dominantWrist.y - dominantShoulder.y,
      z: (dominantWrist.z || 0) - (dominantShoulder.z || 0)
    };
    const shoulderWristLength = Math.sqrt(
      shoulderWristVector.x * shoulderWristVector.x + 
      shoulderWristVector.y * shoulderWristVector.y
    );
    const clubLength2 = shoulderWristLength * 1.8;
    const clubAngle2 = Math.atan2(shoulderWristVector.y, shoulderWristVector.x) + (isRightHanded ? Math.PI / 4 : -Math.PI / 4);
    
    methods.push({
      position: {
        x: dominantWrist.x + Math.cos(clubAngle2) * clubLength2,
        y: dominantWrist.y + Math.sin(clubAngle2) * clubLength2 + 0.06,
        z: (dominantWrist.z || 0) + (dominantShoulder.z || 0) * 0.2
      },
      handedness: isRightHanded ? 'right' : 'left',
      clubLength: clubLength2,
      confidence: Math.min(dominantWrist.visibility || 1, dominantShoulder.visibility || 1) * 0.8,
      method: 'shoulder_wrist'
    });

    // Method 3: Body center reference
    const bodyCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: ((leftHip.z || 0) + (rightHip.z || 0)) / 2
    };
    
    const wristToBodyVector = {
      x: dominantWrist.x - bodyCenter.x,
      y: dominantWrist.y - bodyCenter.y,
      z: (dominantWrist.z || 0) - bodyCenter.z
    };
    
    const clubLength3 = Math.sqrt(
      wristToBodyVector.x * wristToBodyVector.x + 
      wristToBodyVector.y * wristToBodyVector.y
    ) * 1.5;
    
    const clubAngle3 = Math.atan2(wristToBodyVector.y, wristToBodyVector.x) + (isRightHanded ? Math.PI / 2.5 : -Math.PI / 2.5);
    
    methods.push({
      position: {
        x: dominantWrist.x + Math.cos(clubAngle3) * clubLength3,
        y: dominantWrist.y + Math.sin(clubAngle3) * clubLength3 + 0.05,
        z: (dominantWrist.z || 0) + bodyCenter.z * 0.1
      },
      handedness: isRightHanded ? 'right' : 'left',
      clubLength: clubLength3,
      confidence: Math.min(dominantWrist.visibility || 1, (leftHip.visibility || 1), (rightHip.visibility || 1)) * 0.7,
      method: 'body_center'
    });

    // Method 4: Historical trajectory prediction
    if (this.trajectory.length > 2) {
      const recentPositions = this.trajectory.slice(-3);
      const velocity = {
        x: recentPositions[2].x - recentPositions[0].x,
        y: recentPositions[2].y - recentPositions[0].y,
        z: recentPositions[2].z - recentPositions[0].z
      };
      
      const lastPosition = recentPositions[recentPositions.length - 1];
      const predictedPosition = {
        x: lastPosition.x + velocity.x * 0.5,
        y: lastPosition.y + velocity.y * 0.5,
        z: lastPosition.z + velocity.z * 0.5
      };
      
      methods.push({
        position: predictedPosition,
        handedness: lastPosition.handedness,
        clubLength: lastPosition.clubLength,
        confidence: 0.6,
        method: 'trajectory_prediction'
      });
    }

    return methods;
  }

  // Calculate method weights based on confidence and swing phase
  private calculateMethodWeights(methods: Array<{ confidence: number; method: string }>, frameIndex: number): number[] {
    const weights = methods.map(method => method.confidence);
    
    // Adjust weights based on swing phase
    const phase = this.determineSwingPhase(frameIndex, this.trajectory.length);
    
    switch (phase) {
      case 'address':
        // Arm extension is most reliable
        weights[0] *= 1.5;
        weights[1] *= 1.2;
        weights[2] *= 1.0;
        break;
      case 'backswing':
        // Shoulder-wrist line is most reliable
        weights[0] *= 1.2;
        weights[1] *= 1.5;
        weights[2] *= 1.1;
        break;
      case 'top':
        // Body center reference is most reliable
        weights[0] *= 1.1;
        weights[1] *= 1.3;
        weights[2] *= 1.5;
        break;
      case 'downswing':
        // Arm extension is most reliable
        weights[0] *= 1.5;
        weights[1] *= 1.2;
        weights[2] *= 1.0;
        break;
      case 'impact':
        // All methods are important
        weights.forEach((weight, index) => weights[index] = weight * 1.2);
        break;
      case 'follow-through':
        // Trajectory prediction is most reliable
        if (weights.length > 3) weights[3] *= 1.5;
        weights[0] *= 1.1;
        weights[1] *= 1.2;
        weights[2] *= 1.0;
        break;
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight > 0) {
      return weights.map(weight => weight / totalWeight);
    }
    
    return weights.map(() => 1 / weights.length);
  }

  // Advanced handedness detection
  private determineAdvancedHandedness(landmarks: any[], frameIndex: number): boolean {
    const rightWrist = landmarks[16];
    const leftWrist = landmarks[15];
    const rightElbow = landmarks[14];
    const leftElbow = landmarks[13];
    const rightShoulder = landmarks[12];
    const leftShoulder = landmarks[11];
    const nose = landmarks[0];

    // Method 1: Wrist position relative to body center
    const bodyCenterX = (rightWrist.x + leftWrist.x) / 2;
    const rightWristOffset = Math.abs(rightWrist.x - bodyCenterX);
    const leftWristOffset = Math.abs(leftWrist.x - bodyCenterX);

    // Method 2: Arm extension (dominant hand typically extends more)
    const rightArmLength = Math.sqrt(
      Math.pow(rightWrist.x - rightElbow.x, 2) + 
      Math.pow(rightWrist.y - rightElbow.y, 2)
    );
    const leftArmLength = Math.sqrt(
      Math.pow(leftWrist.x - leftElbow.x, 2) + 
      Math.pow(leftWrist.y - leftElbow.y, 2)
    );

    // Method 3: Historical handedness bias
    const historicalBias = this.getHistoricalHandednessBias();

    // Method 4: Swing phase analysis
    const phaseBias = this.getPhaseBasedHandednessBias(frameIndex);

    // Combine methods with weights
    const positionScore = rightWristOffset > leftWristOffset ? 1 : -1;
    const lengthScore = rightArmLength > leftArmLength ? 1 : -1;
    const historicalScore = historicalBias;
    const phaseScore = phaseBias;

    const totalScore = positionScore * 0.3 + lengthScore * 0.3 + historicalScore * 0.2 + phaseScore * 0.2;
    return totalScore > 0;
  }

  // Get phase-based handedness bias
  private getPhaseBasedHandednessBias(frameIndex: number): number {
    if (this.trajectory.length < 5) return 0;
    
    const phase = this.determineSwingPhase(frameIndex, this.trajectory.length);
    
    // In backswing and downswing, dominant hand typically moves more
    if (phase === 'backswing' || phase === 'downswing') {
      const recentPositions = this.trajectory.slice(-3);
      if (recentPositions.length >= 2) {
        const rightHandedCount = recentPositions.filter(p => p.handedness === 'right').length;
        return (rightHandedCount / recentPositions.length) - 0.5;
      }
    }
    
    return 0;
  }

  // Determine handedness based on wrist positions and movement
  private determineHandedness(rightWrist: any, leftWrist: any, rightElbow: any, leftElbow: any): boolean {
    // Method 1: Wrist position relative to body center
    const bodyCenterX = (rightWrist.x + leftWrist.x) / 2;
    const rightWristOffset = Math.abs(rightWrist.x - bodyCenterX);
    const leftWristOffset = Math.abs(leftWrist.x - bodyCenterX);

    // Method 2: Elbow-wrist distance (dominant hand typically has more extension)
    const rightArmLength = Math.sqrt(
      Math.pow(rightWrist.x - rightElbow.x, 2) + 
      Math.pow(rightWrist.y - rightElbow.y, 2)
    );
    const leftArmLength = Math.sqrt(
      Math.pow(leftWrist.x - leftElbow.x, 2) + 
      Math.pow(leftWrist.y - leftElbow.y, 2)
    );

    // Method 3: Historical trajectory analysis
    const historicalBias = this.getHistoricalHandednessBias();

    // Combine methods with weights
    const positionScore = rightWristOffset > leftWristOffset ? 1 : -1;
    const lengthScore = rightArmLength > leftArmLength ? 1 : -1;
    const historicalScore = historicalBias;

    const totalScore = positionScore * 0.4 + lengthScore * 0.3 + historicalScore * 0.3;
    return totalScore > 0;
  }

  // Get historical handedness bias from previous detections
  private getHistoricalHandednessBias(): number {
    if (this.trajectory.length < 5) return 0;
    
    const recentPositions = this.trajectory.slice(-5);
    const rightHandedCount = recentPositions.filter(p => p.handedness === 'right').length;
    return (rightHandedCount / recentPositions.length) - 0.5;
  }

  // Calculate confidence score for club head detection
  private calculateConfidence(wrist: any, elbow: any, shoulder: any): number {
    let confidence = 1.0;

    // Reduce confidence based on landmark visibility
    if (wrist.visibility < 0.8) confidence *= 0.7;
    if (elbow.visibility < 0.8) confidence *= 0.8;
    if (shoulder && shoulder.visibility < 0.8) confidence *= 0.9;

    // Reduce confidence for extreme positions
    const distanceFromCenter = Math.sqrt(
      Math.pow(wrist.x - 0.5, 2) + Math.pow(wrist.y - 0.5, 2)
    );
    if (distanceFromCenter > 0.4) confidence *= 0.8;

    // Reduce confidence for inconsistent arm angles
    if (this.trajectory.length > 0) {
      const lastPosition = this.trajectory[this.trajectory.length - 1];
      const angleChange = Math.abs(
        Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) - 
        Math.atan2(lastPosition.y - elbow.y, lastPosition.x - elbow.x)
      );
      if (angleChange > Math.PI / 4) confidence *= 0.6;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  // Determine swing phase based on frame position and trajectory
  private determineSwingPhase(frameIndex: number, totalFrames: number): string {
    if (totalFrames === 0) return 'address';
    
    const progress = frameIndex / totalFrames;
    
    if (progress < 0.1) return 'address';
    if (progress < 0.4) return 'backswing';
    if (progress < 0.5) return 'top';
    if (progress < 0.8) return 'downswing';
    if (progress < 0.9) return 'impact';
    return 'follow-through';
  }

  // Add position to trajectory with smoothing and gap filling
  addPosition(position: ClubHeadPosition): void {
    // Apply smoothing if we have previous positions
    if (this.trajectory.length > 0 && this.config.smoothingFactor > 0) {
      const lastPosition = this.trajectory[this.trajectory.length - 1];
      position = this.applySmoothing(position, lastPosition);
    }

    // Fill gaps if there are missing frames
    if (this.trajectory.length > 0) {
      const lastFrame = this.trajectory[this.trajectory.length - 1].frame;
      const frameGap = position.frame - lastFrame;
      
      if (frameGap > 1 && frameGap <= this.config.maxGapFrames) {
        this.interpolateGap(lastFrame, position.frame, position);
      }
    }

    this.trajectory.push(position);
    this.lastValidPosition = position;
  }

  // Apply smoothing to reduce jitter
  private applySmoothing(current: ClubHeadPosition, previous: ClubHeadPosition): ClubHeadPosition {
    const factor = this.config.smoothingFactor;
    
    return {
      ...current,
      x: current.x * (1 - factor) + previous.x * factor,
      y: current.y * (1 - factor) + previous.y * factor,
      z: current.z * (1 - factor) + previous.z * factor,
      confidence: Math.min(current.confidence, previous.confidence * 0.9)
    };
  }

  // Interpolate missing frames
  private interpolateGap(startFrame: number, endFrame: number, endPosition: ClubHeadPosition): void {
    const startPosition = this.trajectory[this.trajectory.length - 1];
    const frameGap = endFrame - startFrame;
    
    for (let i = 1; i < frameGap; i++) {
      const progress = i / frameGap;
      const interpolatedPosition: ClubHeadPosition = {
        x: startPosition.x + (endPosition.x - startPosition.x) * progress,
        y: startPosition.y + (endPosition.y - startPosition.y) * progress,
        z: startPosition.z + (endPosition.z - startPosition.z) * progress,
        confidence: startPosition.confidence * (1 - progress) + endPosition.confidence * progress,
        frame: startFrame + i,
        timestamp: startPosition.timestamp + (endPosition.timestamp - startPosition.timestamp) * progress,
        handedness: endPosition.handedness,
        clubLength: endPosition.clubLength,
        swingPhase: this.determineSwingPhase(startFrame + i, this.trajectory.length + frameGap)
      };
      
      this.trajectory.push(interpolatedPosition);
    }
  }

  // Build complete trajectory from poses
  buildTrajectory(poses: any[]): ClubHeadTrajectory {
    this.trajectory = [];
    
    for (let i = 0; i < poses.length; i++) {
      const pose = poses[i];
      const position = this.detectClubHeadPosition(
        pose.landmarks, 
        i, 
        pose.timestamp || i * 33.33
      );
      
      if (position && position.confidence >= this.config.minConfidence) {
        this.addPosition(position);
      }
    }

    return this.getTrajectory();
  }

  // Get current trajectory
  getTrajectory(): ClubHeadTrajectory {
    if (this.trajectory.length === 0) {
      return {
        positions: [],
        totalFrames: 0,
        duration: 0,
        handedness: 'right',
        averageConfidence: 0,
        smoothness: 0,
        completeness: 0
      };
    }

    const totalFrames = this.trajectory.length;
    const duration = this.trajectory[totalFrames - 1].timestamp - this.trajectory[0].timestamp;
    const averageConfidence = this.trajectory.reduce((sum, pos) => sum + pos.confidence, 0) / totalFrames;
    const smoothness = this.calculateSmoothness();
    const completeness = this.calculateCompleteness();

    return {
      positions: [...this.trajectory],
      totalFrames,
      duration,
      handedness: this.trajectory[0].handedness,
      averageConfidence,
      smoothness,
      completeness
    };
  }

  // Calculate trajectory smoothness
  private calculateSmoothness(): number {
    if (this.trajectory.length < 3) return 1;

    let totalAngleChange = 0;
    let validSegments = 0;

    for (let i = 1; i < this.trajectory.length - 1; i++) {
      const prev = this.trajectory[i - 1];
      const curr = this.trajectory[i];
      const next = this.trajectory[i + 1];

      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      
      let angleChange = Math.abs(angle2 - angle1);
      if (angleChange > Math.PI) angleChange = 2 * Math.PI - angleChange;
      
      totalAngleChange += angleChange;
      validSegments++;
    }

    const averageAngleChange = totalAngleChange / validSegments;
    return Math.max(0, 1 - (averageAngleChange / Math.PI));
  }

  // Calculate trajectory completeness
  private calculateCompleteness(): number {
    if (this.trajectory.length === 0) return 0;

    // Check for expected swing phases
    const phases = ['address', 'backswing', 'top', 'downswing', 'impact', 'follow-through'];
    const detectedPhases = new Set(this.trajectory.map(p => p.swingPhase));
    const phaseCompleteness = detectedPhases.size / phases.length;

    // Check for reasonable trajectory coverage
    const xRange = Math.max(...this.trajectory.map(p => p.x)) - Math.min(...this.trajectory.map(p => p.x));
    const yRange = Math.max(...this.trajectory.map(p => p.y)) - Math.min(...this.trajectory.map(p => p.y));
    const coverageCompleteness = Math.min(1, (xRange + yRange) / 0.5);

    return (phaseCompleteness + coverageCompleteness) / 2;
  }

  // Get position at specific frame
  getPositionAtFrame(frame: number): ClubHeadPosition | null {
    return this.trajectory.find(pos => pos.frame === frame) || null;
  }

  // Get position at specific time
  getPositionAtTime(timestamp: number): ClubHeadPosition | null {
    return this.trajectory.find(pos => Math.abs(pos.timestamp - timestamp) < 16.67) || null;
  }

  // Clear trajectory
  clear(): void {
    this.trajectory = [];
    this.lastValidPosition = null;
  }

  // Update configuration
  updateConfig(newConfig: Partial<TracerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
