import type { PoseResult, PoseLandmark } from './mediapipe';
import type { EnhancedSwingPhase } from './enhanced-swing-phases';

// Golf-specific landmark indices
const GOLF_LANDMARKS = {
  head: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

export interface ClubPathPoint {
  x: number;
  y: number;
  timestamp: number;
  phase: string;
  velocity: number;
  acceleration: number;
}

export interface SwingTempoAnalysis {
  backswingTempo: number;
  transitionTempo: number;
  downswingTempo: number;
  followThroughTempo: number;
  overallTempo: number;
  tempoConsistency: number;
  phaseTimings: {
    backswing: { start: number; end: number; duration: number };
    transition: { start: number; end: number; duration: number };
    downswing: { start: number; end: number; duration: number };
    followThrough: { start: number; end: number; duration: number };
  };
}

export interface BodyRotationMetrics {
  shoulderRotation: {
    maxAngle: number;
    currentAngle: number;
    rotationVelocity: number;
    rotationAcceleration: number;
  };
  hipRotation: {
    maxAngle: number;
    currentAngle: number;
    rotationVelocity: number;
    rotationAcceleration: number;
  };
  spineAngle: {
    currentAngle: number;
    tilt: number;
    stability: number;
  };
  rotationSequence: {
    hipLead: number;
    shoulderLead: number;
    sequenceQuality: number;
  };
}

export interface FollowThroughAssessment {
  extension: number;
  balance: number;
  finish: number;
  overallQuality: number;
  recommendations: string[];
}

export interface AdvancedGolfAnalysis {
  clubPath: ClubPathPoint[];
  swingTempo: SwingTempoAnalysis;
  bodyRotation: BodyRotationMetrics;
  followThrough: FollowThroughAssessment;
  overallGrade: string;
  recommendations: string[];
}

/**
 * Estimate club path using wrist and shoulder landmarks
 */
export function estimateClubPath(poses: PoseResult[], phases: EnhancedSwingPhase[]): ClubPathPoint[] {
  const clubPath: ClubPathPoint[] = [];
  
  poses.forEach((pose, index) => {
    if (!pose.landmarks || pose.landmarks.length === 0) return;
    
    const landmarks = pose.landmarks;
    const leftWrist = landmarks[GOLF_LANDMARKS.leftWrist];
    const rightWrist = landmarks[GOLF_LANDMARKS.rightWrist];
    const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
    
    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return;
    
    // Calculate club head position using wrist positions and shoulder orientation
    const wristCenter = {
      x: (leftWrist.x + rightWrist.x) / 2,
      y: (leftWrist.y + rightWrist.y) / 2
    };
    
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    
    // Estimate club head position (offset from wrists based on shoulder angle)
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );
    
    // Club head offset calculation
    const clubLength = 0.15; // Estimated club length as fraction of body
    const clubHeadX = wristCenter.x + Math.cos(shoulderAngle) * clubLength;
    const clubHeadY = wristCenter.y + Math.sin(shoulderAngle) * clubLength;
    
    // Calculate velocity and acceleration
    let velocity = 0;
    let acceleration = 0;
    
    if (clubPath.length > 0) {
      const prevPoint = clubPath[clubPath.length - 1];
      const timeDiff = pose.timestamp - prevPoint.timestamp;
      if (timeDiff > 0) {
        const distance = Math.sqrt(
          Math.pow(clubHeadX - prevPoint.x, 2) + 
          Math.pow(clubHeadY - prevPoint.y, 2)
        );
        velocity = distance / timeDiff;
        
        if (clubPath.length > 1) {
          const prevVelocity = prevPoint.velocity;
          acceleration = (velocity - prevVelocity) / timeDiff;
        }
      }
    }
    
    // Determine current phase
    const currentPhase = phases.find(phase => 
      pose.timestamp >= phase.startTime && pose.timestamp <= phase.endTime
    )?.name || 'unknown';
    
    clubPath.push({
      x: clubHeadX,
      y: clubHeadY,
      timestamp: pose.timestamp,
      phase: currentPhase,
      velocity,
      acceleration
    });
  });
  
  return clubPath;
}

/**
 * Analyze swing tempo breakdown by phases
 */
export function analyzeSwingTempo(poses: PoseResult[], phases: EnhancedSwingPhase[]): SwingTempoAnalysis {
  const clubPath = estimateClubPath(poses, phases);
  
  // Group club path points by phases
  const phaseGroups: { [key: string]: ClubPathPoint[] } = {};
  clubPath.forEach(point => {
    if (!phaseGroups[point.phase]) {
      phaseGroups[point.phase] = [];
    }
    phaseGroups[point.phase].push(point);
  });
  
  // Calculate tempo for each phase
  const backswingTempo = calculatePhaseTempo(phaseGroups['backswing'] || []);
  const transitionTempo = calculatePhaseTempo(phaseGroups['transition'] || []);
  const downswingTempo = calculatePhaseTempo(phaseGroups['downswing'] || []);
  const followThroughTempo = calculatePhaseTempo(phaseGroups['follow-through'] || []);
  
  // Calculate overall tempo
  const overallTempo = (backswingTempo + transitionTempo + downswingTempo + followThroughTempo) / 4;
  
  // Calculate tempo consistency
  const tempos = [backswingTempo, transitionTempo, downswingTempo, followThroughTempo].filter(t => t > 0);
  const tempoConsistency = calculateTempoConsistency(tempos);
  
  // Calculate phase timings
  const phaseTimings = {
    backswing: calculatePhaseTiming(phases, 'backswing'),
    transition: calculatePhaseTiming(phases, 'transition'),
    downswing: calculatePhaseTiming(phases, 'downswing'),
    followThrough: calculatePhaseTiming(phases, 'follow-through')
  };
  
  return {
    backswingTempo,
    transitionTempo,
    downswingTempo,
    followThroughTempo,
    overallTempo,
    tempoConsistency,
    phaseTimings
  };
}

/**
 * Calculate body rotation metrics using hip and shoulder angles
 */
export function calculateBodyRotationMetrics(poses: PoseResult[]): BodyRotationMetrics {
  const rotationHistory: {
    timestamp: number;
    shoulderAngle: number;
    hipAngle: number;
    spineAngle: number;
  }[] = [];
  
  poses.forEach(pose => {
    if (!pose.landmarks || pose.landmarks.length === 0) return;
    
    const landmarks = pose.landmarks;
    const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
    const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_LANDMARKS.rightHip];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;
    
    // Calculate shoulder rotation angle
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * (180 / Math.PI);
    
    // Calculate hip rotation angle
    const hipAngle = Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x
    ) * (180 / Math.PI);
    
    // Calculate spine angle (tilt from vertical)
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    const spineAngle = Math.atan2(
      hipCenter.x - shoulderCenter.x,
      hipCenter.y - shoulderCenter.y
    ) * (180 / Math.PI);
    
    rotationHistory.push({
      timestamp: pose.timestamp,
      shoulderAngle,
      hipAngle,
      spineAngle
    });
  });
  
  // Calculate rotation metrics
  const shoulderRotation = calculateRotationMetrics(rotationHistory, 'shoulderAngle');
  const hipRotation = calculateRotationMetrics(rotationHistory, 'hipAngle');
  const spineAngle = calculateSpineMetrics(rotationHistory);
  const rotationSequence = calculateRotationSequence(rotationHistory);
  
  return {
    shoulderRotation,
    hipRotation,
    spineAngle,
    rotationSequence
  };
}

/**
 * Assess follow-through quality
 */
export function assessFollowThrough(poses: PoseResult[], phases: EnhancedSwingPhase[]): FollowThroughAssessment {
  const followThroughPhase = phases.find(phase => phase.name === 'follow-through');
  if (!followThroughPhase) {
    return {
      extension: 0,
      balance: 0,
      finish: 0,
      overallQuality: 0,
      recommendations: ['No follow-through phase detected']
    };
  }
  
  // Get poses during follow-through
  const followThroughPoses = poses.filter(pose => 
    pose.timestamp >= followThroughPhase.startTime && 
    pose.timestamp <= followThroughPhase.endTime
  );
  
  if (followThroughPoses.length === 0) {
    return {
      extension: 0,
      balance: 0,
      finish: 0,
      overallQuality: 0,
      recommendations: ['No follow-through poses available']
    };
  }
  
  // Calculate extension (how far the club travels)
  const extension = calculateFollowThroughExtension(followThroughPoses);
  
  // Calculate balance (stability during follow-through)
  const balance = calculateFollowThroughBalance(followThroughPoses);
  
  // Calculate finish position quality
  const finish = calculateFinishPosition(followThroughPoses);
  
  // Calculate overall quality
  const overallQuality = (extension + balance + finish) / 3;
  
  // Generate recommendations
  const recommendations = generateFollowThroughRecommendations(extension, balance, finish);
  
  return {
    extension,
    balance,
    finish,
    overallQuality,
    recommendations
  };
}

/**
 * Perform comprehensive advanced golf analysis
 */
export function performAdvancedGolfAnalysis(
  poses: PoseResult[], 
  phases: EnhancedSwingPhase[]
): AdvancedGolfAnalysis {
  // Calculate all metrics
  const clubPath = estimateClubPath(poses, phases);
  const swingTempo = analyzeSwingTempo(poses, phases);
  const bodyRotation = calculateBodyRotationMetrics(poses);
  const followThrough = assessFollowThrough(poses, phases);
  
  // Calculate overall grade
  const overallGrade = calculateOverallGrade(swingTempo, bodyRotation, followThrough);
  
  // Generate recommendations
  const recommendations = generateOverallRecommendations(swingTempo, bodyRotation, followThrough);
  
  return {
    clubPath,
    swingTempo,
    bodyRotation,
    followThrough,
    overallGrade,
    recommendations
  };
}

// Helper functions

function calculatePhaseTempo(phasePoints: ClubPathPoint[]): number {
  if (phasePoints.length < 2) return 0;
  
  const velocities = phasePoints.map(point => point.velocity).filter(v => v > 0);
  if (velocities.length === 0) return 0;
  
  return velocities.reduce((sum, vel) => sum + vel, 0) / velocities.length;
}

function calculateTempoConsistency(tempos: number[]): number {
  if (tempos.length < 2) return 1;
  
  const mean = tempos.reduce((sum, tempo) => sum + tempo, 0) / tempos.length;
  const variance = tempos.reduce((sum, tempo) => sum + Math.pow(tempo - mean, 2), 0) / tempos.length;
  const standardDeviation = Math.sqrt(variance);
  
  return Math.max(0, 1 - (standardDeviation / mean));
}

function calculatePhaseTiming(phases: EnhancedSwingPhase[], phaseName: string): { start: number; end: number; duration: number } {
  const phase = phases.find(p => p.name === phaseName);
  if (!phase) return { start: 0, end: 0, duration: 0 };
  
  return {
    start: phase.startTime,
    end: phase.endTime,
    duration: phase.endTime - phase.startTime
  };
}

function calculateRotationMetrics(
  rotationHistory: { timestamp: number; shoulderAngle: number; hipAngle: number; spineAngle: number }[],
  angleType: 'shoulderAngle' | 'hipAngle'
): { maxAngle: number; currentAngle: number; rotationVelocity: number; rotationAcceleration: number } {
  if (rotationHistory.length === 0) {
    return { maxAngle: 0, currentAngle: 0, rotationVelocity: 0, rotationAcceleration: 0 };
  }
  
  const angles = rotationHistory.map(entry => entry[angleType]);
  const maxAngle = Math.max(...angles.map(Math.abs));
  const currentAngle = angles[angles.length - 1];
  
  // Calculate velocity and acceleration
  let rotationVelocity = 0;
  let rotationAcceleration = 0;
  
  if (rotationHistory.length > 1) {
    const current = rotationHistory[rotationHistory.length - 1];
    const previous = rotationHistory[rotationHistory.length - 2];
    const timeDiff = current.timestamp - previous.timestamp;
    
    if (timeDiff > 0) {
      rotationVelocity = Math.abs(current[angleType] - previous[angleType]) / timeDiff;
      
      if (rotationHistory.length > 2) {
        const prevPrev = rotationHistory[rotationHistory.length - 3];
        const prevVelocity = Math.abs(previous[angleType] - prevPrev[angleType]) / (previous.timestamp - prevPrev.timestamp);
        rotationAcceleration = Math.abs(rotationVelocity - prevVelocity) / timeDiff;
      }
    }
  }
  
  return {
    maxAngle,
    currentAngle,
    rotationVelocity,
    rotationAcceleration
  };
}

function calculateSpineMetrics(
  rotationHistory: { timestamp: number; shoulderAngle: number; hipAngle: number; spineAngle: number }[]
): { currentAngle: number; tilt: number; stability: number } {
  if (rotationHistory.length === 0) {
    return { currentAngle: 0, tilt: 0, stability: 0 };
  }
  
  const spineAngles = rotationHistory.map(entry => entry.spineAngle);
  const currentAngle = spineAngles[spineAngles.length - 1];
  const tilt = Math.abs(currentAngle);
  
  // Calculate stability (inverse of variance)
  const mean = spineAngles.reduce((sum, angle) => sum + angle, 0) / spineAngles.length;
  const variance = spineAngles.reduce((sum, angle) => sum + Math.pow(angle - mean, 2), 0) / spineAngles.length;
  const stability = Math.max(0, 1 - (variance / 100)); // Normalize variance
  
  return {
    currentAngle,
    tilt,
    stability
  };
}

function calculateRotationSequence(
  rotationHistory: { timestamp: number; shoulderAngle: number; hipAngle: number; spineAngle: number }[]
): { hipLead: number; shoulderLead: number; sequenceQuality: number } {
  if (rotationHistory.length < 2) {
    return { hipLead: 0, shoulderLead: 0, sequenceQuality: 0 };
  }
  
  // Calculate which body part leads the rotation
  const hipChanges = rotationHistory.map((entry, index) => 
    index > 0 ? Math.abs(entry.hipAngle - rotationHistory[index - 1].hipAngle) : 0
  );
  const shoulderChanges = rotationHistory.map((entry, index) => 
    index > 0 ? Math.abs(entry.shoulderAngle - rotationHistory[index - 1].shoulderAngle) : 0
  );
  
  const hipLead = hipChanges.reduce((sum, change) => sum + change, 0);
  const shoulderLead = shoulderChanges.reduce((sum, change) => sum + change, 0);
  
  // Calculate sequence quality (ideal: hips lead, then shoulders)
  const sequenceQuality = hipLead > shoulderLead ? 0.8 : 0.4;
  
  return {
    hipLead,
    shoulderLead,
    sequenceQuality
  };
}

function calculateFollowThroughExtension(poses: PoseResult[]): number {
  if (poses.length < 2) return 0;
  
  const clubPath = estimateClubPath(poses, []);
  if (clubPath.length < 2) return 0;
  
  // Calculate total distance traveled
  let totalDistance = 0;
  for (let i = 1; i < clubPath.length; i++) {
    const distance = Math.sqrt(
      Math.pow(clubPath[i].x - clubPath[i-1].x, 2) + 
      Math.pow(clubPath[i].y - clubPath[i-1].y, 2)
    );
    totalDistance += distance;
  }
  
  // Normalize extension (0-1 scale)
  return Math.min(1, totalDistance / 2); // Assuming 2 is a good maximum extension
}

function calculateFollowThroughBalance(poses: PoseResult[]): number {
  if (poses.length === 0) return 0;
  
  // Calculate balance based on head position stability
  const headPositions = poses.map(pose => {
    if (!pose.landmarks || pose.landmarks.length === 0) return null;
    const head = pose.landmarks[GOLF_LANDMARKS.head];
    return head ? { x: head.x, y: head.y } : null;
  }).filter(pos => pos !== null);
  
  if (headPositions.length < 2) return 0;
  
  // Calculate head position variance
  const meanX = headPositions.reduce((sum, pos) => sum + pos!.x, 0) / headPositions.length;
  const meanY = headPositions.reduce((sum, pos) => sum + pos!.y, 0) / headPositions.length;
  
  const variance = headPositions.reduce((sum, pos) => 
    sum + Math.pow(pos!.x - meanX, 2) + Math.pow(pos!.y - meanY, 2), 0
  ) / headPositions.length;
  
  // Convert variance to balance score (0-1)
  return Math.max(0, 1 - (variance * 100));
}

function calculateFinishPosition(poses: PoseResult[]): number {
  if (poses.length === 0) return 0;
  
  const lastPose = poses[poses.length - 1];
  if (!lastPose.landmarks || lastPose.landmarks.length === 0) return 0;
  
  const landmarks = lastPose.landmarks;
  const leftWrist = landmarks[GOLF_LANDMARKS.leftWrist];
  const rightWrist = landmarks[GOLF_LANDMARKS.rightWrist];
  const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
  
  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return 0;
  
  // Calculate finish position quality based on arm extension and shoulder position
  const wristCenter = {
    x: (leftWrist.x + rightWrist.x) / 2,
    y: (leftWrist.y + rightWrist.y) / 2
  };
  
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  
  // Calculate extension (distance from shoulders to wrists)
  const extension = Math.sqrt(
    Math.pow(wristCenter.x - shoulderCenter.x, 2) + 
    Math.pow(wristCenter.y - shoulderCenter.y, 2)
  );
  
  // Normalize finish position quality (0-1)
  return Math.min(1, extension * 2);
}

function generateFollowThroughRecommendations(extension: number, balance: number, finish: number): string[] {
  const recommendations: string[] = [];
  
  if (extension < 0.5) {
    recommendations.push('Extend your arms more fully through the follow-through');
  }
  
  if (balance < 0.6) {
    recommendations.push('Maintain better balance during the follow-through');
  }
  
  if (finish < 0.5) {
    recommendations.push('Hold your finish position longer for better stability');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent follow-through technique!');
  }
  
  return recommendations;
}

function calculateOverallGrade(
  swingTempo: SwingTempoAnalysis,
  bodyRotation: BodyRotationMetrics,
  followThrough: FollowThroughAssessment
): string {
  const tempoScore = swingTempo.tempoConsistency;
  const rotationScore = bodyRotation.rotationSequence.sequenceQuality;
  const followThroughScore = followThrough.overallQuality;
  
  const overallScore = (tempoScore + rotationScore + followThroughScore) / 3;
  
  if (overallScore >= 0.9) return 'A+';
  if (overallScore >= 0.8) return 'A';
  if (overallScore >= 0.7) return 'B+';
  if (overallScore >= 0.6) return 'B';
  if (overallScore >= 0.5) return 'C+';
  if (overallScore >= 0.4) return 'C';
  return 'D';
}

function generateOverallRecommendations(
  swingTempo: SwingTempoAnalysis,
  bodyRotation: BodyRotationMetrics,
  followThrough: FollowThroughAssessment
): string[] {
  const recommendations: string[] = [];
  
  if (swingTempo.tempoConsistency < 0.7) {
    recommendations.push('Work on maintaining consistent tempo throughout your swing');
  }
  
  if (bodyRotation.rotationSequence.sequenceQuality < 0.6) {
    recommendations.push('Focus on proper rotation sequence: hips first, then shoulders');
  }
  
  if (followThrough.overallQuality < 0.6) {
    recommendations.push('Improve your follow-through for better swing completion');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Great swing technique! Keep up the excellent work.');
  }
  
  return recommendations;
}
