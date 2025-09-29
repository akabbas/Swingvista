import { PoseResult } from './mediapipe';
import { SwingPhaseAnalysis } from './professional-phase-detection';

export interface ProfessionalSwingMetrics {
  // Timing metrics
  tempoRatio: number;
  backswingTime: number;
  downswingTime: number;
  totalSwingTime: number;
  
  // Rotation metrics
  shoulderTurn: number;
  hipTurn: number;
  xFactor: number;
  spineAngle: number;
  
  // Weight transfer metrics
  weightTransfer: number;
  pressureShift: number;
  balanceStability: number;
  
  // Swing path metrics
  swingPlane: number;
  clubPath: number;
  attackAngle: number;
  shaftAngle: number;
  
  // Impact metrics
  handPosition: { x: number; y: number };
  clubfaceAngle: number;
  lowPoint: number;
  impactVelocity: number;
  
  // Consistency metrics
  swingConsistency: number;
  tempoStability: number;
  planeConsistency: number;
  
  // Overall scores
  overallScore: number;
  letterGrade: string;
  confidence: number;
}

export function calculateProfessionalSwingMetrics(
  poses: PoseResult[],
  phaseAnalysis: SwingPhaseAnalysis
): ProfessionalSwingMetrics {
  if (!poses || poses.length < 30) {
    throw new Error('Insufficient pose data for professional analysis. Need at least 30 frames.');
  }

  // Validate phase analysis
  if (phaseAnalysis.overallConfidence < 0.5) {
    throw new Error('Phase detection confidence too low for accurate analysis.');
  }

  // Calculate all metrics from real video data
  const timingMetrics = calculateTimingMetrics(poses, phaseAnalysis);
  const rotationMetrics = calculateRotationMetrics(poses, phaseAnalysis);
  const weightTransferMetrics = calculateWeightTransferMetrics(poses, phaseAnalysis);
  const swingPathMetrics = calculateSwingPathMetrics(poses, phaseAnalysis);
  const impactMetrics = calculateImpactMetrics(poses, phaseAnalysis);
  const consistencyMetrics = calculateConsistencyMetrics(poses, phaseAnalysis);
  
  // Calculate overall scores
  const overallScore = calculateOverallScore({
    ...timingMetrics,
    ...rotationMetrics,
    ...weightTransferMetrics,
    ...swingPathMetrics,
    ...impactMetrics,
    ...consistencyMetrics
  });
  
  const letterGrade = calculateLetterGrade(overallScore);
  const confidence = calculateAnalysisConfidence(poses, phaseAnalysis);

  return {
    ...timingMetrics,
    ...rotationMetrics,
    ...weightTransferMetrics,
    ...swingPathMetrics,
    ...impactMetrics,
    ...consistencyMetrics,
    overallScore,
    letterGrade,
    confidence
  };
}

function calculateTimingMetrics(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis) {
  const backswingTime = phaseAnalysis.backswing.duration;
  const downswingTime = phaseAnalysis.downswing.duration;
  const totalSwingTime = phaseAnalysis.totalDuration;
  
  // Calculate tempo ratio from actual phase durations
  const tempoRatio = backswingTime > 0 ? backswingTime / downswingTime : 0;
  
  return {
    tempoRatio,
    backswingTime,
    downswingTime,
    totalSwingTime
  };
}

function calculateRotationMetrics(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis) {
  // Get poses at key phases
  const addressPose = poses[phaseAnalysis.address.start];
  const topPose = poses[phaseAnalysis.top.start];
  const impactPose = poses[phaseAnalysis.impact.start];
  
  if (!addressPose || !topPose || !impactPose) {
    throw new Error('Insufficient pose data for rotation analysis.');
  }
  
  // Calculate shoulder turn
  const shoulderTurn = calculateShoulderTurn(addressPose, topPose);
  
  // Calculate hip turn
  const hipTurn = calculateHipTurn(addressPose, topPose);
  
  // Calculate X-Factor (shoulder-hip differential)
  const xFactor = shoulderTurn - hipTurn;
  
  // Calculate spine angle
  const spineAngle = calculateSpineAngle(impactPose);
  
  return {
    shoulderTurn,
    hipTurn,
    xFactor,
    spineAngle
  };
}

function calculateWeightTransferMetrics(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis) {
  // Calculate weight transfer throughout swing
  const weightTransferData = poses.map((pose, index) => {
    const keypoints = pose.pose?.keypoints || [];
    const leftHip = keypoints.find(kp => kp.name === 'left_hip');
    const rightHip = keypoints.find(kp => kp.name === 'right_hip');
    
    if (!leftHip || !rightHip) return 0;
    
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    return Math.max(0, Math.min(100, (hipCenterX / 640) * 100));
  });
  
  // Calculate weight transfer at impact
  const impactWeight = weightTransferData[phaseAnalysis.impact.start] || 0;
  
  // Calculate pressure shift timing
  const pressureShift = calculatePressureShiftTiming(weightTransferData, phaseAnalysis);
  
  // Calculate balance stability
  const balanceStability = calculateBalanceStability(weightTransferData);
  
  return {
    weightTransfer: impactWeight,
    pressureShift,
    balanceStability
  };
}

function calculateSwingPathMetrics(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis) {
  // Calculate swing plane angle
  const swingPlane = calculateSwingPlaneAngle(poses, phaseAnalysis);
  
  // Calculate club path angle
  const clubPath = calculateClubPathAngle(poses, phaseAnalysis);
  
  // Calculate attack angle
  const attackAngle = calculateAttackAngle(poses, phaseAnalysis);
  
  // Calculate shaft angle
  const shaftAngle = calculateShaftAngle(poses, phaseAnalysis);
  
  return {
    swingPlane,
    clubPath,
    attackAngle,
    shaftAngle
  };
}

function calculateImpactMetrics(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis) {
  const impactPose = poses[phaseAnalysis.impact.start];
  if (!impactPose) {
    throw new Error('Impact pose not found for impact analysis.');
  }
  
  const keypoints = impactPose.pose?.keypoints || [];
  const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
  
  if (!leftWrist || !rightWrist) {
    throw new Error('Wrist keypoints not found for impact analysis.');
  }
  
  // Calculate hand position at impact
  const handPosition = {
    x: (leftWrist.x + rightWrist.x) / 2,
    y: (leftWrist.y + rightWrist.y) / 2
  };
  
  // Calculate clubface angle
  const clubfaceAngle = calculateClubfaceAngle(impactPose);
  
  // Calculate low point
  const lowPoint = calculateLowPoint(poses, phaseAnalysis);
  
  // Calculate impact velocity
  const impactVelocity = calculateImpactVelocity(poses, phaseAnalysis);
  
  return {
    handPosition,
    clubfaceAngle,
    lowPoint,
    impactVelocity
  };
}

function calculateConsistencyMetrics(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis) {
  // Calculate swing consistency
  const swingConsistency = calculateSwingConsistency(poses, phaseAnalysis);
  
  // Calculate tempo stability
  const tempoStability = calculateTempoStability(poses, phaseAnalysis);
  
  // Calculate plane consistency
  const planeConsistency = calculatePlaneConsistency(poses, phaseAnalysis);
  
  return {
    swingConsistency,
    tempoStability,
    planeConsistency
  };
}

// Helper functions for specific calculations

function calculateShoulderTurn(addressPose: PoseResult, topPose: PoseResult): number {
  const addressKeypoints = addressPose.pose?.keypoints || [];
  const topKeypoints = topPose.pose?.keypoints || [];
  
  const addressLeftShoulder = addressKeypoints.find(kp => kp.name === 'left_shoulder');
  const addressRightShoulder = addressKeypoints.find(kp => kp.name === 'right_shoulder');
  const topLeftShoulder = topKeypoints.find(kp => kp.name === 'left_shoulder');
  const topRightShoulder = topKeypoints.find(kp => kp.name === 'right_shoulder');
  
  if (!addressLeftShoulder || !addressRightShoulder || !topLeftShoulder || !topRightShoulder) {
    return 0;
  }
  
  const addressAngle = Math.atan2(
    addressRightShoulder.y - addressLeftShoulder.y,
    addressRightShoulder.x - addressLeftShoulder.x
  );
  
  const topAngle = Math.atan2(
    topRightShoulder.y - topLeftShoulder.y,
    topRightShoulder.x - topLeftShoulder.x
  );
  
  return Math.abs((topAngle - addressAngle) * (180 / Math.PI));
}

function calculateHipTurn(addressPose: PoseResult, topPose: PoseResult): number {
  const addressKeypoints = addressPose.pose?.keypoints || [];
  const topKeypoints = topPose.pose?.keypoints || [];
  
  const addressLeftHip = addressKeypoints.find(kp => kp.name === 'left_hip');
  const addressRightHip = addressKeypoints.find(kp => kp.name === 'right_hip');
  const topLeftHip = topKeypoints.find(kp => kp.name === 'left_hip');
  const topRightHip = topKeypoints.find(kp => kp.name === 'right_hip');
  
  if (!addressLeftHip || !addressRightHip || !topLeftHip || !topRightHip) {
    return 0;
  }
  
  const addressAngle = Math.atan2(
    addressRightHip.y - addressLeftHip.y,
    addressRightHip.x - addressLeftHip.x
  );
  
  const topAngle = Math.atan2(
    topRightHip.y - topLeftHip.y,
    topRightHip.x - topLeftHip.x
  );
  
  return Math.abs((topAngle - addressAngle) * (180 / Math.PI));
}

function calculateSpineAngle(pose: PoseResult): number {
  const keypoints = pose.pose?.keypoints || [];
  const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
  const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
  const leftHip = keypoints.find(kp => kp.name === 'left_hip');
  const rightHip = keypoints.find(kp => kp.name === 'right_hip');
  
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return 0;
  }
  
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  return Math.atan2(
    hipCenter.y - shoulderCenter.y,
    hipCenter.x - shoulderCenter.x
  ) * (180 / Math.PI);
}

function calculatePressureShiftTiming(weightTransferData: number[], phaseAnalysis: SwingPhaseAnalysis): number {
  const downswingStart = phaseAnalysis.downswing.start;
  const impactStart = phaseAnalysis.impact.start;
  
  const downswingWeight = weightTransferData[downswingStart] || 0;
  const impactWeight = weightTransferData[impactStart] || 0;
  
  return impactWeight - downswingWeight;
}

function calculateBalanceStability(weightTransferData: number[]): number {
  // Calculate standard deviation of weight transfer
  const mean = weightTransferData.reduce((sum, val) => sum + val, 0) / weightTransferData.length;
  const variance = weightTransferData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / weightTransferData.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to stability score (lower std dev = higher stability)
  return Math.max(0, 100 - (stdDev * 2));
}

function calculateSwingPlaneAngle(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  // Calculate average swing plane from club path
  const backswingPoses = poses.slice(phaseAnalysis.backswing.start, phaseAnalysis.top.end);
  const downswingPoses = poses.slice(phaseAnalysis.top.start, phaseAnalysis.impact.end);
  
  const backswingAngle = calculateAverageAngle(backswingPoses);
  const downswingAngle = calculateAverageAngle(downswingPoses);
  
  return (backswingAngle + downswingAngle) / 2;
}

function calculateClubPathAngle(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  const impactPose = poses[phaseAnalysis.impact.start];
  if (!impactPose) return 0;
  
  const keypoints = impactPose.pose?.keypoints || [];
  const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
  
  if (!leftWrist || !rightWrist) return 0;
  
  return Math.atan2(
    rightWrist.y - leftWrist.y,
    rightWrist.x - leftWrist.x
  ) * (180 / Math.PI);
}

function calculateAttackAngle(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  // Calculate attack angle from club path at impact
  const impactPose = poses[phaseAnalysis.impact.start];
  const prevPose = poses[phaseAnalysis.impact.start - 1];
  
  if (!impactPose || !prevPose) return 0;
  
  const impactKeypoints = impactPose.pose?.keypoints || [];
  const prevKeypoints = prevPose.pose?.keypoints || [];
  
  const impactLeftWrist = impactKeypoints.find(kp => kp.name === 'left_wrist');
  const impactRightWrist = impactKeypoints.find(kp => kp.name === 'right_wrist');
  const prevLeftWrist = prevKeypoints.find(kp => kp.name === 'left_wrist');
  const prevRightWrist = prevKeypoints.find(kp => kp.name === 'right_wrist');
  
  if (!impactLeftWrist || !impactRightWrist || !prevLeftWrist || !prevRightWrist) return 0;
  
  const impactCenter = {
    x: (impactLeftWrist.x + impactRightWrist.x) / 2,
    y: (impactLeftWrist.y + impactRightWrist.y) / 2
  };
  
  const prevCenter = {
    x: (prevLeftWrist.x + prevRightWrist.x) / 2,
    y: (prevLeftWrist.y + prevRightWrist.y) / 2
  };
  
  return Math.atan2(
    impactCenter.y - prevCenter.y,
    impactCenter.x - prevCenter.x
  ) * (180 / Math.PI);
}

function calculateShaftAngle(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  const impactPose = poses[phaseAnalysis.impact.start];
  if (!impactPose) return 0;
  
  const keypoints = impactPose.pose?.keypoints || [];
  const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
  
  if (!leftWrist || !rightWrist) return 0;
  
  const wristCenter = {
    x: (leftWrist.x + rightWrist.x) / 2,
    y: (leftWrist.y + rightWrist.y) / 2
  };
  
  // Estimate club head position (below hands)
  const clubHead = {
    x: wristCenter.x,
    y: wristCenter.y + 20
  };
  
  return Math.atan2(
    clubHead.y - wristCenter.y,
    clubHead.x - wristCenter.x
  ) * (180 / Math.PI);
}

function calculateClubfaceAngle(pose: PoseResult): number {
  const keypoints = pose.pose?.keypoints || [];
  const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
  
  if (!leftWrist || !rightWrist) return 0;
  
  return Math.atan2(
    rightWrist.y - leftWrist.y,
    rightWrist.x - leftWrist.x
  ) * (180 / Math.PI);
}

function calculateLowPoint(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  // Find the lowest point of the swing arc
  const swingPoses = poses.slice(phaseAnalysis.downswing.start, phaseAnalysis.followThrough.end);
  
  let lowestY = Infinity;
  let lowPointIndex = 0;
  
  swingPoses.forEach((pose, index) => {
    const keypoints = pose.pose?.keypoints || [];
    const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
    const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
    
    if (leftWrist && rightWrist) {
      const wristY = Math.min(leftWrist.y, rightWrist.y);
      if (wristY < lowestY) {
        lowestY = wristY;
        lowPointIndex = index;
      }
    }
  });
  
  return lowPointIndex / 30; // Convert to seconds
}

function calculateImpactVelocity(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  const impactPose = poses[phaseAnalysis.impact.start];
  const prevPose = poses[phaseAnalysis.impact.start - 1];
  
  if (!impactPose || !prevPose) return 0;
  
  const impactKeypoints = impactPose.pose?.keypoints || [];
  const prevKeypoints = prevPose.pose?.keypoints || [];
  
  const impactLeftWrist = impactKeypoints.find(kp => kp.name === 'left_wrist');
  const impactRightWrist = impactKeypoints.find(kp => kp.name === 'right_wrist');
  const prevLeftWrist = prevKeypoints.find(kp => kp.name === 'left_wrist');
  const prevRightWrist = prevKeypoints.find(kp => kp.name === 'right_wrist');
  
  if (!impactLeftWrist || !impactRightWrist || !prevLeftWrist || !prevRightWrist) return 0;
  
  const impactCenter = {
    x: (impactLeftWrist.x + impactRightWrist.x) / 2,
    y: (impactLeftWrist.y + impactRightWrist.y) / 2
  };
  
  const prevCenter = {
    x: (prevLeftWrist.x + prevRightWrist.x) / 2,
    y: (prevLeftWrist.y + prevRightWrist.y) / 2
  };
  
  const distance = Math.sqrt(
    Math.pow(impactCenter.x - prevCenter.x, 2) + Math.pow(impactCenter.y - prevCenter.y, 2)
  );
  
  return distance * 30; // Convert to pixels per second
}

function calculateSwingConsistency(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  // Calculate consistency based on pose stability
  const keyPoses = [
    poses[phaseAnalysis.address.start],
    poses[phaseAnalysis.top.start],
    poses[phaseAnalysis.impact.start]
  ];
  
  let totalVariation = 0;
  let validComparisons = 0;
  
  for (let i = 0; i < keyPoses.length - 1; i++) {
    const pose1 = keyPoses[i];
    const pose2 = keyPoses[i + 1];
    
    if (pose1 && pose2) {
      const variation = calculatePoseVariation(pose1, pose2);
      totalVariation += variation;
      validComparisons++;
    }
  }
  
  const averageVariation = validComparisons > 0 ? totalVariation / validComparisons : 0;
  return Math.max(0, 100 - (averageVariation * 10));
}

function calculateTempoStability(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  // Calculate tempo stability based on phase duration consistency
  const phaseDurations = [
    phaseAnalysis.address.duration,
    phaseAnalysis.approach.duration,
    phaseAnalysis.backswing.duration,
    phaseAnalysis.top.duration,
    phaseAnalysis.downswing.duration,
    phaseAnalysis.impact.duration,
    phaseAnalysis.followThrough.duration
  ];
  
  const mean = phaseDurations.reduce((sum, val) => sum + val, 0) / phaseDurations.length;
  const variance = phaseDurations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / phaseDurations.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.max(0, 100 - (stdDev * 20));
}

function calculatePlaneConsistency(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  // Calculate plane consistency from swing path
  const swingPoses = poses.slice(phaseAnalysis.backswing.start, phaseAnalysis.followThrough.end);
  const angles = swingPoses.map(pose => calculateAverageAngle([pose])).filter(angle => !isNaN(angle));
  
  if (angles.length === 0) return 0;
  
  const mean = angles.reduce((sum, val) => sum + val, 0) / angles.length;
  const variance = angles.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / angles.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.max(0, 100 - (stdDev * 5));
}

function calculateAverageAngle(poses: PoseResult[]): number {
  if (poses.length === 0) return 0;
  
  let totalAngle = 0;
  let validPoses = 0;
  
  poses.forEach(pose => {
    const keypoints = pose.pose?.keypoints || [];
    const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
    const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
    
    if (leftWrist && rightWrist) {
      const angle = Math.atan2(
        rightWrist.y - leftWrist.y,
        rightWrist.x - leftWrist.x
      ) * (180 / Math.PI);
      
      totalAngle += angle;
      validPoses++;
    }
  });
  
  return validPoses > 0 ? totalAngle / validPoses : 0;
}

function calculatePoseVariation(pose1: PoseResult, pose2: PoseResult): number {
  const keypoints1 = pose1.pose?.keypoints || [];
  const keypoints2 = pose2.pose?.keypoints || [];
  
  if (keypoints1.length !== keypoints2.length) return 100;
  
  let totalVariation = 0;
  let validKeypoints = 0;
  
  keypoints1.forEach((kp1, index) => {
    const kp2 = keypoints2[index];
    if (kp1 && kp2 && kp1.score > 0.5 && kp2.score > 0.5) {
      const distance = Math.sqrt(
        Math.pow(kp1.x - kp2.x, 2) + Math.pow(kp1.y - kp2.y, 2)
      );
      totalVariation += distance;
      validKeypoints++;
    }
  });
  
  return validKeypoints > 0 ? totalVariation / validKeypoints : 100;
}

function calculateOverallScore(metrics: any): number {
  // Weight different metrics based on importance
  const weights = {
    tempoRatio: 0.15,
    shoulderTurn: 0.10,
    hipTurn: 0.10,
    xFactor: 0.15,
    weightTransfer: 0.15,
    swingPlane: 0.10,
    clubPath: 0.10,
    impactVelocity: 0.10,
    swingConsistency: 0.05
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.entries(weights).forEach(([metric, weight]) => {
    if (metrics[metric] !== undefined) {
      const normalizedScore = normalizeMetricScore(metric, metrics[metric]);
      totalScore += normalizedScore * weight;
      totalWeight += weight;
    }
  });
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

function normalizeMetricScore(metric: string, value: number): number {
  // Normalize different metrics to 0-100 scale
  switch (metric) {
    case 'tempoRatio':
      // Ideal tempo ratio is 3.0
      return Math.max(0, 100 - Math.abs(value - 3.0) * 20);
    case 'shoulderTurn':
      // Ideal shoulder turn is 90 degrees
      return Math.max(0, 100 - Math.abs(value - 90) * 2);
    case 'hipTurn':
      // Ideal hip turn is 50 degrees
      return Math.max(0, 100 - Math.abs(value - 50) * 2);
    case 'xFactor':
      // Ideal X-Factor is 40 degrees
      return Math.max(0, 100 - Math.abs(value - 40) * 2);
    case 'weightTransfer':
      // Ideal weight transfer is 85%
      return Math.max(0, 100 - Math.abs(value - 85) * 1);
    case 'swingPlane':
      // Ideal swing plane is 60 degrees
      return Math.max(0, 100 - Math.abs(value - 60) * 2);
    case 'clubPath':
      // Ideal club path is 0 degrees (straight)
      return Math.max(0, 100 - Math.abs(value) * 2);
    case 'impactVelocity':
      // Higher velocity is better (normalize to 0-100)
      return Math.min(100, value / 10);
    case 'swingConsistency':
      // Already normalized to 0-100
      return value;
    default:
      return Math.max(0, Math.min(100, value));
  }
}

function calculateLetterGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
}

function calculateAnalysisConfidence(poses: PoseResult[], phaseAnalysis: SwingPhaseAnalysis): number {
  // Calculate confidence based on data quality and phase detection
  let confidence = phaseAnalysis.overallConfidence;
  
  // Adjust based on pose quality
  const avgPoseScore = poses.reduce((sum, pose) => {
    const keypoints = pose.pose?.keypoints || [];
    const avgScore = keypoints.reduce((s, kp) => s + kp.score, 0) / keypoints.length;
    return sum + avgScore;
  }, 0) / poses.length;
  
  confidence *= avgPoseScore;
  
  // Adjust based on data completeness
  const completeness = poses.length / 90; // Ideal is 90 frames (3 seconds at 30fps)
  confidence *= Math.min(1, completeness);
  
  return Math.max(0, Math.min(1, confidence));
}





