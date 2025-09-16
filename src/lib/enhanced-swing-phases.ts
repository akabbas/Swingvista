import { PoseLandmark, TrajectoryPoint, SwingTrajectory } from './mediapipe';

export interface EnhancedSwingPhase {
  name: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  duration: number;
  color: string;
  description: string;
  confidence: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: PhaseMetrics;
  recommendations: string[];
  professionalBenchmark: {
    idealDuration: number;
    keyPositions: any[];
    commonMistakes: string[];
  };
}

export interface PhaseMetrics {
  // Address Phase Metrics
  spineAngle?: number;
  kneeFlex?: number;
  posture?: number;
  weightDistribution?: { left: number; right: number };
  
  // Backswing Phase Metrics
  shoulderRotation?: number;
  hipRotation?: number;
  xFactor?: number;
  swingPlane?: number;
  
  // Top Phase Metrics
  wristHinge?: number;
  clubPosition?: { x: number; y: number; z: number };
  bodyCoil?: number;
  balance?: number;
  
  // Downswing Phase Metrics
  tempoRatio?: number;
  sequencing?: number;
  lag?: number;
  path?: number;
  
  // Impact Phase Metrics
  weightTransfer?: number;
  clubFace?: number;
  bodyPosition?: number;
  release?: number;
  
  // Follow-through Phase Metrics
  finishBalance?: number;
  finishPosition?: number;
  bodyRotation?: number;
  extension?: number;
}

export interface PhaseDetectionConfig {
  minPhaseDuration: number;
  velocityThreshold: number;
  accelerationThreshold: number;
  smoothingWindow: number;
  professionalBenchmarks: {
    address: { idealDuration: number; spineAngle: number; kneeFlex: number };
    backswing: { idealDuration: number; shoulderRotation: number; xFactor: number };
    top: { idealDuration: number; wristHinge: number; balance: number };
    downswing: { idealDuration: number; tempoRatio: number; sequencing: number };
    impact: { idealDuration: number; weightTransfer: number; clubFace: number };
    'follow-through': { idealDuration: number; finishBalance: number; extension: number };
  };
}

export class EnhancedSwingPhaseDetector {
  private config: PhaseDetectionConfig;
  
  constructor(config: Partial<PhaseDetectionConfig> = {}) {
    this.config = {
      minPhaseDuration: 5,
      velocityThreshold: 0.01,
      accelerationThreshold: 0.1,
      smoothingWindow: 3,
      professionalBenchmarks: {
        address: { idealDuration: 2000, spineAngle: 32, kneeFlex: 15 },
        backswing: { idealDuration: 3000, shoulderRotation: 90, xFactor: 25 },
        top: { idealDuration: 500, wristHinge: 90, balance: 85 },
        downswing: { idealDuration: 1000, tempoRatio: 3.0, sequencing: 80 },
        impact: { idealDuration: 200, weightTransfer: 80, clubFace: 0 },
        'follow-through': { idealDuration: 2000, finishBalance: 90, extension: 85 }
      },
      ...config
    };
  }

  detectPhases(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): EnhancedSwingPhase[] {
    console.log('🎯 Starting enhanced swing phase detection...');
    console.log('Total frames:', landmarks.length, 'Duration:', timestamps[timestamps.length - 1] - timestamps[0], 'ms');
    
    const totalFrames = landmarks.length;
    const totalDuration = timestamps[totalFrames - 1] - timestamps[0];
    
    // Detect phase boundaries with enhanced algorithms
    const phaseBoundaries = this.detectPhaseBoundaries(landmarks, trajectory, timestamps);
    
    // Create enhanced phases with detailed metrics
    const phases: EnhancedSwingPhase[] = [
      this.createAddressPhase(phaseBoundaries, landmarks, trajectory, timestamps),
      this.createBackswingPhase(phaseBoundaries, landmarks, trajectory, timestamps),
      this.createTopPhase(phaseBoundaries, landmarks, trajectory, timestamps),
      this.createDownswingPhase(phaseBoundaries, landmarks, trajectory, timestamps),
      this.createImpactPhase(phaseBoundaries, landmarks, trajectory, timestamps),
      this.createFollowThroughPhase(phaseBoundaries, landmarks, trajectory, timestamps)
    ];
    
    // Grade each phase
    const gradedPhases = phases.map(phase => this.gradePhase(phase));
    
    // Add recommendations
    const phasesWithRecommendations = gradedPhases.map(phase => this.addRecommendations(phase));
    
    console.log('✅ Enhanced phase detection complete:');
    phasesWithRecommendations.forEach(phase => {
      console.log(`- ${phase.name}: ${phase.startFrame}-${phase.endFrame} (${phase.duration.toFixed(0)}ms) - Grade: ${phase.grade}`);
    });
    
    return phasesWithRecommendations;
  }

  private detectPhaseBoundaries(landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]) {
    const rightWrist = trajectory.rightWrist;
    const leftWrist = trajectory.leftWrist;
    
    // Address phase: minimal movement
    const addressEnd = this.findMovementStart(landmarks, rightWrist, 0.1);
    
    // Backswing: increasing club height
    const backswingTop = this.findMaxClubHeight(landmarks, rightWrist, addressEnd);
    
    // Top position: transition point
    const topStart = Math.max(0, backswingTop - 3);
    const topEnd = Math.min(landmarks.length - 1, backswingTop + 2);
    
    // Impact: club lowest point
    const impact = this.findImpactFrame(landmarks, rightWrist, topEnd);
    
    // Downswing: top to impact
    const downswingStart = topEnd;
    const downswingEnd = impact;
    
    // Follow-through: after impact
    const followThroughStart = impact + 1;
    const followThroughEnd = landmarks.length - 1;
    
    return {
      address: { start: 0, end: addressEnd },
      backswing: { start: addressEnd, end: backswingTop },
      top: { start: topStart, end: topEnd },
      downswing: { start: downswingStart, end: downswingEnd },
      impact: { start: impact, end: impact + 2 },
      followThrough: { start: followThroughStart, end: followThroughEnd }
    };
  }

  private findMovementStart(landmarks: PoseLandmark[][], trajectory: TrajectoryPoint[], threshold: number): number {
    for (let i = 1; i < Math.min(30, trajectory.length); i++) {
      const velocity = this.calculateVelocity(trajectory[i - 1], trajectory[i]);
      if (velocity > threshold) {
        return Math.max(this.config.minPhaseDuration, i);
      }
    }
    return Math.min(10, landmarks.length - 1);
  }

  private findMaxClubHeight(landmarks: PoseLandmark[][], trajectory: TrajectoryPoint[], startFrame: number): number {
    let maxY = trajectory[startFrame]?.y || 0;
    let topFrame = startFrame;
    const searchEnd = Math.min(Math.floor(trajectory.length * 0.8), trajectory.length - 1);
    
    for (let i = startFrame + 1; i <= searchEnd; i++) {
      if (trajectory[i]?.y < maxY) {
        maxY = trajectory[i].y;
        topFrame = i;
      }
    }
    
    return Math.max(this.config.minPhaseDuration, topFrame);
  }

  private findImpactFrame(landmarks: PoseLandmark[][], trajectory: TrajectoryPoint[], startFrame: number): number {
    let maxAcceleration = 0;
    let impactFrame = Math.floor(landmarks.length * 0.7);
    const searchStart = Math.max(startFrame, Math.floor(trajectory.length * 0.4));
    const searchEnd = Math.min(trajectory.length - 1, landmarks.length - 1);
    
    for (let i = searchStart; i < searchEnd; i++) {
      if (i >= 2) {
        const acceleration = this.calculateAcceleration(trajectory[i - 2], trajectory[i - 1], trajectory[i]);
        if (acceleration > maxAcceleration) {
          maxAcceleration = acceleration;
          impactFrame = i;
        }
      }
    }
    
    return Math.max(this.config.minPhaseDuration, impactFrame);
  }

  private createAddressPhase(boundaries: any, landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): EnhancedSwingPhase {
    const { start, end } = boundaries.address;
    const midFrame = Math.floor((start + end) / 2);
    const midLandmarks = landmarks[midFrame] || [];
    
    const metrics = this.calculateAddressMetrics(midLandmarks);
    const confidence = this.calculatePhaseConfidence(landmarks, start, end);
    
    return {
      name: 'address',
      startFrame: start,
      endFrame: end,
      startTime: timestamps[start] || 0,
      endTime: timestamps[end] || 0,
      duration: (timestamps[end] || 0) - (timestamps[start] || 0),
      color: '#4CAF50', // Green
      description: 'Setup and address position - maintaining posture and balance',
      confidence,
      grade: 'A', // Will be calculated later
      metrics,
      recommendations: [],
      professionalBenchmark: {
        idealDuration: this.config.professionalBenchmarks.address.idealDuration,
        keyPositions: [],
        commonMistakes: ['Poor posture', 'Incorrect ball position', 'Poor alignment']
      }
    };
  }

  private createBackswingPhase(boundaries: any, landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): EnhancedSwingPhase {
    const { start, end } = boundaries.backswing;
    const startLandmarks = landmarks[start] || [];
    const endLandmarks = landmarks[end] || [];
    
    const metrics = this.calculateBackswingMetrics(startLandmarks, endLandmarks);
    const confidence = this.calculatePhaseConfidence(landmarks, start, end);
    
    return {
      name: 'backswing',
      startFrame: start,
      endFrame: end,
      startTime: timestamps[start] || 0,
      endTime: timestamps[end] || 0,
      duration: (timestamps[end] || 0) - (timestamps[start] || 0),
      color: '#2196F3', // Blue
      description: 'Takeaway to top of backswing - building power and maintaining tempo',
      confidence,
      grade: 'A',
      metrics,
      recommendations: [],
      professionalBenchmark: {
        idealDuration: this.config.professionalBenchmarks.backswing.idealDuration,
        keyPositions: [],
        commonMistakes: ['Over-swinging', 'Poor tempo', 'Loss of posture']
      }
    };
  }

  private createTopPhase(boundaries: any, landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): EnhancedSwingPhase {
    const { start, end } = boundaries.top;
    const midFrame = Math.floor((start + end) / 2);
    const midLandmarks = landmarks[midFrame] || [];
    
    const metrics = this.calculateTopMetrics(midLandmarks);
    const confidence = this.calculatePhaseConfidence(landmarks, start, end);
    
    return {
      name: 'top',
      startFrame: start,
      endFrame: end,
      startTime: timestamps[start] || 0,
      endTime: timestamps[end] || 0,
      duration: (timestamps[end] || 0) - (timestamps[start] || 0),
      color: '#FF9800', // Orange
      description: 'Top of swing position - transition and weight shift preparation',
      confidence,
      grade: 'A',
      metrics,
      recommendations: [],
      professionalBenchmark: {
        idealDuration: this.config.professionalBenchmarks.top.idealDuration,
        keyPositions: [],
        commonMistakes: ['Over-swinging', 'Poor balance', 'Loss of posture']
      }
    };
  }

  private createDownswingPhase(boundaries: any, landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): EnhancedSwingPhase {
    const { start, end } = boundaries.downswing;
    const startLandmarks = landmarks[start] || [];
    const endLandmarks = landmarks[end] || [];
    
    const metrics = this.calculateDownswingMetrics(startLandmarks, endLandmarks, landmarks, start, end);
    const confidence = this.calculatePhaseConfidence(landmarks, start, end);
    
    return {
      name: 'downswing',
      startFrame: start,
      endFrame: end,
      startTime: timestamps[start] || 0,
      endTime: timestamps[end] || 0,
      duration: (timestamps[end] || 0) - (timestamps[start] || 0),
      color: '#F44336', // Red
      description: 'Downswing to impact - generating power and clubhead speed',
      confidence,
      grade: 'A',
      metrics,
      recommendations: [],
      professionalBenchmark: {
        idealDuration: this.config.professionalBenchmarks.downswing.idealDuration,
        keyPositions: [],
        commonMistakes: ['Poor sequencing', 'Loss of lag', 'Over-the-top move']
      }
    };
  }

  private createImpactPhase(boundaries: any, landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): EnhancedSwingPhase {
    const { start, end } = boundaries.impact;
    const midFrame = Math.floor((start + end) / 2);
    const midLandmarks = landmarks[midFrame] || [];
    
    const metrics = this.calculateImpactMetrics(midLandmarks);
    const confidence = this.calculatePhaseConfidence(landmarks, start, end);
    
    return {
      name: 'impact',
      startFrame: start,
      endFrame: end,
      startTime: timestamps[start] || 0,
      endTime: timestamps[end] || 0,
      duration: (timestamps[end] || 0) - (timestamps[start] || 0),
      color: '#9C27B0', // Purple
      description: 'Ball contact moment - maximum clubhead speed and accuracy',
      confidence,
      grade: 'A',
      metrics,
      recommendations: [],
      professionalBenchmark: {
        idealDuration: this.config.professionalBenchmarks.impact.idealDuration,
        keyPositions: [],
        commonMistakes: ['Poor weight transfer', 'Open club face', 'Poor body position']
      }
    };
  }

  private createFollowThroughPhase(boundaries: any, landmarks: PoseLandmark[][], trajectory: SwingTrajectory, timestamps: number[]): EnhancedSwingPhase {
    const { start, end } = boundaries.followThrough;
    const startLandmarks = landmarks[start] || [];
    const endLandmarks = landmarks[end] || [];
    
    const metrics = this.calculateFollowThroughMetrics(startLandmarks, endLandmarks);
    const confidence = this.calculatePhaseConfidence(landmarks, start, end);
    
    return {
      name: 'follow-through',
      startFrame: start,
      endFrame: end,
      startTime: timestamps[start] || 0,
      endTime: timestamps[end] || 0,
      duration: (timestamps[end] || 0) - (timestamps[start] || 0),
      color: '#FFEB3B', // Yellow
      description: 'Follow-through to finish - maintaining balance and completing the swing',
      confidence,
      grade: 'A',
      metrics,
      recommendations: [],
      professionalBenchmark: {
        idealDuration: this.config.professionalBenchmarks['follow-through'].idealDuration,
        keyPositions: [],
        commonMistakes: ['Poor balance', 'Incomplete finish', 'Loss of posture']
      }
    };
  }

  // Phase-specific metric calculations
  private calculateAddressMetrics(landmarks: PoseLandmark[]): PhaseMetrics {
    const spineAngle = this.calculateSpineAngle(landmarks);
    const kneeFlex = this.calculateKneeFlex(landmarks);
    const posture = this.calculatePosture(landmarks);
    const weightDistribution = this.calculateWeightDistribution(landmarks);
    
    return {
      spineAngle,
      kneeFlex,
      posture,
      weightDistribution
    };
  }

  private calculateBackswingMetrics(startLandmarks: PoseLandmark[], endLandmarks: PoseLandmark[]): PhaseMetrics {
    const shoulderRotation = this.calculateShoulderRotation(startLandmarks, endLandmarks);
    const hipRotation = this.calculateHipRotation(startLandmarks, endLandmarks);
    const xFactor = this.calculateXFactor(endLandmarks);
    const swingPlane = this.calculateSwingPlane(endLandmarks);
    
    return {
      shoulderRotation,
      hipRotation,
      xFactor,
      swingPlane
    };
  }

  private calculateTopMetrics(landmarks: PoseLandmark[]): PhaseMetrics {
    const wristHinge = this.calculateWristHinge(landmarks);
    const clubPosition = this.getClubPosition(landmarks);
    const bodyCoil = this.calculateBodyCoil(landmarks);
    const balance = this.calculateBalance(landmarks);
    
    return {
      wristHinge,
      clubPosition,
      bodyCoil,
      balance
    };
  }

  private calculateDownswingMetrics(startLandmarks: PoseLandmark[], endLandmarks: PoseLandmark[], allLandmarks: PoseLandmark[][], startFrame: number, endFrame: number): PhaseMetrics {
    const tempoRatio = this.calculateTempoRatio(allLandmarks, startFrame, endFrame);
    const sequencing = this.calculateSequencing(allLandmarks, startFrame, endFrame);
    const lag = this.calculateLag(startLandmarks, endLandmarks);
    const path = this.calculateSwingPath(allLandmarks, startFrame, endFrame);
    
    return {
      tempoRatio,
      sequencing,
      lag,
      path
    };
  }

  private calculateImpactMetrics(landmarks: PoseLandmark[]): PhaseMetrics {
    const weightTransfer = this.calculateWeightTransfer(landmarks);
    const clubFace = this.calculateClubFace(landmarks);
    const bodyPosition = this.calculateBodyPosition(landmarks);
    const release = this.calculateRelease(landmarks);
    
    return {
      weightTransfer,
      clubFace,
      bodyPosition,
      release
    };
  }

  private calculateFollowThroughMetrics(startLandmarks: PoseLandmark[], endLandmarks: PoseLandmark[]): PhaseMetrics {
    const finishBalance = this.calculateBalance(endLandmarks);
    const finishPosition = this.calculateFinishPosition(endLandmarks);
    const bodyRotation = this.calculateBodyRotation(startLandmarks, endLandmarks);
    const extension = this.calculateExtension(endLandmarks);
    
    return {
      finishBalance,
      finishPosition,
      bodyRotation,
      extension
    };
  }

  // Helper calculation methods
  private calculateSpineAngle(landmarks: PoseLandmark[]): number {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    
    const angle = Math.atan2(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y) * (180 / Math.PI);
    return Math.abs(angle);
  }

  private calculateKneeFlex(landmarks: PoseLandmark[]): number {
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftKnee || !rightKnee || !leftHip || !rightHip) return 0;
    
    const leftAngle = this.calculateAngle(leftHip, leftKnee, { x: leftKnee.x, y: leftKnee.y - 0.1, z: leftKnee.z || 0 });
    const rightAngle = this.calculateAngle(rightHip, rightKnee, { x: rightKnee.x, y: rightKnee.y - 0.1, z: rightKnee.z || 0 });
    
    return (leftAngle + rightAngle) / 2;
  }

  private calculatePosture(landmarks: PoseLandmark[]): number {
    const spineAngle = this.calculateSpineAngle(landmarks);
    const idealAngle = this.config.professionalBenchmarks.address.spineAngle;
    const deviation = Math.abs(spineAngle - idealAngle);
    
    return Math.max(0, 100 - (deviation * 2));
  }

  private calculateWeightDistribution(landmarks: PoseLandmark[]): { left: number; right: number } {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    
    if (!leftAnkle || !rightAnkle) return { left: 50, right: 50 };
    
    const totalX = Math.abs(leftAnkle.x) + Math.abs(rightAnkle.x);
    const leftWeight = totalX > 0 ? (Math.abs(leftAnkle.x) / totalX) * 100 : 50;
    
    return { left: leftWeight, right: 100 - leftWeight };
  }

  private calculateShoulderRotation(startLandmarks: PoseLandmark[], endLandmarks: PoseLandmark[]): number {
    const startLeftShoulder = startLandmarks[11];
    const startRightShoulder = startLandmarks[12];
    const endLeftShoulder = endLandmarks[11];
    const endRightShoulder = endLandmarks[12];
    
    if (!startLeftShoulder || !startRightShoulder || !endLeftShoulder || !endRightShoulder) return 0;
    
    const startAngle = Math.atan2(startRightShoulder.y - startLeftShoulder.y, startRightShoulder.x - startLeftShoulder.x);
    const endAngle = Math.atan2(endRightShoulder.y - endLeftShoulder.y, endRightShoulder.x - endLeftShoulder.x);
    
    return Math.abs(endAngle - startAngle) * (180 / Math.PI);
  }

  private calculateHipRotation(startLandmarks: PoseLandmark[], endLandmarks: PoseLandmark[]): number {
    const startLeftHip = startLandmarks[23];
    const startRightHip = startLandmarks[24];
    const endLeftHip = endLandmarks[23];
    const endRightHip = endLandmarks[24];
    
    if (!startLeftHip || !startRightHip || !endLeftHip || !endRightHip) return 0;
    
    const startAngle = Math.atan2(startRightHip.y - startLeftHip.y, startRightHip.x - startLeftHip.x);
    const endAngle = Math.atan2(endRightHip.y - endLeftHip.y, endRightHip.x - endLeftHip.x);
    
    return Math.abs(endAngle - startAngle) * (180 / Math.PI);
  }

  private calculateXFactor(landmarks: PoseLandmark[]): number {
    const shoulderRotation = this.calculateShoulderRotation(landmarks, landmarks);
    const hipRotation = this.calculateHipRotation(landmarks, landmarks);
    
    return shoulderRotation - hipRotation;
  }

  private calculateSwingPlane(landmarks: PoseLandmark[]): number {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    
    const angle = Math.atan2(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y);
    return (angle * 180) / Math.PI;
  }

  private calculateWristHinge(landmarks: PoseLandmark[]): number {
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    
    if (!leftWrist || !rightWrist || !leftElbow || !rightElbow) return 0;
    
    const leftAngle = this.calculateAngle(leftElbow, leftWrist, { x: leftWrist.x, y: leftWrist.y - 0.1, z: leftWrist.z || 0 });
    const rightAngle = this.calculateAngle(rightElbow, rightWrist, { x: rightWrist.x, y: rightWrist.y - 0.1, z: rightWrist.z || 0 });
    
    return (leftAngle + rightAngle) / 2;
  }

  private getClubPosition(landmarks: PoseLandmark[]): { x: number; y: number; z: number } | undefined {
    const rightWrist = landmarks[16];
    if (!rightWrist) return undefined;
    
    return { x: rightWrist.x, y: rightWrist.y, z: rightWrist.z || 0 };
  }

  private calculateBodyCoil(landmarks: PoseLandmark[]): number {
    return this.calculateXFactor(landmarks);
  }

  private calculateBalance(landmarks: PoseLandmark[]): number {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    
    if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee) return 0;
    
    const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
    const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
    
    const idealAnkleDistance = 0.15;
    const ankleScore = Math.max(0, 100 - Math.abs(ankleDistance - idealAnkleDistance) * 1000);
    const kneeScore = Math.max(0, 100 - Math.abs(kneeDistance - ankleDistance) * 500);
    
    return (ankleScore + kneeScore) / 2;
  }

  private calculateTempoRatio(allLandmarks: PoseLandmark[][], startFrame: number, endFrame: number): number {
    if (endFrame - startFrame < 2) return 1.0;
    
    const backswingFrames = Math.floor((endFrame - startFrame) * 0.7);
    const downswingFrames = endFrame - startFrame - backswingFrames;
    
    return backswingFrames / downswingFrames;
  }

  private calculateSequencing(allLandmarks: PoseLandmark[][], startFrame: number, endFrame: number): number {
    // Calculate how well the body moves in sequence (hips first, then shoulders, then arms)
    let score = 0;
    const step = Math.max(1, Math.floor((endFrame - startFrame) / 10));
    
    for (let i = startFrame; i < endFrame - step; i += step) {
      const current = allLandmarks[i];
      const next = allLandmarks[i + step];
      
      if (current && next) {
        const hipMovement = this.calculateHipMovement(current, next);
        const shoulderMovement = this.calculateShoulderMovement(current, next);
        
        if (hipMovement > shoulderMovement) {
          score += 10; // Good sequencing
        }
      }
    }
    
    return Math.min(100, score);
  }

  private calculateLag(startLandmarks: PoseLandmark[], endLandmarks: PoseLandmark[]): number {
    // Calculate wrist lag during downswing
    const startWrist = startLandmarks[16];
    const endWrist = endLandmarks[16];
    
    if (!startWrist || !endWrist) return 0;
    
    const wristAngle = this.calculateWristAngle(startWrist, endWrist);
    return Math.max(0, 100 - wristAngle);
  }

  private calculateSwingPath(allLandmarks: PoseLandmark[][], startFrame: number, endFrame: number): number {
    // Calculate how on-plane the swing is
    let score = 100;
    const step = Math.max(1, Math.floor((endFrame - startFrame) / 10));
    
    for (let i = startFrame; i < endFrame - step; i += step) {
      const landmarks = allLandmarks[i];
      const planeAngle = this.calculateSwingPlane(landmarks);
      const idealAngle = 60; // Ideal swing plane angle
      
      const deviation = Math.abs(planeAngle - idealAngle);
      score -= deviation * 0.5;
    }
    
    return Math.max(0, score);
  }

  private calculateWeightTransfer(landmarks: PoseLandmark[]): number {
    // Calculate weight transfer at impact
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    
    if (!leftAnkle || !rightAnkle) return 0;
    
    const leftWeight = Math.abs(leftAnkle.x);
    const rightWeight = Math.abs(rightAnkle.x);
    const totalWeight = leftWeight + rightWeight;
    
    return totalWeight > 0 ? (rightWeight / totalWeight) * 100 : 50;
  }

  private calculateClubFace(landmarks: PoseLandmark[]): number {
    // Calculate club face angle at impact
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    
    if (!leftWrist || !rightWrist) return 0;
    
    const wristAngle = Math.atan2(rightWrist.y - leftWrist.y, rightWrist.x - leftWrist.x) * (180 / Math.PI);
    return Math.abs(wristAngle);
  }

  private calculateBodyPosition(landmarks: PoseLandmark[]): number {
    // Calculate body position at impact
    const spineAngle = this.calculateSpineAngle(landmarks);
    const idealAngle = 32;
    const deviation = Math.abs(spineAngle - idealAngle);
    
    return Math.max(0, 100 - (deviation * 2));
  }

  private calculateRelease(landmarks: PoseLandmark[]): number {
    // Calculate wrist release at impact
    const wristHinge = this.calculateWristHinge(landmarks);
    const idealHinge = 90;
    const deviation = Math.abs(wristHinge - idealHinge);
    
    return Math.max(0, 100 - (deviation * 0.5));
  }

  private calculateFinishPosition(landmarks: PoseLandmark[]): number {
    // Calculate finish position quality
    const balance = this.calculateBalance(landmarks);
    const posture = this.calculatePosture(landmarks);
    
    return (balance + posture) / 2;
  }

  private calculateBodyRotation(startLandmarks: PoseLandmark[], endLandmarks: PoseLandmark[]): number {
    const shoulderRotation = this.calculateShoulderRotation(startLandmarks, endLandmarks);
    const hipRotation = this.calculateHipRotation(startLandmarks, endLandmarks);
    
    return (shoulderRotation + hipRotation) / 2;
  }

  private calculateExtension(landmarks: PoseLandmark[]): number {
    // Calculate arm extension at finish
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return 0;
    
    const leftExtension = this.calculateDistance(leftShoulder, leftWrist);
    const rightExtension = this.calculateDistance(rightShoulder, rightWrist);
    
    return (leftExtension + rightExtension) / 2 * 100;
  }

  // Utility methods
  private calculateVelocity(point1: TrajectoryPoint, point2: TrajectoryPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = (point2.z || 0) - (point1.z || 0);
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

  private calculateAngle(point1: PoseLandmark, point2: PoseLandmark, point3: PoseLandmark): number {
    const a = this.calculateDistance(point1, point2);
    const b = this.calculateDistance(point2, point3);
    const c = this.calculateDistance(point1, point3);
    
    if (a === 0 || b === 0) return 0;
    
    const angle = Math.acos((a * a + b * b - c * c) / (2 * a * b));
    return angle * (180 / Math.PI);
  }

  private calculateDistance(point1: PoseLandmark, point2: PoseLandmark): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = (point2.z || 0) - (point1.z || 0);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private calculateHipMovement(landmarks1: PoseLandmark[], landmarks2: PoseLandmark[]): number {
    const leftHip1 = landmarks1[23];
    const rightHip1 = landmarks1[24];
    const leftHip2 = landmarks2[23];
    const rightHip2 = landmarks2[24];
    
    if (!leftHip1 || !rightHip1 || !leftHip2 || !rightHip2) return 0;
    
    const center1 = { x: (leftHip1.x + rightHip1.x) / 2, y: (leftHip1.y + rightHip1.y) / 2, z: (leftHip1.z || 0 + rightHip1.z || 0) / 2 };
    const center2 = { x: (leftHip2.x + rightHip2.x) / 2, y: (leftHip2.y + rightHip2.y) / 2, z: (leftHip2.z || 0 + rightHip2.z || 0) / 2 };
    
    return this.calculateDistance(center1, center2);
  }

  private calculateShoulderMovement(landmarks1: PoseLandmark[], landmarks2: PoseLandmark[]): number {
    const leftShoulder1 = landmarks1[11];
    const rightShoulder1 = landmarks1[12];
    const leftShoulder2 = landmarks2[11];
    const rightShoulder2 = landmarks2[12];
    
    if (!leftShoulder1 || !rightShoulder1 || !leftShoulder2 || !rightShoulder2) return 0;
    
    const center1 = { x: (leftShoulder1.x + rightShoulder1.x) / 2, y: (leftShoulder1.y + rightShoulder1.y) / 2, z: (leftShoulder1.z || 0 + rightShoulder1.z || 0) / 2 };
    const center2 = { x: (leftShoulder2.x + rightShoulder2.x) / 2, y: (leftShoulder2.y + rightShoulder2.y) / 2, z: (leftShoulder2.z || 0 + rightShoulder2.z || 0) / 2 };
    
    return this.calculateDistance(center1, center2);
  }

  private calculateWristAngle(wrist1: PoseLandmark, wrist2: PoseLandmark): number {
    const dx = wrist2.x - wrist1.x;
    const dy = wrist2.y - wrist1.y;
    
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  private calculatePhaseConfidence(landmarks: PoseLandmark[][], startFrame: number, endFrame: number): number {
    if (endFrame - startFrame < 2) return 0.5;
    
    let confidence = 0.8;
    
    // Check for sufficient landmark visibility
    for (let i = startFrame; i < endFrame; i++) {
      const frame = landmarks[i];
      if (!frame || frame.length < 20) {
        confidence -= 0.1;
      }
    }
    
    return Math.max(0.1, confidence);
  }

  private gradePhase(phase: EnhancedSwingPhase): EnhancedSwingPhase {
    const benchmark = this.config.professionalBenchmarks[phase.name];
    let score = 0;
    
    // Grade based on duration
    const durationScore = Math.max(0, 100 - Math.abs(phase.duration - benchmark.idealDuration) / benchmark.idealDuration * 100);
    score += durationScore * 0.3;
    
    // Grade based on key metrics
    const metricsScore = this.calculateMetricsScore(phase.metrics, phase.name);
    score += metricsScore * 0.7;
    
    // Determine grade
    if (score >= 90) phase.grade = 'A';
    else if (score >= 80) phase.grade = 'B';
    else if (score >= 70) phase.grade = 'C';
    else if (score >= 60) phase.grade = 'D';
    else phase.grade = 'F';
    
    return phase;
  }

  private calculateMetricsScore(metrics: PhaseMetrics, phaseName: string): number {
    let score = 0;
    let count = 0;
    
    switch (phaseName) {
      case 'address':
        if (metrics.spineAngle) { score += Math.max(0, 100 - Math.abs(metrics.spineAngle - 32) * 2); count++; }
        if (metrics.kneeFlex) { score += Math.max(0, 100 - Math.abs(metrics.kneeFlex - 15) * 2); count++; }
        if (metrics.posture) { score += metrics.posture; count++; }
        break;
      case 'backswing':
        if (metrics.shoulderRotation) { score += Math.max(0, 100 - Math.abs(metrics.shoulderRotation - 90) * 0.5); count++; }
        if (metrics.xFactor) { score += Math.max(0, 100 - Math.abs(metrics.xFactor - 25) * 2); count++; }
        break;
      case 'top':
        if (metrics.wristHinge) { score += Math.max(0, 100 - Math.abs(metrics.wristHinge - 90) * 0.5); count++; }
        if (metrics.balance) { score += metrics.balance; count++; }
        break;
      case 'downswing':
        if (metrics.tempoRatio) { score += Math.max(0, 100 - Math.abs(metrics.tempoRatio - 3.0) * 10); count++; }
        if (metrics.sequencing) { score += metrics.sequencing; count++; }
        break;
      case 'impact':
        if (metrics.weightTransfer) { score += Math.max(0, 100 - Math.abs(metrics.weightTransfer - 80) * 0.5); count++; }
        if (metrics.clubFace) { score += Math.max(0, 100 - Math.abs(metrics.clubFace) * 2); count++; }
        break;
      case 'follow-through':
        if (metrics.finishBalance) { score += metrics.finishBalance; count++; }
        if (metrics.extension) { score += metrics.extension; count++; }
        break;
    }
    
    return count > 0 ? score / count : 50;
  }

  private addRecommendations(phase: EnhancedSwingPhase): EnhancedSwingPhase {
    const recommendations: string[] = [];
    
    switch (phase.name) {
      case 'address':
        if (phase.metrics.spineAngle && phase.metrics.spineAngle < 25) {
          recommendations.push('Increase spine angle for better posture');
        }
        if (phase.metrics.kneeFlex && phase.metrics.kneeFlex < 10) {
          recommendations.push('Add more knee flex for better balance');
        }
        break;
      case 'backswing':
        if (phase.metrics.shoulderRotation && phase.metrics.shoulderRotation < 80) {
          recommendations.push('Increase shoulder turn for more power');
        }
        if (phase.metrics.xFactor && phase.metrics.xFactor < 20) {
          recommendations.push('Work on X-factor separation between shoulders and hips');
        }
        break;
      case 'top':
        if (phase.metrics.balance && phase.metrics.balance < 70) {
          recommendations.push('Improve balance at the top of your swing');
        }
        break;
      case 'downswing':
        if (phase.metrics.tempoRatio && phase.metrics.tempoRatio < 2.5) {
          recommendations.push('Slow down your backswing for better tempo');
        }
        if (phase.metrics.sequencing && phase.metrics.sequencing < 60) {
          recommendations.push('Work on proper sequencing: hips first, then shoulders');
        }
        break;
      case 'impact':
        if (phase.metrics.weightTransfer && phase.metrics.weightTransfer < 70) {
          recommendations.push('Transfer more weight to your front foot at impact');
        }
        if (phase.metrics.clubFace && Math.abs(phase.metrics.clubFace) > 5) {
          recommendations.push('Work on squaring the club face at impact');
        }
        break;
      case 'follow-through':
        if (phase.metrics.finishBalance && phase.metrics.finishBalance < 70) {
          recommendations.push('Improve your finish position and balance');
        }
        break;
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great work! Keep practicing to maintain consistency');
    }
    
    phase.recommendations = recommendations;
    return phase;
  }
}
