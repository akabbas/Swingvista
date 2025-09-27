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

export interface ClubPathAnalysis {
  pathType: 'inside-out' | 'outside-in' | 'straight' | 'unknown';
  pathDeviation: number; // degrees from ideal path
  pathConsistency: number; // 0-1 score
  insideOutRatio: number; // ratio of inside-out movement
  outsideInRatio: number; // ratio of outside-in movement
  pathEfficiency: number; // 0-1 score
  recommendations: string[];
}

export interface SwingPlaneEfficiency {
  planeAngle: number; // degrees from vertical
  planeConsistency: number; // 0-1 score
  planeStability: number; // 0-1 score
  efficiencyScore: number; // 0-1 overall score
  idealPlaneDeviation: number; // degrees from ideal plane
  planeRecommendations: string[];
}

export interface WeightTransferAnalysis {
  pressureShift: number; // 0-1 (0 = left foot, 1 = right foot)
  weightTransferSmoothness: number; // 0-1 score
  weightTransferTiming: number; // 0-1 score
  pressureDistribution: {
    leftFoot: number;
    rightFoot: number;
    centerOfPressure: number;
  };
  transferEfficiency: number; // 0-1 score
  recommendations: string[];
}

export interface SpineAngleConsistency {
  averageSpineAngle: number; // degrees
  spineAngleVariance: number; // degrees
  consistencyScore: number; // 0-1 score
  spineStability: number; // 0-1 score
  maxDeviation: number; // degrees
  spineRecommendations: string[];
}

export interface HeadMovementStability {
  headPositionVariance: number; // pixels
  headMovementRange: number; // pixels
  stabilityScore: number; // 0-1 score
  headStillness: number; // 0-1 score
  movementPattern: 'stable' | 'excessive' | 'moderate';
  stabilityRecommendations: string[];
}

export interface ProfessionalGolfMetrics {
  clubPath: ClubPathAnalysis;
  swingPlane: SwingPlaneEfficiency;
  weightTransfer: WeightTransferAnalysis;
  spineAngle: SpineAngleConsistency;
  headStability: HeadMovementStability;
  overallProfessionalScore: number; // 0-1 score
  professionalGrade: string;
  keyRecommendations: string[];
}

/**
 * Analyze club path for inside-out vs outside-in patterns
 */
export function analyzeClubPath(poses: PoseResult[], phases: EnhancedSwingPhase[]): ClubPathAnalysis {
  if (poses.length === 0) {
    return {
      pathType: 'unknown',
      pathDeviation: 0,
      pathConsistency: 0,
      insideOutRatio: 0,
      outsideInRatio: 0,
      pathEfficiency: 0,
      recommendations: ['No pose data available']
    };
  }

  // Calculate club path points
  const clubPathPoints = calculateClubPathPoints(poses);
  if (clubPathPoints.length < 3) {
    return {
      pathType: 'unknown',
      pathDeviation: 0,
      pathConsistency: 0,
      insideOutRatio: 0,
      outsideInRatio: 0,
      pathEfficiency: 0,
      recommendations: ['Insufficient club path data']
    };
  }

  // Analyze path direction
  const pathAnalysis = analyzePathDirection(clubPathPoints);
  
  // Calculate path consistency
  const pathConsistency = calculatePathConsistency(clubPathPoints);
  
  // Calculate path efficiency
  const pathEfficiency = calculatePathEfficiency(clubPathPoints, pathAnalysis);
  
  // Generate recommendations
  const recommendations = generateClubPathRecommendations(pathAnalysis, pathConsistency, pathEfficiency);

  return {
    pathType: pathAnalysis.pathType,
    pathDeviation: pathAnalysis.deviation,
    pathConsistency,
    insideOutRatio: pathAnalysis.insideOutRatio,
    outsideInRatio: pathAnalysis.outsideInRatio,
    pathEfficiency,
    recommendations
  };
}

/**
 * Analyze swing plane efficiency
 */
export function analyzeSwingPlaneEfficiency(poses: PoseResult[]): SwingPlaneEfficiency {
  if (poses.length === 0) {
    return {
      planeAngle: 0,
      planeConsistency: 0,
      planeStability: 0,
      efficiencyScore: 0,
      idealPlaneDeviation: 0,
      planeRecommendations: ['No pose data available']
    };
  }

  // Calculate swing plane angles
  const planeAngles = calculateSwingPlaneAngles(poses);
  
  // Calculate plane consistency
  const planeConsistency = calculatePlaneConsistency(planeAngles);
  
  // Calculate plane stability
  const planeStability = calculatePlaneStability(planeAngles);
  
  // Calculate efficiency score
  const efficiencyScore = (planeConsistency + planeStability) / 2;
  
  // Calculate deviation from ideal plane
  const idealPlaneDeviation = calculateIdealPlaneDeviation(planeAngles);
  
  // Generate recommendations
  const planeRecommendations = generateSwingPlaneRecommendations(planeConsistency, planeStability, idealPlaneDeviation);

  return {
    planeAngle: planeAngles[planeAngles.length - 1] || 0,
    planeConsistency,
    planeStability,
    efficiencyScore,
    idealPlaneDeviation,
    planeRecommendations
  };
}

/**
 * Analyze weight transfer and pressure shift
 */
export function analyzeWeightTransfer(poses: PoseResult[]): WeightTransferAnalysis {
  if (poses.length === 0) {
    return {
      pressureShift: 0.5,
      weightTransferSmoothness: 0,
      weightTransferTiming: 0,
      pressureDistribution: { leftFoot: 0.5, rightFoot: 0.5, centerOfPressure: 0.5 },
      transferEfficiency: 0,
      recommendations: ['No pose data available']
    };
  }

  // Calculate weight transfer data
  const weightTransferData = calculateWeightTransferData(poses);
  
  // Calculate pressure shift
  const pressureShift = calculatePressureShift(weightTransferData);
  
  // Calculate smoothness
  const weightTransferSmoothness = calculateWeightTransferSmoothness(weightTransferData);
  
  // Calculate timing
  const weightTransferTiming = calculateWeightTransferTiming(weightTransferData);
  
  // Calculate efficiency
  const transferEfficiency = (weightTransferSmoothness + weightTransferTiming) / 2;
  
  // Generate recommendations
  const recommendations = generateWeightTransferRecommendations(weightTransferSmoothness, weightTransferTiming, transferEfficiency);

  return {
    pressureShift,
    weightTransferSmoothness,
    weightTransferTiming,
    pressureDistribution: weightTransferData.pressureDistribution,
    transferEfficiency,
    recommendations
  };
}

/**
 * Analyze spine angle consistency
 */
export function analyzeSpineAngleConsistency(poses: PoseResult[]): SpineAngleConsistency {
  if (poses.length === 0) {
    return {
      averageSpineAngle: 0,
      spineAngleVariance: 0,
      consistencyScore: 0,
      spineStability: 0,
      maxDeviation: 0,
      spineRecommendations: ['No pose data available']
    };
  }

  // Calculate spine angles
  const spineAngles = calculateSpineAngles(poses);
  
  // Calculate average spine angle
  const averageSpineAngle = spineAngles.reduce((sum, angle) => sum + angle, 0) / spineAngles.length;
  
  // Calculate variance
  const spineAngleVariance = calculateSpineAngleVariance(spineAngles, averageSpineAngle);
  
  // Calculate consistency score
  const consistencyScore = calculateSpineConsistencyScore(spineAngleVariance);
  
  // Calculate stability
  const spineStability = calculateSpineStability(spineAngles);
  
  // Calculate max deviation
  const maxDeviation = calculateMaxSpineDeviation(spineAngles, averageSpineAngle);
  
  // Generate recommendations
  const spineRecommendations = generateSpineRecommendations(consistencyScore, spineStability, maxDeviation);

  return {
    averageSpineAngle,
    spineAngleVariance,
    consistencyScore,
    spineStability,
    maxDeviation,
    spineRecommendations
  };
}

/**
 * Analyze head movement stability
 */
export function analyzeHeadMovementStability(poses: PoseResult[]): HeadMovementStability {
  if (poses.length === 0) {
    return {
      headPositionVariance: 0,
      headMovementRange: 0,
      stabilityScore: 0,
      headStillness: 0,
      movementPattern: 'stable',
      stabilityRecommendations: ['No pose data available']
    };
  }

  // Calculate head positions
  const headPositions = calculateHeadPositions(poses);
  
  // Calculate position variance
  const headPositionVariance = calculateHeadPositionVariance(headPositions);
  
  // Calculate movement range
  const headMovementRange = calculateHeadMovementRange(headPositions);
  
  // Calculate stability score
  const stabilityScore = calculateHeadStabilityScore(headPositionVariance, headMovementRange);
  
  // Calculate stillness
  const headStillness = calculateHeadStillness(headPositions);
  
  // Determine movement pattern
  const movementPattern = determineHeadMovementPattern(headPositionVariance, headMovementRange);
  
  // Generate recommendations
  const stabilityRecommendations = generateHeadStabilityRecommendations(stabilityScore, headStillness, movementPattern);

  return {
    headPositionVariance,
    headMovementRange,
    stabilityScore,
    headStillness,
    movementPattern,
    stabilityRecommendations
  };
}

/**
 * Perform comprehensive professional golf analysis
 */
export function performProfessionalGolfAnalysis(poses: PoseResult[], phases: EnhancedSwingPhase[]): ProfessionalGolfMetrics {
  // Perform all analyses
  const clubPath = analyzeClubPath(poses, phases);
  const swingPlane = analyzeSwingPlaneEfficiency(poses);
  const weightTransfer = analyzeWeightTransfer(poses);
  const spineAngle = analyzeSpineAngleConsistency(poses);
  const headStability = analyzeHeadMovementStability(poses);

  // Calculate overall professional score
  const overallProfessionalScore = (
    clubPath.pathEfficiency +
    swingPlane.efficiencyScore +
    weightTransfer.transferEfficiency +
    spineAngle.consistencyScore +
    headStability.stabilityScore
  ) / 5;

  // Calculate professional grade
  const professionalGrade = calculateProfessionalGrade(overallProfessionalScore);

  // Generate key recommendations
  const keyRecommendations = generateKeyRecommendations(clubPath, swingPlane, weightTransfer, spineAngle, headStability);

  return {
    clubPath,
    swingPlane,
    weightTransfer,
    spineAngle,
    headStability,
    overallProfessionalScore,
    professionalGrade,
    keyRecommendations
  };
}

// Helper functions

function calculateClubPathPoints(poses: PoseResult[]): { x: number; y: number; timestamp: number }[] {
  return poses.map(pose => {
    if (!pose.landmarks || pose.landmarks.length === 0) return null;
    
    const landmarks = pose.landmarks;
    const leftWrist = landmarks[GOLF_LANDMARKS.leftWrist];
    const rightWrist = landmarks[GOLF_LANDMARKS.rightWrist];
    
    if (!leftWrist || !rightWrist) return null;
    
    return {
      x: (leftWrist.x + rightWrist.x) / 2,
      y: (leftWrist.y + rightWrist.y) / 2,
      timestamp: pose.timestamp
    };
  }).filter(point => point !== null) as { x: number; y: number; timestamp: number }[];
}

function analyzePathDirection(clubPathPoints: { x: number; y: number; timestamp: number }[]): {
  pathType: 'inside-out' | 'outside-in' | 'straight' | 'unknown';
  deviation: number;
  insideOutRatio: number;
  outsideInRatio: number;
} {
  if (clubPathPoints.length < 3) {
    return { pathType: 'unknown', deviation: 0, insideOutRatio: 0, outsideInRatio: 0 };
  }

  // Calculate path direction changes
  const directionChanges = [];
  for (let i = 1; i < clubPathPoints.length - 1; i++) {
    const prev = clubPathPoints[i - 1];
    const curr = clubPathPoints[i];
    const next = clubPathPoints[i + 1];
    
    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    
    const angleDiff = angle2 - angle1;
    directionChanges.push(angleDiff);
  }

  // Analyze direction patterns
  const insideOutCount = directionChanges.filter(change => change > 0).length;
  const outsideInCount = directionChanges.filter(change => change < 0).length;
  const totalChanges = directionChanges.length;

  const insideOutRatio = insideOutCount / totalChanges;
  const outsideInRatio = outsideInCount / totalChanges;

  // Determine path type
  let pathType: 'inside-out' | 'outside-in' | 'straight' | 'unknown';
  if (insideOutRatio > 0.6) {
    pathType = 'inside-out';
  } else if (outsideInRatio > 0.6) {
    pathType = 'outside-in';
  } else if (Math.abs(insideOutRatio - outsideInRatio) < 0.2) {
    pathType = 'straight';
  } else {
    pathType = 'unknown';
  }

  // Calculate deviation from straight line
  const deviation = calculatePathDeviation(clubPathPoints);

  return {
    pathType,
    deviation,
    insideOutRatio,
    outsideInRatio
  };
}

function calculatePathDeviation(clubPathPoints: { x: number; y: number; timestamp: number }[]): number {
  if (clubPathPoints.length < 3) return 0;

  const start = clubPathPoints[0];
  const end = clubPathPoints[clubPathPoints.length - 1];
  
  // Calculate ideal straight line
  const idealSlope = (end.y - start.y) / (end.x - start.x);
  const idealIntercept = start.y - idealSlope * start.x;
  
  // Calculate deviation from ideal line
  let totalDeviation = 0;
  for (const point of clubPathPoints) {
    const idealY = idealSlope * point.x + idealIntercept;
    const deviation = Math.abs(point.y - idealY);
    totalDeviation += deviation;
  }
  
  return totalDeviation / clubPathPoints.length;
}

function calculatePathConsistency(clubPathPoints: { x: number; y: number; timestamp: number }[]): number {
  if (clubPathPoints.length < 3) return 0;

  // Calculate path smoothness
  const velocities = [];
  for (let i = 1; i < clubPathPoints.length; i++) {
    const prev = clubPathPoints[i - 1];
    const curr = clubPathPoints[i];
    const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
    const timeDiff = curr.timestamp - prev.timestamp;
    const velocity = timeDiff > 0 ? distance / timeDiff : 0;
    velocities.push(velocity);
  }

  // Calculate velocity consistency
  const meanVelocity = velocities.reduce((sum, vel) => sum + vel, 0) / velocities.length;
  const variance = velocities.reduce((sum, vel) => sum + Math.pow(vel - meanVelocity, 2), 0) / velocities.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency score (0-1)
  return Math.max(0, 1 - (standardDeviation / meanVelocity));
}

function calculatePathEfficiency(clubPathPoints: { x: number; y: number; timestamp: number }[], pathAnalysis: any): number {
  // Combine path consistency with direction analysis
  const consistencyScore = calculatePathConsistency(clubPathPoints);
  const directionScore = pathAnalysis.pathType === 'straight' ? 1 : 0.5;
  const deviationScore = Math.max(0, 1 - (pathAnalysis.deviation / 0.1)); // Normalize deviation
  
  return (consistencyScore + directionScore + deviationScore) / 3;
}

function generateClubPathRecommendations(pathAnalysis: any, pathConsistency: number, pathEfficiency: number): string[] {
  const recommendations: string[] = [];
  
  if (pathAnalysis.pathType === 'outside-in') {
    recommendations.push('Focus on swinging from inside to out');
  } else if (pathAnalysis.pathType === 'inside-out') {
    recommendations.push('Work on straightening your club path');
  }
  
  if (pathConsistency < 0.7) {
    recommendations.push('Improve club path consistency');
  }
  
  if (pathEfficiency < 0.6) {
    recommendations.push('Focus on more efficient club path');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent club path!');
  }
  
  return recommendations;
}

function calculateSwingPlaneAngles(poses: PoseResult[]): number[] {
  return poses.map(pose => {
    if (!pose.landmarks || pose.landmarks.length === 0) return 0;
    
    const landmarks = pose.landmarks;
    const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
    const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_LANDMARKS.rightHip];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    // Calculate swing plane angle
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    
    const angle = Math.atan2(
      hipCenter.x - shoulderCenter.x,
      hipCenter.y - shoulderCenter.y
    ) * (180 / Math.PI);
    
    return Math.abs(angle);
  }).filter(angle => angle > 0);
}

function calculatePlaneConsistency(planeAngles: number[]): number {
  if (planeAngles.length < 2) return 0;
  
  const mean = planeAngles.reduce((sum, angle) => sum + angle, 0) / planeAngles.length;
  const variance = planeAngles.reduce((sum, angle) => sum + Math.pow(angle - mean, 2), 0) / planeAngles.length;
  const standardDeviation = Math.sqrt(variance);
  
  return Math.max(0, 1 - (standardDeviation / mean));
}

function calculatePlaneStability(planeAngles: number[]): number {
  if (planeAngles.length < 3) return 0;
  
  // Calculate stability based on angle changes
  const angleChanges = [];
  for (let i = 1; i < planeAngles.length; i++) {
    const change = Math.abs(planeAngles[i] - planeAngles[i - 1]);
    angleChanges.push(change);
  }
  
  const meanChange = angleChanges.reduce((sum, change) => sum + change, 0) / angleChanges.length;
  return Math.max(0, 1 - (meanChange / 10)); // Normalize to 0-1
}

function calculateIdealPlaneDeviation(planeAngles: number[]): number {
  if (planeAngles.length === 0) return 0;
  
  const idealPlaneAngle = 45; // Ideal swing plane angle
  const meanAngle = planeAngles.reduce((sum, angle) => sum + angle, 0) / planeAngles.length;
  return Math.abs(meanAngle - idealPlaneAngle);
}

function generateSwingPlaneRecommendations(planeConsistency: number, planeStability: number, idealPlaneDeviation: number): string[] {
  const recommendations: string[] = [];
  
  if (planeConsistency < 0.7) {
    recommendations.push('Work on maintaining consistent swing plane');
  }
  
  if (planeStability < 0.6) {
    recommendations.push('Focus on swing plane stability');
  }
  
  if (idealPlaneDeviation > 10) {
    recommendations.push('Adjust your swing plane angle');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent swing plane!');
  }
  
  return recommendations;
}

function calculateWeightTransferData(poses: PoseResult[]): {
  pressureDistribution: { leftFoot: number; rightFoot: number; centerOfPressure: number };
  weightHistory: number[];
} {
  const weightHistory: number[] = [];
  let leftFootTotal = 0;
  let rightFootTotal = 0;
  
  poses.forEach(pose => {
    if (!pose.landmarks || pose.landmarks.length === 0) return;
    
    const landmarks = pose.landmarks;
    const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_LANDMARKS.rightHip];
    
    if (!leftHip || !rightHip) return;
    
    // Calculate weight distribution based on hip position
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const weight = Math.max(0, Math.min(1, hipCenterX / 0.5));
    
    weightHistory.push(weight);
    leftFootTotal += 1 - weight;
    rightFootTotal += weight;
  });
  
  const totalWeight = leftFootTotal + rightFootTotal;
  const leftFootRatio = totalWeight > 0 ? leftFootTotal / totalWeight : 0.5;
  const rightFootRatio = totalWeight > 0 ? rightFootTotal / totalWeight : 0.5;
  
  return {
    pressureDistribution: {
      leftFoot: leftFootRatio,
      rightFoot: rightFootRatio,
      centerOfPressure: (leftFootRatio + rightFootRatio) / 2
    },
    weightHistory
  };
}

function calculatePressureShift(weightTransferData: any): number {
  if (weightTransferData.weightHistory.length === 0) return 0.5;
  
  const currentWeight = weightTransferData.weightHistory[weightTransferData.weightHistory.length - 1];
  return currentWeight;
}

function calculateWeightTransferSmoothness(weightTransferData: any): number {
  if (weightTransferData.weightHistory.length < 3) return 0;
  
  // Calculate smoothness based on weight change consistency
  const weightChanges = [];
  for (let i = 1; i < weightTransferData.weightHistory.length; i++) {
    const change = Math.abs(weightTransferData.weightHistory[i] - weightTransferData.weightHistory[i - 1]);
    weightChanges.push(change);
  }
  
  const meanChange = weightChanges.reduce((sum, change) => sum + change, 0) / weightChanges.length;
  return Math.max(0, 1 - (meanChange / 0.1)); // Normalize to 0-1
}

function calculateWeightTransferTiming(weightTransferData: any): number {
  if (weightTransferData.weightHistory.length < 3) return 0;
  
  // Calculate timing based on weight transfer pattern
  const weights = weightTransferData.weightHistory;
  const startWeight = weights[0];
  const endWeight = weights[weights.length - 1];
  const weightChange = Math.abs(endWeight - startWeight);
  
  // Good timing if there's significant weight transfer
  return Math.min(1, weightChange / 0.3);
}

function generateWeightTransferRecommendations(smoothness: number, timing: number, efficiency: number): string[] {
  const recommendations: string[] = [];
  
  if (smoothness < 0.6) {
    recommendations.push('Work on smoother weight transfer');
  }
  
  if (timing < 0.5) {
    recommendations.push('Focus on proper weight transfer timing');
  }
  
  if (efficiency < 0.6) {
    recommendations.push('Improve weight transfer efficiency');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent weight transfer!');
  }
  
  return recommendations;
}

function calculateSpineAngles(poses: PoseResult[]): number[] {
  return poses.map(pose => {
    if (!pose.landmarks || pose.landmarks.length === 0) return 0;
    
    const landmarks = pose.landmarks;
    const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
    const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_LANDMARKS.rightHip];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
    
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    
    const angle = Math.atan2(
      hipCenter.x - shoulderCenter.x,
      hipCenter.y - shoulderCenter.y
    ) * (180 / Math.PI);
    
    return Math.abs(angle);
  }).filter(angle => angle > 0);
}

function calculateSpineAngleVariance(spineAngles: number[], averageSpineAngle: number): number {
  if (spineAngles.length === 0) return 0;
  
  const variance = spineAngles.reduce((sum, angle) => sum + Math.pow(angle - averageSpineAngle, 2), 0) / spineAngles.length;
  return Math.sqrt(variance);
}

function calculateSpineConsistencyScore(spineAngleVariance: number): number {
  return Math.max(0, 1 - (spineAngleVariance / 10)); // Normalize to 0-1
}

function calculateSpineStability(spineAngles: number[]): number {
  if (spineAngles.length < 3) return 0;
  
  // Calculate stability based on angle changes
  const angleChanges = [];
  for (let i = 1; i < spineAngles.length; i++) {
    const change = Math.abs(spineAngles[i] - spineAngles[i - 1]);
    angleChanges.push(change);
  }
  
  const meanChange = angleChanges.reduce((sum, change) => sum + change, 0) / angleChanges.length;
  return Math.max(0, 1 - (meanChange / 5)); // Normalize to 0-1
}

function calculateMaxSpineDeviation(spineAngles: number[], averageSpineAngle: number): number {
  if (spineAngles.length === 0) return 0;
  
  const deviations = spineAngles.map(angle => Math.abs(angle - averageSpineAngle));
  return Math.max(...deviations);
}

function generateSpineRecommendations(consistencyScore: number, spineStability: number, maxDeviation: number): string[] {
  const recommendations: string[] = [];
  
  if (consistencyScore < 0.7) {
    recommendations.push('Work on maintaining consistent spine angle');
  }
  
  if (spineStability < 0.6) {
    recommendations.push('Focus on spine stability during swing');
  }
  
  if (maxDeviation > 15) {
    recommendations.push('Reduce spine angle variation');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent spine angle consistency!');
  }
  
  return recommendations;
}

function calculateHeadPositions(poses: PoseResult[]): { x: number; y: number; timestamp: number }[] {
  return poses.map(pose => {
    if (!pose.landmarks || pose.landmarks.length === 0) return null;
    
    const landmarks = pose.landmarks;
    const head = landmarks[GOLF_LANDMARKS.head];
    
    if (!head) return null;
    
    return {
      x: head.x,
      y: head.y,
      timestamp: pose.timestamp
    };
  }).filter(position => position !== null) as { x: number; y: number; timestamp: number }[];
}

function calculateHeadPositionVariance(headPositions: { x: number; y: number; timestamp: number }[]): number {
  if (headPositions.length < 2) return 0;
  
  const meanX = headPositions.reduce((sum, pos) => sum + pos.x, 0) / headPositions.length;
  const meanY = headPositions.reduce((sum, pos) => sum + pos.y, 0) / headPositions.length;
  
  const variance = headPositions.reduce((sum, pos) => 
    sum + Math.pow(pos.x - meanX, 2) + Math.pow(pos.y - meanY, 2), 0
  ) / headPositions.length;
  
  return Math.sqrt(variance);
}

function calculateHeadMovementRange(headPositions: { x: number; y: number; timestamp: number }[]): number {
  if (headPositions.length < 2) return 0;
  
  const xValues = headPositions.map(pos => pos.x);
  const yValues = headPositions.map(pos => pos.y);
  
  const xRange = Math.max(...xValues) - Math.min(...xValues);
  const yRange = Math.max(...yValues) - Math.min(...yValues);
  
  return Math.sqrt(xRange * xRange + yRange * yRange);
}

function calculateHeadStabilityScore(headPositionVariance: number, headMovementRange: number): number {
  const varianceScore = Math.max(0, 1 - (headPositionVariance / 0.01)); // Normalize variance
  const rangeScore = Math.max(0, 1 - (headMovementRange / 0.1)); // Normalize range
  
  return (varianceScore + rangeScore) / 2;
}

function calculateHeadStillness(headPositions: { x: number; y: number; timestamp: number }[]): number {
  if (headPositions.length < 2) return 0;
  
  // Calculate stillness based on movement frequency
  const movements = [];
  for (let i = 1; i < headPositions.length; i++) {
    const prev = headPositions[i - 1];
    const curr = headPositions[i];
    const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
    movements.push(distance);
  }
  
  const meanMovement = movements.reduce((sum, movement) => sum + movement, 0) / movements.length;
  return Math.max(0, 1 - (meanMovement / 0.01)); // Normalize to 0-1
}

function determineHeadMovementPattern(headPositionVariance: number, headMovementRange: number): 'stable' | 'excessive' | 'moderate' {
  if (headPositionVariance < 0.005 && headMovementRange < 0.05) {
    return 'stable';
  } else if (headPositionVariance > 0.02 || headMovementRange > 0.1) {
    return 'excessive';
  } else {
    return 'moderate';
  }
}

function generateHeadStabilityRecommendations(stabilityScore: number, headStillness: number, movementPattern: string): string[] {
  const recommendations: string[] = [];
  
  if (stabilityScore < 0.7) {
    recommendations.push('Work on keeping your head more stable');
  }
  
  if (headStillness < 0.6) {
    recommendations.push('Focus on reducing head movement');
  }
  
  if (movementPattern === 'excessive') {
    recommendations.push('Significantly reduce head movement during swing');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent head stability!');
  }
  
  return recommendations;
}

function calculateProfessionalGrade(overallScore: number): string {
  if (overallScore >= 0.95) return 'A+';
  if (overallScore >= 0.9) return 'A';
  if (overallScore >= 0.85) return 'A-';
  if (overallScore >= 0.8) return 'B+';
  if (overallScore >= 0.75) return 'B';
  if (overallScore >= 0.7) return 'B-';
  if (overallScore >= 0.65) return 'C+';
  if (overallScore >= 0.6) return 'C';
  if (overallScore >= 0.55) return 'C-';
  if (overallScore >= 0.5) return 'D+';
  if (overallScore >= 0.45) return 'D';
  return 'F';
}

function generateKeyRecommendations(
  clubPath: ClubPathAnalysis,
  swingPlane: SwingPlaneEfficiency,
  weightTransfer: WeightTransferAnalysis,
  spineAngle: SpineAngleConsistency,
  headStability: HeadMovementStability
): string[] {
  const recommendations: string[] = [];
  
  // Prioritize recommendations based on scores
  if (clubPath.pathEfficiency < 0.6) {
    recommendations.push('Focus on improving club path efficiency');
  }
  
  if (swingPlane.efficiencyScore < 0.6) {
    recommendations.push('Work on swing plane consistency');
  }
  
  if (weightTransfer.transferEfficiency < 0.6) {
    recommendations.push('Improve weight transfer timing and smoothness');
  }
  
  if (spineAngle.consistencyScore < 0.6) {
    recommendations.push('Maintain more consistent spine angle');
  }
  
  if (headStability.stabilityScore < 0.6) {
    recommendations.push('Keep your head more stable during the swing');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent overall swing technique!');
  }
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
}
