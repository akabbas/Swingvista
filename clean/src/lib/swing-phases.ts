import { PoseLandmark, TrajectoryPoint, SwingTrajectory } from './mediapipe';

export interface SwingPhase {
  name: string;
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  duration: number;
  keyLandmarks: PoseLandmark[];
  color: string;
  description: string;
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
    const totalFrames = landmarks.length;
    const totalDuration = timestamps[totalFrames - 1] - timestamps[0];
    const setupEnd = this.detectSetupEnd(landmarks, trajectory);
    const backswingTop = this.detectBackswingTop(landmarks, trajectory);
    const impact = this.detectImpact(landmarks, trajectory);
    const followThroughStart = this.detectFollowThroughStart(landmarks, trajectory, impact);
    const phases: SwingPhase[] = [
      this.createPhase('Setup', 0, setupEnd, timestamps, landmarks, '#3B82F6', 'Initial position and posture'),
      this.createPhase('Backswing', setupEnd, backswingTop, timestamps, landmarks, '#10B981', 'Takeaway to top of swing'),
      this.createPhase('Transition', backswingTop, impact, timestamps, landmarks, '#F59E0B', 'Downswing to impact'),
      this.createPhase('Impact', impact, impact + 2, timestamps, landmarks, '#EF4444', 'Ball contact moment'),
      this.createPhase('Follow-through', followThroughStart, totalFrames - 1, timestamps, landmarks, '#8B5CF6', 'Finish position')
    ];
    const tempoRatio = this.calculateTempoRatio(phases);
    const swingPlane = this.calculateSwingPlane(landmarks, impact);
    const weightTransfer = this.calculateWeightTransfer(landmarks, 0, impact);
    const rotation = this.calculateRotation(landmarks, 0, backswingTop);
    return { phases, totalDuration, tempoRatio, swingPlane, weightTransfer, rotation };
  }

  private detectSetupEnd(landmarks: PoseLandmark[][], trajectory: SwingTrajectory): number {
    const rightWrist = trajectory.rightWrist; if (rightWrist.length < 2) return Math.min(5, landmarks.length - 1);
    for (let i = 1; i < Math.min(30, rightWrist.length); i++) { const velocity = this.calculateVelocity(rightWrist[i - 1], rightWrist[i]); if (velocity > this.config.velocityThreshold) { return Math.max(this.config.minPhaseDuration, i - 1); } }
    return Math.min(10, landmarks.length - 1);
  }

  private detectBackswingTop(landmarks: PoseLandmark[][], trajectory: SwingTrajectory): number {
    const rightWrist = trajectory.rightWrist; if (rightWrist.length < 2) return Math.min(15, landmarks.length - 1);
    let maxY = rightWrist[0].y; let topFrame = 0; const searchEnd = Math.min(Math.floor(rightWrist.length * 0.7), rightWrist.length - 1);
    for (let i = 1; i <= searchEnd; i++) { if (rightWrist[i].y < maxY) { maxY = rightWrist[i].y; topFrame = i; } }
    return Math.max(this.config.minPhaseDuration, topFrame);
  }

  private detectImpact(landmarks: PoseLandmark[][], trajectory: SwingTrajectory): number {
    const rightWrist = trajectory.rightWrist; if (rightWrist.length < 3) return Math.min(20, landmarks.length - 1);
    let maxAcceleration = 0; let impactFrame = Math.floor(landmarks.length * 0.7);
    const searchStart = Math.floor(rightWrist.length * 0.5); const searchEnd = Math.min(rightWrist.length - 1, landmarks.length - 1);
    for (let i = searchStart; i < searchEnd; i++) {
      if (i >= 2) { const acceleration = this.calculateAcceleration(rightWrist[i - 2], rightWrist[i - 1], rightWrist[i]); if (acceleration > maxAcceleration) { maxAcceleration = acceleration; impactFrame = i; } }
    }
    return Math.max(this.config.minPhaseDuration, impactFrame);
  }

  private detectFollowThroughStart(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, impactFrame: number): number {
    return Math.min(impactFrame + 2, landmarks.length - 1);
  }

  private createPhase(name: string, startFrame: number, endFrame: number, timestamps: number[], landmarks: PoseLandmark[][], color: string, description: string): SwingPhase {
    const startTime = timestamps[startFrame] || 0; const endTime = timestamps[endFrame] || 0; const duration = endTime - startTime;
    return { name, startFrame, endFrame, startTime, endTime, duration, keyLandmarks: landmarks[Math.floor((startFrame + endFrame) / 2)] || [], color, description };
  }

  private calculateTempoRatio(phases: SwingPhase[]): number {
    const backswingPhase = phases.find(p => p.name === 'Backswing'); const transitionPhase = phases.find(p => p.name === 'Transition');
    if (!backswingPhase || !transitionPhase) return 1.0; const backswingTime = backswingPhase.duration; const downswingTime = transitionPhase.duration; if (downswingTime <= 0) return 1.0; return backswingTime / downswingTime;
  }

  private calculateSwingPlane(landmarks: PoseLandmark[][], impactFrame: number): number {
    if (impactFrame >= landmarks.length) return 0; const impact = landmarks[impactFrame]; const leftShoulder = impact[11]; const rightShoulder = impact[12]; const leftHip = impact[23]; const rightHip = impact[24]; if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 }; const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    const angle = Math.atan2(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y); return (angle * 180) / Math.PI;
  }

  private calculateWeightTransfer(landmarks: PoseLandmark[][], startFrame: number, impactFrame: number): number {
    if (startFrame >= landmarks.length || impactFrame >= landmarks.length) return 0; const start = landmarks[startFrame]; const impact = landmarks[impactFrame]; const leftAnkle = start[27]; const rightAnkle = start[28]; const impactLeftAnkle = impact[27]; const impactRightAnkle = impact[28]; if (!leftAnkle || !rightAnkle || !impactLeftAnkle || !impactRightAnkle) return 0;
    const startWeight = Math.abs(leftAnkle.x - rightAnkle.x); const impactWeight = Math.abs(impactLeftAnkle.x - impactRightAnkle.x); if (startWeight === 0) return 0; return Math.max(0, 1 - Math.abs(impactWeight - startWeight) / startWeight);
  }

  private calculateRotation(landmarks: PoseLandmark[][], startFrame: number, topFrame: number): { shoulder: number; hip: number } {
    if (startFrame >= landmarks.length || topFrame >= landmarks.length) { return { shoulder: 0, hip: 0 }; }
    const start = landmarks[startFrame]; const top = landmarks[topFrame]; if (!start || !top) { return { shoulder: 0, hip: 0 }; }
    const startLeftShoulder = start[11]; const startRightShoulder = start[12]; const topLeftShoulder = top[11]; const topRightShoulder = top[12];
    const startLeftHip = start[23]; const startRightHip = start[24]; const topLeftHip = top[23]; const topRightHip = top[24];
    let shoulderRotation = 0; let hipRotation = 0;
    if (startLeftShoulder && startRightShoulder && topLeftShoulder && topRightShoulder) {
      const startAngle = Math.atan2(startRightShoulder.y - startLeftShoulder.y, startRightShoulder.x - startLeftShoulder.x);
      const topAngle = Math.atan2(topRightShoulder.y - topLeftShoulder.y, topRightShoulder.x - topLeftShoulder.x);
      shoulderRotation = Math.abs(topAngle - startAngle) * (180 / Math.PI); shoulderRotation = Math.min(shoulderRotation, 180);
    }
    if (startLeftHip && startRightHip && topLeftHip && topRightHip) {
      const startAngle = Math.atan2(startRightHip.y - startLeftHip.y, startRightHip.x - startLeftHip.x);
      const topAngle = Math.atan2(topRightHip.y - topLeftHip.y, topRightHip.x - topLeftHip.x);
      hipRotation = Math.abs(topAngle - startAngle) * (180 / Math.PI); hipRotation = Math.min(hipRotation, 180);
    }
    return { shoulder: shoulderRotation, hip: hipRotation };
  }

  private calculateVelocity(point1: TrajectoryPoint, point2: TrajectoryPoint): number { const dx = point2.x - point1.x; const dy = point2.y - point1.y; const dz = point2.z - point1.z; const dt = point2.timestamp - point1.timestamp; if (dt === 0) return 0; return Math.sqrt(dx * dx + dy * dy + dz * dz) / dt; }
  private calculateAcceleration(point1: TrajectoryPoint, point2: TrajectoryPoint, point3: TrajectoryPoint): number { const v1 = this.calculateVelocity(point1, point2); const v2 = this.calculateVelocity(point2, point3); const dt = (point3.timestamp - point1.timestamp) / 2; if (dt === 0) return 0; return Math.abs(v2 - v1) / dt; }
  getPhaseAtFrame(phases: SwingPhase[], frame: number): SwingPhase | null { return phases.find(phase => frame >= phase.startFrame && frame <= phase.endFrame) || null; }
  getPhaseProgress(phase: SwingPhase, frame: number): number { if (frame < phase.startFrame) return 0; if (frame >= phase.endFrame) return 1; const totalFrames = phase.endFrame - phase.startFrame; const currentFrames = frame - phase.startFrame; return totalFrames > 0 ? currentFrames / totalFrames : 0; }
  smoothPhaseBoundaries(phases: SwingPhase[]): SwingPhase[] {
    const smoothed = [...phases]; const maxFrame = Math.max(...phases.map(p => p.endFrame));
    for (let i = 0; i < smoothed.length; i++) {
      const phase = smoothed[i];
      if (phase.endFrame - phase.startFrame < this.config.minPhaseDuration) { phase.endFrame = Math.min(phase.startFrame + this.config.minPhaseDuration, maxFrame); }
      if (i > 0) { const prev = smoothed[i - 1]; if (phase.startFrame <= prev.endFrame) { phase.startFrame = prev.endFrame + 1; } }
      if (phase.endFrame > maxFrame) { phase.endFrame = maxFrame; }
      if (phase.startFrame >= phase.endFrame) { phase.startFrame = Math.max(0, phase.endFrame - this.config.minPhaseDuration); }
    }
    return smoothed;
  }
}


