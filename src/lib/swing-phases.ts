import { PoseLandmark, TrajectoryPoint, SwingTrajectory } from './mediapipe';

export interface SwingPhase {
  name: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  duration: number;
  keyLandmarks: PoseLandmark[];
  color: string;
  description: string;
  confidence: number; // 0-1 confidence in phase detection
  keyMetrics: {
    clubPosition?: { x: number; y: number; z: number };
    bodyRotation?: { shoulder: number; hip: number };
    weightDistribution?: { left: number; right: number };
    velocity?: number;
    acceleration?: number;
  };
}

export interface SwingPhaseAnalysis {
  phases: SwingPhase[];
  totalDuration: number;
  tempoRatio: number;
  swingPlane: number;
  weightTransfer: number;
  rotation: { shoulder: number; hip: number };
}

export interface PhaseDetectionConfig {
  minPhaseDuration: number;
  velocityThreshold: number;
  accelerationThreshold: number;
  smoothingWindow: number;
}

export class SwingPhaseDetector {
  private config: PhaseDetectionConfig;
  constructor(config: Partial<PhaseDetectionConfig> = {}) {
    this.config = { minPhaseDuration: 5, velocityThreshold: 0.01, accelerationThreshold: 0.1, smoothingWindow: 3, ...config };
  }

  detectPhases(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): SwingPhaseAnalysis {
    console.log('⏰ PHASE TIMING DEBUG: Starting comprehensive swing phase detection...');
    console.log('⏰ PHASE TIMING DEBUG: Total frames:', landmarks.length, 'Total duration:', timestamps[timestamps.length - 1] - timestamps[0], 'ms');
    
    const totalFrames = landmarks.length;
    const totalDuration = timestamps[totalFrames - 1] - timestamps[0];
    
    // Enhanced phase detection with better timing algorithms
    const addressEnd = this.detectAddressEnd(landmarks, trajectory, timestamps);
    const backswingTop = this.detectBackswingTop(landmarks, trajectory, timestamps);
    const downswingStart = this.detectDownswingStart(landmarks, trajectory, timestamps, backswingTop);
    const impact = this.detectImpact(landmarks, trajectory, timestamps);
    const followThroughStart = this.detectFollowThroughStart(landmarks, trajectory, timestamps, impact);
    
    console.log('⏰ PHASE TIMING DEBUG: Phase detection results:');
    console.log('⏰ PHASE TIMING DEBUG: - Address end:', addressEnd, `(${timestamps[addressEnd]?.toFixed(0) || 0}ms)`);
    console.log('⏰ PHASE TIMING DEBUG: - Backswing top:', backswingTop, `(${timestamps[backswingTop]?.toFixed(0) || 0}ms)`);
    console.log('⏰ PHASE TIMING DEBUG: - Downswing start:', downswingStart, `(${timestamps[downswingStart]?.toFixed(0) || 0}ms)`);
    console.log('⏰ PHASE TIMING DEBUG: - Impact:', impact, `(${timestamps[impact]?.toFixed(0) || 0}ms)`);
    console.log('⏰ PHASE TIMING DEBUG: - Follow-through start:', followThroughStart, `(${timestamps[followThroughStart]?.toFixed(0) || 0}ms)`);
    
    // Validate phase sequence and timing
    const validatedPhases = this.validatePhaseSequence(addressEnd, backswingTop, downswingStart, impact, followThroughStart, totalFrames);
    
    // Create phases with enhanced descriptions and confidence scores
    const phases: SwingPhase[] = [
      this.createPhase('address', 0, validatedPhases.addressEnd, timestamps, landmarks, '#3B82F6', 
        'Setup and address position - maintaining posture and balance', 0.95),
      this.createPhase('backswing', validatedPhases.addressEnd, validatedPhases.backswingTop, timestamps, landmarks, '#10B981', 
        'Takeaway to top of backswing - building power and maintaining tempo', 0.85),
      this.createPhase('top', validatedPhases.backswingTop, validatedPhases.downswingStart, timestamps, landmarks, '#F59E0B', 
        'Top of swing position - transition and weight shift preparation', 0.75),
      this.createPhase('downswing', validatedPhases.downswingStart, validatedPhases.impact, timestamps, landmarks, '#EF4444', 
        'Downswing to impact - generating power and clubhead speed', 0.90),
      this.createPhase('impact', validatedPhases.impact, Math.min(validatedPhases.impact + 5, totalFrames - 1), timestamps, landmarks, '#DC2626', 
        'Ball contact moment - maximum clubhead speed and accuracy', 0.95),
      this.createPhase('follow-through', validatedPhases.followThroughStart, totalFrames - 1, timestamps, landmarks, '#8B5CF6', 
        'Follow-through to finish - maintaining balance and completing the swing', 0.85)
    ];
    
    // Smooth phase boundaries to prevent overlaps
    const smoothedPhases = this.smoothPhaseBoundaries(phases);
    
    // Normalize phase timing to video duration for proper timeline alignment
    const normalizedPhases = this.normalizePhaseTiming(smoothedPhases, totalDuration);
    
    // Calculate comprehensive metrics
    const tempoRatio = this.calculateTempoRatio(normalizedPhases);
    const swingPlane = this.calculateSwingPlane(landmarks, validatedPhases.impact);
    const weightTransfer = this.calculateWeightTransfer(landmarks, 0, validatedPhases.impact);
    const rotation = this.calculateRotation(landmarks, 0, validatedPhases.backswingTop);
    
    // Add phase-specific metrics to each phase
    const enhancedPhases = this.addPhaseSpecificMetrics(normalizedPhases, landmarks, trajectory, timestamps);
    
    console.log('⏰ PHASE TIMING DEBUG: Enhanced phase analysis complete with normalized timing:');
    enhancedPhases.forEach(p => {
      console.log(`⏰ PHASE TIMING DEBUG: - ${p.name}: frames ${p.startFrame}-${p.endFrame} (${p.duration.toFixed(0)}ms), start: ${p.startTime.toFixed(0)}ms, end: ${p.endTime.toFixed(0)}ms, confidence: ${(p.confidence * 100).toFixed(0)}%`);
    });
    
    return { phases: enhancedPhases, totalDuration, tempoRatio, swingPlane, weightTransfer, rotation };
  }

  private detectAddressEnd(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): number {
    console.log('⏰ PHASE TIMING DEBUG: Detecting address end...');
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 3) return Math.min(5, landmarks.length - 1);
    
    // Look for first significant movement of right wrist (club takeaway)
    for (let i = 1; i < Math.min(30, rightWrist.length); i++) {
      const velocity = this.calculateVelocity(rightWrist[i - 1], rightWrist[i]);
      const timeDiff = timestamps[i] - timestamps[0];
      
      // Check for movement in any direction (back, up, or away from body)
      const dx = rightWrist[i].x - rightWrist[0].x;
      const dy = rightWrist[i].y - rightWrist[0].y;
      const movement = Math.sqrt(dx * dx + dy * dy);
      
      if (velocity > this.config.velocityThreshold || movement > 0.05) {
        console.log(`⏰ PHASE TIMING DEBUG: Address end detected at frame ${i}, velocity: ${velocity.toFixed(4)}, movement: ${movement.toFixed(4)}`);
        return Math.max(this.config.minPhaseDuration, i);
      }
    }
    
    console.log('⏰ PHASE TIMING DEBUG: Address end not detected, using default');
    return Math.min(10, landmarks.length - 1);
  }

  private detectBackswingTop(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): number {
    console.log('⏰ PHASE TIMING DEBUG: Detecting backswing top...');
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 3) return Math.min(15, landmarks.length - 1);
    
    let maxY = rightWrist[0].y;
    let topFrame = 0;
    const searchEnd = Math.min(Math.floor(rightWrist.length * 0.8), rightWrist.length - 1);
    
    // Find the highest point (lowest Y value in screen coordinates)
    for (let i = 1; i <= searchEnd; i++) {
      if (rightWrist[i].y < maxY) {
        maxY = rightWrist[i].y;
        topFrame = i;
      }
    }
    
    // Additional check: look for velocity change indicating top of swing
    let velocityChangeFrame = topFrame;
    for (let i = 1; i < searchEnd; i++) {
      if (i >= 2) {
        const v1 = this.calculateVelocity(rightWrist[i - 2], rightWrist[i - 1]);
        const v2 = this.calculateVelocity(rightWrist[i - 1], rightWrist[i]);
        if (v2 < v1 * 0.5) { // Significant velocity drop
          velocityChangeFrame = i;
          break;
        }
      }
    }
    
    const finalFrame = Math.max(topFrame, velocityChangeFrame);
    console.log(`⏰ PHASE TIMING DEBUG: Backswing top detected at frame ${finalFrame}, Y position: ${maxY.toFixed(4)}`);
    return Math.max(this.config.minPhaseDuration, finalFrame);
  }

  private detectDownswingStart(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[], backswingTop: number): number {
    console.log('Detecting downswing start...');
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 3 || backswingTop >= rightWrist.length - 1) return backswingTop + 1;
    
    // Look for the first frame after backswing top where wrist starts moving down
    for (let i = backswingTop + 1; i < Math.min(backswingTop + 20, rightWrist.length - 1); i++) {
      const velocity = this.calculateVelocity(rightWrist[i - 1], rightWrist[i]);
      const dy = rightWrist[i].y - rightWrist[i - 1].y;
      
      // Downswing starts when wrist moves down (positive Y change) with significant velocity
      if (dy > 0 && velocity > this.config.velocityThreshold * 0.5) {
        console.log(`Downswing start detected at frame ${i}, velocity: ${velocity.toFixed(4)}`);
        return i;
      }
    }
    
    console.log('Downswing start not clearly detected, using backswing top + 2');
    return Math.min(backswingTop + 2, landmarks.length - 1);
  }

  private detectImpact(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): number {
    console.log('Detecting impact...');
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 3) return Math.min(20, landmarks.length - 1);
    
    let maxAcceleration = 0;
    let impactFrame = Math.floor(landmarks.length * 0.7);
    const searchStart = Math.floor(rightWrist.length * 0.4);
    const searchEnd = Math.min(rightWrist.length - 1, landmarks.length - 1);
    
    // Look for maximum acceleration (deceleration) indicating impact
    for (let i = searchStart; i < searchEnd; i++) {
      if (i >= 2) {
        const acceleration = this.calculateAcceleration(rightWrist[i - 2], rightWrist[i - 1], rightWrist[i]);
        if (acceleration > maxAcceleration) {
          maxAcceleration = acceleration;
          impactFrame = i;
        }
      }
    }
    
    // Additional check: look for minimum Y position (lowest point of swing)
    let minY = rightWrist[0].y;
    let minYFrame = impactFrame;
    for (let i = searchStart; i < searchEnd; i++) {
      if (rightWrist[i].y > minY) {
        minY = rightWrist[i].y;
        minYFrame = i;
      }
    }
    
    // Use the frame closest to the middle of the search range
    const finalFrame = Math.abs(impactFrame - (searchStart + searchEnd) / 2) < Math.abs(minYFrame - (searchStart + searchEnd) / 2) 
      ? impactFrame : minYFrame;
    
    console.log(`Impact detected at frame ${finalFrame}, acceleration: ${maxAcceleration.toFixed(4)}`);
    return Math.max(this.config.minPhaseDuration, finalFrame);
  }

  private detectFollowThroughStart(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[], impactFrame: number): number {
    console.log('Detecting follow-through start...');
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 3 || impactFrame >= rightWrist.length - 1) return Math.min(impactFrame + 2, landmarks.length - 1);
    
    // Follow-through starts shortly after impact
    const followThroughStart = Math.min(impactFrame + 3, landmarks.length - 1);
    console.log(`Follow-through start at frame ${followThroughStart}`);
    return followThroughStart;
  }

  private createPhase(
    name: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through',
    startFrame: number, 
    endFrame: number, 
    timestamps: number[], 
    landmarks: PoseLandmark[][], 
    color: string, 
    description: string,
    confidence: number = 0.8
  ): SwingPhase {
    const startTime = timestamps[startFrame] || 0;
    const endTime = timestamps[endFrame] || 0;
    const duration = endTime - startTime;
    const midFrame = Math.floor((startFrame + endFrame) / 2);
    const keyLandmarks = landmarks[midFrame] || [];
    
    // Calculate key metrics for this phase
    const keyMetrics = this.calculatePhaseMetrics(landmarks, startFrame, endFrame, midFrame);
    
    return {
      name,
      startFrame,
      endFrame,
      startTime,
      endTime,
      duration,
      keyLandmarks,
      color,
      description,
      confidence,
      keyMetrics
    };
  }

  private calculatePhaseMetrics(landmarks: PoseLandmark[][], startFrame: number, endFrame: number, midFrame: number) {
    const midLandmarks = landmarks[midFrame] || [];
    const startLandmarks = landmarks[startFrame] || [];
    const endLandmarks = landmarks[endFrame] || [];
    
    // Calculate club position (approximate from right wrist)
    const rightWrist = midLandmarks[16]; // Right wrist
    const clubPosition = rightWrist ? { x: rightWrist.x, y: rightWrist.y, z: rightWrist.z || 0 } : undefined;
    
    // Calculate body rotation
    const bodyRotation = this.calculateBodyRotation(startLandmarks, midLandmarks);
    
    // Calculate weight distribution
    const weightDistribution = this.calculateWeightDistribution(midLandmarks);
    
    // Calculate velocity and acceleration
    const velocity = this.calculatePhaseVelocity(landmarks, startFrame, endFrame);
    const acceleration = this.calculatePhaseAcceleration(landmarks, startFrame, endFrame);
    
    return {
      clubPosition,
      bodyRotation,
      weightDistribution,
      velocity,
      acceleration
    };
  }

  private calculateBodyRotation(startLandmarks: PoseLandmark[], currentLandmarks: PoseLandmark[]) {
    if (!startLandmarks || !currentLandmarks) return { shoulder: 0, hip: 0 };
    
    const startLeftShoulder = startLandmarks[11];
    const startRightShoulder = startLandmarks[12];
    const currentLeftShoulder = currentLandmarks[11];
    const currentRightShoulder = currentLandmarks[12];
    
    const startLeftHip = startLandmarks[23];
    const startRightHip = startLandmarks[24];
    const currentLeftHip = currentLandmarks[23];
    const currentRightHip = currentLandmarks[24];
    
    let shoulderRotation = 0;
    let hipRotation = 0;
    
    if (startLeftShoulder && startRightShoulder && currentLeftShoulder && currentRightShoulder) {
      const startAngle = Math.atan2(startRightShoulder.y - startLeftShoulder.y, startRightShoulder.x - startLeftShoulder.x);
      const currentAngle = Math.atan2(currentRightShoulder.y - currentLeftShoulder.y, currentRightShoulder.x - currentLeftShoulder.x);
      shoulderRotation = Math.abs(currentAngle - startAngle) * (180 / Math.PI);
    }
    
    if (startLeftHip && startRightHip && currentLeftHip && currentRightHip) {
      const startAngle = Math.atan2(startRightHip.y - startLeftHip.y, startRightHip.x - startLeftHip.x);
      const currentAngle = Math.atan2(currentRightHip.y - currentLeftHip.y, currentRightHip.x - currentLeftHip.x);
      hipRotation = Math.abs(currentAngle - startAngle) * (180 / Math.PI);
    }
    
    return { shoulder: shoulderRotation, hip: hipRotation };
  }

  private calculateWeightDistribution(landmarks: PoseLandmark[]) {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    
    if (!leftAnkle || !rightAnkle) return { left: 50, right: 50 };
    
    // Simple weight distribution based on ankle positions
    const totalX = Math.abs(leftAnkle.x) + Math.abs(rightAnkle.x);
    const leftWeight = totalX > 0 ? (Math.abs(leftAnkle.x) / totalX) * 100 : 50;
    const rightWeight = 100 - leftWeight;
    
    return { left: leftWeight, right: rightWeight };
  }

  private calculatePhaseVelocity(landmarks: PoseLandmark[][], startFrame: number, endFrame: number): number {
    if (endFrame - startFrame < 2) return 0;
    
    const startLandmarks = landmarks[startFrame];
    const endLandmarks = landmarks[endFrame];
    
    if (!startLandmarks || !endLandmarks) return 0;
    
    const rightWristStart = startLandmarks[16];
    const rightWristEnd = endLandmarks[16];
    
    if (!rightWristStart || !rightWristEnd) return 0;
    
    const dx = rightWristEnd.x - rightWristStart.x;
    const dy = rightWristEnd.y - rightWristStart.y;
    const dz = (rightWristEnd.z || 0) - (rightWristStart.z || 0);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private calculatePhaseAcceleration(landmarks: PoseLandmark[][], startFrame: number, endFrame: number): number {
    if (endFrame - startFrame < 3) return 0;
    
    const midFrame = Math.floor((startFrame + endFrame) / 2);
    const v1 = this.calculatePhaseVelocity(landmarks, startFrame, midFrame);
    const v2 = this.calculatePhaseVelocity(landmarks, midFrame, endFrame);
    
    return Math.abs(v2 - v1);
  }

  private calculateTempoRatio(phases: SwingPhase[]): number {
    const backswingPhase = phases.find(p => p.name === 'backswing');
    const downswingPhase = phases.find(p => p.name === 'downswing');
    
    if (!backswingPhase || !downswingPhase) return 1.0;
    
    const backswingTime = backswingPhase.duration;
    const downswingTime = downswingPhase.duration;
    
    if (downswingTime <= 0) return 1.0;
    
    return backswingTime / downswingTime;
  }

  private calculateSwingPlane(landmarks: PoseLandmark[][], impactFrame: number): number {
    if (impactFrame >= landmarks.length) return 0;
    
    const impact = landmarks[impactFrame];
    const leftShoulder = impact[11];
    const rightShoulder = impact[12];
    const leftHip = impact[23];
    const rightHip = impact[24];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    const shoulderCenter = { 
      x: (leftShoulder.x + rightShoulder.x) / 2, 
      y: (leftShoulder.y + rightShoulder.y) / 2 
    };
    const hipCenter = { 
      x: (leftHip.x + rightHip.x) / 2, 
      y: (leftHip.y + rightHip.y) / 2 
    };
    
    const angle = Math.atan2(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y);
    return (angle * 180) / Math.PI;
  }

  private calculateWeightTransfer(landmarks: PoseLandmark[][], startFrame: number, impactFrame: number): number {
    if (startFrame >= landmarks.length || impactFrame >= landmarks.length) return 0;
    
    const start = landmarks[startFrame];
    const impact = landmarks[impactFrame];
    const leftAnkle = start[27];
    const rightAnkle = start[28];
    const impactLeftAnkle = impact[27];
    const impactRightAnkle = impact[28];
    
    if (!leftAnkle || !rightAnkle || !impactLeftAnkle || !impactRightAnkle) return 0;
    
    const startWeight = Math.abs(leftAnkle.x - rightAnkle.x);
    const impactWeight = Math.abs(impactLeftAnkle.x - impactRightAnkle.x);
    
    if (startWeight === 0) return 0;
    
    return Math.max(0, 1 - Math.abs(impactWeight - startWeight) / startWeight);
  }

  private calculateRotation(landmarks: PoseLandmark[][], startFrame: number, topFrame: number): { shoulder: number; hip: number } {
    if (startFrame >= landmarks.length || topFrame >= landmarks.length) {
      return { shoulder: 0, hip: 0 };
    }
    
    const start = landmarks[startFrame];
    const top = landmarks[topFrame];
    
    if (!start || !top) {
      return { shoulder: 0, hip: 0 };
    }
    
    const startLeftShoulder = start[11];
    const startRightShoulder = start[12];
    const topLeftShoulder = top[11];
    const topRightShoulder = top[12];
    const startLeftHip = start[23];
    const startRightHip = start[24];
    const topLeftHip = top[23];
    const topRightHip = top[24];
    
    let shoulderRotation = 0;
    let hipRotation = 0;
    
    if (startLeftShoulder && startRightShoulder && topLeftShoulder && topRightShoulder) {
      const startAngle = Math.atan2(startRightShoulder.y - startLeftShoulder.y, startRightShoulder.x - startLeftShoulder.x);
      const topAngle = Math.atan2(topRightShoulder.y - topLeftShoulder.y, topRightShoulder.x - topLeftShoulder.x);
      shoulderRotation = Math.abs(topAngle - startAngle) * (180 / Math.PI);
      shoulderRotation = Math.min(shoulderRotation, 180);
    }
    
    if (startLeftHip && startRightHip && topLeftHip && topRightHip) {
      const startAngle = Math.atan2(startRightHip.y - startLeftHip.y, startRightHip.x - startLeftHip.x);
      const topAngle = Math.atan2(topRightHip.y - topLeftHip.y, topRightHip.x - topLeftHip.x);
      hipRotation = Math.abs(topAngle - startAngle) * (180 / Math.PI);
      hipRotation = Math.min(hipRotation, 180);
    }
    
    return { shoulder: shoulderRotation, hip: hipRotation };
  }

  private calculateVelocity(point1: TrajectoryPoint, point2: TrajectoryPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    const dt = point2.timestamp - point1.timestamp;
    
    if (dt === 0) return 0;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
  }
  
  private calculateAcceleration(point1: TrajectoryPoint, point2: TrajectoryPoint, point3: TrajectoryPoint): number {
    const v1 = this.calculateVelocity(point1, point2);
    const v2 = this.calculateVelocity(point2, point3);
    const dt = (point3.timestamp - point1.timestamp) / 2;
    
    if (dt === 0) return 0;
    
    return Math.abs(v2 - v1) / dt;
  }
  
  getPhaseAtFrame(phases: SwingPhase[], frame: number): SwingPhase | null {
    return phases.find(phase => frame >= phase.startFrame && frame <= phase.endFrame) || null;
  }
  
  getPhaseProgress(phase: SwingPhase, frame: number): number {
    if (frame < phase.startFrame) return 0;
    if (frame >= phase.endFrame) return 1;
    
    const totalFrames = phase.endFrame - phase.startFrame;
    const currentFrames = frame - phase.startFrame;
    
    return totalFrames > 0 ? currentFrames / totalFrames : 0;
  }
  smoothPhaseBoundaries(phases: SwingPhase[]): SwingPhase[] {
    const smoothed = [...phases];
    const maxFrame = Math.max(...phases.map(p => p.endFrame));
    
    for (let i = 0; i < smoothed.length; i++) {
      const phase = smoothed[i];
      
      // Ensure minimum phase duration
      if (phase.endFrame - phase.startFrame < this.config.minPhaseDuration) {
        phase.endFrame = Math.min(phase.startFrame + this.config.minPhaseDuration, maxFrame);
      }
      
      // Prevent overlaps with previous phase
      if (i > 0) {
        const prev = smoothed[i - 1];
        if (phase.startFrame <= prev.endFrame) {
          phase.startFrame = prev.endFrame + 1;
        }
      }
      
      // Ensure phase doesn't exceed total frames
      if (phase.endFrame > maxFrame) {
        phase.endFrame = maxFrame;
      }
      
      // Ensure valid phase boundaries
      if (phase.startFrame >= phase.endFrame) {
        phase.startFrame = Math.max(0, phase.endFrame - this.config.minPhaseDuration);
      }
    }
    
    return smoothed;
  }
  
  private addPhaseSpecificMetrics(phases: SwingPhase[], landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): SwingPhase[] {
    return phases.map(phase => {
      const enhancedPhase = { ...phase };
      
      // Calculate specific metrics for each phase type
      switch (phase.name) {
        case 'address':
          enhancedPhase.keyMetrics = this.calculateAddressMetrics(landmarks, phase.startFrame, phase.endFrame);
          break;
        case 'backswing':
          enhancedPhase.keyMetrics = this.calculateBackswingMetrics(landmarks, trajectory, phase.startFrame, phase.endFrame);
          break;
        case 'top':
          enhancedPhase.keyMetrics = this.calculateTopMetrics(landmarks, phase.startFrame, phase.endFrame);
          break;
        case 'downswing':
          enhancedPhase.keyMetrics = this.calculateDownswingMetrics(landmarks, trajectory, phase.startFrame, phase.endFrame);
          break;
        case 'impact':
          enhancedPhase.keyMetrics = this.calculateImpactMetrics(landmarks, trajectory, phase.startFrame, phase.endFrame);
          break;
        case 'follow-through':
          enhancedPhase.keyMetrics = this.calculateFollowThroughMetrics(landmarks, trajectory, phase.startFrame, phase.endFrame);
          break;
      }
      
      return enhancedPhase;
    });
  }
  
  private calculateAddressMetrics(landmarks: PoseLandmark[][], startFrame: number, endFrame: number) {
    const midFrame = Math.floor((startFrame + endFrame) / 2);
    const midLandmarks = landmarks[midFrame] || [];
    
    // Calculate posture and balance metrics
    const posture = this.calculatePosture(midLandmarks);
    const balance = this.calculateBalance(midLandmarks);
    
    return {
      posture,
      balance,
      clubPosition: this.getClubPosition(midLandmarks),
      bodyRotation: { shoulder: 0, hip: 0 },
      weightDistribution: this.calculateWeightDistribution(midLandmarks),
      velocity: 0,
      acceleration: 0
    };
  }
  
  private calculateBackswingMetrics(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, startFrame: number, endFrame: number) {
    const startLandmarks = landmarks[startFrame] || [];
    const endLandmarks = landmarks[endFrame] || [];
    
    // Calculate rotation and tempo
    const rotation = this.calculateBodyRotation(startLandmarks, endLandmarks);
    const velocity = this.calculatePhaseVelocity(landmarks, startFrame, endFrame);
    const acceleration = this.calculatePhaseAcceleration(landmarks, startFrame, endFrame);
    
    return {
      clubPosition: this.getClubPosition(endLandmarks),
      bodyRotation: rotation,
      weightDistribution: this.calculateWeightDistribution(endLandmarks),
      velocity,
      acceleration,
      tempo: this.calculateTempoForPhase(landmarks, startFrame, endFrame)
    };
  }
  
  private calculateTopMetrics(landmarks: PoseLandmark[][], startFrame: number, endFrame: number) {
    const midLandmarks = landmarks[Math.floor((startFrame + endFrame) / 2)] || [];
    
    return {
      clubPosition: this.getClubPosition(midLandmarks),
      bodyRotation: this.calculateBodyRotation(landmarks[0] || [], midLandmarks),
      weightDistribution: this.calculateWeightDistribution(midLandmarks),
      velocity: 0, // At the top, velocity should be near zero
      acceleration: 0,
      xFactor: this.calculateXFactor(midLandmarks)
    };
  }
  
  private calculateDownswingMetrics(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, startFrame: number, endFrame: number) {
    const startLandmarks = landmarks[startFrame] || [];
    const endLandmarks = landmarks[endFrame] || [];
    
    const velocity = this.calculatePhaseVelocity(landmarks, startFrame, endFrame);
    const acceleration = this.calculatePhaseAcceleration(landmarks, startFrame, endFrame);
    const powerGeneration = this.calculatePowerGeneration(landmarks, startFrame, endFrame);
    
    return {
      clubPosition: this.getClubPosition(endLandmarks),
      bodyRotation: this.calculateBodyRotation(startLandmarks, endLandmarks),
      weightDistribution: this.calculateWeightDistribution(endLandmarks),
      velocity,
      acceleration,
      powerGeneration
    };
  }
  
  private calculateImpactMetrics(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, startFrame: number, endFrame: number) {
    const midLandmarks = landmarks[Math.floor((startFrame + endFrame) / 2)] || [];
    
    return {
      clubPosition: this.getClubPosition(midLandmarks),
      bodyRotation: this.calculateBodyRotation(landmarks[0] || [], midLandmarks),
      weightDistribution: this.calculateWeightDistribution(midLandmarks),
      velocity: this.calculatePhaseVelocity(landmarks, startFrame, endFrame),
      acceleration: this.calculatePhaseAcceleration(landmarks, startFrame, endFrame),
      impactAngle: this.calculateImpactAngle(midLandmarks)
    };
  }
  
  private calculateFollowThroughMetrics(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, startFrame: number, endFrame: number) {
    const startLandmarks = landmarks[startFrame] || [];
    const endLandmarks = landmarks[endFrame] || [];
    
    const velocity = this.calculatePhaseVelocity(landmarks, startFrame, endFrame);
    const balance = this.calculateBalance(endLandmarks);
    const finish = this.calculateFinishPosition(endLandmarks);
    
    return {
      clubPosition: this.getClubPosition(endLandmarks),
      bodyRotation: this.calculateBodyRotation(startLandmarks, endLandmarks),
      weightDistribution: this.calculateWeightDistribution(endLandmarks),
      velocity,
      acceleration: this.calculatePhaseAcceleration(landmarks, startFrame, endFrame),
      balance,
      finish
    };
  }
  
  private calculatePosture(landmarks: PoseLandmark[]): number {
    // Calculate spine angle and posture quality
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    
    const spineAngle = Math.atan2(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y) * (180 / Math.PI);
    
    // Ideal spine angle is around 30-35 degrees
    const idealAngle = 32;
    const deviation = Math.abs(spineAngle - idealAngle);
    
    return Math.max(0, 100 - (deviation * 2));
  }
  
  private calculateBalance(landmarks: PoseLandmark[]): number {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    
    if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee) return 0;
    
    // Calculate balance based on ankle and knee alignment
    const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
    const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
    
    // Good balance when feet are shoulder-width apart and knees are aligned
    const idealAnkleDistance = 0.15; // Approximate shoulder width
    const ankleScore = Math.max(0, 100 - Math.abs(ankleDistance - idealAnkleDistance) * 1000);
    const kneeScore = Math.max(0, 100 - Math.abs(kneeDistance - ankleDistance) * 500);
    
    return (ankleScore + kneeScore) / 2;
  }
  
  private getClubPosition(landmarks: PoseLandmark[]): { x: number; y: number; z: number } | undefined {
    const rightWrist = landmarks[16];
    if (!rightWrist) return undefined;
    
    return { x: rightWrist.x, y: rightWrist.y, z: rightWrist.z || 0 };
  }
  
  private calculateTempoForPhase(landmarks: PoseLandmark[][], startFrame: number, endFrame: number): number {
    if (endFrame - startFrame < 2) return 0;
    
    const totalFrames = endFrame - startFrame;
    const timePerFrame = 1000 / 30; // Assuming 30fps
    const totalTime = totalFrames * timePerFrame;
    
    return totalTime;
  }
  
  private calculateXFactor(landmarks: PoseLandmark[]): number {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    const shoulderAngle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
    const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x);
    
    return Math.abs(shoulderAngle - hipAngle) * (180 / Math.PI);
  }
  
  private calculatePowerGeneration(landmarks: PoseLandmark[][], startFrame: number, endFrame: number): number {
    // Calculate power generation based on acceleration and body movement
    const acceleration = this.calculatePhaseAcceleration(landmarks, startFrame, endFrame);
    const velocity = this.calculatePhaseVelocity(landmarks, startFrame, endFrame);
    
    return acceleration * velocity;
  }
  
  private calculateImpactAngle(landmarks: PoseLandmark[]): number {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    
    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) return 0;
    
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const wristCenter = { x: (leftWrist.x + rightWrist.x) / 2, y: (leftWrist.y + rightWrist.y) / 2 };
    
    return Math.atan2(wristCenter.y - shoulderCenter.y, wristCenter.x - shoulderCenter.x) * (180 / Math.PI);
  }
  
  private calculateFinishPosition(landmarks: PoseLandmark[]): number {
    // Calculate finish position quality based on balance and posture
    const balance = this.calculateBalance(landmarks);
    const posture = this.calculatePosture(landmarks);
    
    return (balance + posture) / 2;
  }

  // Normalize phase timing to video duration for proper timeline alignment
  private normalizePhaseTiming(phases: SwingPhase[], videoDuration: number): SwingPhase[] {
    console.log('⏰ PHASE TIMING DEBUG: Normalizing phase timing to video duration:', videoDuration, 'ms');
    
    return phases.map(phase => {
      // Calculate the percentage of total video duration for each phase
      const totalFrames = Math.max(...phases.map(p => p.endFrame));
      const phaseStartPercent = phase.startFrame / totalFrames;
      const phaseEndPercent = phase.endFrame / totalFrames;
      
      // Convert percentages to actual video time
      const normalizedStartTime = phaseStartPercent * videoDuration;
      const normalizedEndTime = phaseEndPercent * videoDuration;
      const normalizedDuration = normalizedEndTime - normalizedStartTime;
      
      console.log(`⏰ PHASE TIMING DEBUG: Normalizing ${phase.name}: ${phase.startTime.toFixed(0)}-${phase.endTime.toFixed(0)}ms -> ${normalizedStartTime.toFixed(0)}-${normalizedEndTime.toFixed(0)}ms`);
      
      return {
        ...phase,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        duration: normalizedDuration
      };
    });
  }

  // Validate phase sequence and ensure proper timing
  private validatePhaseSequence(
    addressEnd: number,
    backswingTop: number,
    downswingStart: number,
    impact: number,
    followThroughStart: number,
    totalFrames: number
  ): { addressEnd: number; backswingTop: number; downswingStart: number; impact: number; followThroughStart: number } {
    console.log('⏰ PHASE TIMING DEBUG: Validating phase sequence...');
    console.log('⏰ PHASE TIMING DEBUG: Input phases:', { addressEnd, backswingTop, downswingStart, impact, followThroughStart });
    
    // Ensure phases are in correct order and have reasonable timing
    let validatedAddressEnd = Math.max(1, Math.min(addressEnd, totalFrames - 1));
    let validatedBackswingTop = Math.max(validatedAddressEnd + 1, Math.min(backswingTop, totalFrames - 1));
    let validatedDownswingStart = Math.max(validatedBackswingTop + 1, Math.min(downswingStart, totalFrames - 1));
    let validatedImpact = Math.max(validatedDownswingStart + 1, Math.min(impact, totalFrames - 1));
    let validatedFollowThroughStart = Math.max(validatedImpact + 1, Math.min(followThroughStart, totalFrames - 1));
    
    // Ensure minimum phase durations
    const minPhaseDuration = 3; // Minimum 3 frames per phase
    
    if (validatedBackswingTop - validatedAddressEnd < minPhaseDuration) {
      validatedBackswingTop = Math.min(validatedAddressEnd + minPhaseDuration, totalFrames - 1);
    }
    
    if (validatedDownswingStart - validatedBackswingTop < minPhaseDuration) {
      validatedDownswingStart = Math.min(validatedBackswingTop + minPhaseDuration, totalFrames - 1);
    }
    
    if (validatedImpact - validatedDownswingStart < minPhaseDuration) {
      validatedImpact = Math.min(validatedDownswingStart + minPhaseDuration, totalFrames - 1);
    }
    
    if (validatedFollowThroughStart - validatedImpact < minPhaseDuration) {
      validatedFollowThroughStart = Math.min(validatedImpact + minPhaseDuration, totalFrames - 1);
    }
    
    console.log('⏰ PHASE TIMING DEBUG: Validated phases:', { 
      addressEnd: validatedAddressEnd, 
      backswingTop: validatedBackswingTop, 
      downswingStart: validatedDownswingStart, 
      impact: validatedImpact, 
      followThroughStart: validatedFollowThroughStart 
    });
    
    return {
      addressEnd: validatedAddressEnd,
      backswingTop: validatedBackswingTop,
      downswingStart: validatedDownswingStart,
      impact: validatedImpact,
      followThroughStart: validatedFollowThroughStart
    };
  }
}


