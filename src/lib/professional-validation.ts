import { PoseResult } from './mediapipe';
import { SwingPhaseAnalysis } from './professional-phase-detection';
import { ProfessionalSwingMetrics } from './professional-swing-metrics';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}

export function validateAnalysisResults(
  poses: PoseResult[],
  metrics: ProfessionalSwingMetrics,
  phaseAnalysis: SwingPhaseAnalysis
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for sufficient data
  if (poses.length < 30) {
    errors.push("Insufficient frames for accurate analysis. Need at least 30 frames.");
  }
  
  if (poses.length < 60) {
    warnings.push("Analysis would be more accurate with more frames (60+ recommended).");
  }
  
  // Validate phase analysis
  validatePhaseAnalysis(phaseAnalysis, errors, warnings);
  
  // Validate metrics for physical possibility
  validatePhysicalPossibility(metrics, errors, warnings);
  
  // Validate data quality
  validateDataQuality(poses, errors, warnings);
  
  // Validate consistency
  validateConsistency(metrics, phaseAnalysis, errors, warnings);
  
  // Calculate overall confidence
  const confidence = calculateValidationConfidence(poses, metrics, phaseAnalysis, errors, warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidence
  };
}

function validatePhaseAnalysis(phaseAnalysis: SwingPhaseAnalysis, errors: string[], warnings: string[]) {
  // Check phase order
  const phases = ['address', 'approach', 'backswing', 'top', 'downswing', 'impact', 'followThrough'];
  
  for (let i = 1; i < phases.length; i++) {
    const currentPhase = phaseAnalysis[phases[i] as keyof SwingPhaseAnalysis] as any;
    const prevPhase = phaseAnalysis[phases[i - 1] as keyof SwingPhaseAnalysis] as any;
    
    if (currentPhase && prevPhase) {
      if (currentPhase.start <= prevPhase.start) {
        errors.push(`Phase ${phases[i]} starts before ${phases[i - 1]}. Invalid phase order.`);
      }
      
      if (currentPhase.end <= currentPhase.start) {
        errors.push(`Phase ${phases[i]} has invalid duration (end <= start).`);
      }
    }
  }
  
  // Check total duration
  if (phaseAnalysis.totalDuration <= 0) {
    errors.push("Invalid total swing duration.");
  }
  
  if (phaseAnalysis.totalDuration < 0.5) {
    warnings.push("Swing duration is very short. Check if video contains complete swing.");
  }
  
  if (phaseAnalysis.totalDuration > 5.0) {
    warnings.push("Swing duration is very long. Check if video contains multiple swings.");
  }
  
  // Check confidence levels
  if (phaseAnalysis.overallConfidence < 0.3) {
    errors.push("Phase detection confidence too low for reliable analysis.");
  }
  
  if (phaseAnalysis.overallConfidence < 0.6) {
    warnings.push("Phase detection confidence is low. Results may be less accurate.");
  }
  
  // Check individual phase confidences
  phases.forEach(phase => {
    const phaseData = phaseAnalysis[phase as keyof SwingPhaseAnalysis] as any;
    if (phaseData && phaseData.confidence < 0.2) {
      warnings.push(`Phase ${phase} has very low confidence (${(phaseData.confidence * 100).toFixed(0)}%).`);
    }
  });
}

function validatePhysicalPossibility(metrics: ProfessionalSwingMetrics, errors: string[], warnings: string[]) {
  // Validate tempo ratio
  if (metrics.tempoRatio < 1.0 || metrics.tempoRatio > 5.0) {
    errors.push(`Impossible tempo ratio: ${metrics.tempoRatio.toFixed(2)}. Should be between 1.0 and 5.0.`);
  }
  
  if (metrics.tempoRatio < 1.5 || metrics.tempoRatio > 4.0) {
    warnings.push(`Unusual tempo ratio: ${metrics.tempoRatio.toFixed(2)}. Most golfers are between 2.5-3.5.`);
  }
  
  // Validate rotation angles
  if (metrics.shoulderTurn < 0 || metrics.shoulderTurn > 180) {
    errors.push(`Impossible shoulder turn: ${metrics.shoulderTurn.toFixed(0)}°. Should be between 0-180°.`);
  }
  
  if (metrics.hipTurn < 0 || metrics.hipTurn > 180) {
    errors.push(`Impossible hip turn: ${metrics.hipTurn.toFixed(0)}°. Should be between 0-180°.`);
  }
  
  if (metrics.xFactor < -20 || metrics.xFactor > 80) {
    errors.push(`Impossible X-Factor: ${metrics.xFactor.toFixed(0)}°. Should be between -20° and 80°.`);
  }
  
  // Validate weight transfer
  if (metrics.weightTransfer < 0 || metrics.weightTransfer > 100) {
    errors.push(`Impossible weight transfer: ${metrics.weightTransfer.toFixed(0)}%. Should be between 0-100%.`);
  }
  
  if (metrics.weightTransfer < 30) {
    warnings.push(`Very low weight transfer: ${metrics.weightTransfer.toFixed(0)}%. Most golfers transfer 60-90%.`);
  }
  
  // Validate swing plane
  if (metrics.swingPlane < 0 || metrics.swingPlane > 90) {
    errors.push(`Impossible swing plane: ${metrics.swingPlane.toFixed(0)}°. Should be between 0-90°.`);
  }
  
  // Validate impact velocity
  if (metrics.impactVelocity < 0) {
    errors.push(`Impossible impact velocity: ${metrics.impactVelocity.toFixed(0)}. Should be positive.`);
  }
  
  if (metrics.impactVelocity > 1000) {
    warnings.push(`Very high impact velocity: ${metrics.impactVelocity.toFixed(0)}. Check if measurement is correct.`);
  }
  
  // Validate scores
  if (metrics.overallScore < 0 || metrics.overallScore > 100) {
    errors.push(`Invalid overall score: ${metrics.overallScore.toFixed(0)}. Should be between 0-100.`);
  }
  
  if (metrics.confidence < 0 || metrics.confidence > 1) {
    errors.push(`Invalid confidence: ${metrics.confidence.toFixed(2)}. Should be between 0-1.`);
  }
}

function validateDataQuality(poses: PoseResult[], errors: string[], warnings: string[]) {
  if (poses.length === 0) {
    errors.push("No pose data available for analysis.");
    return;
  }
  
  // Check pose quality
  let totalPoseScore = 0;
  let validPoses = 0;
  
  poses.forEach(pose => {
    const keypoints = pose.pose?.keypoints || [];
    if (keypoints.length > 0) {
      const avgScore = keypoints.reduce((sum, kp) => sum + kp.score, 0) / keypoints.length;
      totalPoseScore += avgScore;
      validPoses++;
    }
  });
  
  const avgPoseScore = validPoses > 0 ? totalPoseScore / validPoses : 0;
  
  if (avgPoseScore < 0.3) {
    errors.push("Pose detection quality too low for accurate analysis.");
  }
  
  if (avgPoseScore < 0.6) {
    warnings.push("Pose detection quality is low. Results may be less accurate.");
  }
  
  // Check for missing keypoints
  const requiredKeypoints = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_wrist', 'right_wrist'];
  let missingKeypoints = 0;
  
  poses.forEach(pose => {
    const keypoints = pose.pose?.keypoints || [];
    requiredKeypoints.forEach(keypointName => {
      const keypoint = keypoints.find(kp => kp.name === keypointName);
      if (!keypoint || keypoint.score < 0.5) {
        missingKeypoints++;
      }
    });
  });
  
  const missingPercentage = (missingKeypoints / (poses.length * requiredKeypoints.length)) * 100;
  
  if (missingPercentage > 50) {
    errors.push("Too many missing keypoints for accurate analysis.");
  }
  
  if (missingPercentage > 25) {
    warnings.push("Many keypoints are missing. Analysis accuracy may be reduced.");
  }
}

function validateConsistency(metrics: ProfessionalSwingMetrics, phaseAnalysis: SwingPhaseAnalysis, errors: string[], warnings: string[]) {
  // Check tempo consistency
  const backswingTime = phaseAnalysis.backswing.duration;
  const downswingTime = phaseAnalysis.downswing.duration;
  const calculatedTempoRatio = downswingTime > 0 ? backswingTime / downswingTime : 0;
  
  if (Math.abs(calculatedTempoRatio - metrics.tempoRatio) > 0.1) {
    warnings.push("Tempo ratio calculated from phases doesn't match metrics calculation.");
  }
  
  // Check timing consistency
  if (Math.abs(backswingTime - metrics.backswingTime) > 0.05) {
    warnings.push("Backswing time from phases doesn't match metrics calculation.");
  }
  
  if (Math.abs(downswingTime - metrics.downswingTime) > 0.05) {
    warnings.push("Downswing time from phases doesn't match metrics calculation.");
  }
  
  // Check overall score consistency
  if (metrics.overallScore > 0 && metrics.confidence < 0.3) {
    warnings.push("High overall score with low confidence. Results may be unreliable.");
  }
  
  // Check for impossible combinations
  if (metrics.tempoRatio > 3.5 && metrics.backswingTime < 0.5) {
    warnings.push("Very high tempo ratio with short backswing. Check if measurements are correct.");
  }
  
  if (metrics.weightTransfer > 90 && metrics.xFactor < 20) {
    warnings.push("High weight transfer with low X-Factor. Unusual combination.");
  }
}

function calculateValidationConfidence(
  poses: PoseResult[],
  metrics: ProfessionalSwingMetrics,
  phaseAnalysis: SwingPhaseAnalysis,
  errors: string[],
  warnings: string[]
): number {
  let confidence = 1.0;
  
  // Reduce confidence for errors
  confidence -= errors.length * 0.2;
  
  // Reduce confidence for warnings
  confidence -= warnings.length * 0.05;
  
  // Adjust for data quality
  if (poses.length < 30) {
    confidence *= 0.5;
  } else if (poses.length < 60) {
    confidence *= 0.8;
  }
  
  // Adjust for phase detection confidence
  confidence *= phaseAnalysis.overallConfidence;
  
  // Adjust for metrics confidence
  confidence *= metrics.confidence;
  
  // Adjust for pose quality
  let totalPoseScore = 0;
  let validPoses = 0;
  
  poses.forEach(pose => {
    const keypoints = pose.pose?.keypoints || [];
    if (keypoints.length > 0) {
      const avgScore = keypoints.reduce((sum, kp) => sum + kp.score, 0) / keypoints.length;
      totalPoseScore += avgScore;
      validPoses++;
    }
  });
  
  const avgPoseScore = validPoses > 0 ? totalPoseScore / validPoses : 0;
  confidence *= avgPoseScore;
  
  return Math.max(0, Math.min(1, confidence));
}

export function validateProfessionalStandards(metrics: ProfessionalSwingMetrics): {
  meetsStandards: boolean;
  recommendations: string[];
  score: number;
} {
  const recommendations: string[] = [];
  let score = 0;
  let totalChecks = 0;
  
  // Tempo ratio check
  totalChecks++;
  if (metrics.tempoRatio >= 2.8 && metrics.tempoRatio <= 3.2) {
    score += 1;
  } else if (metrics.tempoRatio >= 2.5 && metrics.tempoRatio <= 3.5) {
    score += 0.7;
    recommendations.push("Work on tempo consistency. Ideal ratio is 3.0:1");
  } else {
    recommendations.push("Focus on tempo. Your ratio is outside the professional range.");
  }
  
  // Shoulder turn check
  totalChecks++;
  if (metrics.shoulderTurn >= 85 && metrics.shoulderTurn <= 95) {
    score += 1;
  } else if (metrics.shoulderTurn >= 80 && metrics.shoulderTurn <= 100) {
    score += 0.7;
    recommendations.push("Improve shoulder turn. Aim for 85-95 degrees.");
  } else {
    recommendations.push("Work on shoulder turn. You need more rotation.");
  }
  
  // Hip turn check
  totalChecks++;
  if (metrics.hipTurn >= 45 && metrics.hipTurn <= 55) {
    score += 1;
  } else if (metrics.hipTurn >= 40 && metrics.hipTurn <= 60) {
    score += 0.7;
    recommendations.push("Adjust hip turn. Ideal range is 45-55 degrees.");
  } else {
    recommendations.push("Work on hip turn. You need better hip rotation.");
  }
  
  // X-Factor check
  totalChecks++;
  if (metrics.xFactor >= 35 && metrics.xFactor <= 45) {
    score += 1;
  } else if (metrics.xFactor >= 30 && metrics.xFactor <= 50) {
    score += 0.7;
    recommendations.push("Improve X-Factor. Aim for 35-45 degrees separation.");
  } else {
    recommendations.push("Work on X-Factor. Create more separation between shoulders and hips.");
  }
  
  // Weight transfer check
  totalChecks++;
  if (metrics.weightTransfer >= 80 && metrics.weightTransfer <= 90) {
    score += 1;
  } else if (metrics.weightTransfer >= 70 && metrics.weightTransfer <= 95) {
    score += 0.7;
    recommendations.push("Improve weight transfer. Aim for 80-90% at impact.");
  } else {
    recommendations.push("Work on weight transfer. You need better weight shift.");
  }
  
  // Swing plane check
  totalChecks++;
  if (metrics.swingPlane >= 55 && metrics.swingPlane <= 65) {
    score += 1;
  } else if (metrics.swingPlane >= 50 && metrics.swingPlane <= 70) {
    score += 0.7;
    recommendations.push("Adjust swing plane. Ideal range is 55-65 degrees.");
  } else {
    recommendations.push("Work on swing plane. Your angle needs adjustment.");
  }
  
  const finalScore = totalChecks > 0 ? score / totalChecks : 0;
  
  return {
    meetsStandards: finalScore >= 0.8,
    recommendations,
    score: finalScore
  };
}







