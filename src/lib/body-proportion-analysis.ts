'use client';

import { PoseResult, PoseLandmark } from './mediapipe';

/**
 * Body proportion analysis for personalized golf swing grading
 * 
 * This system analyzes individual body proportions from pose data to create
 * personalized benchmarks for golf swing analysis. It accounts for differences
 * in body type, height, arm length, and flexibility to provide more accurate and
 * individualized swing analysis.
 */

export interface BodyProportions {
  height: number;           // Normalized height
  armLength: number;        // Normalized arm length
  shoulderWidth: number;    // Normalized shoulder width
  legLength: number;        // Normalized leg length
  torsoLength: number;      // Normalized torso length
  armTorsoRatio: number;    // Ratio of arm length to torso length
  shoulderHipRatio: number; // Ratio of shoulder width to hip width
  legHeightRatio: number;   // Ratio of leg length to total height
  confidence: number;       // Confidence in the measurements (0-1)
}

export interface PersonalizedBenchmarks {
  shoulderTurnMax: number;  // Maximum shoulder turn in degrees
  hipTurnMax: number;       // Maximum hip turn in degrees
  swingPlaneAngle: number;  // Ideal swing plane angle
  spineAngleSetup: number;  // Ideal spine angle at setup
  wristAngleMax: number;    // Maximum wrist angle (hinge)
  expectedTempo: number;    // Expected tempo ratio
  flexibility: number;      // Overall flexibility score (0-100)
}

// Key landmarks for body measurements
const LANDMARKS = {
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
  rightAnkle: 28
};

// Standard benchmarks for reference
const STANDARD_BENCHMARKS = {
  shoulderTurnMax: 90,   // degrees
  hipTurnMax: 45,        // degrees
  swingPlaneAngle: 70,   // degrees
  spineAngleSetup: 40,   // degrees
  wristAngleMax: 90,     // degrees
  expectedTempo: 3,      // 3:1 ratio
  flexibility: 70        // score out of 100
};

/**
 * Calculate body proportions from pose data
 */
export function calculateBodyProportions(poses: PoseResult[]): BodyProportions {
  console.log('🧍 PROPORTION ANALYSIS: Starting body proportion analysis');
  
  if (!poses || poses.length === 0) {
    console.warn('🧍 PROPORTION ANALYSIS: No pose data provided');
    return getDefaultProportions();
  }

  // Filter poses with good visibility for accurate measurements
  const goodPoses = poses.filter(pose => {
    if (!pose.landmarks) return false;
    
    // Check if key landmarks are visible
    const keyLandmarks = [
      LANDMARKS.head, 
      LANDMARKS.leftShoulder, 
      LANDMARKS.rightShoulder,
      LANDMARKS.leftHip,
      LANDMARKS.rightHip,
      LANDMARKS.leftAnkle,
      LANDMARKS.rightAnkle
    ];
    
    return keyLandmarks.every(idx => 
      pose.landmarks[idx] && 
      pose.landmarks[idx].visibility && 
      pose.landmarks[idx].visibility > 0.5
    );
  });

  if (goodPoses.length < 5) {
    console.warn('🧍 PROPORTION ANALYSIS: Insufficient good quality poses for accurate measurements');
    return getDefaultProportions();
  }

  // Use address phase pose or first good pose for measurements
  const addressPose = goodPoses.find(pose => {
    // Check if this is likely an address pose (person standing upright)
    if (!pose.landmarks) return false;
    
    const head = pose.landmarks[LANDMARKS.head];
    const leftAnkle = pose.landmarks[LANDMARKS.leftAnkle];
    const rightAnkle = pose.landmarks[LANDMARKS.rightAnkle];
    
    if (!head || !leftAnkle || !rightAnkle) return false;
    
    // In address position, head should be above feet
    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    return head.y < avgAnkleY;
  }) || goodPoses[0];

  if (!addressPose || !addressPose.landmarks) {
    console.warn('🧍 PROPORTION ANALYSIS: No suitable pose found for measurements');
    return getDefaultProportions();
  }

  try {
    const landmarks = addressPose.landmarks;
    
    // Calculate height (head to ankles)
    const head = landmarks[LANDMARKS.head];
    const leftAnkle = landmarks[LANDMARKS.leftAnkle];
    const rightAnkle = landmarks[LANDMARKS.rightAnkle];
    
    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    const height = avgAnkleY - head.y;
    
    // Calculate shoulder width
    const leftShoulder = landmarks[LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[LANDMARKS.rightShoulder];
    
    const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
    
    // Calculate arm length (average of left and right)
    const leftElbow = landmarks[LANDMARKS.leftElbow];
    const rightElbow = landmarks[LANDMARKS.rightElbow];
    const leftWrist = landmarks[LANDMARKS.leftWrist];
    const rightWrist = landmarks[LANDMARKS.rightWrist];
    
    const leftArmLength = calculateDistance(leftShoulder, leftElbow) + 
                         calculateDistance(leftElbow, leftWrist);
    const rightArmLength = calculateDistance(rightShoulder, rightElbow) + 
                          calculateDistance(rightElbow, rightWrist);
    const armLength = (leftArmLength + rightArmLength) / 2;
    
    // Calculate leg length (average of left and right)
    const leftHip = landmarks[LANDMARKS.leftHip];
    const rightHip = landmarks[LANDMARKS.rightHip];
    const leftKnee = landmarks[LANDMARKS.leftKnee];
    const rightKnee = landmarks[LANDMARKS.rightKnee];
    
    const leftLegLength = calculateDistance(leftHip, leftKnee) + 
                         calculateDistance(leftKnee, leftAnkle);
    const rightLegLength = calculateDistance(rightHip, rightKnee) + 
                          calculateDistance(rightKnee, rightAnkle);
    const legLength = (leftLegLength + rightLegLength) / 2;
    
    // Calculate torso length (shoulders to hips)
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    const torsoLength = hipCenterY - shoulderCenterY;
    
    // Calculate hip width
    const hipWidth = calculateDistance(leftHip, rightHip);
    
    // Calculate ratios
    const armTorsoRatio = armLength / torsoLength;
    const shoulderHipRatio = shoulderWidth / hipWidth;
    const legHeightRatio = legLength / height;
    
    // Calculate confidence based on landmark visibility
    let visibilitySum = 0;
    let landmarkCount = 0;
    
    [
      head, leftShoulder, rightShoulder, leftElbow, rightElbow,
      leftWrist, rightWrist, leftHip, rightHip, leftKnee, rightKnee,
      leftAnkle, rightAnkle
    ].forEach(landmark => {
      if (landmark && landmark.visibility) {
        visibilitySum += landmark.visibility;
        landmarkCount++;
      }
    });
    
    const confidence = landmarkCount > 0 ? visibilitySum / landmarkCount : 0;
    
    console.log('🧍 PROPORTION ANALYSIS: Body proportions calculated:', {
      height,
      armLength,
      shoulderWidth,
      legLength,
      torsoLength,
      armTorsoRatio,
      shoulderHipRatio,
      legHeightRatio,
      confidence
    });
    
    return {
      height,
      armLength,
      shoulderWidth,
      legLength,
      torsoLength,
      armTorsoRatio,
      shoulderHipRatio,
      legHeightRatio,
      confidence
    };
  } catch (error) {
    console.error('🧍 PROPORTION ANALYSIS: Error calculating body proportions:', error);
    return getDefaultProportions();
  }
}

/**
 * Generate personalized benchmarks based on body proportions
 */
export function generatePersonalizedBenchmarks(
  proportions: BodyProportions
): PersonalizedBenchmarks {
  console.log('🧍 PROPORTION ANALYSIS: Generating personalized benchmarks');
  
  // Calculate flexibility factor based on arm-torso ratio
  // Longer arms relative to torso typically allow for more rotation
  const flexibilityFactor = 
    proportions.confidence > 0.5 ? 
    mapRange(proportions.armTorsoRatio, 1.5, 2.5, 0.8, 1.2) : 
    1.0;
  
  // Calculate build factor based on shoulder-hip ratio
  // Broader shoulders relative to hips typically allow for more powerful rotation
  const buildFactor = 
    proportions.confidence > 0.5 ? 
    mapRange(proportions.shoulderHipRatio, 1.0, 1.5, 0.9, 1.1) : 
    1.0;
  
  // Calculate height factor based on leg-height ratio
  // Longer legs relative to height typically require adjustment to swing plane
  const heightFactor = 
    proportions.confidence > 0.5 ? 
    mapRange(proportions.legHeightRatio, 0.4, 0.6, 0.9, 1.1) : 
    1.0;
  
  // Apply factors to standard benchmarks
  const shoulderTurnMax = STANDARD_BENCHMARKS.shoulderTurnMax * flexibilityFactor * buildFactor;
  const hipTurnMax = STANDARD_BENCHMARKS.hipTurnMax * flexibilityFactor;
  const swingPlaneAngle = STANDARD_BENCHMARKS.swingPlaneAngle * heightFactor;
  const spineAngleSetup = STANDARD_BENCHMARKS.spineAngleSetup * heightFactor;
  const wristAngleMax = STANDARD_BENCHMARKS.wristAngleMax;
  const expectedTempo = STANDARD_BENCHMARKS.expectedTempo * 
    (flexibilityFactor > 1 ? 0.95 : 1.05); // More flexible golfers can have faster tempo
  
  // Calculate overall flexibility score
  const flexibility = STANDARD_BENCHMARKS.flexibility * flexibilityFactor;
  
  const benchmarks: PersonalizedBenchmarks = {
    shoulderTurnMax: Math.round(shoulderTurnMax),
    hipTurnMax: Math.round(hipTurnMax),
    swingPlaneAngle: Math.round(swingPlaneAngle),
    spineAngleSetup: Math.round(spineAngleSetup),
    wristAngleMax: Math.round(wristAngleMax),
    expectedTempo: Number(expectedTempo.toFixed(1)),
    flexibility: Math.round(flexibility)
  };
  
  console.log('🧍 PROPORTION ANALYSIS: Personalized benchmarks generated:', benchmarks);
  
  return benchmarks;
}

/**
 * Apply personalized benchmarks to swing metrics
 * 
 * @param metrics Original metrics to adjust
 * @param benchmarks Personalized benchmarks based on body proportions
 * @returns Adjusted metrics
 */
export function adjustMetricsForBodyProportions(
  metrics: any, 
  benchmarks: PersonalizedBenchmarks
): any {
  console.log('🧍 PROPORTION ANALYSIS: Adjusting metrics for body proportions');
  
  // Make a deep copy of the metrics to avoid modifying the original
  const adjustedMetrics = JSON.parse(JSON.stringify(metrics));
  
  // Adjust rotation metrics based on personalized shoulder and hip turn maximums
  if (adjustedMetrics.rotation) {
    const shoulderAdjustmentFactor = benchmarks.shoulderTurnMax / STANDARD_BENCHMARKS.shoulderTurnMax;
    const hipAdjustmentFactor = benchmarks.hipTurnMax / STANDARD_BENCHMARKS.hipTurnMax;
    
    // Adjust rotation scores based on personal ability
    if (adjustedMetrics.rotation.shoulderTurn) {
      adjustedMetrics.rotation.score = adjustScoreForPersonalBenchmark(
        adjustedMetrics.rotation.score,
        adjustedMetrics.rotation.shoulderTurn,
        benchmarks.shoulderTurnMax,
        STANDARD_BENCHMARKS.shoulderTurnMax
      );
    }
  }
  
  // Adjust swing plane metrics based on personalized swing plane angle
  if (adjustedMetrics.swingPlane) {
    const planeAdjustmentFactor = benchmarks.swingPlaneAngle / STANDARD_BENCHMARKS.swingPlaneAngle;
    
    if (adjustedMetrics.swingPlane.shaftAngle) {
      adjustedMetrics.swingPlane.score = adjustScoreForPersonalBenchmark(
        adjustedMetrics.swingPlane.score,
        adjustedMetrics.swingPlane.shaftAngle,
        benchmarks.swingPlaneAngle,
        STANDARD_BENCHMARKS.swingPlaneAngle
      );
    }
  }
  
  // Adjust body alignment metrics based on personalized spine angle
  if (adjustedMetrics.bodyAlignment) {
    const spineAdjustmentFactor = benchmarks.spineAngleSetup / STANDARD_BENCHMARKS.spineAngleSetup;
    
    if (adjustedMetrics.bodyAlignment.spineAngle) {
      adjustedMetrics.bodyAlignment.score = adjustScoreForPersonalBenchmark(
        adjustedMetrics.bodyAlignment.score,
        adjustedMetrics.bodyAlignment.spineAngle,
        benchmarks.spineAngleSetup,
        STANDARD_BENCHMARKS.spineAngleSetup
      );
    }
  }
  
  // Adjust tempo metrics based on personalized tempo expectations
  if (adjustedMetrics.tempo) {
    const tempoAdjustmentFactor = benchmarks.expectedTempo / STANDARD_BENCHMARKS.expectedTempo;
    
    if (adjustedMetrics.tempo.tempoRatio) {
      adjustedMetrics.tempo.score = adjustScoreForPersonalBenchmark(
        adjustedMetrics.tempo.score,
        adjustedMetrics.tempo.tempoRatio,
        benchmarks.expectedTempo,
        STANDARD_BENCHMARKS.expectedTempo
      );
    }
  }
  
  // Recalculate overall score based on adjusted category scores
  if (adjustedMetrics.overallScore !== undefined) {
    let totalScore = 0;
    let categoryCount = 0;
    
    ['tempo', 'rotation', 'swingPlane', 'bodyAlignment'].forEach(category => {
      if (adjustedMetrics[category] && adjustedMetrics[category].score !== undefined) {
        totalScore += adjustedMetrics[category].score;
        categoryCount++;
      }
    });
    
    if (categoryCount > 0) {
      adjustedMetrics.overallScore = Math.round(totalScore / categoryCount);
      
      // Update letter grade if present
      if (adjustedMetrics.letterGrade !== undefined) {
        adjustedMetrics.letterGrade = calculateLetterGrade(adjustedMetrics.overallScore);
      }
    }
  }
  
  console.log('🧍 PROPORTION ANALYSIS: Metrics adjusted for body proportions');
  
  return adjustedMetrics;
}

// Helper functions

/**
 * Calculate Euclidean distance between two landmarks
 */
function calculateDistance(p1: PoseLandmark, p2: PoseLandmark): number {
  return Math.sqrt(
    Math.pow((p1.x - p2.x), 2) + 
    Math.pow((p1.y - p2.y), 2)
  );
}

/**
 * Map a value from one range to another
 */
function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  // Clamp input value to input range
  const clampedValue = Math.max(inMin, Math.min(inMax, value));
  
  // Map to output range
  return outMin + (clampedValue - inMin) * (outMax - outMin) / (inMax - inMin);
}

/**
 * Get default proportions when measurements aren't possible
 */
function getDefaultProportions(): BodyProportions {
  return {
    height: 1,
    armLength: 0.4,
    shoulderWidth: 0.2,
    legLength: 0.5,
    torsoLength: 0.3,
    armTorsoRatio: 1.33,
    shoulderHipRatio: 1.2,
    legHeightRatio: 0.5,
    confidence: 0
  };
}

/**
 * Adjust a score based on personal benchmarks
 */
function adjustScoreForPersonalBenchmark(
  originalScore: number, 
  actualValue: number, 
  personalBenchmark: number, 
  standardBenchmark: number
): number {
  // Calculate how far the actual value is from the personal benchmark
  const personalDeviation = Math.abs(actualValue - personalBenchmark);
  
  // Calculate how far the actual value is from the standard benchmark
  const standardDeviation = Math.abs(actualValue - standardBenchmark);
  
  // If the personal benchmark is more favorable, increase the score
  if (personalDeviation < standardDeviation) {
    const improvement = (standardDeviation - personalDeviation) / standardDeviation;
    return Math.min(100, Math.round(originalScore * (1 + improvement * 0.2)));
  }
  
  // If the standard benchmark is more favorable, keep the original score
  return originalScore;
}

/**
 * Calculate letter grade from numeric score
 */
function calculateLetterGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}
