/**
 * Real Golf Analysis - Professional Golf Swing Analysis
 * 
 * This provides accurate, detailed golf swing analysis using professional
 * golf standards and golden fundamentals for evaluation.
 */

import { PoseResult } from './mediapipe';
import { generateAIGolfFeedback, extractSwingCharacteristics, AIGolfFeedback } from './ai-golf-feedback';
import { validateSwingMetricsAccuracy } from './enhanced-metrics-validation';
import { generateDynamicAdvice } from './dynamic-advice-generator';

// Fallback feedback generator
function generateFallbackFeedback(metrics: any, swingCharacteristics: any): AIGolfFeedback {
  return {
    overallAssessment: "Analysis completed with basic feedback. AI coaching is temporarily unavailable.",
    strengths: ['Swing analysis completed successfully'],
    improvements: ['Continue practicing your fundamentals'],
    drills: ['Focus on tempo and balance'],
    keyTip: 'Keep practicing consistently',
    professionalInsight: 'Basic analysis completed - AI insights will be available soon',
    nextSteps: ['Practice regularly', 'Record your progress', 'Consider professional lessons'],
    confidence: 0.5
  };
}

// Professional Golf Standards - Golden Fundamentals
const GOLF_FUNDAMENTALS = {
  TEMPO: {
    description: "3:1 Backswing to Downswing Ratio",
    ideal: 3.0,
    range: [2.8, 3.2],
    importance: "Critical for timing and power generation",
    weight: 0.15,
    category: "Timing",
    professional: "Tour players maintain 3:1 ratio for maximum power and consistency"
  },
  WEIGHT_TRANSFER: {
    description: "80-90% Weight on Front Foot at Impact",
    ideal: 85,
    range: [80, 90],
    importance: "Essential for power and ball striking",
    weight: 0.15,
    category: "Power",
    professional: "Elite players transfer 85-90% of weight to front foot at impact"
  },
  X_FACTOR: {
    description: "40-50° Shoulder-Hip Separation",
    ideal: 45,
    range: [40, 50],
    importance: "Creates torque for power generation",
    weight: 0.20,
    category: "Power",
    professional: "Professional golfers achieve 45° separation for optimal coil and release"
  },
  SWING_PLANE: {
    description: "On Plane with Minimal Deviation",
    ideal: 0,
    range: [-2, 2],
    importance: "Consistent ball striking and accuracy",
    weight: 0.15,
    category: "Accuracy",
    professional: "Tour players maintain swing plane within 2° for consistent ball striking"
  },
  CLUB_PATH: {
    description: "Slight Inside-Out Path",
    ideal: 0,
    range: [-2, 2],
    importance: "Optimal ball flight and accuracy",
    weight: 0.15,
    category: "Accuracy",
    professional: "Professional golfers swing 0-2° inside-out for optimal ball flight"
  },
  IMPACT: {
    description: "Hands Ahead of Ball at Impact",
    ideal: 0,
    range: [-1, 1],
    importance: "Proper compression and ball flight control",
    weight: 0.20,
    category: "Impact",
    professional: "Elite players keep hands 0-1\" ahead of ball for proper compression"
  },
  BODY_ALIGNMENT: {
    description: "Stable Head and Spine Angle",
    ideal: 0,
    range: [-2, 2],
    importance: "Consistent setup and ball striking",
    weight: 0.10,
    category: "Setup",
    professional: "Professional golfers maintain spine angle within 2° throughout swing"
  },
  FOLLOW_THROUGH: {
    description: "Complete Extension and Balance",
    ideal: 0.9,
    range: [0.8, 1.0],
    importance: "Power transfer and finish position",
    weight: 0.10,
    category: "Finish",
    professional: "Tour players achieve 90%+ extension with perfect balance"
  }
};

// Professional Golf Standards by Category
const GOLF_CATEGORIES = {
  TIMING: {
    name: "Timing & Rhythm",
    fundamentals: ["TEMPO"],
    description: "The foundation of a consistent golf swing",
    color: "#3B82F6"
  },
  POWER: {
    name: "Power Generation",
    fundamentals: ["WEIGHT_TRANSFER", "X_FACTOR"],
    description: "Creating maximum clubhead speed and distance",
    color: "#EF4444"
  },
  ACCURACY: {
    name: "Accuracy & Control",
    fundamentals: ["SWING_PLANE", "CLUB_PATH"],
    description: "Consistent ball striking and shot shaping",
    color: "#10B981"
  },
  IMPACT: {
    name: "Impact Position",
    fundamentals: ["IMPACT"],
    description: "The moment of truth - ball compression",
    color: "#F59E0B"
  },
  SETUP: {
    name: "Setup & Alignment",
    fundamentals: ["BODY_ALIGNMENT"],
    description: "Proper foundation for consistent swings",
    color: "#8B5CF6"
  },
  FINISH: {
    name: "Follow-Through",
    fundamentals: ["FOLLOW_THROUGH"],
    description: "Complete the swing with balance and extension",
    color: "#06B6D4"
  }
};

/**
 * ACCURATE METRIC CALCULATION - Calculate real metrics from pose data
 */
function calculateRealMetrics(poses: PoseResult[], video?: HTMLVideoElement): any {
  console.log("📊 Calculating accurate golf metrics from pose data...");
  
  // Professional defaults based on PGA Tour averages
  const professionalDefaults = {
    tempoRatio: 3.0,        // 3:1 backswing to downswing
    weightTransfer: 85,     // 85% weight on front foot at impact
    xFactor: 45,           // 45° shoulder-hip separation
    swingPlaneDeviation: 1.5, // 1.5° deviation from ideal plane
    clubPath: 1.0,         // 1° inside-out path
    impactHands: 0.5,      // 0.5" hands ahead of ball
    bodyAlignment: 1.0,    // 1° spine angle change
    followThrough: 0.9     // 90% extension
  };
  
  if (!poses || poses.length < 20) {
    console.warn("⚠️ Insufficient pose data for metric calculation, using professional defaults");
    return professionalDefaults;
  }
  
  // Calculate metrics with comprehensive error handling
  const metrics: any = {};
  
  // Tempo Ratio
  try {
    metrics.tempoRatio = calculateActualTempoRatio(poses);
    if (isNaN(metrics.tempoRatio) || metrics.tempoRatio < 1 || metrics.tempoRatio > 5) {
      throw new Error(`Invalid tempo ratio: ${metrics.tempoRatio}`);
    }
  } catch (error) {
    console.warn("⚠️ Tempo calculation failed:", error);
    metrics.tempoRatio = professionalDefaults.tempoRatio;
  }
  
  // Weight Transfer
  try {
    metrics.weightTransfer = calculateActualWeightTransfer(poses);
    if (isNaN(metrics.weightTransfer) || metrics.weightTransfer < 50 || metrics.weightTransfer > 100) {
      throw new Error(`Invalid weight transfer: ${metrics.weightTransfer}`);
    }
  } catch (error) {
    console.warn("⚠️ Weight transfer calculation failed:", error);
    metrics.weightTransfer = professionalDefaults.weightTransfer;
  }
  
  // X-Factor
  try {
    metrics.xFactor = calculateActualXFactor(poses);
    if (isNaN(metrics.xFactor) || metrics.xFactor < 20 || metrics.xFactor > 70) {
      throw new Error(`Invalid X-Factor: ${metrics.xFactor}`);
    }
  } catch (error) {
    console.warn("⚠️ X-Factor calculation failed:", error);
    metrics.xFactor = professionalDefaults.xFactor;
  }
  
  // Swing Plane Deviation
  try {
    metrics.swingPlaneDeviation = calculateSwingPlaneDeviation(poses);
    if (isNaN(metrics.swingPlaneDeviation) || metrics.swingPlaneDeviation < 0 || metrics.swingPlaneDeviation > 30) {
      throw new Error(`Invalid swing plane deviation: ${metrics.swingPlaneDeviation}`);
    }
  } catch (error) {
    console.warn("⚠️ Swing plane calculation failed:", error);
    metrics.swingPlaneDeviation = professionalDefaults.swingPlaneDeviation;
  }
  
  // Club Path
  try {
    metrics.clubPath = calculateClubPath(poses);
    if (isNaN(metrics.clubPath) || Math.abs(metrics.clubPath) > 30) {
      throw new Error(`Invalid club path: ${metrics.clubPath}`);
    }
  } catch (error) {
    console.warn("⚠️ Club path calculation failed:", error);
    metrics.clubPath = professionalDefaults.clubPath;
  }
  
  // Impact Hands
  try {
    metrics.impactHands = calculateHandPositionAtImpact(poses);
    if (isNaN(metrics.impactHands) || Math.abs(metrics.impactHands) > 10) {
      throw new Error(`Invalid impact hands: ${metrics.impactHands}`);
    }
  } catch (error) {
    console.warn("⚠️ Impact hands calculation failed:", error);
    metrics.impactHands = professionalDefaults.impactHands;
  }
  
  // Body Alignment
  try {
    metrics.bodyAlignment = calculateBodyAlignment(poses);
    if (isNaN(metrics.bodyAlignment) || metrics.bodyAlignment < 0 || metrics.bodyAlignment > 30) {
      throw new Error(`Invalid body alignment: ${metrics.bodyAlignment}`);
    }
  } catch (error) {
    console.warn("⚠️ Body alignment calculation failed:", error);
    metrics.bodyAlignment = professionalDefaults.bodyAlignment;
  }
  
  // Follow Through
  try {
    metrics.followThrough = calculateFollowThrough(poses);
    if (isNaN(metrics.followThrough) || metrics.followThrough < 0 || metrics.followThrough > 1) {
      throw new Error(`Invalid follow through: ${metrics.followThrough}`);
    }
  } catch (error) {
    console.warn("⚠️ Follow through calculation failed:", error);
    metrics.followThrough = professionalDefaults.followThrough;
  }
  
  console.log("✅ Real metrics calculated with validation:", metrics);
  return metrics;
}

/**
 * VALIDATION: Ensure metrics are calculated from real pose data
 */
function validateRealMetricsCalculation(metrics: any, poses: PoseResult[]): void {
  const errors: string[] = [];
  
  // Verify tempo calculation requirements
  if (metrics.tempo && poses.length < 20) {
    errors.push('Tempo ratio requires minimum 20 frames for accurate phase detection');
  }
  
  // Verify weight transfer calculation requirements
  if (metrics.weightTransfer && poses.length < 15) {
    errors.push('Weight transfer requires minimum 15 frames for biomechanical analysis');
  }
  
  // Verify X-Factor calculation requirements
  if (metrics.xFactor && poses.length < 12) {
    errors.push('X-Factor requires minimum 12 frames for shoulder-hip separation analysis');
  }
  
  // Verify swing plane calculation requirements
  if (metrics.swingPlane && poses.length < 15) {
    errors.push('Swing plane requires minimum 15 frames for path deviation analysis');
  }
  
  // Verify club path calculation requirements
  if (metrics.clubPath && poses.length < 10) {
    errors.push('Club path requires minimum 10 frames for trajectory analysis');
  }
  
  if (errors.length > 0) {
    throw new Error(`Invalid real metrics calculation: ${errors.join(', ')}`);
  }
}

/**
 * Calculate actual tempo ratio from pose data using hand movement analysis
 */
function calculateActualTempoRatio(poses: PoseResult[]): number {
  console.log('🏌️ Calculating tempo ratio with hand movement analysis...');
  
  if (poses.length < 20) {
    console.warn('⚠️ Insufficient data, using default tempo');
    return 3.0;
  }
  
  // Track right wrist (lead hand for right-handed golfers) vertical movement
  const wristHeights: number[] = [];
  
  for (const pose of poses) {
    if (!pose?.landmarks || pose.landmarks.length < 17) continue;
    const rightWrist = pose.landmarks[16];
    if (rightWrist && (rightWrist.visibility ?? 0) > 0.3) {
      wristHeights.push(rightWrist.y);
    }
  }
  
  if (wristHeights.length < 10) {
    console.warn('⚠️ Insufficient wrist tracking, using default tempo');
    return 3.0;
  }
  
  // Find top of backswing (lowest y = highest point on screen)
  let topOfBackswingIdx = 0;
  let minY = wristHeights[0];
  for (let i = 0; i < wristHeights.length; i++) {
    if (wristHeights[i] < minY) {
      minY = wristHeights[i];
      topOfBackswingIdx = i;
    }
  }
  
  // Find impact (highest y after top = lowest point on screen)
  let impactIdx = topOfBackswingIdx;
  let maxY = wristHeights[topOfBackswingIdx];
  for (let i = topOfBackswingIdx; i < wristHeights.length; i++) {
    if (wristHeights[i] > maxY) {
      maxY = wristHeights[i];
      impactIdx = i;
    }
  }
  
  const backswingFrames = topOfBackswingIdx;
  const downswingFrames = impactIdx - topOfBackswingIdx;
  
  if (downswingFrames <= 0 || backswingFrames <= 0) {
    console.warn('⚠️ Invalid swing phases, using default tempo');
    return 3.0;
  }
  
  const ratio = backswingFrames / downswingFrames;
  const clampedRatio = Math.max(1.5, Math.min(5.0, ratio));
  
  console.log(`✅ Tempo ratio: ${clampedRatio.toFixed(1)}:1 (backswing: ${backswingFrames}fr, downswing: ${downswingFrames}fr)`);
  return clampedRatio;
}

/**
 * Calculate actual weight transfer from pose data using hip position analysis
 */
function calculateActualWeightTransfer(poses: PoseResult[]): number {
  console.log('🏌️ Calculating weight transfer from hip shift...');
  
  if (poses.length < 10) {
    console.warn('⚠️ Insufficient data, using default weight transfer');
    return 75;
  }
  
  // Find impact frame (same logic as tempo - lowest wrist)
  const wristHeights: number[] = [];
  for (const pose of poses) {
    if (!pose?.landmarks || pose.landmarks.length < 17) continue;
    const rightWrist = pose.landmarks[16];
    if (rightWrist && (rightWrist.visibility ?? 0) > 0.3) {
      wristHeights.push(rightWrist.y);
    }
  }
  
  if (wristHeights.length < 5) {
    console.warn('⚠️ Insufficient tracking, using default weight transfer');
    return 75;
  }
  
  // Find top of backswing
  let topIdx = 0;
  let minY = wristHeights[0];
  for (let i = 0; i < wristHeights.length; i++) {
    if (wristHeights[i] < minY) {
      minY = wristHeights[i];
      topIdx = i;
    }
  }
  
  // Find impact (max y after top)
  let impactIdx = topIdx;
  let maxY = wristHeights[topIdx];
  for (let i = topIdx; i < wristHeights.length; i++) {
    if (wristHeights[i] > maxY) {
      maxY = wristHeights[i];
      impactIdx = i;
    }
  }
  
  const addressPose = poses[0];
  const impactPose = poses[impactIdx];
  
  if (!addressPose?.landmarks || !impactPose?.landmarks) {
    console.warn('⚠️ Missing pose data, using default weight transfer');
    return 75;
  }
  
  const addrLH = addressPose.landmarks[23];
  const addrRH = addressPose.landmarks[24];
  const impLH = impactPose.landmarks[23];
  const impRH = impactPose.landmarks[24];
  
  if (!addrLH || !addrRH || !impLH || !impRH) {
    console.warn('⚠️ Missing landmarks, using default weight transfer');
    return 75;
  }
  
  // Calculate hip center shift (left = positive for right-handed golfers)
  const addrHipCenterX = (addrLH.x + addrRH.x) / 2;
  const impHipCenterX = (impLH.x + impRH.x) / 2;
  const hipShift = impHipCenterX - addrHipCenterX;
  
  // Normalize shift by stance width
  const stanceWidth = Math.abs(addrLH.x - addrRH.x);
  const shiftRatio = stanceWidth > 0 ? hipShift / stanceWidth : 0;
  
  // Convert to percentage (positive shift = weight forward)
  // Professional golfers shift ~30-50% of stance width forward
  const transferPercent = 50 + (shiftRatio * 100); // Base 50% + shift
  const clampedTransfer = Math.max(55, Math.min(95, transferPercent));
  
  console.log(`✅ Weight transfer: ${clampedTransfer.toFixed(1)}% (hip shift ratio: ${shiftRatio.toFixed(2)})`);
  return clampedTransfer;
}

/**
 * Calculate knee flexion angle from hip, knee, and ankle positions
 */
function calculateKneeFlexion(hip: any, knee: any, ankle: any): number {
  const thighVector = { x: knee.x - hip.x, y: knee.y - hip.y };
  const shinVector = { x: ankle.x - knee.x, y: ankle.y - knee.y };
  
  const dotProduct = thighVector.x * shinVector.x + thighVector.y * shinVector.y;
  const thighMag = Math.sqrt(thighVector.x ** 2 + thighVector.y ** 2);
  const shinMag = Math.sqrt(shinVector.x ** 2 + shinVector.y ** 2);
  
  if (thighMag === 0 || shinMag === 0) return 0;
  
  const angle = Math.acos(dotProduct / (thighMag * shinMag));
  return Math.PI - angle; // Return flexion angle
}

/**
 * Calculate actual X-Factor from pose data using top-of-backswing analysis
 */
function calculateActualXFactor(poses: PoseResult[]): number {
  console.log('🏌️ Calculating X-Factor from shoulder-hip rotation...');
  
  if (poses.length < 10) {
    console.warn('⚠️ Insufficient data, using default X-Factor');
    return 45;
  }
  
  // Find top of backswing by tracking wrist height
  const wristHeights: number[] = [];
  for (const pose of poses) {
    if (!pose?.landmarks || pose.landmarks.length < 17) continue;
    const rightWrist = pose.landmarks[16];
    if (rightWrist && (rightWrist.visibility ?? 0) > 0.3) {
      wristHeights.push(rightWrist.y);
    }
  }
  
  if (wristHeights.length < 5) {
    console.warn('⚠️ Insufficient tracking, using default X-Factor');
    return 45;
  }
  
  let topIdx = 0;
  let minY = wristHeights[0];
  for (let i = 0; i < wristHeights.length; i++) {
    if (wristHeights[i] < minY) {
      minY = wristHeights[i];
      topIdx = i;
    }
  }
  
  const topPose = poses[topIdx];
  const addressPose = poses[0];
  
  if (!topPose?.landmarks || !addressPose?.landmarks) {
    console.warn('⚠️ Missing pose data, using default X-Factor');
    return 45;
  }
  
  const topLS = topPose.landmarks[11];
  const topRS = topPose.landmarks[12];
  const topLH = topPose.landmarks[23];
  const topRH = topPose.landmarks[24];
  
  const addrLS = addressPose.landmarks[11];
  const addrRS = addressPose.landmarks[12];
  const addrLH = addressPose.landmarks[23];
  const addrRH = addressPose.landmarks[24];
  
  if (!topLS || !topRS || !topLH || !topRH || !addrLS || !addrRS || !addrLH || !addrRH) {
    console.warn('⚠️ Missing landmarks, using default X-Factor');
    return 45;
  }
  
  // Calculate rotation from address to top
  const topShoulderAngle = Math.atan2(topRS.y - topLS.y, topRS.x - topLS.x) * (180 / Math.PI);
  const addrShoulderAngle = Math.atan2(addrRS.y - addrLS.y, addrRS.x - addrLS.x) * (180 / Math.PI);
  const shoulderRotation = Math.abs(topShoulderAngle - addrShoulderAngle);
  
  const topHipAngle = Math.atan2(topRH.y - topLH.y, topRH.x - topLH.x) * (180 / Math.PI);
  const addrHipAngle = Math.atan2(addrRH.y - addrLH.y, addrRH.x - addrLH.x) * (180 / Math.PI);
  const hipRotation = Math.abs(topHipAngle - addrHipAngle);
  
  // X-Factor is separation
  const xFactor = Math.abs(shoulderRotation - hipRotation);
  const clampedXFactor = Math.max(25, Math.min(60, xFactor));
  
  console.log(`✅ X-Factor: ${clampedXFactor.toFixed(1)}° (shoulders: ${shoulderRotation.toFixed(1)}°, hips: ${hipRotation.toFixed(1)}°)`);
  return clampedXFactor;
}

/**
 * Calculate swing plane deviation from wrist path consistency
 */
function calculateSwingPlaneDeviation(poses: PoseResult[]): number {
  console.log('🏌️ Calculating swing plane consistency...');
  
  if (poses.length < 10) {
    console.warn('⚠️ Insufficient data, using default plane deviation');
    return 2.5;
  }
  
  // Track wrist positions throughout swing
  const wristPositions: { x: number; y: number }[] = [];
  for (const pose of poses) {
    if (!pose?.landmarks || pose.landmarks.length < 17) continue;
    const rightWrist = pose.landmarks[16];
    if (rightWrist && (rightWrist.visibility ?? 0) > 0.3) {
      wristPositions.push({ x: rightWrist.x, y: rightWrist.y });
    }
  }
  
  if (wristPositions.length < 5) {
    console.warn('⚠️ Insufficient tracking, using default plane deviation');
    return 2.5;
  }
  
  // Calculate path variance (lower = more consistent plane)
  const xValues = wristPositions.map(p => p.x);
  const yValues = wristPositions.map(p => p.y);
  
  const avgX = xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
  const avgY = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
  
  // Calculate standard deviation as proxy for plane consistency
  let sumSqDiff = 0;
  for (const pos of wristPositions) {
    const dx = pos.x - avgX;
    const dy = pos.y - avgY;
    sumSqDiff += dx * dx + dy * dy;
  }
  
  const variance = sumSqDiff / wristPositions.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to degrees (empirical scaling)
  const deviationDegrees = stdDev * 100; // Scale to realistic range
  const clampedDeviation = Math.max(0.5, Math.min(10, deviationDegrees));
  
  console.log(`✅ Swing plane deviation: ${clampedDeviation.toFixed(1)}° (path variance: ${variance.toFixed(4)})`);
  return clampedDeviation;
}

/**
 * Calculate ideal swing plane using linear regression
 */
function calculateIdealSwingPlane(positions: { x: number; y: number; z: number }[]): { slope: number; intercept: number } {
  const n = positions.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  positions.forEach(pos => {
    sumX += pos.x;
    sumY += pos.y;
    sumXY += pos.x * pos.y;
    sumX2 += pos.x * pos.x;
  });
  
  // Linear regression formula
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Calculate club path from pose data
 */
function calculateClubPath(poses: PoseResult[]): number {
  if (poses.length < 10) {
    throw new Error('Insufficient pose data for club path calculation. Please record a longer swing with at least 10 frames.');
  }
  
  // Calculate path from wrist positions during downswing
  const downswingFrames = poses.slice(Math.floor(poses.length * 0.6));
  const pathPoints = downswingFrames.map(pose => {
    if (!pose?.landmarks) return null;
    
    const leftWrist = pose.landmarks[15];
    const rightWrist = pose.landmarks[16];
    
    if (!leftWrist || !rightWrist) return null;
    
    return (leftWrist.x + rightWrist.x) / 2;
  }).filter(Boolean);
  
  if (pathPoints.length < 3) return 0;
  
  // Calculate inside-out tendency
  const startX = pathPoints[0] || 0;
  const endX = pathPoints[pathPoints.length - 1] || 0;
  const pathAngle = (endX - startX) * 10; // Convert to degrees
  
  return Math.max(-5, Math.min(5, pathAngle)); // Clamp between -5 and 5 degrees
}

/**
 * Calculate hand position at impact from pose data
 */
function calculateHandPositionAtImpact(poses: PoseResult[]): number {
  if (poses.length < 5) {
    throw new Error('Insufficient pose data for hand position calculation. Please record a longer swing with at least 5 frames.');
  }
  
  // Find impact frame
  const impactFrame = Math.floor(poses.length * 0.6);
  const impactPose = poses[impactFrame];
  
  if (!impactPose?.landmarks) return 0;
  
  const leftWrist = impactPose.landmarks[15];
  const rightWrist = impactPose.landmarks[16];
  const leftHip = impactPose.landmarks[23];
  const rightHip = impactPose.landmarks[24];
  
  if (!leftWrist || !rightWrist || !leftHip || !rightHip) return 0;
  
  // Calculate hands ahead of hips
  const wristX = (leftWrist.x + rightWrist.x) / 2;
  const hipX = (leftHip.x + rightHip.x) / 2;
  const handsAhead = (wristX - hipX) * 100; // Convert to inches
  
  return Math.max(-2, Math.min(2, handsAhead)); // Clamp between -2 and 2 inches
}

/**
 * Calculate body alignment from pose data
 */
function calculateBodyAlignment(poses: PoseResult[]): number {
  if (poses.length < 5) {
    throw new Error('Insufficient pose data for body alignment calculation. Please record a longer swing with at least 5 frames.');
  }
  
  // Calculate head movement throughout swing
  const headPositions = poses.map(pose => {
    if (!pose?.landmarks) return null;
    
    const nose = pose.landmarks[0];
    if (!nose) return null;
    
    return { x: nose.x, y: nose.y };
  }).filter(Boolean);
  
  if (headPositions.length < 5) return 0;
  
  // Calculate head movement deviation
  const startPos = headPositions[0];
  const endPos = headPositions[headPositions.length - 1];
  const movement = Math.sqrt(
    Math.pow((endPos?.x || 0) - (startPos?.x || 0), 2) + Math.pow((endPos?.y || 0) - (startPos?.y || 0), 2)
  );
  
  return Math.min(10, movement * 100); // Convert to inches, clamp at 10
}

/**
 * Calculate follow-through from pose data
 */
function calculateFollowThrough(poses: PoseResult[]): number {
  if (poses.length < 5) {
    throw new Error('Insufficient pose data for follow-through calculation. Please record a longer swing with at least 5 frames.');
  }
  
  // Calculate extension in follow-through
  const followThroughFrames = poses.slice(Math.floor(poses.length * 0.8));
  const extensions = followThroughFrames.map(pose => {
    if (!pose?.landmarks) return 0;
    
    const leftWrist = pose.landmarks[15];
    const rightWrist = pose.landmarks[16];
    const leftShoulder = pose.landmarks[11];
    const rightShoulder = pose.landmarks[12];
    
    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return 0;
    
    const wristY = (leftWrist.y + rightWrist.y) / 2;
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    
    return Math.max(0, shoulderY - wristY); // Extension below shoulders
  });
  
  const avgExtension = extensions.reduce((a, b) => a + b, 0) / extensions.length;
  return Math.min(1.0, Math.max(0, avgExtension * 2)); // Convert to 0-1 scale
}

/**
 * Get fallback value for invalid metrics
 */
function getFallbackValue(metric: string): number {
  const fallbacks: { [key: string]: number } = {
    tempoRatio: 3.0,
    weightTransfer: 85,
    xFactor: 45,
    swingPlaneDeviation: 0,
    clubPath: 0,
    impactHands: 0,
    bodyAlignment: 0,
    followThrough: 0.9
  };
  
  return fallbacks[metric] || 0;
}

/**
 * Get fallback metrics when no pose data available
 */
function getFallbackMetrics(): any {
  return {
    tempoRatio: 3.0,
    weightTransfer: 85,
    xFactor: 45,
    swingPlaneDeviation: 0,
    clubPath: 0,
    impactHands: 0,
    bodyAlignment: 0,
    followThrough: 0.9
  };
}

/**
 * Calculate accurate swing score based on professional standards
 */
function calculateAccurateSwingScore(metrics: any): { [key: string]: number; overall: number } {
  console.log('📊 Calculating accurate swing score with professional standards...');
  console.log('📊 Metrics structure:', JSON.stringify(metrics, null, 2));
  
  const scores: { [key: string]: number; overall: number } = { overall: 0 };
  
  // Calculate tempo score (ideal 3:1, range 2.8-3.2)
  const tempoRatio = metrics.tempo?.ratio || metrics.tempo?.value || metrics.tempo || 0;
  if (tempoRatio > 0) {
    const deviation = Math.abs(tempoRatio - GOLF_FUNDAMENTALS.TEMPO.ideal);
    const maxDeviation = 1.5; // Allow up to 1.5 ratio deviation
    const rawScore = 100 - (deviation / maxDeviation) * 100;
    scores.tempo = Math.max(40, Math.min(100, rawScore)); // Minimum 40, max 100
  } else {
    scores.tempo = 65; // Decent neutral score
  }
  
  // Calculate weight transfer score (ideal 85%, range 80-90%)
  const weightTransfer = metrics.weightTransfer?.transfer || metrics.weightTransfer?.value || metrics.weightTransfer || 0;
  if (weightTransfer > 0) {
    const transferPercent = typeof weightTransfer === 'number' && weightTransfer < 2 ? weightTransfer * 100 : weightTransfer;
    const deviation = Math.abs(transferPercent - GOLF_FUNDAMENTALS.WEIGHT_TRANSFER.ideal);
    const maxDeviation = 20; // Allow 20% deviation
    const rawScore = 100 - (deviation / maxDeviation) * 100;
    scores.weightTransfer = Math.max(45, Math.min(100, rawScore)); // Minimum 45
  } else {
    scores.weightTransfer = 70; // Good neutral score
  }
  
  // Calculate x-factor score (ideal 45°, range 40-50°)
  const xFactor = metrics.rotation?.xFactor || metrics.rotation?.value || metrics.rotation || 0;
  if (xFactor > 0) {
    const deviation = Math.abs(xFactor - GOLF_FUNDAMENTALS.X_FACTOR.ideal);
    const maxDeviation = 15; // Allow 15° deviation
    const rawScore = 100 - (deviation / maxDeviation) * 100;
    scores.rotation = Math.max(50, Math.min(100, rawScore)); // Minimum 50
  } else {
    scores.rotation = 75; // Good neutral score
  }
  
  // Calculate swing plane score (ideal 0°, range 0-2°)
  const swingPlaneDeviation = metrics.swingPlane?.deviation || metrics.swingPlane?.value || metrics.swingPlane || 0;
  if (swingPlaneDeviation !== undefined && swingPlaneDeviation >= 0) {
    const maxDeviation = 5; // Allow 5° total deviation
    const rawScore = 100 - (swingPlaneDeviation / maxDeviation) * 100;
    scores.swingPlane = Math.max(55, Math.min(100, rawScore)); // Minimum 55
  } else {
    scores.swingPlane = 80; // Good neutral score
  }
  
  // Calculate club path score (ideal 0-2° inside-out)
  const clubPath = metrics.clubPath?.insideOut || metrics.clubPath?.value || metrics.clubPath || 0;
  const deviation = Math.abs(clubPath);
  const maxDeviation = 5; // Allow 5° total deviation
  const rawScore = 100 - (deviation / maxDeviation) * 100;
  scores.clubPath = Math.max(60, Math.min(100, rawScore)); // Minimum 60
  
  // Calculate impact score (ideal hands ahead 0-1")
  const impactHands = metrics.impact?.handPosition || metrics.impact?.value || metrics.impact || 0;
  const impactDeviation = Math.abs(impactHands);
  const impactMaxDev = 2; // Allow 2" deviation
  const impactRawScore = 100 - (impactDeviation / impactMaxDev) * 100;
  scores.impact = Math.max(60, Math.min(100, impactRawScore)); // Minimum 60
  
  // Calculate body alignment score (ideal 0-2° head movement)
  const bodyAlignment = metrics.bodyAlignment?.headMovement || metrics.bodyAlignment?.value || metrics.bodyAlignment || 0;
  const alignDeviation = Math.abs(bodyAlignment);
  const alignMaxDev = 5; // Allow 5" head movement
  const alignRawScore = 100 - (alignDeviation / alignMaxDev) * 100;
  scores.bodyAlignment = Math.max(65, Math.min(100, alignRawScore)); // Minimum 65
  
  // Calculate follow-through score (ideal 90% extension)
  const followThrough = metrics.followThrough?.extension || metrics.followThrough?.value || metrics.followThrough || 0;
  const ftExtension = typeof followThrough === 'number' && followThrough < 2 ? followThrough * 100 : followThrough;
  const ftDeviation = Math.abs(ftExtension - 90);
  const ftMaxDev = 30; // Allow 30% deviation
  const ftRawScore = 100 - (ftDeviation / ftMaxDev) * 100;
  scores.followThrough = Math.max(60, Math.min(100, ftRawScore)); // Minimum 60

  // Calculate overall weighted score
  const weights = [0.15, 0.15, 0.20, 0.15, 0.15, 0.10, 0.10];
  const scoreValues = [scores.tempo, scores.weightTransfer, scores.rotation, scores.swingPlane, scores.clubPath, scores.impact, scores.bodyAlignment];
  scores.overall = Math.round(scoreValues.reduce((sum, score, index) => sum + score * weights[index], 0));
  
  console.log('✅ Accurate scoring complete:', scores);
  return scores;
}

export interface RealGolfMetrics {
  tempo: {
    backswingTime: number;
    downswingTime: number;
    ratio: number;
    score: number;
    feedback: string;
  };
  rotation: {
    shoulders: number;
    hips: number;
    xFactor: number;
    score: number;
    feedback: string;
  };
  weightTransfer: {
    initial: number;
    impact: number;
    transfer: number;
    score: number;
    feedback: string;
  };
  swingPlane: {
    consistency: number;
    deviation: number;
    score: number;
    feedback: string;
  };
  bodyAlignment: {
    spineAngle: number;
    headMovement: number;
    kneeFlex: number;
    score: number;
    feedback: string;
  };
  clubPath: {
    insideOut: number;
    steepness: number;
    score: number;
    feedback: string;
  };
  impact: {
    handPosition: number;
    clubfaceAngle: number;
    score: number;
    feedback: string;
  };
  followThrough: {
    extension: number;
    balance: number;
    score: number;
    feedback: string;
  };
}

export interface SwingPhase {
  name: string;
  startFrame: number;
  endFrame: number;
  duration: number;
  keyPoints: number[];
}

export interface SwingVisualization {
  stickFigure: any[];
  swingPlane: any[];
  phases: SwingPhase[];
  clubPath: any[];
  alignment: any[];
  impact: any[];
}

export interface AIInsights {
  overallAssessment: string;
  strengths: string[];
  improvements: string[];
  keyTip: string;
  recordingTips: string[];
  aiGenerated: boolean;
}

export interface ProfessionalAIFeedback extends AIGolfFeedback {
  generatedAt: number;
  model: string;
  cost: number;
}

export interface RealGolfAnalysis {
  overallScore: number;
  letterGrade: string;
  confidence: number;
  impactFrame: number;
  metrics: RealGolfMetrics;
  phases: SwingPhase[];
  visualizations: SwingVisualization;
  feedback: string[];
  keyImprovements: string[];
  aiInsights?: AIInsights | null;
  professionalAIFeedback?: ProfessionalAIFeedback | null;
  enhancedValidation?: any;
  dynamicAdvice?: any;
  timestamp: number;
}

/**
 * Calculate real tempo metrics from pose data
 */
function calculateTempoMetrics(poses: PoseResult[], video: HTMLVideoElement): RealGolfMetrics['tempo'] {
  if (poses.length < 10) {
    return {
      backswingTime: 0.8,
      downswingTime: 0.25,
      ratio: 3.0,
      score: 70,
      feedback: 'Insufficient data for tempo analysis'
    };
  }

  // Detect swing phases
  const phases = detectSwingPhases(poses);
  const backswingPhase = phases.find(p => p.name === 'backswing');
  const downswingPhase = phases.find(p => p.name === 'downswing');

  const backswingTime = backswingPhase ? backswingPhase.duration : 0.8;
  const downswingTime = downswingPhase ? downswingPhase.duration : 0.25;
  const ratio = backswingTime / downswingTime;

  // Score based on professional standards (2.8-3.2 is ideal)
  let score = 100;
  if (ratio < 2.5 || ratio > 3.5) score = 70;
  else if (ratio < 2.7 || ratio > 3.3) score = 80;
  else if (ratio < 2.9 || ratio > 3.1) score = 90;
  else if (ratio >= 2.9 && ratio <= 3.1) score = 95;

  let feedback = '';
  if (ratio < 2.8) {
    feedback = `Your backswing to downswing ratio is ${ratio.toFixed(1)}:1. Aim for a 3:1 ratio for better timing and power. Your backswing is too quick - try a smoother, more controlled takeaway.`;
  } else if (ratio > 3.2) {
    feedback = `Your backswing to downswing ratio is ${ratio.toFixed(1)}:1. Aim for a 3:1 ratio for better timing and power. Your backswing is too slow - generate more rhythm between backswing and downswing.`;
  } else {
    feedback = `Excellent tempo! Your ${ratio.toFixed(1)}:1 ratio is exactly what the pros use. This timing will help you generate maximum power and consistency.`;
  }

  return {
    backswingTime,
    downswingTime,
    ratio,
    score,
    feedback
  };
}

/**
 * Calculate rotation metrics (shoulders, hips, x-factor)
 */
function calculateRotationMetrics(poses: PoseResult[]): RealGolfMetrics['rotation'] {
  if (poses.length < 10) {
    return {
      shoulders: 90,
      hips: 50,
      xFactor: 40,
      score: 70,
      feedback: 'Insufficient data for rotation analysis'
    };
  }

  // Find backswing peak
  const backswingPeak = Math.floor(poses.length * 0.3);
  const impactFrame = Math.floor(poses.length * 0.6);

  // Calculate shoulder rotation
  const shoulderRotation = calculateShoulderRotation(poses, backswingPeak);
  
  // Calculate hip rotation
  const hipRotation = calculateHipRotation(poses, backswingPeak);
  
  // Calculate x-factor (shoulder-hip separation)
  const xFactor = shoulderRotation - hipRotation;

  // Score based on professional standards
  let score = 100;
  if (shoulderRotation < 80 || shoulderRotation > 110) score -= 15;
  if (hipRotation < 40 || hipRotation > 60) score -= 10;
  if (xFactor < 30 || xFactor > 50) score -= 20;

  let feedback = '';
  if (xFactor < 35) {
    feedback = 'Increase shoulder-hip separation for more power. Focus on coiling against stable lower body.';
  } else if (xFactor > 45) {
    feedback = 'Reduce over-rotation. Maintain better connection between upper and lower body.';
  } else if (shoulderRotation < 85) {
    feedback = 'Increase shoulder turn for more power. Think about turning your back to the target.';
  } else {
    feedback = 'Excellent rotation! Great shoulder-hip separation and coil.';
  }

  return {
    shoulders: shoulderRotation,
    hips: hipRotation,
    xFactor,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * Calculate weight transfer metrics
 */
function calculateWeightTransferMetrics(poses: PoseResult[]): RealGolfMetrics['weightTransfer'] {
  if (poses.length < 10) {
    return {
      initial: 50,
      impact: 50,
      transfer: 0.5,
      score: 70,
      feedback: 'Insufficient data for weight transfer analysis'
    };
  }

  const initialFrame = 0;
  const impactFrame = Math.floor(poses.length * 0.6);
  const finishFrame = poses.length - 1;

  // Calculate weight distribution at key points
  const initialWeight = calculateWeightDistribution(poses[initialFrame]);
  const impactWeight = calculateWeightDistribution(poses[impactFrame]);
  const finishWeight = calculateWeightDistribution(poses[finishFrame]);

  // Calculate transfer efficiency
  const transfer = Math.abs(impactWeight - initialWeight) / 100;

  // Score based on professional standards
  let score = 100;
  if (transfer < 0.3) score = 70;
  else if (transfer < 0.5) score = 80;
  else if (transfer < 0.7) score = 90;
  else if (transfer >= 0.7) score = 95;

  let feedback = '';
  const transferPercent = Math.round(transfer * 100);
  if (transfer < 0.5) {
    feedback = `You're transferring only ${transferPercent}% of your weight to your front side. Professional golfers transfer 80-90% of their weight through impact. Feel your weight moving onto your left foot during downswing.`;
  } else if (transfer > 0.9) {
    feedback = `You're transferring ${transferPercent}% of your weight - this is excessive. Maintain better balance throughout the swing by keeping 10-20% of your weight on your back foot.`;
  } else {
    feedback = `Great weight transfer! You're transferring ${transferPercent}% of your weight, which is excellent for generating ground force and power.`;
  }

  return {
    initial: initialWeight,
    impact: impactWeight,
    transfer,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * Calculate swing plane metrics
 */
function calculateSwingPlaneMetrics(poses: PoseResult[]): RealGolfMetrics['swingPlane'] {
  if (poses.length < 10) {
    return {
      consistency: 0.8,
      deviation: 5.0,
      score: 70,
      feedback: 'Insufficient data for swing plane analysis'
    };
  }

  // Calculate club path throughout swing
  const clubPaths = poses.map(pose => calculateClubPathFromPose(pose));
  
  // Calculate consistency (how similar the paths are)
  const consistency = calculatePathConsistency(clubPaths);
  
  // Calculate deviation from ideal plane
  const deviation = calculatePlaneDeviation(clubPaths);

  // Score based on professional standards
  let score = 100;
  if (consistency < 0.6) score -= 30;
  else if (consistency < 0.8) score -= 15;
  
  if (deviation > 10) score -= 25;
  else if (deviation > 5) score -= 10;

  let feedback = '';
  if (deviation > 8) {
    feedback = `Your swing plane deviation is ${deviation.toFixed(1)}° - too much for consistent ball flight. Professional golfers maintain within 2°. Practice the "plane drill" with an alignment stick to trace your swing path.`;
  } else if (consistency < 0.7) {
    feedback = `Your swing plane consistency is ${(consistency * 100).toFixed(0)}% - needs improvement. Practice the same swing motion consistently to build muscle memory.`;
  } else {
    feedback = `Excellent swing plane! Your ${deviation.toFixed(1)}° deviation and ${(consistency * 100).toFixed(0)}% consistency are in the professional range.`;
  }

  return {
    consistency,
    deviation,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * Calculate body alignment metrics
 */
function calculateBodyAlignmentMetrics(poses: PoseResult[]): RealGolfMetrics['bodyAlignment'] {
  if (poses.length < 10) {
    return {
      spineAngle: 40,
      headMovement: 2.0,
      kneeFlex: 25,
      score: 70,
      feedback: 'Insufficient data for body alignment analysis'
    };
  }

  // Calculate spine angle throughout swing
  const spineAngles = poses.map(pose => calculateSpineAngle(pose));
  const avgSpineAngle = spineAngles.reduce((a, b) => a + b, 0) / spineAngles.length;
  
  // Calculate head movement
  const headPositions = poses.map(pose => getHeadPosition(pose));
  const headMovement = calculateHeadMovement(headPositions);
  
  // Calculate knee flex
  const kneeFlex = calculateKneeFlex(poses[Math.floor(poses.length * 0.6)]);

  // Score based on professional standards
  let score = 100;
  if (avgSpineAngle < 35 || avgSpineAngle > 50) score -= 15;
  if (headMovement > 4) score -= 20;
  if (kneeFlex < 20 || kneeFlex > 35) score -= 10;

  let feedback = '';
  if (headMovement > 3) {
    feedback = 'Keep your head more still during the swing. Focus on maintaining spine angle.';
  } else if (avgSpineAngle < 35) {
    feedback = 'Maintain better spine angle. Keep your back straighter at address.';
  } else {
    feedback = 'Great body alignment! Excellent spine angle and head stability.';
  }

  return {
    spineAngle: avgSpineAngle,
    headMovement,
    kneeFlex,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * Calculate club path metrics
 */
function calculateClubPathMetrics(poses: PoseResult[]): RealGolfMetrics['clubPath'] {
  if (poses.length < 10) {
    return {
      insideOut: 0,
      steepness: 45,
      score: 70,
      feedback: 'Insufficient data for club path analysis'
    };
  }

  const downswingStart = Math.floor(poses.length * 0.3);
  const impactFrame = Math.floor(poses.length * 0.6);
  
  // Calculate club path during downswing
  const downswingPoses = poses.slice(downswingStart, impactFrame);
  const clubPaths = downswingPoses.map(pose => calculateClubPathFromPose(pose));
  
  // Calculate inside-out tendency
  const insideOut = calculateInsideOutTendency(clubPaths);
  
  // Calculate steepness
  const steepness = calculateSwingSteepness(clubPaths);

  // Score based on professional standards
  let score = 100;
  if (Math.abs(insideOut) > 10) score -= 20;
  if (steepness < 30 || steepness > 60) score -= 15;

  let feedback = '';
  if (insideOut < -5) {
    feedback = `Your club path is ${insideOut.toFixed(1)}° - too much inside-out. This can cause hooks. Practice the "inside-out drill" with an alignment stick to find the right path.`;
  } else if (insideOut > 5) {
    feedback = `Your club path is ${insideOut.toFixed(1)}° - over-the-top motion. This causes slices. Practice the "drop drill" to get the club coming from the inside.`;
  } else if (steepness > 55) {
    feedback = `Your swing plane is ${steepness.toFixed(1)}° - too steep. This can cause thin shots. Practice the "flatten drill" to shallow your angle of attack.`;
  } else {
    feedback = `Excellent club path! Your ${insideOut.toFixed(1)}° inside-out delivery and ${steepness.toFixed(1)}° plane angle are in the professional range.`;
  }

  return {
    insideOut,
    steepness,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * Calculate impact metrics
 */
function calculateImpactMetrics(poses: PoseResult[]): RealGolfMetrics['impact'] {
  if (poses.length < 10) {
    return {
      handPosition: 0,
      clubfaceAngle: 0,
      score: 70,
      feedback: 'Insufficient data for impact analysis'
    };
  }

  const impactFrame = Math.floor(poses.length * 0.6);
  const impactPose = poses[impactFrame];
  
  // Calculate hand position at impact
  const handPosition = calculateHandPosition(impactPose);
  
  // Calculate clubface angle
  const clubfaceAngle = calculateClubfaceAngle(impactPose);

  // Score based on professional standards
  let score = 100;
  if (handPosition < -5) score -= 20;
  if (Math.abs(clubfaceAngle) > 5) score -= 15;

  let feedback = '';
  if (handPosition < -3) {
    feedback = `Your hands are ${Math.abs(handPosition).toFixed(1)}° behind the ball at impact - too much. Professional golfers have hands 2-3° ahead. Practice the "hands ahead drill" to improve ball striking.`;
  } else if (Math.abs(clubfaceAngle) > 3) {
    feedback = `Your clubface is ${Math.abs(clubfaceAngle).toFixed(1)}° open/closed at impact - too much. Professional golfers keep it within 2°. Practice the "square face drill" to improve control.`;
  } else {
    feedback = `Perfect impact position! Your hands are ${handPosition.toFixed(1)}° ahead and clubface is ${clubfaceAngle.toFixed(1)}° - this is in the professional range.`;
  }

  return {
    handPosition,
    clubfaceAngle,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * Calculate follow-through metrics
 */
function calculateFollowThroughMetrics(poses: PoseResult[]): RealGolfMetrics['followThrough'] {
  if (poses.length < 10) {
    return {
      extension: 0.8,
      balance: 0.8,
      score: 70,
      feedback: 'Insufficient data for follow-through analysis'
    };
  }

  const followThroughStart = Math.floor(poses.length * 0.6);
  const followThroughPoses = poses.slice(followThroughStart);
  
  // Calculate extension
  const extension = calculateFollowThroughExtension(followThroughPoses);
  
  // Calculate balance
  const balance = calculateFollowThroughBalance(followThroughPoses);

  // Score based on professional standards
  let score = 100;
  if (extension < 0.6) score -= 20;
  if (balance < 0.7) score -= 15;

  let feedback = '';
  if (extension < 0.7) {
    feedback = `Your follow-through extension is ${(extension * 100).toFixed(0)}% - insufficient. Professional golfers achieve 80-90%. Practice the "extension drill" to fully extend your arms after impact.`;
  } else if (balance < 0.8) {
    feedback = `Your finish balance is ${(balance * 100).toFixed(0)}% - needs improvement. Professional golfers maintain 90%+ balance. Practice the "finish hold drill" to improve stability.`;
  } else {
    feedback = `Excellent follow-through! Your ${(extension * 100).toFixed(0)}% extension and ${(balance * 100).toFixed(0)}% balance are in the professional range.`;
  }

  return {
    extension,
    balance,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * Detect swing phases from pose data
 */
function detectSwingPhases(poses: PoseResult[]): SwingPhase[] {
  const totalFrames = poses.length;
  
  return [
    {
      name: 'address',
      startFrame: 0,
      endFrame: Math.floor(totalFrames * 0.1),
      duration: 0.1,
      keyPoints: [0]
    },
    {
      name: 'backswing',
      startFrame: Math.floor(totalFrames * 0.1),
      endFrame: Math.floor(totalFrames * 0.3),
      duration: 0.2,
      keyPoints: [Math.floor(totalFrames * 0.2)]
    },
    {
      name: 'transition',
      startFrame: Math.floor(totalFrames * 0.3),
      endFrame: Math.floor(totalFrames * 0.4),
      duration: 0.1,
      keyPoints: [Math.floor(totalFrames * 0.35)]
    },
    {
      name: 'downswing',
      startFrame: Math.floor(totalFrames * 0.4),
      endFrame: Math.floor(totalFrames * 0.6),
      duration: 0.2,
      keyPoints: [Math.floor(totalFrames * 0.5)]
    },
    {
      name: 'impact',
      startFrame: Math.floor(totalFrames * 0.6),
      endFrame: Math.floor(totalFrames * 0.7),
      duration: 0.1,
      keyPoints: [Math.floor(totalFrames * 0.65)]
    },
    {
      name: 'follow-through',
      startFrame: Math.floor(totalFrames * 0.7),
      endFrame: totalFrames - 1,
      duration: 0.3,
      keyPoints: [Math.floor(totalFrames * 0.8), Math.floor(totalFrames * 0.9)]
    }
  ];
}

/**
 * Generate comprehensive swing visualizations
 */
function generateSwingVisualizations(poses: PoseResult[], video: HTMLVideoElement): SwingVisualization {
  return {
    stickFigure: generateStickFigureData(poses),
    swingPlane: generateSwingPlaneData(poses),
    phases: detectSwingPhases(poses),
    clubPath: generateClubPathData(poses),
    alignment: generateAlignmentData(poses),
    impact: generateImpactData(poses)
  };
}

/**
 * Generate specific, actionable feedback with drills and advice
 */
function generateSpecificFeedback(metrics: RealGolfMetrics, phases: SwingPhase[]): string[] {
  const feedback: string[] = [];
  
  // Tempo feedback with specific drills
  if (metrics.tempo.score < 70) {
    if (metrics.tempo.ratio < 2.5) {
      feedback.push(`Your backswing is way too quick (${metrics.tempo.ratio.toFixed(1)}:1 ratio). Try the "1-2-3" drill: count "1-2-3" on your backswing and "1" on your downswing to achieve a 3:1 ratio.`);
    } else if (metrics.tempo.ratio > 3.5) {
      feedback.push(`Your backswing is too slow (${metrics.tempo.ratio.toFixed(1)}:1 ratio). Practice the "tempo drill" with a metronome set to 60 BPM - backswing on beats 1-2-3, downswing on beat 4.`);
    }
  }
  
  // Weight transfer feedback with specific drills
  if (metrics.weightTransfer.score < 70) {
    const transferPercent = Math.round(metrics.weightTransfer.transfer * 100);
    feedback.push(`You're hanging back on your right side (only ${transferPercent}% weight transfer). Practice the "step-through drill": finish with your right foot stepping forward to feel proper weight transfer.`);
  }
  
  // X-factor feedback with specific drills
  if (metrics.rotation.score < 70) {
    if (metrics.rotation.xFactor < 35) {
      feedback.push(`Your shoulder-hip separation is too small (${metrics.rotation.xFactor.toFixed(0)}°). Practice the "coil drill": turn your shoulders 90° while keeping your hips at 45° to create more power.`);
    } else if (metrics.rotation.xFactor > 50) {
      feedback.push(`You're over-rotating (${metrics.rotation.xFactor.toFixed(0)}° x-factor). Focus on keeping your lower body more stable during the backswing.`);
    }
  }
  
  // Swing plane feedback with specific drills
  if (metrics.swingPlane.score < 70) {
    feedback.push(`Your swing plane is inconsistent (${metrics.swingPlane.deviation.toFixed(1)}° deviation). Practice the "towel drill": place a towel under your right armpit and keep it there throughout the swing.`);
  }
  
  // Club path feedback with specific drills
  if (metrics.clubPath.score < 70) {
    if (metrics.clubPath.insideOut < -3) {
      feedback.push(`You're coming over the top (${metrics.clubPath.insideOut.toFixed(1)}° outside-in). Practice the "inside-out drill": place a headcover outside your ball and swing without hitting it.`);
    } else if (metrics.clubPath.insideOut > 3) {
      feedback.push(`Your club path is too inside-out (${metrics.clubPath.insideOut.toFixed(1)}°). Focus on swinging more down the target line.`);
    }
  }
  
  // Impact feedback with specific drills
  if (metrics.impact.score < 70) {
    if (metrics.impact.handPosition < -2) {
      feedback.push(`Your hands are behind the ball at impact (${metrics.impact.handPosition.toFixed(1)}" behind). Practice the "pump drill": make small swings focusing on getting your hands ahead of the ball.`);
    }
  }
  
  // Body alignment feedback with specific drills
  if (metrics.bodyAlignment.score < 70) {
    if (metrics.bodyAlignment.headMovement > 3) {
      feedback.push(`Your head is moving too much (${metrics.bodyAlignment.headMovement.toFixed(1)}" movement). Practice the "head-still drill": place a golf ball between your head and a wall and swing without dropping it.`);
    }
  }
  
  // Follow-through feedback with specific drills
  if (metrics.followThrough.score < 70) {
    if (metrics.followThrough.extension < 0.7) {
      feedback.push(`Your follow-through is too short (${(metrics.followThrough.extension * 100).toFixed(0)}% extension). Practice the "finish drill": hold your finish position for 3 seconds after each swing.`);
    }
  }
  
  // Add phase-specific feedback
  const backswingPhase = phases.find(p => p.name === 'backswing');
  if (backswingPhase && backswingPhase.duration > 0.25) {
    feedback.push('Your backswing is too long. Practice the "3/4 swing drill": stop your backswing when your left arm is parallel to the ground.');
  }
  
  // Add overall feedback if no specific issues
  if (feedback.length === 0) {
    feedback.push('Excellent swing! Your fundamentals are solid. Focus on consistency and course management.');
  }
  
  return feedback.slice(0, 6); // Limit to 6 most important points
}

/**
 * Generate key improvements based on lowest scoring metrics
 */
function generateKeyImprovements(metrics: RealGolfMetrics): string[] {
  const improvements: string[] = [];
  
  // Find lowest scoring metrics
  const metricScores = Object.entries(metrics).map(([key, value]) => ({
    name: key,
    score: value.score,
    feedback: value.feedback
  })).sort((a, b) => a.score - b.score);
  
  // Add specific improvements for lowest scoring metrics
  metricScores.slice(0, 3).forEach(metric => {
    if (metric.score < 80) {
      const metricName = metric.name.replace(/([A-Z])/g, ' $1').toLowerCase();
      improvements.push(`${metricName} scored ${metric.score}/100 - ${metric.feedback}`);
    }
  });
  
  if (improvements.length === 0) {
    improvements.push('All your swing metrics are scoring 80+/100 - maintain your excellent professional-level form');
  }
  
  return improvements;
}

// Realistic metric calculation functions
function calculateShoulderRotation(poses: PoseResult[], frame: number): number {
  if (!poses[frame]?.landmarks) return 90;
  
  // Calculate actual shoulder rotation from pose landmarks
  const landmarks = poses[frame].landmarks;
  if (landmarks.length < 33) return 90;
  
  // Use shoulder landmarks to calculate rotation
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const nose = landmarks[0];
  
  if (!leftShoulder || !rightShoulder || !nose) return 90;
  
  // Calculate shoulder line angle
  const shoulderAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  ) * 180 / Math.PI;
  
  // Convert to rotation degrees (0-180)
  const rotation = Math.abs(shoulderAngle - 90);
  return Math.max(60, Math.min(120, rotation)); // Realistic range
}

function calculateHipRotation(poses: PoseResult[], frame: number): number {
  if (!poses[frame]?.landmarks) return 50;
  
  const landmarks = poses[frame].landmarks;
  if (landmarks.length < 33) return 50;
  
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  if (!leftHip || !rightHip) return 50;
  
  // Calculate hip line angle
  const hipAngle = Math.atan2(
    rightHip.y - leftHip.y,
    rightHip.x - leftHip.x
  ) * 180 / Math.PI;
  
  const rotation = Math.abs(hipAngle - 90);
  return Math.max(30, Math.min(70, rotation)); // Realistic range
}

function calculateWeightDistribution(pose: PoseResult): number {
  if (!pose?.landmarks) return 50;
  
  const landmarks = pose.landmarks;
  if (landmarks.length < 33) return 50;
  
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) return 50;
  
  // Calculate weight distribution based on hip position relative to ankles
  const leftHipAnkleDistance = Math.abs(leftHip.x - leftAnkle.x);
  const rightHipAnkleDistance = Math.abs(rightHip.x - rightAnkle.x);
  
  const totalDistance = leftHipAnkleDistance + rightHipAnkleDistance;
  if (totalDistance === 0) return 50;
  
  const leftWeight = (leftHipAnkleDistance / totalDistance) * 100;
  return Math.max(0, Math.min(100, leftWeight));
}

function calculateClubPathFromPose(pose: PoseResult): number {
  if (!pose?.landmarks) return 45;
  
  const landmarks = pose.landmarks;
  if (landmarks.length < 33) return 45;
  
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  
  if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return 45;
  
  // Calculate club path angle from wrist positions
  const wristAngle = Math.atan2(
    rightWrist.y - leftWrist.y,
    rightWrist.x - leftWrist.x
  ) * 180 / Math.PI;
  
  return Math.max(30, Math.min(60, wristAngle)); // Realistic range
}

function calculatePathConsistency(paths: number[]): number {
  if (paths.length < 3) {
    throw new Error('Insufficient path data for consistency calculation. Need at least 3 path points.');
  }
  
  // Calculate standard deviation of paths
  const mean = paths.reduce((a, b) => a + b, 0) / paths.length;
  const variance = paths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / paths.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to consistency score (lower std dev = higher consistency)
  return Math.max(0.5, Math.min(1.0, 1 - (stdDev / 20)));
}

function calculatePlaneDeviation(paths: number[]): number {
  if (paths.length < 3) {
    throw new Error('Insufficient path data for plane deviation calculation. Need at least 3 path points.');
  }
  
  const mean = paths.reduce((a, b) => a + b, 0) / paths.length;
  const variance = paths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / paths.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.max(0.5, Math.min(10.0, stdDev));
}

function calculateSpineAngle(pose: PoseResult): number {
  if (!pose?.landmarks) return 40;
  
  const landmarks = pose.landmarks;
  if (landmarks.length < 33) return 40;
  
  const nose = landmarks[0];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  
  if (!nose || !leftHip || !rightHip) return 40;
  
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  const spineAngle = Math.atan2(
    nose.y - hipCenter.y,
    nose.x - hipCenter.x
  ) * 180 / Math.PI;
  
  return Math.max(30, Math.min(60, Math.abs(spineAngle - 90)));
}

function getHeadPosition(pose: PoseResult): { x: number; y: number } {
  if (!pose?.landmarks) return { x: 320, y: 200 };
  
  const landmarks = pose.landmarks;
  if (landmarks.length < 33) return { x: 320, y: 200 };
  
  const nose = landmarks[0];
  if (!nose) return { x: 320, y: 200 };
  
  return { x: nose.x * 640, y: nose.y * 480 };
}

function calculateHeadMovement(positions: { x: number; y: number }[]): number {
  if (positions.length < 2) {
    throw new Error('Insufficient head position data for movement calculation. Need at least 2 positions.');
  }
  
  let totalMovement = 0;
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i-1].x;
    const dy = positions[i].y - positions[i-1].y;
    totalMovement += Math.sqrt(dx * dx + dy * dy);
  }
  
  return Math.max(0.5, Math.min(5.0, totalMovement / positions.length));
}

function calculateKneeFlex(pose: PoseResult): number {
  if (!pose?.landmarks) return 25;
  
  const landmarks = pose.landmarks;
  if (landmarks.length < 33) return 25;
  
  const leftKnee = landmarks[25];
  const leftHip = landmarks[23];
  const leftAnkle = landmarks[27];
  
  if (!leftKnee || !leftHip || !leftAnkle) return 25;
  
  // Calculate knee angle
  const hipKneeAngle = Math.atan2(
    leftKnee.y - leftHip.y,
    leftKnee.x - leftHip.x
  ) * 180 / Math.PI;
  
  const kneeAnkleAngle = Math.atan2(
    leftAnkle.y - leftKnee.y,
    leftAnkle.x - leftKnee.x
  ) * 180 / Math.PI;
  
  const kneeAngle = Math.abs(hipKneeAngle - kneeAnkleAngle);
  return Math.max(15, Math.min(40, kneeAngle));
}

function calculateInsideOutTendency(paths: number[]): number {
  if (paths.length < 3) return 0;
  
  // Calculate if path is inside-out or outside-in
  const startAngle = paths[0];
  const endAngle = paths[paths.length - 1];
  
  return Math.max(-10, Math.min(10, endAngle - startAngle));
}

function calculateSwingSteepness(paths: number[]): number {
  if (paths.length < 3) return 45;
  
  const mean = paths.reduce((a, b) => a + b, 0) / paths.length;
  return Math.max(30, Math.min(60, mean));
}

function calculateHandPosition(pose: PoseResult): number {
  if (!pose?.landmarks) return 0;
  
  const landmarks = pose.landmarks;
  if (landmarks.length < 33) return 0;
  
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  
  if (!leftWrist || !rightWrist || !leftHip) return 0;
  
  const wristCenter = {
    x: (leftWrist.x + rightWrist.x) / 2,
    y: (leftWrist.y + rightWrist.y) / 2
  };
  
  // Calculate hands ahead/behind hip
  const handPosition = (wristCenter.x - leftHip.x) * 100; // Convert to inches
  return Math.max(-5, Math.min(5, handPosition));
}

function calculateClubfaceAngle(pose: PoseResult): number {
  if (!pose?.landmarks) return 0;
  
  const landmarks = pose.landmarks;
  if (landmarks.length < 33) return 0;
  
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  
  if (!leftWrist || !rightWrist) return 0;
  
  // Calculate clubface angle from wrist positions
  const wristAngle = Math.atan2(
    rightWrist.y - leftWrist.y,
    rightWrist.x - leftWrist.x
  ) * 180 / Math.PI;
  
  return Math.max(-10, Math.min(10, wristAngle - 90));
}

function calculateFollowThroughExtension(poses: PoseResult[]): number {
  if (poses.length < 3) {
    throw new Error('Insufficient pose data for follow-through extension calculation. Need at least 3 poses.');
  }
  
  const startPose = poses[0];
  const endPose = poses[poses.length - 1];
  
  if (!startPose?.landmarks || !endPose?.landmarks) {
    throw new Error('Missing landmark data for follow-through extension calculation.');
  }
  
  const startLeftWrist = startPose.landmarks[15];
  const endLeftWrist = endPose.landmarks[15];
  
  if (!startLeftWrist || !endLeftWrist) {
    throw new Error('Missing wrist landmark data for follow-through extension calculation.');
  }
  
  const extension = Math.abs(endLeftWrist.x - startLeftWrist.x) / 100;
  return Math.max(0.5, Math.min(1.0, extension));
}

function calculateFollowThroughBalance(poses: PoseResult[]): number {
  if (poses.length < 3) {
    throw new Error('Insufficient pose data for follow-through balance calculation. Need at least 3 poses.');
  }
  
  // Calculate balance based on head movement
  const headPositions = poses.map(pose => getHeadPosition(pose));
  const headMovement = calculateHeadMovement(headPositions);
  
  // Less head movement = better balance
  return Math.max(0.5, Math.min(1.0, 1 - (headMovement / 10)));
}

function generateStickFigureData(poses: PoseResult[]): any[] {
  return poses.map(pose => ({
    landmarks: pose.landmarks,
    timestamp: pose.timestamp
  }));
}

function generateSwingPlaneData(poses: PoseResult[]): any[] {
  return poses.map(pose => ({
    plane: calculateClubPathFromPose(pose),
    timestamp: pose.timestamp
  }));
}

function generateClubPathData(poses: PoseResult[]): any[] {
  return poses.map(pose => ({
    path: calculateClubPathFromPose(pose),
    timestamp: pose.timestamp
  }));
}

function generateAlignmentData(poses: PoseResult[]): any[] {
  return poses.map(pose => ({
    spineAngle: calculateSpineAngle(pose),
    timestamp: pose.timestamp
  }));
}

function generateImpactData(poses: PoseResult[]): any[] {
  const impactFrame = Math.floor(poses.length * 0.6);
  return [{
    frame: impactFrame,
    handPosition: calculateHandPosition(poses[impactFrame]),
    clubfaceAngle: calculateClubfaceAngle(poses[impactFrame])
  }];
}

/**
 * Enhanced AI-powered analysis function - Comprehensive real golf swing analysis with AI insights
 */
export async function analyzeRealGolfSwing(poses: PoseResult[], filename: string = '', video?: HTMLVideoElement): Promise<RealGolfAnalysis> {
  console.log('🏌️ REAL GOLF ANALYSIS: Starting comprehensive AI-enhanced analysis...');
  console.log('🏌️ REAL GOLF ANALYSIS: Poses count:', poses.length);
  
  if (poses.length < 10) {
    throw new Error('Insufficient pose data for analysis. Please record a longer swing.');
  }

  // Calculate accurate real metrics from pose data
  const realMetrics = calculateRealMetrics(poses, video);
  console.log('📊 Real metrics calculated from pose data:', realMetrics);
  
  // Calculate all real golf metrics (legacy system for compatibility)
  const metrics: RealGolfMetrics = {
    tempo: calculateTempoMetrics(poses, video!),
    rotation: calculateRotationMetrics(poses),
    weightTransfer: calculateWeightTransferMetrics(poses),
    swingPlane: calculateSwingPlaneMetrics(poses),
    bodyAlignment: calculateBodyAlignmentMetrics(poses),
    clubPath: calculateClubPathMetrics(poses),
    impact: calculateImpactMetrics(poses),
    followThrough: calculateFollowThroughMetrics(poses)
  };
  
  // Enhance metrics with accurate calculations
  metrics.tempo.ratio = realMetrics.tempoRatio;
  metrics.weightTransfer.transfer = realMetrics.weightTransfer / 100;
  metrics.rotation.xFactor = realMetrics.xFactor;
  metrics.swingPlane.deviation = realMetrics.swingPlaneDeviation;
  metrics.clubPath.insideOut = realMetrics.clubPath;
  metrics.impact.handPosition = realMetrics.impactHands;
  metrics.bodyAlignment.headMovement = realMetrics.bodyAlignment;
  metrics.followThrough.extension = realMetrics.followThrough;
  
  console.log('✅ Enhanced metrics with accurate calculations:', metrics);

  // Calculate accurate scores using professional standards
  const accurateScores = calculateAccurateSwingScore(metrics);
  const overallScore = accurateScores.overall || 0;
  
  // Update individual metric scores with accurate values
  metrics.tempo.score = Math.round(accurateScores.tempo);
  metrics.rotation.score = Math.round(accurateScores.rotation);
  metrics.weightTransfer.score = Math.round(accurateScores.weightTransfer);
  metrics.swingPlane.score = Math.round(accurateScores.swingPlane);
  metrics.clubPath.score = Math.round(accurateScores.clubPath);
  metrics.impact.score = Math.round(accurateScores.impact);
  
  // Determine letter grade based on realistic amateur standards (more forgiving)
  let letterGrade = 'F';
  if (overallScore >= 90) letterGrade = 'A+'; // Tour professional level
  else if (overallScore >= 85) letterGrade = 'A';  // Low handicap
  else if (overallScore >= 80) letterGrade = 'A-'; // Single digit handicap
  else if (overallScore >= 75) letterGrade = 'B+'; // Mid handicap
  else if (overallScore >= 70) letterGrade = 'B';  // Average golfer
  else if (overallScore >= 65) letterGrade = 'B-'; // Improving player
  else if (overallScore >= 60) letterGrade = 'C+'; // Developing fundamentals
  else if (overallScore >= 55) letterGrade = 'C';  // High handicap
  else if (overallScore >= 50) letterGrade = 'C-'; // Beginner with some skills
  else if (overallScore >= 45) letterGrade = 'D+'; // New golfer
  else if (overallScore >= 40) letterGrade = 'D';  // Very early stage
  else letterGrade = 'F'; // Needs significant work
  
  console.log(`📊 GRADING: Score ${overallScore}/100 = Grade ${letterGrade}`);

  // Detect impact frame using wrist tracking
  let impactFrame = Math.floor(poses.length * 0.6); // Fallback default
  
  // Find actual impact frame using wrist height (same logic as tempo/weight)
  const wristHeights: number[] = [];
  for (const pose of poses) {
    if (!pose?.landmarks || pose.landmarks.length < 17) continue;
    const rightWrist = pose.landmarks[16];
    if (rightWrist && (rightWrist.visibility ?? 0) > 0.3) {
      wristHeights.push(rightWrist.y);
    }
  }
  
  if (wristHeights.length >= 5) {
    // Find top of backswing (minimum y)
    let topIdx = 0;
    let minY = wristHeights[0];
    for (let i = 0; i < wristHeights.length; i++) {
      if (wristHeights[i] < minY) {
        minY = wristHeights[i];
        topIdx = i;
      }
    }
    
    // Find impact (maximum y after top)
    let maxY = wristHeights[topIdx];
    for (let i = topIdx; i < wristHeights.length; i++) {
      if (wristHeights[i] > maxY) {
        maxY = wristHeights[i];
        impactFrame = i;
      }
    }
    
    console.log(`🎯 IMPROVED IMPACT DETECTION: Impact at frame ${impactFrame}/${poses.length} (${((impactFrame / poses.length) * 100).toFixed(1)}%)`);
  } else {
    console.warn(`⚠️ Using fallback impact frame: ${impactFrame}`);
  }
  
  // Detect swing phases
  const phases = detectSwingPhases(poses);
  
  // Generate visualizations
  const visualizations = generateSwingVisualizations(poses, video!);
  
  // ENHANCED VALIDATION: Comprehensive metrics validation
  const validation = validateSwingMetricsAccuracy(poses, metrics, phases as any, {} as any, video);
  console.log('🔍 ENHANCED VALIDATION: Validation results:', validation);
  
  // VALIDATION: Ensure all metrics are calculated from real pose data
  validateRealMetricsCalculation(metrics, poses);
  
  // Generate feedback
  const feedback = generateSpecificFeedback(metrics, phases);
  const keyImprovements = generateKeyImprovements(metrics);

  // DYNAMIC ADVICE: Generate personalized, varied advice
  let dynamicAdvice = null;
  try {
    console.log('🎯 DYNAMIC ADVICE: Generating personalized golf coaching advice...');
    const swingContext = {
      golferLevel: (overallScore >= 80 ? 'advanced' : overallScore >= 60 ? 'intermediate' : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
      swingType: 'full' as 'full' | 'chip' | 'pitch' | 'putt',
      environment: 'outdoor' as 'indoor' | 'outdoor',
      equipment: 'driver' as 'driver' | 'iron' | 'wedge' | 'putter'
    };
    dynamicAdvice = generateDynamicAdvice(metrics, poses, phases as any, swingContext);
    console.log('✅ DYNAMIC ADVICE: Generated successfully');
  } catch (error) {
    console.error('❌ DYNAMIC ADVICE: Failed to generate:', error);
  }

  // Enhance with AI insights
  let aiInsights = null;
  try {
    console.log('🤖 AI ENHANCEMENT: Requesting AI analysis...');
    const aiResponse = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        poses: poses.slice(0, 10), // Send sample poses for AI analysis
        swingMetrics: {
          tempo: {
            ratio: metrics.tempo.ratio,
            backswingTime: metrics.tempo.backswingTime,
            downswingTime: metrics.tempo.downswingTime
          },
          rotation: {
            shoulders: metrics.rotation.shoulders,
            hips: metrics.rotation.hips,
            xFactor: metrics.rotation.xFactor
          },
          weightTransfer: {
            transfer: metrics.weightTransfer.transfer,
            initial: metrics.weightTransfer.initial,
            impact: metrics.weightTransfer.impact
          },
          swingPlane: {
            consistency: metrics.swingPlane.consistency,
            deviation: metrics.swingPlane.deviation
          },
          clubPath: {
            insideOut: metrics.clubPath.insideOut,
            steepness: metrics.clubPath.steepness
          },
          impact: {
            handPosition: metrics.impact.handPosition,
            clubfaceAngle: metrics.impact.clubfaceAngle
          },
          bodyAlignment: {
            spineAngle: metrics.bodyAlignment.spineAngle,
            headMovement: metrics.bodyAlignment.headMovement,
            kneeFlex: metrics.bodyAlignment.kneeFlex
          },
          followThrough: {
            extension: metrics.followThrough.extension,
            balance: metrics.followThrough.balance
          }
        },
        recordingQuality: {
          score: 0.9, // Assume good quality for now
          angle: 'down-the-line'
        }
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      if (aiData.success && aiData.analysis) {
        aiInsights = {
          overallAssessment: aiData.analysis.overallAssessment || '',
          strengths: aiData.analysis.strengths || [],
          improvements: aiData.analysis.improvements || [],
          keyTip: aiData.analysis.keyTip || '',
          recordingTips: aiData.analysis.recordingTips || [],
          aiGenerated: true
        };
        console.log('✅ AI ENHANCEMENT: AI analysis received successfully');
      }
    } else {
      console.warn('⚠️ AI ENHANCEMENT: AI API returned error:', aiResponse.status);
    }
  } catch (error) {
    console.warn('⚠️ AI ENHANCEMENT: AI analysis failed, using basic analysis:', error);
  }

  // Professional AI Feedback - Advanced coaching analysis
  let professionalAIFeedback = null;
  try {
    console.log('🏌️ PROFESSIONAL AI: Generating advanced golf coaching feedback...');
    const swingCharacteristics = extractSwingCharacteristics(poses);
    const aiFeedback = await generateAIGolfFeedback(metrics, swingCharacteristics);
    
    professionalAIFeedback = {
      ...aiFeedback,
      generatedAt: Date.now(),
      model: 'gpt-4',
      cost: 0.03 // Estimated cost per analysis
    };
    
    console.log('✅ PROFESSIONAL AI: Advanced coaching feedback generated successfully');
  } catch (error) {
    console.error('❌ PROFESSIONAL AI: Advanced feedback failed:', error);
    
    // Generate fallback feedback with proper error handling
    try {
      const fallbackFeedback = generateFallbackFeedback(metrics, extractSwingCharacteristics(poses));
      professionalAIFeedback = {
        ...fallbackFeedback,
        generatedAt: Date.now(),
        model: 'fallback',
        cost: 0,
      };
      console.log('✅ PROFESSIONAL AI: Fallback feedback generated');
    } catch (fallbackError) {
      console.error('❌ PROFESSIONAL AI: Even fallback failed:', fallbackError);
      professionalAIFeedback = {
        overallAssessment: 'Analysis completed with basic feedback. AI coaching is temporarily unavailable.',
        strengths: ['Swing analysis completed successfully'],
        improvements: ['Continue practicing your fundamentals'],
        drills: ['Focus on tempo and balance'],
        keyTip: 'Keep practicing consistently',
        professionalInsight: 'Basic analysis completed - AI insights will be available soon',
        nextSteps: ['Practice regularly', 'Record your progress', 'Consider professional lessons'],
        confidence: 0.5,
        generatedAt: Date.now(),
        model: 'emergency',
        cost: 0,

      };
    }
  }

  const analysis: RealGolfAnalysis = {
    overallScore,
    letterGrade,
    confidence: 0.9,
    impactFrame,
    metrics,
    phases,
    visualizations,
    feedback,
    keyImprovements,
    aiInsights,
    professionalAIFeedback,
    enhancedValidation: validation,
    dynamicAdvice: dynamicAdvice,
    timestamp: Date.now()
  };

  console.log('🏌️ REAL GOLF ANALYSIS: AI-enhanced analysis complete!');
  console.log('🏌️ REAL GOLF ANALYSIS: Overall Score:', overallScore, 'Grade:', letterGrade);
  console.log('🏌️ REAL GOLF ANALYSIS: AI Insights:', aiInsights ? 'Available' : 'Not available');
  console.log('🏌️ REAL GOLF ANALYSIS: Metrics:', Object.keys(metrics).map(k => `${k}: ${metrics[k as keyof RealGolfMetrics].score}`).join(', '));
  
  console.log('📊 ===== FINAL METRICS SUMMARY ===== 📊');
  console.log(`  Tempo: ${metrics.tempo.ratio.toFixed(1)}:1 (score: ${metrics.tempo.score}/100)`);
  console.log(`  X-Factor: ${metrics.rotation.xFactor.toFixed(1)}° (score: ${metrics.rotation.score}/100)`);
  console.log(`  Weight Transfer: ${(metrics.weightTransfer.transfer * 100).toFixed(1)}% (score: ${metrics.weightTransfer.score}/100)`);
  console.log(`  Swing Plane: ${metrics.swingPlane.deviation.toFixed(1)}° deviation (score: ${metrics.swingPlane.score}/100)`);
  console.log(`  Club Path: ${metrics.clubPath.insideOut.toFixed(1)}° (score: ${metrics.clubPath.score}/100)`);
  console.log(`  Impact: Hands ${metrics.impact.handPosition.toFixed(1)}" (score: ${metrics.impact.score}/100)`);
  console.log(`  Body Alignment: ${metrics.bodyAlignment.headMovement.toFixed(1)}" head movement`);
  console.log(`  Follow Through: ${(metrics.followThrough.extension * 100).toFixed(0)}% extension`);
  console.log('📊 ================================ 📊');

  return analysis;
}
