/**
 * Dynamic Advice Generator
 * 
 * Generates varied, personalized, and context-aware golf swing advice
 * based on actual swing metrics and video analysis
 */

import { PoseResult } from './mediapipe';
import { SwingPhase } from './swing-phases';

export interface DynamicAdvice {
  overallAssessment: string;
  strengths: string[];
  improvements: string[];
  drills: string[];
  keyTip: string;
  professionalInsight: string;
  nextSteps: string[];
  confidence: number;
  personalizedFactors: string[];
  swingType: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface SwingContext {
  golferLevel: 'beginner' | 'intermediate' | 'advanced';
  swingType: 'full' | 'chip' | 'pitch' | 'putt';
  environment: 'indoor' | 'outdoor';
  equipment: 'driver' | 'iron' | 'wedge' | 'putter';
  previousSessions?: any[];
}

/**
 * Generate dynamic, personalized golf advice based on swing analysis
 */
export function generateDynamicAdvice(
  metrics: any,
  poses: PoseResult[],
  phases: SwingPhase[],
  context: SwingContext
): DynamicAdvice {
  console.log('🎯 DYNAMIC ADVICE: Generating personalized golf coaching advice...');
  
  // Analyze swing characteristics
  const swingCharacteristics = analyzeSwingCharacteristics(metrics, poses, phases);
  const swingType = determineSwingType(swingCharacteristics, context);
  const difficultyLevel = determineDifficultyLevel(swingCharacteristics, context);
  
  // Generate personalized advice based on analysis
  const advice = generatePersonalizedAdvice(metrics, swingCharacteristics, context, swingType, difficultyLevel);
  
  // Add dynamic elements based on swing patterns
  const dynamicElements = addDynamicElements(advice, swingCharacteristics, context);
  
  return {
    ...advice,
    ...dynamicElements,
    swingType,
    difficultyLevel,
    confidence: calculateAdviceConfidence(metrics, poses, swingCharacteristics)
  };
}

/**
 * Analyze swing characteristics from metrics and pose data
 */
function analyzeSwingCharacteristics(metrics: any, poses: PoseResult[], phases: SwingPhase[]): any {
  const characteristics = {
    tempo: {
      ratio: metrics.tempo?.tempoRatio || 3.0,
      backswingTime: metrics.tempo?.backswingTime || 0.8,
      downswingTime: metrics.tempo?.downswingTime || 0.25,
      consistency: calculateTempoConsistency(phases)
    },
    rotation: {
      shoulderTurn: metrics.rotation?.shoulderTurn || 90,
      hipTurn: metrics.rotation?.hipTurn || 45,
      xFactor: metrics.rotation?.xFactor || 40,
      flexibility: calculateFlexibilityScore(poses)
    },
    weightTransfer: {
      backswing: metrics.weightTransfer?.backswing || 85,
      impact: metrics.weightTransfer?.impact || 85,
      finish: metrics.weightTransfer?.finish || 95,
      sequence: calculateWeightTransferSequence(poses)
    },
    swingPlane: {
      shaftAngle: metrics.swingPlane?.shaftAngle || 60,
      planeDeviation: metrics.swingPlane?.planeDeviation || 2,
      consistency: calculateSwingPlaneConsistency(poses)
    },
    bodyAlignment: {
      spineAngle: metrics.bodyAlignment?.spineAngle || 40,
      headMovement: metrics.bodyAlignment?.headMovement || 2,
      kneeFlex: metrics.bodyAlignment?.kneeFlex || 25,
      stability: calculateBodyStability(poses)
    },
    power: calculatePowerMetrics(metrics, poses),
    balance: calculateBalanceMetrics(poses),
    timing: calculateTimingMetrics(phases),
    consistency: calculateOverallConsistency(metrics, poses)
  };
  
  return characteristics;
}

/**
 * Generate personalized advice based on swing analysis
 */
function generatePersonalizedAdvice(
  metrics: any,
  characteristics: any,
  context: SwingContext,
  swingType: string,
  difficultyLevel: string
): DynamicAdvice {
  const advice: DynamicAdvice = {
    overallAssessment: '',
    strengths: [],
    improvements: [],
    drills: [],
    keyTip: '',
    professionalInsight: '',
    nextSteps: [],
    confidence: 0,
    personalizedFactors: [],
    swingType: '',
    difficultyLevel: 'beginner'
  };
  
  // Generate overall assessment
  advice.overallAssessment = generateOverallAssessment(characteristics, context, swingType);
  
  // Generate strengths based on what's working well
  advice.strengths = generateStrengths(characteristics, context);
  
  // Generate improvements based on specific issues
  advice.improvements = generateImprovements(characteristics, context, difficultyLevel);
  
  // Generate specific drills
  advice.drills = generateDrills(characteristics, context, difficultyLevel);
  
  // Generate key tip
  advice.keyTip = generateKeyTip(characteristics, context);
  
  // Generate professional insight
  advice.professionalInsight = generateProfessionalInsight(characteristics, context, swingType);
  
  // Generate next steps
  advice.nextSteps = generateNextSteps(characteristics, context, difficultyLevel);
  
  // Add personalized factors
  advice.personalizedFactors = generatePersonalizedFactors(characteristics, context);
  
  return advice;
}

/**
 * Add dynamic elements to make advice more varied and engaging
 */
function addDynamicElements(
  advice: DynamicAdvice,
  characteristics: any,
  context: SwingContext
): Partial<DynamicAdvice> {
  const dynamicElements: Partial<DynamicAdvice> = {};
  
  // Add motivational elements based on performance
  if (characteristics.consistency > 0.8) {
    dynamicElements.strengths = [
      ...advice.strengths,
      "Your consistency is impressive - this is the foundation of great golf!"
    ];
  }
  
  // Add specific tips based on swing type
  if (context.swingType === 'full') {
    dynamicElements.keyTip = `${advice.keyTip} For full swings, focus on maintaining this tempo throughout your round.`;
  } else if (context.swingType === 'chip') {
    dynamicElements.keyTip = `${advice.keyTip} For chipping, this tempo will help you control distance and trajectory.`;
  }
  
  // Add equipment-specific advice
  if (context.equipment === 'driver') {
    dynamicElements.professionalInsight = `${advice.professionalInsight} With the driver, your current metrics suggest focusing on launch angle and ball speed.`;
  } else if (context.equipment === 'iron') {
    dynamicElements.professionalInsight = `${advice.professionalInsight} With irons, your current metrics suggest focusing on ball striking and trajectory control.`;
  }
  
  // Add environment-specific advice
  if (context.environment === 'indoor') {
    dynamicElements.nextSteps = [
      ...advice.nextSteps,
      "Practice these drills indoors, then take them to the course for real-world application"
    ];
  } else {
    dynamicElements.nextSteps = [
      ...advice.nextSteps,
      "Continue practicing these fundamentals on the course"
    ];
  }
  
  return dynamicElements;
}

// Helper functions for generating specific advice components

function generateOverallAssessment(characteristics: any, context: SwingContext, swingType: string): string {
  const consistency = characteristics.consistency;
  const power = characteristics.power;
  const balance = characteristics.balance;
  
  if (consistency > 0.8 && power > 0.7 && balance > 0.8) {
    return `Your ${swingType} swing shows excellent fundamentals with strong consistency, good power generation, and solid balance. You're demonstrating professional-level mechanics that will serve you well on the course.`;
  } else if (consistency > 0.6 && power > 0.5) {
    return `Your ${swingType} swing has good fundamentals with room for improvement in consistency and power. The foundation is solid - focus on the key areas identified to take your game to the next level.`;
  } else {
    return `Your ${swingType} swing shows potential with some areas needing attention. Focus on the fundamentals first - tempo, balance, and weight transfer - before working on advanced techniques.`;
  }
}

function generateStrengths(characteristics: any, context: SwingContext): string[] {
  const strengths: string[] = [];
  
  // Tempo strengths
  if (characteristics.tempo.ratio >= 2.8 && characteristics.tempo.ratio <= 3.2) {
    strengths.push(`Excellent tempo ratio of ${characteristics.tempo.ratio.toFixed(1)}:1 - your timing is spot-on`);
  } else if (characteristics.tempo.consistency > 0.8) {
    strengths.push(`Consistent tempo throughout your swing - this is the foundation of great golf`);
  }
  
  // Rotation strengths
  if (characteristics.rotation.shoulderTurn >= 85 && characteristics.rotation.shoulderTurn <= 95) {
    strengths.push(`Outstanding shoulder turn of ${characteristics.rotation.shoulderTurn}° - you're getting great coil`);
  }
  if (characteristics.rotation.xFactor >= 35 && characteristics.rotation.xFactor <= 45) {
    strengths.push(`Excellent X-Factor of ${characteristics.rotation.xFactor}° - your shoulder-hip separation is in the professional range`);
  }
  
  // Weight transfer strengths
  if (characteristics.weightTransfer.impact >= 80) {
    strengths.push(`Strong weight transfer at impact - ${characteristics.weightTransfer.impact}% on your lead foot shows good sequencing`);
  }
  
  // Balance strengths
  if (characteristics.balance > 0.8) {
    strengths.push(`Excellent balance throughout your swing - this leads to consistent ball striking`);
  }
  
  // Power strengths
  if (characteristics.power > 0.7) {
    strengths.push(`Good power generation - your swing mechanics are creating solid clubhead speed`);
  }
  
  // Add context-specific strengths
  if (context.golferLevel === 'beginner') {
    strengths.push(`Great progress for a beginner - you're developing solid fundamentals`);
  } else if (context.golferLevel === 'advanced') {
    strengths.push(`Your advanced technique shows years of practice and refinement`);
  }
  
  return strengths.length > 0 ? strengths : ['Your swing shows good athletic ability and solid foundation'];
}

function generateImprovements(characteristics: any, context: SwingContext, difficultyLevel: string): string[] {
  const improvements: string[] = [];
  
  // Tempo improvements
  if (characteristics.tempo.ratio < 2.5) {
    improvements.push(`Your tempo ratio of ${characteristics.tempo.ratio.toFixed(1)}:1 is too quick. Professional golfers achieve 3:1. Practice counting "1-2-3" on backswing, "1" on downswing`);
  } else if (characteristics.tempo.ratio > 3.5) {
    improvements.push(`Your tempo ratio of ${characteristics.tempo.ratio.toFixed(1)}:1 is too slow. Try speeding up your downswing while maintaining control`);
  }
  
  // Rotation improvements
  if (characteristics.rotation.shoulderTurn < 70) {
    improvements.push(`Your shoulder turn is ${characteristics.rotation.shoulderTurn}°. Professional golfers achieve 80-90° for maximum power. Practice the "shoulder turn drill": place a club across your chest and turn until you feel a stretch`);
  } else if (characteristics.rotation.shoulderTurn > 100) {
    improvements.push(`Your shoulder turn is ${characteristics.rotation.shoulderTurn}°, which is quite large. While this can generate power, focus on maintaining control and balance. Practice "half swings" to find your optimal range`);
  }
  
  // X-Factor improvements
  if (characteristics.rotation.xFactor < 35) {
    improvements.push(`Your X-Factor is ${characteristics.rotation.xFactor}° - insufficient separation. Professional golfers achieve 40-45°. Practice turning shoulders 90° while keeping hips at 45°`);
  }
  
  // Weight transfer improvements
  if (characteristics.weightTransfer.impact < 75) {
    improvements.push(`Your weight transfer is ${characteristics.weightTransfer.impact}% - insufficient. Professional golfers transfer 80-90%. Practice the step-through drill to reach 90%`);
  }
  
  // Balance improvements
  if (characteristics.balance < 0.6) {
    improvements.push(`Your balance needs work - practice swinging with your feet together to improve stability`);
  }
  
  // Power improvements
  if (characteristics.power < 0.5) {
    improvements.push(`Your power generation needs improvement - focus on proper weight transfer and hip rotation to increase clubhead speed`);
  }
  
  // Add difficulty-appropriate improvements
  if (difficultyLevel === 'beginner') {
    improvements.push(`Focus on fundamentals first - tempo, balance, and weight transfer before advanced techniques`);
  } else if (difficultyLevel === 'advanced') {
    improvements.push(`Fine-tune your technique for maximum consistency and power`);
  }
  
  return improvements.length > 0 ? improvements : ['Your swing metrics are in the professional range - maintain your excellent form'];
}

function generateDrills(characteristics: any, context: SwingContext, difficultyLevel: string): string[] {
  const drills: string[] = [];
  
  // Tempo drills
  if (characteristics.tempo.ratio < 2.5 || characteristics.tempo.ratio > 3.5) {
    drills.push('Practice with a metronome: 3 beats back, 1 beat down');
    drills.push('Try the "pause at the top" drill to feel proper tempo');
  }
  
  // Rotation drills
  if (characteristics.rotation.shoulderTurn < 80) {
    drills.push('Shoulder turn drill: Place a club across your chest and turn until you feel a stretch');
    drills.push('Practice "half swings" focusing on shoulder turn');
  }
  
  // Weight transfer drills
  if (characteristics.weightTransfer.impact < 80) {
    drills.push('Step-through drill: Step forward with your lead foot during the downswing');
    drills.push('Hip bump drill: Start your downswing with a hip bump to the left');
  }
  
  // Balance drills
  if (characteristics.balance < 0.7) {
    drills.push('Practice swinging with your feet together to improve balance');
    drills.push('One-foot drill: Practice swinging while standing on one foot');
  }
  
  // Power drills
  if (characteristics.power < 0.6) {
    drills.push('Medicine ball throws: Practice the throwing motion with a medicine ball');
    drills.push('Resistance band drills: Use resistance bands to strengthen your swing muscles');
  }
  
  // Add context-specific drills
  if (context.equipment === 'driver') {
    drills.push('Driver-specific: Practice with alignment sticks to ensure proper setup');
  } else if (context.equipment === 'iron') {
    drills.push('Iron-specific: Practice with a towel under your arms to maintain connection');
  }
  
  return drills.length > 0 ? drills : ['Continue practicing to maintain consistency in your fundamentals'];
}

function generateKeyTip(characteristics: any, context: SwingContext): string {
  // Prioritize the most important improvement
  if (characteristics.tempo.ratio < 2.5) {
    return `Focus on tempo - your current ${characteristics.tempo.ratio.toFixed(1)}:1 ratio should be 3:1. Professional golfers use "1-2-3" backswing, "1" downswing counting`;
  } else if (characteristics.weightTransfer.impact < 75) {
    return `Transfer your weight to your front foot during the downswing - aim for 80-90% on your lead foot at impact`;
  } else if (characteristics.rotation.shoulderTurn < 80) {
    return `Increase your shoulder turn to 80-90° for maximum power and coil`;
  } else if (characteristics.balance < 0.7) {
    return `Focus on balance - practice swinging with your feet together to improve stability`;
  } else {
    return `Maintain your current fundamentals while working on consistency - you're on the right track!`;
  }
}

function generateProfessionalInsight(characteristics: any, context: SwingContext, swingType: string): string {
  const insights: string[] = [];
  
  if (characteristics.consistency > 0.8) {
    insights.push('Consistency comes from proper tempo and weight transfer - you\'re mastering the building blocks of a repeatable swing');
  }
  
  if (characteristics.power > 0.7 && characteristics.balance > 0.8) {
    insights.push('Your combination of power and balance suggests you\'re ready to work on advanced techniques');
  }
  
  if (characteristics.rotation.xFactor > 40) {
    insights.push('Your X-Factor shows excellent shoulder-hip separation - this is what creates power in the golf swing');
  }
  
  if (context.golferLevel === 'beginner') {
    insights.push('For a beginner, you\'re showing excellent progress - focus on fundamentals before advanced techniques');
  } else if (context.golferLevel === 'advanced') {
    insights.push('Your advanced technique shows years of practice - now focus on fine-tuning for maximum consistency');
  }
  
  return insights.length > 0 ? insights.join(' ') : 'Your swing shows good fundamentals with room for improvement in key areas';
}

function generateNextSteps(characteristics: any, context: SwingContext, difficultyLevel: string): string[] {
  const nextSteps: string[] = [];
  
  // General next steps
  nextSteps.push('Practice the recommended drills daily');
  nextSteps.push('Focus on one improvement area at a time');
  nextSteps.push('Record your swing regularly to track progress');
  
  // Add difficulty-specific next steps
  if (difficultyLevel === 'beginner') {
    nextSteps.push('Consider taking lessons to build proper fundamentals');
    nextSteps.push('Practice with a mirror to check your setup and posture');
  } else if (difficultyLevel === 'advanced') {
    nextSteps.push('Work with a coach to fine-tune your technique');
    nextSteps.push('Practice under pressure to simulate course conditions');
  }
  
  // Add context-specific next steps
  if (context.environment === 'indoor') {
    nextSteps.push('Take your practice to the course for real-world application');
  } else {
    nextSteps.push('Continue practicing these fundamentals on the course');
  }
  
  return nextSteps;
}

function generatePersonalizedFactors(characteristics: any, context: SwingContext): string[] {
  const factors: string[] = [];
  
  // Add factors based on swing characteristics
  if (characteristics.tempo.consistency > 0.8) {
    factors.push('Consistent tempo');
  }
  if (characteristics.balance > 0.8) {
    factors.push('Excellent balance');
  }
  if (characteristics.power > 0.7) {
    factors.push('Good power generation');
  }
  if (characteristics.rotation.xFactor > 40) {
    factors.push('Strong X-Factor');
  }
  
  // Add context factors
  if (context.golferLevel === 'beginner') {
    factors.push('Beginner-friendly approach');
  } else if (context.golferLevel === 'advanced') {
    factors.push('Advanced technique focus');
  }
  
  return factors;
}

// Helper functions for calculating various metrics

function calculateTempoConsistency(phases: SwingPhase[]): number {
  if (phases.length < 2) return 0.5;
  
  const backswingPhases = phases.filter(p => p.name === 'backswing');
  const downswingPhases = phases.filter(p => p.name === 'downswing');
  
  if (backswingPhases.length === 0 || downswingPhases.length === 0) return 0.5;
  
  const backswingTimes = backswingPhases.map(p => p.duration);
  const downswingTimes = downswingPhases.map(p => p.duration);
  
  const backswingConsistency = calculateConsistency(backswingTimes);
  const downswingConsistency = calculateConsistency(downswingTimes);
  
  return (backswingConsistency + downswingConsistency) / 2;
}

function calculateFlexibilityScore(poses: PoseResult[]): number {
  if (poses.length < 5) return 0.5;
  
  // Calculate shoulder flexibility based on rotation
  const shoulderRotations = poses.map(pose => {
    if (!pose.landmarks) return 0;
    const leftShoulder = pose.landmarks[11];
    const rightShoulder = pose.landmarks[12];
    if (leftShoulder && rightShoulder) {
      return Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * 180 / Math.PI;
    }
    return 0;
  });
  
  const maxRotation = Math.max(...shoulderRotations);
  const minRotation = Math.min(...shoulderRotations);
  const rotationRange = Math.abs(maxRotation - minRotation);
  
  return Math.min(1.0, rotationRange / 90); // Normalize to 0-1
}

function calculateWeightTransferSequence(poses: PoseResult[]): number {
  if (poses.length < 10) return 0.5;
  
  // Calculate weight transfer progression
  const weightTransfers = poses.map(pose => {
    if (!pose.landmarks) return 0.5;
    // Simplified weight transfer calculation
    const leftAnkle = pose.landmarks[27];
    const rightAnkle = pose.landmarks[28];
    if (leftAnkle && rightAnkle) {
      const leftWeight = leftAnkle.visibility || 0.5;
      const rightWeight = rightAnkle.visibility || 0.5;
      return leftWeight / (leftWeight + rightWeight);
    }
    return 0.5;
  });
  
  // Check if weight transfer follows expected pattern
  const startWeight = weightTransfers[0];
  const midWeight = weightTransfers[Math.floor(poses.length / 2)];
  const endWeight = weightTransfers[poses.length - 1];
  
  // Expected pattern: start balanced, shift to trail foot, then to lead foot
  const expectedPattern = startWeight < 0.6 && midWeight < 0.4 && endWeight > 0.6;
  
  return expectedPattern ? 0.8 : 0.5;
}

function calculateSwingPlaneConsistency(poses: PoseResult[]): number {
  if (poses.length < 5) return 0.5;
  
  // Calculate swing plane angles
  const planeAngles = poses.map(pose => {
    if (!pose.landmarks) return 0;
    const leftWrist = pose.landmarks[15];
    const rightWrist = pose.landmarks[16];
    if (leftWrist && rightWrist) {
      return Math.atan2(rightWrist.y - leftWrist.y, rightWrist.x - leftWrist.x) * 180 / Math.PI;
    }
    return 0;
  });
  
  return calculateConsistency(planeAngles);
}

function calculateBodyStability(poses: PoseResult[]): number {
  if (poses.length < 5) return 0.5;
  
  // Calculate head movement
  const headPositions = poses.map(pose => {
    if (!pose.landmarks) return { x: 0, y: 0 };
    const nose = pose.landmarks[0];
    return { x: nose.x, y: nose.y };
  });
  
  const headMovement = calculateMovementRange(headPositions);
  return Math.max(0, 1 - headMovement * 10); // Normalize to 0-1
}

function calculatePowerMetrics(metrics: any, poses: PoseResult[]): number {
  // Combine various power indicators
  const tempoPower = metrics.tempo?.tempoRatio ? Math.min(1.0, metrics.tempo.tempoRatio / 3.0) : 0.5;
  const rotationPower = metrics.rotation?.shoulderTurn ? Math.min(1.0, metrics.rotation.shoulderTurn / 90) : 0.5;
  const weightPower = metrics.weightTransfer?.impact ? Math.min(1.0, metrics.weightTransfer.impact / 85) : 0.5;
  
  return (tempoPower + rotationPower + weightPower) / 3;
}

function calculateBalanceMetrics(poses: PoseResult[]): number {
  if (poses.length < 5) return 0.5;
  
  // Calculate balance based on foot positions and stability
  const footStability = calculateFootStability(poses);
  const headStability = calculateHeadStability(poses);
  
  return (footStability + headStability) / 2;
}

function calculateTimingMetrics(phases: SwingPhase[]): number {
  if (phases.length < 2) return 0.5;
  
  const backswingPhase = phases.find(p => p.name === 'backswing');
  const downswingPhase = phases.find(p => p.name === 'downswing');
  
  if (!backswingPhase || !downswingPhase) return 0.5;
  
  const ratio = backswingPhase.duration / downswingPhase.duration;
  const idealRatio = 3.0;
  
  return Math.max(0, 1 - Math.abs(ratio - idealRatio) / idealRatio);
}

function calculateOverallConsistency(metrics: any, poses: PoseResult[]): number {
  const tempoConsistency = metrics.tempo?.score ? metrics.tempo.score / 100 : 0.5;
  const rotationConsistency = metrics.rotation?.score ? metrics.rotation.score / 100 : 0.5;
  const weightConsistency = metrics.weightTransfer?.score ? metrics.weightTransfer.score / 100 : 0.5;
  const planeConsistency = metrics.swingPlane?.score ? metrics.swingPlane.score / 100 : 0.5;
  
  return (tempoConsistency + rotationConsistency + weightConsistency + planeConsistency) / 4;
}

// Utility functions

function calculateConsistency(values: number[]): number {
  if (values.length < 2) return 1.0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  return Math.max(0, 1 - standardDeviation / mean);
}

function calculateMovementRange(positions: { x: number; y: number }[]): number {
  if (positions.length < 2) return 0;
  
  let maxMovement = 0;
  for (let i = 1; i < positions.length; i++) {
    const movement = Math.sqrt(
      Math.pow(positions[i].x - positions[i-1].x, 2) + 
      Math.pow(positions[i].y - positions[i-1].y, 2)
    );
    maxMovement = Math.max(maxMovement, movement);
  }
  
  return maxMovement;
}

function calculateFootStability(poses: PoseResult[]): number {
  if (poses.length < 3) return 0.5;
  
  const footPositions = poses.map(pose => {
    if (!pose.landmarks) return { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
    const leftAnkle = pose.landmarks[27];
    const rightAnkle = pose.landmarks[28];
    return {
      left: { x: leftAnkle.x, y: leftAnkle.y },
      right: { x: rightAnkle.x, y: rightAnkle.y }
    };
  });
  
  const leftFootMovement = calculateMovementRange(footPositions.map(p => p.left));
  const rightFootMovement = calculateMovementRange(footPositions.map(p => p.right));
  
  return Math.max(0, 1 - (leftFootMovement + rightFootMovement) / 2);
}

function calculateHeadStability(poses: PoseResult[]): number {
  if (poses.length < 3) return 0.5;
  
  const headPositions = poses.map(pose => {
    if (!pose.landmarks) return { x: 0, y: 0 };
    const nose = pose.landmarks[0];
    return { x: nose.x, y: nose.y };
  });
  
  const headMovement = calculateMovementRange(headPositions);
  return Math.max(0, 1 - headMovement * 5);
}

function determineSwingType(characteristics: any, context: SwingContext): string {
  if (context.swingType === 'full') return 'Full Swing';
  if (context.swingType === 'chip') return 'Chip Shot';
  if (context.swingType === 'pitch') return 'Pitch Shot';
  if (context.swingType === 'putt') return 'Putting Stroke';
  
  // Determine based on characteristics
  if (characteristics.tempo.backswingTime < 0.5) return 'Short Game';
  if (characteristics.tempo.backswingTime > 1.0) return 'Full Swing';
  
  return 'Full Swing';
}

function determineDifficultyLevel(characteristics: any, context: SwingContext): 'beginner' | 'intermediate' | 'advanced' {
  if (context.golferLevel === 'beginner') return 'beginner';
  if (context.golferLevel === 'advanced') return 'advanced';
  
  // Determine based on consistency and technique
  if (characteristics.consistency > 0.8 && characteristics.power > 0.7) return 'advanced';
  if (characteristics.consistency > 0.6 && characteristics.power > 0.5) return 'intermediate';
  
  return 'beginner';
}

function calculateAdviceConfidence(metrics: any, poses: PoseResult[], characteristics: any): number {
  const poseQuality = poses.length >= 15 ? 0.9 : poses.length >= 10 ? 0.7 : 0.5;
  const metricsQuality = characteristics.consistency > 0.7 ? 0.9 : 0.6;
  const dataCompleteness = Object.keys(metrics).length >= 5 ? 0.9 : 0.6;
  
  return (poseQuality + metricsQuality + dataCompleteness) / 3;
}
