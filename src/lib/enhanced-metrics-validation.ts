/**
 * Enhanced Metrics Validation System
 * 
 * Ensures all swing metrics accurately reflect what's happening in the video
 * Validates pose data quality, metric calculations, and physical possibility
 */

import { PoseResult } from './mediapipe';
import { SwingPhase } from './swing-phases';
import { SwingTrajectory } from './mediapipe';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface MetricsValidation {
  poseDataQuality: ValidationResult;
  calculationAccuracy: ValidationResult;
  physicalPossibility: ValidationResult;
  videoConsistency: ValidationResult;
  overall: ValidationResult;
}

/**
 * Comprehensive validation of swing metrics against video content
 */
export function validateSwingMetricsAccuracy(
  poses: PoseResult[],
  metrics: any,
  phases: SwingPhase[],
  trajectory: SwingTrajectory,
  videoElement?: HTMLVideoElement
): MetricsValidation {
  console.log('🔍 ENHANCED VALIDATION: Starting comprehensive metrics validation...');
  
  const poseDataQuality = validatePoseDataQuality(poses);
  const calculationAccuracy = validateCalculationAccuracy(metrics, poses, phases);
  const physicalPossibility = validatePhysicalPossibility(metrics);
  const videoConsistency = validateVideoConsistency(poses, metrics, videoElement);
  
  // Calculate overall validation
  const overall = calculateOverallValidation({
    poseDataQuality,
    calculationAccuracy,
    physicalPossibility,
    videoConsistency
  });
  
  return {
    poseDataQuality,
    calculationAccuracy,
    physicalPossibility,
    videoConsistency,
    overall
  };
}

/**
 * Validate pose data quality and consistency
 */
function validatePoseDataQuality(poses: PoseResult[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Check minimum frame count
  if (poses.length < 15) {
    errors.push(`Insufficient frames: ${poses.length}/15 minimum required for accurate analysis`);
  }
  
  // Check pose data completeness
  let validPoses = 0;
  let totalLandmarks = 0;
  let visibleLandmarks = 0;
  
  poses.forEach((pose, index) => {
    if (pose?.landmarks && pose.landmarks.length >= 33) {
      validPoses++;
      
      // Count visible landmarks
      const visible = pose.landmarks.filter(lm => lm.visibility && lm.visibility > 0.5).length;
      totalLandmarks += pose.landmarks.length;
      visibleLandmarks += visible;
    }
  });
  
  const validPoseRatio = validPoses / poses.length;
  const visibilityRatio = totalLandmarks > 0 ? visibleLandmarks / totalLandmarks : 0;
  
  if (validPoseRatio < 0.8) {
    errors.push(`Poor pose detection quality: ${validPoses}/${poses.length} valid poses (need 80%+)`);
  }
  
  if (visibilityRatio < 0.4) {
    warnings.push(`Low landmark visibility: ${(visibilityRatio * 100).toFixed(1)}% (need 40%+)`);
    recommendations.push('Improve lighting and camera angle for better pose detection');
  }
  
  // Check for sufficient movement (not just static poses)
  if (poses.length >= 5) {
    const movement = calculateMovementRange(poses);
    if (movement < 0.1) {
      errors.push('Insufficient movement detected - please ensure you are performing a full golf swing');
    } else if (movement < 0.2) {
      warnings.push('Limited movement detected - consider a more complete swing');
    }
  }
  
  // Check for pose consistency
  const consistency = calculatePoseConsistency(poses);
  if (consistency < 0.6) {
    warnings.push('Inconsistent pose detection - some frames may be unreliable');
    recommendations.push('Ensure stable camera position and good lighting');
  }
  
  const confidence = Math.min(1.0, (validPoseRatio * 0.4 + visibilityRatio * 0.3 + consistency * 0.3));
  
  return {
    isValid: errors.length === 0,
    confidence,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Validate calculation accuracy based on pose data
 */
function validateCalculationAccuracy(metrics: any, poses: PoseResult[], phases: SwingPhase[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Validate tempo calculation
  if (metrics.tempo) {
    const tempoValidation = validateTempoCalculation(metrics.tempo, phases);
    if (!tempoValidation.isValid) {
      errors.push(...tempoValidation.errors);
    }
    if (tempoValidation.warnings.length > 0) {
      warnings.push(...tempoValidation.warnings);
    }
  }
  
  // Validate rotation calculation
  if (metrics.rotation) {
    const rotationValidation = validateRotationCalculation(metrics.rotation, poses);
    if (!rotationValidation.isValid) {
      errors.push(...rotationValidation.errors);
    }
    if (rotationValidation.warnings.length > 0) {
      warnings.push(...rotationValidation.warnings);
    }
  }
  
  // Validate weight transfer calculation
  if (metrics.weightTransfer) {
    const weightValidation = validateWeightTransferCalculation(metrics.weightTransfer, poses);
    if (!weightValidation.isValid) {
      errors.push(...weightValidation.errors);
    }
    if (weightValidation.warnings.length > 0) {
      warnings.push(...weightValidation.warnings);
    }
  }
  
  // Validate swing plane calculation
  if (metrics.swingPlane) {
    const planeValidation = validateSwingPlaneCalculation(metrics.swingPlane, poses);
    if (!planeValidation.isValid) {
      errors.push(...planeValidation.errors);
    }
    if (planeValidation.warnings.length > 0) {
      warnings.push(...planeValidation.warnings);
    }
  }
  
  const confidence = errors.length === 0 ? 0.9 : errors.length <= 2 ? 0.7 : 0.5;
  
  return {
    isValid: errors.length === 0,
    confidence,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Validate physical possibility of metrics
 */
function validatePhysicalPossibility(metrics: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Validate tempo ratio
  if (metrics.tempo?.tempoRatio) {
    const ratio = metrics.tempo.tempoRatio;
    if (ratio < 1.0 || ratio > 10.0) {
      errors.push(`Impossible tempo ratio: ${ratio.toFixed(2)} (should be 1.0-10.0)`);
    } else if (ratio < 1.5 || ratio > 5.0) {
      warnings.push(`Unusual tempo ratio: ${ratio.toFixed(2)} (typical range: 2.0-4.0)`);
    }
  }
  
  // Validate rotation angles
  if (metrics.rotation?.shoulderTurn) {
    const shoulderTurn = metrics.rotation.shoulderTurn;
    if (shoulderTurn < 0 || shoulderTurn > 180) {
      errors.push(`Invalid shoulder turn: ${shoulderTurn}° (should be 0-180°)`);
    } else if (shoulderTurn > 120) {
      warnings.push(`Extreme shoulder turn: ${shoulderTurn}° (typical range: 60-100°)`);
    }
  }
  
  if (metrics.rotation?.hipTurn) {
    const hipTurn = metrics.rotation.hipTurn;
    if (hipTurn < 0 || hipTurn > 90) {
      errors.push(`Invalid hip turn: ${hipTurn}° (should be 0-90°)`);
    } else if (hipTurn > 70) {
      warnings.push(`Extreme hip turn: ${hipTurn}° (typical range: 30-60°)`);
    }
  }
  
  // Validate weight transfer percentages
  if (metrics.weightTransfer) {
    const backswing = metrics.weightTransfer.backswing;
    const impact = metrics.weightTransfer.impact;
    const finish = metrics.weightTransfer.finish;
    
    if (backswing && (backswing < 0 || backswing > 100)) {
      errors.push(`Invalid backswing weight: ${backswing}% (should be 0-100%)`);
    }
    if (impact && (impact < 0 || impact > 100)) {
      errors.push(`Invalid impact weight: ${impact}% (should be 0-100%)`);
    }
    if (finish && (finish < 0 || finish > 100)) {
      errors.push(`Invalid finish weight: ${finish}% (should be 0-100%)`);
    }
  }
  
  // Validate swing plane angle
  if (metrics.swingPlane?.shaftAngle) {
    const shaftAngle = metrics.swingPlane.shaftAngle;
    if (shaftAngle < 0 || shaftAngle > 90) {
      errors.push(`Invalid shaft angle: ${shaftAngle}° (should be 0-90°)`);
    }
  }
  
  const confidence = errors.length === 0 ? 0.95 : errors.length <= 1 ? 0.8 : 0.6;
  
  return {
    isValid: errors.length === 0,
    confidence,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Validate video consistency
 */
function validateVideoConsistency(poses: PoseResult[], metrics: any, videoElement?: HTMLVideoElement): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Check if metrics align with video duration
  if (videoElement && videoElement.duration) {
    const videoDuration = videoElement.duration;
    const expectedFrames = Math.floor(videoDuration * 30); // Assuming 30fps
    
    if (poses.length < expectedFrames * 0.5) {
      warnings.push(`Low frame count: ${poses.length} frames for ${videoDuration.toFixed(1)}s video`);
      recommendations.push('Consider recording at higher frame rate or longer duration');
    }
  }
  
  // Check for temporal consistency in pose data
  const temporalConsistency = calculateTemporalConsistency(poses);
  if (temporalConsistency < 0.7) {
    warnings.push('Temporal inconsistency detected in pose data');
    recommendations.push('Ensure stable recording conditions and consistent lighting');
  }
  
  // Validate that metrics make sense for the swing type
  const swingTypeValidation = validateSwingTypeConsistency(metrics);
  if (!swingTypeValidation.isValid) {
    warnings.push(...swingTypeValidation.warnings);
  }
  
  const confidence = temporalConsistency * 0.7 + (swingTypeValidation.isValid ? 0.3 : 0.1);
  
  return {
    isValid: errors.length === 0,
    confidence,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Calculate overall validation score
 */
function calculateOverallValidation(validations: {
  poseDataQuality: ValidationResult;
  calculationAccuracy: ValidationResult;
  physicalPossibility: ValidationResult;
  videoConsistency: ValidationResult;
}): ValidationResult {
  const allErrors = [
    ...validations.poseDataQuality.errors,
    ...validations.calculationAccuracy.errors,
    ...validations.physicalPossibility.errors,
    ...validations.videoConsistency.errors
  ];
  
  const allWarnings = [
    ...validations.poseDataQuality.warnings,
    ...validations.calculationAccuracy.warnings,
    ...validations.physicalPossibility.warnings,
    ...validations.videoConsistency.warnings
  ];
  
  const allRecommendations = [
    ...validations.poseDataQuality.recommendations,
    ...validations.calculationAccuracy.recommendations,
    ...validations.physicalPossibility.recommendations,
    ...validations.videoConsistency.recommendations
  ];
  
  const confidence = (
    validations.poseDataQuality.confidence * 0.3 +
    validations.calculationAccuracy.confidence * 0.3 +
    validations.physicalPossibility.confidence * 0.2 +
    validations.videoConsistency.confidence * 0.2
  );
  
  return {
    isValid: allErrors.length === 0,
    confidence,
    errors: allErrors,
    warnings: allWarnings,
    recommendations: allRecommendations
  };
}

// Helper functions for specific validations

function calculateMovementRange(poses: PoseResult[]): number {
  if (poses.length < 2) return 0;
  
  const firstPose = poses[0];
  const lastPose = poses[poses.length - 1];
  
  if (!firstPose?.landmarks || !lastPose?.landmarks) return 0;
  
  let maxMovement = 0;
  for (let i = 0; i < Math.min(firstPose.landmarks.length, lastPose.landmarks.length); i++) {
    const start = firstPose.landmarks[i];
    const end = lastPose.landmarks[i];
    
    if (start && end && start.visibility && end.visibility && start.visibility > 0.5 && end.visibility > 0.5) {
      const movement = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      maxMovement = Math.max(maxMovement, movement);
    }
  }
  
  return maxMovement;
}

function calculatePoseConsistency(poses: PoseResult[]): number {
  if (poses.length < 3) return 1.0;
  
  let consistentFrames = 0;
  for (let i = 1; i < poses.length - 1; i++) {
    const prev = poses[i - 1];
    const current = poses[i];
    const next = poses[i + 1];
    
    if (prev?.landmarks && current?.landmarks && next?.landmarks) {
      const consistency = calculateFrameConsistency(prev, current, next);
      if (consistency > 0.7) {
        consistentFrames++;
      }
    }
  }
  
  return consistentFrames / (poses.length - 2);
}

function calculateFrameConsistency(prev: PoseResult, current: PoseResult, next: PoseResult): number {
  let consistentLandmarks = 0;
  let totalLandmarks = 0;
  
  for (let i = 0; i < Math.min(prev.landmarks.length, current.landmarks.length, next.landmarks.length); i++) {
    const p = prev.landmarks[i];
    const c = current.landmarks[i];
    const n = next.landmarks[i];
    
    if (p && c && n && p.visibility && c.visibility && n.visibility && 
        p.visibility > 0.5 && c.visibility > 0.5 && n.visibility > 0.5) {
      
      totalLandmarks++;
      
      // Check if current frame is between prev and next (reasonable movement)
      const prevToCurrent = Math.sqrt(Math.pow(c.x - p.x, 2) + Math.pow(c.y - p.y, 2));
      const currentToNext = Math.sqrt(Math.pow(n.x - c.x, 2) + Math.pow(n.y - c.y, 2));
      const prevToNext = Math.sqrt(Math.pow(n.x - p.x, 2) + Math.pow(n.y - p.y, 2));
      
      // If current is roughly between prev and next, it's consistent
      if (Math.abs(prevToCurrent + currentToNext - prevToNext) < 0.1) {
        consistentLandmarks++;
      }
    }
  }
  
  return totalLandmarks > 0 ? consistentLandmarks / totalLandmarks : 0;
}

function calculateTemporalConsistency(poses: PoseResult[]): number {
  if (poses.length < 3) return 1.0;
  
  let consistentTransitions = 0;
  for (let i = 1; i < poses.length; i++) {
    const prev = poses[i - 1];
    const current = poses[i];
    
    if (prev?.landmarks && current?.landmarks) {
      const transitionConsistency = calculateTransitionConsistency(prev, current);
      if (transitionConsistency > 0.6) {
        consistentTransitions++;
      }
    }
  }
  
  return consistentTransitions / (poses.length - 1);
}

function calculateTransitionConsistency(prev: PoseResult, current: PoseResult): number {
  let consistentLandmarks = 0;
  let totalLandmarks = 0;
  
  for (let i = 0; i < Math.min(prev.landmarks.length, current.landmarks.length); i++) {
    const p = prev.landmarks[i];
    const c = current.landmarks[i];
    
    if (p && c && p.visibility && c.visibility && p.visibility > 0.5 && c.visibility > 0.5) {
      totalLandmarks++;
      
      // Check if movement is reasonable (not too sudden)
      const movement = Math.sqrt(Math.pow(c.x - p.x, 2) + Math.pow(c.y - p.y, 2));
      if (movement < 0.3) { // Reasonable movement threshold
        consistentLandmarks++;
      }
    }
  }
  
  return totalLandmarks > 0 ? consistentLandmarks / totalLandmarks : 0;
}

// Specific validation functions for different metrics

function validateTempoCalculation(tempo: any, phases: SwingPhase[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (tempo.tempoRatio && (tempo.tempoRatio < 1.0 || tempo.tempoRatio > 10.0)) {
    errors.push(`Invalid tempo ratio: ${tempo.tempoRatio} (should be 1.0-10.0)`);
  }
  
  if (tempo.backswingTime && (tempo.backswingTime < 0.1 || tempo.backswingTime > 3.0)) {
    warnings.push(`Unusual backswing time: ${tempo.backswingTime}s (typical: 0.5-1.5s)`);
  }
  
  if (tempo.downswingTime && (tempo.downswingTime < 0.05 || tempo.downswingTime > 1.0)) {
    warnings.push(`Unusual downswing time: ${tempo.downswingTime}s (typical: 0.2-0.5s)`);
  }
  
  return {
    isValid: errors.length === 0,
    confidence: errors.length === 0 ? 0.9 : 0.6,
    errors,
    warnings,
    recommendations: []
  };
}

function validateRotationCalculation(rotation: any, poses: PoseResult[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (rotation.shoulderTurn && (rotation.shoulderTurn < 0 || rotation.shoulderTurn > 180)) {
    errors.push(`Invalid shoulder turn: ${rotation.shoulderTurn}° (should be 0-180°)`);
  }
  
  if (rotation.hipTurn && (rotation.hipTurn < 0 || rotation.hipTurn > 90)) {
    errors.push(`Invalid hip turn: ${rotation.hipTurn}° (should be 0-90°)`);
  }
  
  if (rotation.xFactor && (rotation.xFactor < 0 || rotation.xFactor > 90)) {
    errors.push(`Invalid X-Factor: ${rotation.xFactor}° (should be 0-90°)`);
  }
  
  return {
    isValid: errors.length === 0,
    confidence: errors.length === 0 ? 0.9 : 0.6,
    errors,
    warnings,
    recommendations: []
  };
}

function validateWeightTransferCalculation(weightTransfer: any, poses: PoseResult[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const fields = ['backswing', 'impact', 'finish'];
  fields.forEach(field => {
    if (weightTransfer[field] !== undefined) {
      const value = weightTransfer[field];
      if (value < 0 || value > 100) {
        errors.push(`Invalid ${field} weight: ${value}% (should be 0-100%)`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    confidence: errors.length === 0 ? 0.9 : 0.6,
    errors,
    warnings,
    recommendations: []
  };
}

function validateSwingPlaneCalculation(swingPlane: any, poses: PoseResult[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (swingPlane.shaftAngle && (swingPlane.shaftAngle < 0 || swingPlane.shaftAngle > 90)) {
    errors.push(`Invalid shaft angle: ${swingPlane.shaftAngle}° (should be 0-90°)`);
  }
  
  if (swingPlane.planeDeviation && (swingPlane.planeDeviation < 0 || swingPlane.planeDeviation > 45)) {
    warnings.push(`High plane deviation: ${swingPlane.planeDeviation}° (typical: 0-10°)`);
  }
  
  return {
    isValid: errors.length === 0,
    confidence: errors.length === 0 ? 0.9 : 0.6,
    errors,
    warnings,
    recommendations: []
  };
}

function validateSwingTypeConsistency(metrics: any): ValidationResult {
  const warnings: string[] = [];
  
  // Check for consistency between different metrics
  if (metrics.tempo && metrics.rotation) {
    const tempoRatio = metrics.tempo.tempoRatio;
    const shoulderTurn = metrics.rotation.shoulderTurn;
    
    // Fast tempo with high shoulder turn might be inconsistent
    if (tempoRatio < 2.0 && shoulderTurn > 100) {
      warnings.push('Fast tempo with extreme shoulder turn may indicate measurement error');
    }
  }
  
  if (metrics.weightTransfer && metrics.rotation) {
    const weightTransfer = metrics.weightTransfer.impact;
    const hipTurn = metrics.rotation.hipTurn;
    
    // High weight transfer with low hip turn might be inconsistent
    if (weightTransfer > 90 && hipTurn < 30) {
      warnings.push('High weight transfer with low hip turn may indicate measurement error');
    }
  }
  
  return {
    isValid: warnings.length === 0,
    confidence: warnings.length === 0 ? 0.9 : 0.7,
    errors: [],
    warnings,
    recommendations: []
  };
}
