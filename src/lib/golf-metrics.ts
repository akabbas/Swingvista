import { PoseResult } from './mediapipe';
import { SwingPhase } from './swing-phases';
import { TrajectoryPoint, SwingTrajectory } from './mediapipe';

// Professional benchmark data based on PGA Tour statistics
export const BENCHMARKS = {
  professional: {
    tempo: {
      backswingTime: { min: 0.7, ideal: 0.8, max: 0.9 }, // seconds
      downswingTime: { min: 0.23, ideal: 0.25, max: 0.27 }, // seconds
      tempoRatio: { min: 2.8, ideal: 3.0, max: 3.2 } // backswing:downswing
    },
    rotation: {
      shoulderTurn: { min: 85, ideal: 90, max: 95 }, // degrees
      hipTurn: { min: 45, ideal: 50, max: 55 }, // degrees
      xFactor: { min: 35, ideal: 40, max: 45 } // degrees (shoulder-hip differential)
    },
    weightTransfer: {
      backswing: { min: 80, ideal: 85, max: 90 }, // % on trail foot
      impact: { min: 80, ideal: 85, max: 90 }, // % on lead foot
      finish: { min: 90, ideal: 95, max: 100 } // % on lead foot
    },
    swingPlane: {
      shaftAngle: { min: 55, ideal: 60, max: 65 }, // degrees from ground
      planeDeviation: { min: 0, ideal: 2, max: 4 } // degrees from ideal plane
    },
    bodyAlignment: {
      spineAngle: { min: 35, ideal: 40, max: 45 }, // degrees from vertical
      headMovement: { min: 0, ideal: 2, max: 4 }, // inches of lateral movement
      kneeFlex: { min: 20, ideal: 25, max: 30 } // degrees
    }
  },
  amateur: {
    tempo: {
      backswingTime: { min: 0.6, ideal: 0.8, max: 1.0 },
      downswingTime: { min: 0.2, ideal: 0.25, max: 0.3 },
      tempoRatio: { min: 2.5, ideal: 3.0, max: 3.5 }
    },
    rotation: {
      shoulderTurn: { min: 75, ideal: 85, max: 95 },
      hipTurn: { min: 35, ideal: 45, max: 55 },
      xFactor: { min: 30, ideal: 35, max: 45 }
    },
    weightTransfer: {
      backswing: { min: 70, ideal: 80, max: 90 },
      impact: { min: 70, ideal: 80, max: 90 },
      finish: { min: 80, ideal: 90, max: 100 }
    },
    swingPlane: {
      shaftAngle: { min: 50, ideal: 60, max: 70 },
      planeDeviation: { min: 0, ideal: 4, max: 8 }
    },
    bodyAlignment: {
      spineAngle: { min: 30, ideal: 40, max: 50 },
      headMovement: { min: 0, ideal: 3, max: 6 },
      kneeFlex: { min: 15, ideal: 25, max: 35 }
    }
  }
};

export interface SwingMetrics {
  tempo: {
    backswingTime: number;
    downswingTime: number;
    tempoRatio: number;
    score: number;
  };
  rotation: {
    shoulderTurn: number;
    hipTurn: number;
    xFactor: number;
    score: number;
  };
  weightTransfer: {
    backswing: number;
    impact: number;
    finish: number;
    score: number;
  };
  swingPlane: {
    shaftAngle: number;
    planeDeviation: number;
    score: number;
  };
  bodyAlignment: {
    spineAngle: number;
    headMovement: number;
    kneeFlex: number;
    score: number;
  };
  overallScore: number;
  letterGrade: string;
}

// Calculate tempo metrics from swing phases
export function calculateTempoMetrics(phases: SwingPhase[]): SwingMetrics['tempo'] {
  const backswing = phases.find(p => p.name === 'backswing');
  const downswing = phases.find(p => p.name === 'downswing');
  
  const backswingTime = backswing?.duration || 0;
  const downswingTime = downswing?.duration || 0;
  const tempoRatio = backswingTime / (downswingTime || 1);
  
  // Score based on deviation from ideal professional tempo
  const backswingScore = scoreMetric(backswingTime, BENCHMARKS.professional.tempo.backswingTime);
  const downswingScore = scoreMetric(downswingTime, BENCHMARKS.professional.tempo.downswingTime);
  const ratioScore = scoreMetric(tempoRatio, BENCHMARKS.professional.tempo.tempoRatio);
  
  const score = (backswingScore + downswingScore + ratioScore) / 3;
  
  return {
    backswingTime,
    downswingTime,
    tempoRatio,
    score
  };
}

// Calculate rotation metrics from pose data
export function calculateRotationMetrics(poses: PoseResult[], phases: SwingPhase[]): SwingMetrics['rotation'] {
  const topFrame = findPhaseFrame(phases, 'backswing', 'end');
  const impactFrame = findPhaseFrame(phases, 'downswing', 'end');
  
  if (!topFrame || !impactFrame || !poses[topFrame] || !poses[impactFrame]) {
    return { shoulderTurn: 0, hipTurn: 0, xFactor: 0, score: 0 };
  }
  
  const topPose = poses[topFrame];
  const shoulderTurn = calculateShoulderRotation(topPose);
  const hipTurn = calculateHipRotation(topPose);
  const xFactor = Math.abs(shoulderTurn - hipTurn);
  
  const shoulderScore = scoreMetric(shoulderTurn, BENCHMARKS.professional.rotation.shoulderTurn);
  const hipScore = scoreMetric(hipTurn, BENCHMARKS.professional.rotation.hipTurn);
  const xFactorScore = scoreMetric(xFactor, BENCHMARKS.professional.rotation.xFactor);
  
  const score = (shoulderScore + hipScore + xFactorScore) / 3;
  
  return {
    shoulderTurn,
    hipTurn,
    xFactor,
    score
  };
}

// Calculate weight transfer metrics from pose data
export function calculateWeightTransferMetrics(poses: PoseResult[], phases: SwingPhase[]): SwingMetrics['weightTransfer'] {
  const addressFrame = findPhaseFrame(phases, 'address', 'start');
  const topFrame = findPhaseFrame(phases, 'backswing', 'end');
  const impactFrame = findPhaseFrame(phases, 'downswing', 'end');
  const finishFrame = findPhaseFrame(phases, 'followThrough', 'end');
  
  if (!addressFrame || !topFrame || !impactFrame || !finishFrame) {
    return { backswing: 0, impact: 0, finish: 0, score: 0 };
  }
  
  const backswing = calculateWeightDistribution(poses[topFrame]);
  const impact = calculateWeightDistribution(poses[impactFrame]);
  const finish = calculateWeightDistribution(poses[finishFrame]);
  
  const backswingScore = scoreMetric(backswing, BENCHMARKS.professional.weightTransfer.backswing);
  const impactScore = scoreMetric(impact, BENCHMARKS.professional.weightTransfer.impact);
  const finishScore = scoreMetric(finish, BENCHMARKS.professional.weightTransfer.finish);
  
  const score = (backswingScore + impactScore + finishScore) / 3;
  
  return {
    backswing,
    impact,
    finish,
    score
  };
}

// Calculate swing plane metrics from trajectory data
export function calculateSwingPlaneMetrics(trajectory: SwingTrajectory): SwingMetrics['swingPlane'] {
  const shaftAngle = calculateShaftAngle(trajectory);
  const planeDeviation = calculatePlaneDeviation(trajectory);
  
  const angleScore = scoreMetric(shaftAngle, BENCHMARKS.professional.swingPlane.shaftAngle);
  const deviationScore = scoreMetric(planeDeviation, BENCHMARKS.professional.swingPlane.planeDeviation);
  
  const score = (angleScore + deviationScore) / 2;
  
  return {
    shaftAngle,
    planeDeviation,
    score
  };
}

// Calculate body alignment metrics from pose data
export function calculateBodyAlignmentMetrics(poses: PoseResult[]): SwingMetrics['bodyAlignment'] {
  const spineAngle = calculateSpineAngle(poses);
  const headMovement = calculateHeadMovement(poses);
  const kneeFlex = calculateKneeFlex(poses);
  
  const spineScore = scoreMetric(spineAngle, BENCHMARKS.professional.bodyAlignment.spineAngle);
  const headScore = scoreMetric(headMovement, BENCHMARKS.professional.bodyAlignment.headMovement);
  const kneeScore = scoreMetric(kneeFlex, BENCHMARKS.professional.bodyAlignment.kneeFlex);
  
  const score = (spineScore + headScore + kneeScore) / 3;
  
  return {
    spineAngle,
    headMovement,
    kneeFlex,
    score
  };
}

// Calculate overall swing metrics and grade
export function calculateSwingMetrics(poses: PoseResult[], phases: SwingPhase[], trajectory: SwingTrajectory): SwingMetrics {
  const tempo = calculateTempoMetrics(phases);
  const rotation = calculateRotationMetrics(poses, phases);
  const weightTransfer = calculateWeightTransferMetrics(poses, phases);
  const swingPlane = calculateSwingPlaneMetrics(trajectory);
  const bodyAlignment = calculateBodyAlignmentMetrics(poses);
  
  const overallScore = (
    tempo.score +
    rotation.score +
    weightTransfer.score +
    swingPlane.score +
    bodyAlignment.score
  ) / 5;
  
  return {
    tempo,
    rotation,
    weightTransfer,
    swingPlane,
    bodyAlignment,
    overallScore,
    letterGrade: calculateLetterGrade(overallScore)
  };
}

// Helper functions

function findPhaseFrame(phases: SwingPhase[], phaseName: string, position: 'start' | 'end'): number | null {
  const phase = phases.find(p => p.name === phaseName);
  return phase ? (position === 'start' ? phase.startFrame : phase.endFrame) : null;
}

function calculateShoulderRotation(pose: PoseResult): number {
  const rightShoulder = pose.landmarks[12];
  const leftShoulder = pose.landmarks[11];
  return calculateRotationAngle(rightShoulder, leftShoulder);
}

function calculateHipRotation(pose: PoseResult): number {
  const rightHip = pose.landmarks[24];
  const leftHip = pose.landmarks[23];
  return calculateRotationAngle(rightHip, leftHip);
}

function calculateRotationAngle(right: any, left: any): number {
  const dx = right.x - left.x;
  const dz = right.z - left.z;
  return Math.atan2(dz, dx) * (180 / Math.PI);
}

function calculateWeightDistribution(pose: PoseResult): number {
  const rightFoot = pose.landmarks[32];
  const leftFoot = pose.landmarks[31];
  const rightAnkle = pose.landmarks[28];
  const leftAnkle = pose.landmarks[27];
  
  // Calculate weight distribution based on vertical pressure and foot position
  const rightPressure = (rightFoot.y - rightAnkle.y) / (rightFoot.visibility || 1);
  const leftPressure = (leftFoot.y - leftAnkle.y) / (leftFoot.visibility || 1);
  
  const totalPressure = rightPressure + leftPressure;
  return (rightPressure / totalPressure) * 100;
}

function calculateShaftAngle(trajectory: SwingTrajectory): number {
  // Calculate shaft angle relative to ground at impact
  const impactPoint = trajectory.clubhead[Math.floor(trajectory.clubhead.length * 0.6)];
  const prevPoint = trajectory.clubhead[Math.floor(trajectory.clubhead.length * 0.59)];
  
  const dx = impactPoint.x - prevPoint.x;
  const dy = impactPoint.y - prevPoint.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

function calculatePlaneDeviation(trajectory: SwingTrajectory): number {
  // Calculate deviation from ideal swing plane
  let totalDeviation = 0;
  const points = trajectory.rightWrist;
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    const plane1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const plane2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    totalDeviation += Math.abs(plane2 - plane1) * (180 / Math.PI);
  }
  
  return totalDeviation / (points.length - 2);
}

function calculateSpineAngle(poses: PoseResult[]): number {
  // Calculate average spine angle through the swing
  let totalAngle = 0;
  poses.forEach(pose => {
    const neck = pose.landmarks[0];
    const midHip = {
      x: (pose.landmarks[23].x + pose.landmarks[24].x) / 2,
      y: (pose.landmarks[23].y + pose.landmarks[24].y) / 2,
      z: (pose.landmarks[23].z + pose.landmarks[24].z) / 2
    };
    
    const dx = neck.x - midHip.x;
    const dy = neck.y - midHip.y;
    totalAngle += Math.atan2(dx, dy) * (180 / Math.PI);
  });
  
  return totalAngle / poses.length;
}

function calculateHeadMovement(poses: PoseResult[]): number {
  // Calculate head movement in inches (assuming MediaPipe units)
  const nose = poses.map(pose => pose.landmarks[0]);
  let maxMovement = 0;
  
  for (let i = 1; i < nose.length; i++) {
    const movement = Math.sqrt(
      Math.pow(nose[i].x - nose[i-1].x, 2) +
      Math.pow(nose[i].y - nose[i-1].y, 2)
    );
    maxMovement = Math.max(maxMovement, movement);
  }
  
  return maxMovement * 39.37; // Convert to inches
}

function calculateKneeFlex(poses: PoseResult[]): number {
  // Calculate average knee flex angle
  let totalFlex = 0;
  poses.forEach(pose => {
    const rightKnee = pose.landmarks[26];
    const rightHip = pose.landmarks[24];
    const rightAnkle = pose.landmarks[28];
    
    const angle = calculateAngleBetweenPoints(rightHip, rightKnee, rightAnkle);
    totalFlex += angle;
  });
  
  return totalFlex / poses.length;
}

function calculateAngleBetweenPoints(p1: any, p2: any, p3: any): number {
  const v1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y
  };
  const v2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y
  };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
}

function scoreMetric(value: number, benchmark: { min: number; ideal: number; max: number }): number {
  const { min, ideal, max } = benchmark;
  
  if (value < min) {
    return Math.max(0, 50 * (value / min));
  } else if (value > max) {
    return Math.max(0, 100 - 50 * ((value - max) / max));
  } else {
    const deviation = Math.abs(value - ideal);
    const range = Math.max(ideal - min, max - ideal);
    return Math.max(0, 100 - (deviation / range) * 50);
  }
}

function calculateLetterGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
