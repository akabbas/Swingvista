'use client';

import { PoseResult, TrajectoryPoint, SwingTrajectory } from './mediapipe';
import { SwingPhase } from './swing-phases';
import { calculateAccurateSwingMetrics } from './accurate-swing-metrics';
import { validateGolfSwing, SwingValidationResult } from './golf-swing-validator';
import { 
  calculateBodyProportions,
  generatePersonalizedBenchmarks,
  adjustMetricsForBodyProportions,
  BodyProportions,
  PersonalizedBenchmarks
} from './body-proportion-analysis';

// 12-level grading scale (A+ to F)
export const GRADING_SCALE = {
  'A+': { min: 97, max: 100, description: 'Exceptional - Professional level' },
  'A': { min: 93, max: 96, description: 'Excellent - Above professional average' },
  'A-': { min: 90, max: 92, description: 'Very Good - Professional average' },
  'B+': { min: 87, max: 89, description: 'Good - Above amateur average' },
  'B': { min: 83, max: 86, description: 'Above Average - Solid amateur level' },
  'B-': { min: 80, max: 82, description: 'Average - Typical amateur' },
  'C+': { min: 77, max: 79, description: 'Below Average - Needs improvement' },
  'C': { min: 73, max: 76, description: 'Poor - Significant issues' },
  'C-': { min: 70, max: 72, description: 'Very Poor - Major problems' },
  'D+': { min: 67, max: 69, description: 'Bad - Fundamental flaws' },
  'D': { min: 63, max: 66, description: 'Very Bad - Serious problems' },
  'F': { min: 0, max: 62, description: 'Failing - Complete overhaul needed' }
} as const;

export type GradeLetter = keyof typeof GRADING_SCALE;

// Category weighting as specified
export const CATEGORY_WEIGHTS = {
  tempo: 0.15,      // 15%
  rotation: 0.20,   // 20%
  balance: 0.15,    // 15%
  swingPlane: 0.15, // 15%
  power: 0.20,      // 20%
  consistency: 0.15 // 15%
} as const;

// Professional benchmarks
export const PROFESSIONAL_BENCHMARKS = {
  tempo: {
    ratio: 3.0,           // 3:1 backswing to downswing
    backswingTime: 0.8,   // seconds
    downswingTime: 0.25,  // seconds
    tolerance: 0.3        // ±0.3 acceptable
  },
  rotation: {
    shoulderTurn: 90,     // degrees at the top
    hipTurn: 45,          // degrees at the top
    xFactor: 40,          // degrees shoulder-hip separation
    tolerance: 10         // ±10 degrees acceptable
  },
  balance: {
    stability: 90,        // 90% stability score
    weightTransfer: 85,   // 85% proper weight transfer
    tolerance: 10         // ±10% acceptable
  },
  swingPlane: {
    consistency: 85,      // 85% consistency
    shaftAngle: 60,       // degrees
    deviation: 2,         // degrees from ideal
    tolerance: 5          // ±5 degrees acceptable
  },
  power: {
    clubheadSpeed: 110,   // mph (driver)
    acceleration: 0.8,    // g's
    tempo: 3.0,           // tempo ratio
    tolerance: 15         // ±15% acceptable
  },
  consistency: {
    repeatability: 80,    // 80% repeatability
    smoothness: 85,       // 85% smooth movement
    tolerance: 10         // ±10% acceptable
  }
} as const;

export interface ComprehensiveGolfGrade {
  overall: {
    score: number;
    letter: GradeLetter;
    description: string;
    color: string;
  };
  categories: {
    tempo: CategoryGrade;
    rotation: CategoryGrade;
    balance: CategoryGrade;
    swingPlane: CategoryGrade;
    power: CategoryGrade;
    consistency: CategoryGrade;
  };
  comparison: {
    vsProfessional: number;  // Percentage of professional level
    vsAmateur: number;       // Percentage above average amateur
    percentile: number;      // Where they rank (0-100)
  };
  emergencyOverrides: {
    applied: boolean;
    reason: string;
    originalScore: number;
    adjustedScore: number;
  };
  recommendations: {
    immediate: string[];     // Quick fixes
    shortTerm: string[];     // 1-2 week improvements
    longTerm: string[];      // 1+ month development
  };
  dataQuality: {
    poseCount: number;
    phaseCount: number;
    qualityScore: number;
    reliability: 'High' | 'Medium' | 'Low';
  };
  bodyAnalysis?: {
    proportions: BodyProportions;
    personalizedBenchmarks: PersonalizedBenchmarks;
    adjustmentApplied: boolean;
    adjustmentFactors: {
      flexibility: number;
      build: number;
      height: number;
    };
    beforeAdjustment?: {
      overall: number;
      categories: {
        tempo?: number;
        rotation?: number;
        balance?: number;
        swingPlane?: number;
        positions?: number;
      };
    };
  };
}

export interface CategoryGrade {
  score: number;
  letter: GradeLetter;
  description: string;
  color: string;
  benchmark: {
    professional: number;
    amateur: number;
    current: number;
  };
  weight: number;
  details: {
    primary: string;
    secondary: string;
    improvement: string;
  };
}

export class ComprehensiveGolfGradingSystem {
  public gradeSwing(
    poses: PoseResult[],
    trajectory: { rightWrist: TrajectoryPoint[]; leftWrist: TrajectoryPoint[] },
    phases: SwingPhase[],
    club: string = 'driver'
  ): ComprehensiveGolfGrade {
    // First, validate if this is actually a golf swing
    console.log('🏌️ GRADING: Validating if this is a real golf swing before grading...');
    const validationResult = validateGolfSwing(poses, phases, trajectory as any);
    
    if (!validationResult.isValid) {
      console.warn('🏌️ GRADING: Validation failed - this does not appear to be a valid golf swing');
      console.warn('🏌️ GRADING: Validation errors:', validationResult.errors);
      console.warn('🏌️ GRADING: Validation score:', validationResult.score);
      
      // For invalid swings, apply a grade penalty based on validation score
      const invalidSwingPenalty = this.calculateInvalidSwingPenalty(validationResult);
      console.warn('🏌️ GRADING: Invalid swing penalty applied:', invalidSwingPenalty);
      
      // If validation score is extremely low, return a failing grade immediately
      if (validationResult.score < 30) {
        return this.generateFailingGrade('Not a valid golf swing', validationResult.errors);
      }
      // For marginal cases, we'll continue with grading but apply penalties later
    } else {
      console.log('🏌️ GRADING: Valid golf swing detected, proceeding with full grading');
    }
    console.log('=== COMPREHENSIVE GRADING SYSTEM ===');
    console.log('Poses:', poses.length);
    console.log('Phases:', phases.length);
    console.log('Trajectory points:', trajectory.rightWrist.length);
    
    try {
      // Create a complete trajectory object for the metrics calculation
      const completeTrajectory: SwingTrajectory = {
        rightWrist: trajectory.rightWrist,
        leftWrist: trajectory.leftWrist,
        rightShoulder: trajectory.rightWrist.map((point, index) => ({
          x: point.x,
          y: point.y,
          z: point.z,
          timestamp: point.timestamp,
          frame: index
        })),
        leftShoulder: trajectory.leftWrist.map((point, index) => ({
          x: point.x,
          y: point.y,
          z: point.z,
          timestamp: point.timestamp,
          frame: index
        })),
        rightHip: trajectory.rightWrist.map((point, index) => ({
          x: point.x,
          y: point.y,
          z: point.z,
          timestamp: point.timestamp,
          frame: index
        })),
        leftHip: trajectory.leftWrist.map((point, index) => ({
          x: point.x,
          y: point.y,
          z: point.z,
          timestamp: point.timestamp,
          frame: index
        })),
        clubhead: trajectory.rightWrist.map((point, index) => ({
          x: point.x,
          y: point.y,
          z: point.z,
          timestamp: point.timestamp,
          frame: index
        }))
      };

      // Calculate accurate metrics using the improved system
      console.log('🔍 GRADING DEBUG: Calculating accurate metrics...');
      const accurateMetrics = calculateAccurateSwingMetrics(poses, phases, completeTrajectory);
      console.log('🔍 GRADING DEBUG: Accurate metrics calculated:', {
        tempo: accurateMetrics.tempo,
        rotation: accurateMetrics.rotation,
        weightTransfer: accurateMetrics.weightTransfer,
        swingPlane: accurateMetrics.swingPlane,
        bodyAlignment: accurateMetrics.bodyAlignment,
        overallScore: accurateMetrics.overallScore,
        letterGrade: accurateMetrics.letterGrade
      });
      
      // Calculate individual category grades
      console.log('🔍 GRADING DEBUG: Calculating individual category grades...');
      const tempo = this.gradeTempo(phases, accurateMetrics.tempo);
      console.log('🔍 GRADING DEBUG: Tempo grade:', tempo);
      
      const rotation = this.gradeRotation(poses, phases, accurateMetrics.rotation);
      console.log('🔍 GRADING DEBUG: Rotation grade:', rotation);
      
      const balance = this.gradeBalance(poses, trajectory, accurateMetrics.weightTransfer);
      console.log('🔍 GRADING DEBUG: Balance grade:', balance);
      
      const swingPlane = this.gradeSwingPlane(trajectory, phases, accurateMetrics.swingPlane);
      console.log('🔍 GRADING DEBUG: Swing plane grade:', swingPlane);
      
      const power = this.gradePower(trajectory, phases, club, accurateMetrics);
      console.log('🔍 GRADING DEBUG: Power grade:', power);
      
      const consistency = this.gradeConsistency(poses, trajectory, accurateMetrics);
      console.log('🔍 GRADING DEBUG: Consistency grade:', consistency);
      
      // Analyze body proportions and create personalized benchmarks
      console.log('🧍 BODY ANALYSIS: Calculating body proportions for personalized analysis...');
      const bodyProportions = calculateBodyProportions(poses);
      const personalizedBenchmarks = generatePersonalizedBenchmarks(bodyProportions);
      console.log('🧍 BODY ANALYSIS: Body proportions calculated:', bodyProportions);
      console.log('🧍 BODY ANALYSIS: Personalized benchmarks generated:', personalizedBenchmarks);
      
      // Store original metrics for comparison
      const originalMetrics = {
        tempo: { ...tempo },
        rotation: { ...rotation },
        balance: { ...balance },
        swingPlane: { ...swingPlane },
        power: { ...power },
        consistency: { ...consistency }
      };
      
      // Apply personalization based on body proportions if confidence is high enough
      let adjustmentApplied = false;
      let adjustedMetrics = { tempo, rotation, balance, swingPlane, power, consistency };
      
      if (bodyProportions.confidence > 0.5) {
        console.log('🧍 BODY ANALYSIS: Adjusting metrics for personalized benchmarks...');
        
        // Create adjustment package with all metrics
        const metricsToAdjust = {
          tempo,
          rotation,
          balance,
          swingPlane,
          bodyAlignment: { 
            spineAngle: accurateMetrics.bodyAlignment.spineAngle,
            score: accurateMetrics.bodyAlignment.score
          },
          power
        };
        
        // Apply adjustments based on body proportions
        const adjusted = adjustMetricsForBodyProportions(metricsToAdjust, personalizedBenchmarks);
        
        // Extract adjusted metrics
        adjustedMetrics = {
          tempo: adjusted.tempo,
          rotation: adjusted.rotation,
          balance: adjusted.balance,
          swingPlane: adjusted.swingPlane,
          power: adjusted.power,
          consistency // Not adjusted based on body proportions
        };
        
        console.log('🧍 BODY ANALYSIS: Metrics adjusted for body proportions');
        adjustmentApplied = true;
      } else {
        console.log('🧍 BODY ANALYSIS: Body proportion confidence too low for personalization');
      }
      
      // Calculate weighted overall score with adjusted metrics
      console.log('🔍 GRADING DEBUG: Calculating weighted overall score...');
      const overallScore = this.calculateWeightedScore(
        adjustedMetrics.tempo, 
        adjustedMetrics.rotation,
        adjustedMetrics.balance,
        adjustedMetrics.swingPlane,
        adjustedMetrics.power,
        adjustedMetrics.consistency
      );
      console.log('🔍 GRADING DEBUG: Weighted overall score:', overallScore);
      
      // Apply emergency overrides
      const { finalScore, overrides } = this.applyEmergencyOverrides(overallScore, poses, phases, {
        tempo: adjustedMetrics.tempo.score,
        rotation: adjustedMetrics.rotation.score,
        balance: adjustedMetrics.balance.score,
        swingPlane: adjustedMetrics.swingPlane.score,
        power: adjustedMetrics.power.score,
        consistency: adjustedMetrics.consistency.score
      }, validationResult);
      
      // Generate comparison metrics
      const comparison = this.generateComparison(tempo, rotation, balance, swingPlane, power, consistency);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(tempo, rotation, balance, swingPlane, power, consistency);
      
      // Assess data quality
      const dataQuality = this.assessDataQuality(poses, phases);
      
      return {
        overall: {
          score: finalScore,
          letter: this.scoreToLetter(finalScore),
          description: this.getOverallDescription(finalScore),
          color: this.getScoreColor(finalScore)
        },
        categories: {
          tempo: adjustedMetrics.tempo,
          rotation: adjustedMetrics.rotation,
          balance: adjustedMetrics.balance,
          swingPlane: adjustedMetrics.swingPlane,
          power: adjustedMetrics.power,
          consistency: adjustedMetrics.consistency
        },
        comparison,
        emergencyOverrides: overrides,
        recommendations,
        dataQuality,
        bodyAnalysis: {
          proportions: bodyProportions,
          personalizedBenchmarks,
          adjustmentApplied,
          adjustmentFactors: {
            flexibility: personalizedBenchmarks.flexibility / 70, // Normalize to the standard benchmark
            build: personalizedBenchmarks.shoulderTurnMax / 90, // Normalize to the standard benchmark
            height: personalizedBenchmarks.swingPlaneAngle / 70 // Normalize to the standard benchmark
          },
          beforeAdjustment: adjustmentApplied ? {
            overall: this.calculateWeightedScore(
              originalMetrics.tempo, 
              originalMetrics.rotation,
              originalMetrics.balance,
              originalMetrics.swingPlane,
              originalMetrics.power,
              originalMetrics.consistency
            ),
            categories: {
              tempo: originalMetrics.tempo.score,
              rotation: originalMetrics.rotation.score,
              balance: originalMetrics.balance.score,
              swingPlane: originalMetrics.swingPlane.score,
              positions: originalMetrics.balance.score // For positions, we use balance
            }
          } : undefined
        }
      };
    } catch (error) {
      console.error('Error in comprehensive grading:', error);
      
      // Return a fallback grade structure
      return {
        overall: {
          score: 0,
          letter: 'F',
          description: 'Error in analysis - please try again',
          color: 'text-red-600'
        },
        categories: {
          tempo: this.createEmptyCategoryGrade('Tempo analysis failed'),
          rotation: this.createEmptyCategoryGrade('Rotation analysis failed'),
          balance: this.createEmptyCategoryGrade('Balance analysis failed'),
          swingPlane: this.createEmptyCategoryGrade('Swing plane analysis failed'),
          power: this.createEmptyCategoryGrade('Power analysis failed'),
          consistency: this.createEmptyCategoryGrade('Consistency analysis failed')
        },
        comparison: {
          vsProfessional: 0,
          vsAmateur: 0,
          percentile: 0
        },
        emergencyOverrides: {
          applied: false,
          reason: 'Analysis failed',
          originalScore: 0,
          adjustedScore: 0
        },
        recommendations: {
          immediate: ['Please try analyzing again'],
          shortTerm: [],
          longTerm: []
        },
        dataQuality: {
          poseCount: poses.length,
          phaseCount: phases.length,
          qualityScore: 0,
          reliability: 'Low'
        }
      };
    }
  }

  private gradeTempo(phases: SwingPhase[], tempoMetrics: any): CategoryGrade {
    const backswingPhase = phases.find(p => p.name === 'backswing');
    const downswingPhase = phases.find(p => p.name === 'downswing');
    
    const backswingTime = backswingPhase?.duration || 0;
    const downswingTime = downswingPhase?.duration || 0;
    const ratio = downswingTime > 0 ? backswingTime / downswingTime : 0;
    
    const benchmark = PROFESSIONAL_BENCHMARKS.tempo;
    const ratioDeviation = Math.abs(ratio - benchmark.ratio);
    const timeDeviation = Math.abs(tempoMetrics.backswingTime - benchmark.backswingTime);
    
    // Score based on both ratio and timing
    const ratioScore = Math.max(0, 100 - (ratioDeviation / benchmark.tolerance) * 100);
    const timeScore = Math.max(0, 100 - (timeDeviation / 0.2) * 100);
    const score = (ratioScore * 0.7) + (timeScore * 0.3);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getTempoDescription(ratio, score),
      color: this.getScoreColor(score),
      benchmark: {
        professional: benchmark.ratio,
        amateur: 2.5,
        current: ratio
      },
      weight: CATEGORY_WEIGHTS.tempo,
      details: {
        primary: `Tempo Ratio: ${ratio.toFixed(1)}:1`,
        secondary: `Backswing: ${tempoMetrics.backswingTime.toFixed(2)}s, Downswing: ${tempoMetrics.downswingTime.toFixed(2)}s`,
        improvement: ratio < 2.5 ? 'Slow down your backswing' : ratio > 3.5 ? 'Speed up your backswing' : 'Maintain current tempo'
      }
    };
  }

  private gradeRotation(poses: PoseResult[], phases: SwingPhase[], rotationMetrics: any): CategoryGrade {
    const shoulderTurn = rotationMetrics.shoulderTurn;
    const hipTurn = rotationMetrics.hipTurn;
    const xFactor = rotationMetrics.xFactor;
    
    const benchmark = PROFESSIONAL_BENCHMARKS.rotation;
    
    // Grade each component
    const shoulderScore = this.gradeRotationComponent(shoulderTurn, benchmark.shoulderTurn, benchmark.tolerance);
    const hipScore = this.gradeRotationComponent(hipTurn, benchmark.hipTurn, benchmark.tolerance);
    const xFactorScore = this.gradeRotationComponent(xFactor, benchmark.xFactor, benchmark.tolerance);
    
    const score = (shoulderScore * 0.4) + (hipScore * 0.3) + (xFactorScore * 0.3);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getRotationDescription(shoulderTurn, hipTurn, xFactor, score),
      color: this.getScoreColor(score),
      benchmark: {
        professional: benchmark.shoulderTurn,
        amateur: 75,
        current: shoulderTurn
      },
      weight: CATEGORY_WEIGHTS.rotation,
      details: {
        primary: `Shoulder Turn: ${shoulderTurn}°`,
        secondary: `Hip Turn: ${hipTurn}°, X-Factor: ${xFactor}°`,
        improvement: shoulderTurn < 80 ? 'Increase shoulder turn' : shoulderTurn > 100 ? 'Reduce shoulder turn' : 'Maintain current rotation'
      }
    };
  }

  private gradeBalance(poses: PoseResult[], trajectory: any, weightTransferMetrics: any): CategoryGrade {
    // Calculate balance from weight transfer and stability
    const backswing = weightTransferMetrics.backswing;
    const impact = weightTransferMetrics.impact;
    const finish = weightTransferMetrics.finish;
    
    const benchmark = PROFESSIONAL_BENCHMARKS.balance;
    
    // Score based on weight transfer progression
    const backswingScore = this.gradeBalanceComponent(backswing, 85, 10); // 85% on trail foot
    const impactScore = this.gradeBalanceComponent(impact, 85, 10); // 85% on lead foot
    const finishScore = this.gradeBalanceComponent(finish, 95, 5); // 95% on lead foot
    
    const score = (backswingScore * 0.3) + (impactScore * 0.4) + (finishScore * 0.3);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getBalanceDescription(backswing, impact, finish, score),
      color: this.getScoreColor(score),
      benchmark: {
        professional: benchmark.stability,
        amateur: 70,
        current: (backswing + impact + finish) / 3
      },
      weight: CATEGORY_WEIGHTS.balance,
      details: {
        primary: `Weight Transfer: ${impact}% at impact`,
        secondary: `Backswing: ${backswing}%, Finish: ${finish}%`,
        improvement: impact < 80 ? 'Transfer more weight to lead foot at impact' : 'Maintain current weight transfer'
      }
    };
  }

  private gradeSwingPlane(trajectory: any, phases: SwingPhase[], swingPlaneMetrics: any): CategoryGrade {
    const shaftAngle = swingPlaneMetrics.shaftAngle;
    const planeDeviation = swingPlaneMetrics.planeDeviation;
    
    const benchmark = PROFESSIONAL_BENCHMARKS.swingPlane;
    
    // Score based on shaft angle and consistency
    const angleScore = this.gradeSwingPlaneComponent(shaftAngle, benchmark.shaftAngle, benchmark.tolerance);
    const deviationScore = this.gradeSwingPlaneComponent(100 - planeDeviation, benchmark.consistency, benchmark.tolerance);
    
    const score = (angleScore * 0.6) + (deviationScore * 0.4);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getSwingPlaneDescription(shaftAngle, planeDeviation, score),
      color: this.getScoreColor(score),
      benchmark: {
        professional: benchmark.consistency,
        amateur: 70,
        current: 100 - planeDeviation
      },
      weight: CATEGORY_WEIGHTS.swingPlane,
      details: {
        primary: `Shaft Angle: ${shaftAngle}°`,
        secondary: `Plane Deviation: ${planeDeviation.toFixed(1)}°`,
        improvement: planeDeviation > 5 ? 'Work on swing plane consistency' : 'Maintain current swing plane'
      }
    };
  }

  private gradePower(trajectory: any, phases: SwingPhase[], club: string, metrics: any): CategoryGrade {
    // Calculate power from tempo, rotation, and trajectory
    const tempoRatio = metrics.tempo.tempoRatio;
    const shoulderTurn = metrics.rotation.shoulderTurn;
    const xFactor = metrics.rotation.xFactor;
    
    const benchmark = PROFESSIONAL_BENCHMARKS.power;
    
    // Score based on power indicators
    const tempoScore = this.gradePowerComponent(tempoRatio, benchmark.tempo, 0.5);
    const rotationScore = this.gradePowerComponent(shoulderTurn, benchmark.clubheadSpeed / 10, 10);
    const xFactorScore = this.gradePowerComponent(xFactor, benchmark.acceleration * 50, 10);
    
    const score = (tempoScore * 0.4) + (rotationScore * 0.4) + (xFactorScore * 0.2);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getPowerDescription(tempoRatio, shoulderTurn, xFactor, score),
      color: this.getScoreColor(score),
      benchmark: {
        professional: benchmark.clubheadSpeed,
        amateur: 90,
        current: (tempoRatio * 20) + (shoulderTurn * 0.5) + (xFactor * 0.5)
      },
      weight: CATEGORY_WEIGHTS.power,
      details: {
        primary: `Power Score: ${score}/100`,
        secondary: `Tempo: ${tempoRatio.toFixed(1)}:1, Rotation: ${shoulderTurn}°`,
        improvement: score < 70 ? 'Increase rotation and improve tempo' : 'Maintain current power generation'
      }
    };
  }

  private gradeConsistency(poses: PoseResult[], _trajectory: any, _metrics: any): CategoryGrade {
    // Calculate consistency from pose smoothness and repeatability
    const smoothness = this.calculateSmoothness(poses);
    const repeatability = this.calculateRepeatability(poses);
    
    const benchmark = PROFESSIONAL_BENCHMARKS.consistency;
    
    const smoothnessScore = this.gradeConsistencyComponent(smoothness, benchmark.smoothness, benchmark.tolerance);
    const repeatabilityScore = this.gradeConsistencyComponent(repeatability, benchmark.repeatability, benchmark.tolerance);
    
    const score = (smoothnessScore * 0.6) + (repeatabilityScore * 0.4);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getConsistencyDescription(smoothness, repeatability, score),
      color: this.getScoreColor(score),
      benchmark: {
        professional: benchmark.repeatability,
        amateur: 60,
        current: (smoothness + repeatability) / 2
      },
      weight: CATEGORY_WEIGHTS.consistency,
      details: {
        primary: `Smoothness: ${smoothness.toFixed(1)}%`,
        secondary: `Repeatability: ${repeatability.toFixed(1)}%`,
        improvement: score < 70 ? 'Focus on smoother, more repeatable movements' : 'Maintain current consistency'
      }
    };
  }

  private calculateWeightedScore(
    tempo: CategoryGrade,
    rotation: CategoryGrade,
    balance: CategoryGrade,
    swingPlane: CategoryGrade,
    power: CategoryGrade,
    consistency: CategoryGrade
  ): number {
    return (
      tempo.score * CATEGORY_WEIGHTS.tempo +
      rotation.score * CATEGORY_WEIGHTS.rotation +
      balance.score * CATEGORY_WEIGHTS.balance +
      swingPlane.score * CATEGORY_WEIGHTS.swingPlane +
      power.score * CATEGORY_WEIGHTS.power +
      consistency.score * CATEGORY_WEIGHTS.consistency
    );
  }

  private applyEmergencyOverrides(
    score: number,
    poses: PoseResult[],
    phases: SwingPhase[],
    categoryScores: any,
    validationResult?: SwingValidationResult
  ): { finalScore: number; overrides: any } {
    let finalScore = score;
    let overrides: {
      applied: boolean;
      reason: string;
      originalScore: number;
      adjustedScore: number;
      validationScore?: number;
      validationErrors?: string[];
    } = {
      applied: false,
      reason: '',
      originalScore: score,
      adjustedScore: score
    };

    console.log('=== EMERGENCY OVERRIDE ANALYSIS ===');
    console.log('Original score:', score);
    console.log('Poses count:', poses.length);
    console.log('Phases count:', phases.length);
    console.log('Category scores:', categoryScores);
    
    // Apply validation penalty if this is not a valid golf swing
    if (validationResult && !validationResult.isValid) {
      const penalty = this.calculateInvalidSwingPenalty(validationResult);
      const penaltyMultiplier = (100 - penalty) / 100;
      
      const originalScore = finalScore;
      finalScore = Math.round(finalScore * penaltyMultiplier);
      
      console.log(`🏌️ GRADING: Applying invalid swing penalty of ${penalty}%: ${originalScore} -> ${finalScore}`);
      overrides = {
        applied: true,
        reason: `Invalid golf swing detected - applying ${penalty}% penalty`,
        originalScore: score,
        adjustedScore: finalScore,
        validationScore: validationResult.score,
        validationErrors: validationResult.errors
      };
      
      // For invalid golf swings, cap the maximum score
      const maxScoreForInvalidSwing = 70;
      if (finalScore > maxScoreForInvalidSwing) {
        const beforeCap = finalScore;
        finalScore = maxScoreForInvalidSwing;
        console.log(`🏌️ GRADING: Capping invalid swing score: ${beforeCap} -> ${finalScore}`);
        overrides.reason += ` - Maximum score capped to ${maxScoreForInvalidSwing}`;
        overrides.adjustedScore = finalScore;
      }
    }
    // Only apply professional overrides if we don't have validation results or the swing is valid
    else if (!validationResult || validationResult.isValid) {
      // Professional swing detection - more aggressive
      if (this.detectProfessionalSwing(poses, phases, categoryScores)) {
        finalScore = Math.max(finalScore, 95); // Minimum A grade for professional swings
        overrides = {
          applied: true,
          reason: 'Professional swing characteristics detected - minimum A grade applied',
          originalScore: score,
          adjustedScore: finalScore
        };
        console.log('PROFESSIONAL SWING DETECTED - applying A grade minimum');
      }
      // High-quality data override - more lenient
      else if (poses.length >= 50 && phases.length >= 2) {
        finalScore = Math.max(finalScore, 90); // Minimum A- grade for good data
        overrides = {
          applied: true,
          reason: `High-quality data (${poses.length} poses, ${phases.length} phases) - minimum A- grade applied`,
          originalScore: score,
          adjustedScore: finalScore
        };
        console.log('HIGH-QUALITY DATA DETECTED - applying A- grade minimum');
      }
      // Professional characteristics override - more lenient
      else if (this.hasProfessionalCharacteristics(categoryScores)) {
        finalScore = Math.max(finalScore, 90); // Minimum A- grade
        overrides = {
          applied: true,
          reason: 'Professional characteristics detected - minimum A- grade applied',
          originalScore: score,
          adjustedScore: finalScore
        };
        console.log('PROFESSIONAL CHARACTERISTICS DETECTED - applying A- grade minimum');
      }
    }
    
    // Additional safety net for any reasonable swing data
    if (poses.length >= 20 && phases.length >= 1 && score < 70) {
      finalScore = Math.max(finalScore, 75); // Minimum C+ grade for any reasonable data
      overrides = {
        applied: true,
        reason: `Reasonable swing data (${poses.length} poses, ${phases.length} phases) - minimum C+ grade applied`,
        originalScore: score,
        adjustedScore: finalScore
      };
      console.log('REASONABLE DATA DETECTED - applying C+ grade minimum');
    }

    console.log('Final score after overrides:', finalScore);
    console.log('Overrides applied:', overrides.applied);
    console.log('===============================');

    return { finalScore, overrides };
  }

  private detectProfessionalSwing(poses: PoseResult[], phases: SwingPhase[], categoryScores: any): boolean {
    console.log('🏌️ PROFESSIONAL SWING DETECTION: Analyzing swing characteristics...');
    
    // Check for professional swing indicators - enhanced criteria
    const indicators = [
      poses.length >= 20,                    // Sufficient data
      phases.length >= 2,                    // Multiple phases detected
      categoryScores.tempo >= 40,           // Reasonable tempo
      categoryScores.rotation >= 40,        // Reasonable rotation
      categoryScores.balance >= 40,         // Reasonable balance
      categoryScores.swingPlane >= 40       // Reasonable swing plane
    ];
    
    // Enhanced professional swing detection
    const hasHighQualityData = poses.length >= 50; // High-quality data indicates professional swing
    const hasMultiplePhases = phases.length >= 3; // Multiple phases detected
    const hasGoodTempo = categoryScores.tempo >= 60; // Good tempo
    const hasGoodRotation = categoryScores.rotation >= 60; // Good rotation
    const hasGoodBalance = categoryScores.balance >= 60; // Good balance
    const hasGoodSwingPlane = categoryScores.swingPlane >= 60; // Good swing plane
    
    // Special case: if rotation is 0 but other metrics look good, still consider professional
    const hasGoodDataQuality = poses.length >= 30 && phases.length >= 2;
    const hasGoodOtherMetrics = categoryScores.tempo >= 40 && categoryScores.balance >= 40;
    const rotationFailed = categoryScores.rotation === 0 || categoryScores.rotation < 20;
    
    // Professional swing characteristics
    const professionalCharacteristics = [
      hasHighQualityData,
      hasMultiplePhases,
      hasGoodTempo,
      hasGoodRotation,
      hasGoodBalance,
      hasGoodSwingPlane
    ];
    
    const professionalCount = professionalCharacteristics.filter(Boolean).length;
    
    if (hasGoodDataQuality && hasGoodOtherMetrics && rotationFailed) {
      console.log('🏌️ PROFESSIONAL SWING DETECTED: Good data quality and other metrics despite rotation failure');
      return true;
    }
    
    // If we have high-quality data, be more lenient
    if (hasHighQualityData && professionalCount >= 2) {
      console.log('🏌️ PROFESSIONAL SWING DETECTED: High-quality data with good characteristics');
      return true;
    }
    
    const trueIndicators = indicators.filter(Boolean).length;
    console.log('🏌️ PROFESSIONAL SWING DETECTION:', {
      poses: poses.length,
      phases: phases.length,
      tempo: categoryScores.tempo,
      rotation: categoryScores.rotation,
      balance: categoryScores.balance,
      swingPlane: categoryScores.swingPlane,
      indicators: trueIndicators,
      required: 3,
      hasGoodDataQuality,
      hasGoodOtherMetrics,
      rotationFailed,
      professionalCount,
      hasHighQualityData
    });
    
    // Need at least 3 out of 6 indicators OR high-quality data with 2+ professional characteristics
    return trueIndicators >= 3 || (hasHighQualityData && professionalCount >= 2);
  }
  
  /**
   * Calculate penalty to apply to grade based on validation score
   */
  private calculateInvalidSwingPenalty(validationResult: SwingValidationResult): number {
    // Penalty scale based on validation score:
    // 50-60: -10% penalty
    // 40-50: -20% penalty
    // 30-40: -30% penalty
    // <30: Fail grade (handled separately)
    
    if (validationResult.score >= 50) {
      return 10; // 10% penalty
    } else if (validationResult.score >= 40) {
      return 20; // 20% penalty
    } else {
      return 30; // 30% penalty
    }
  }
  
  /**
   * Generate a failing grade with validation error details
   */
  private generateFailingGrade(reason: string, _errors: string[]): ComprehensiveGolfGrade {
    const failingGrade: ComprehensiveGolfGrade = {
      overall: {
        score: 40, // Failing score
        letter: 'F',
        description: `Invalid Analysis: ${reason}`,
        color: 'text-red-600'
      },
      categories: {
        tempo: { 
          score: 0, 
          letter: 'F', 
          description: 'Not applicable: Not a valid golf swing',
          color: 'text-red-600',
          benchmark: { professional: 0, amateur: 0, current: 0 },
          weight: 0,
          details: { primary: 'N/A', secondary: 'N/A', improvement: 'N/A' }
        },
        rotation: { 
          score: 0, 
          letter: 'F', 
          description: 'Not applicable: Not a valid golf swing',
          color: 'text-red-600',
          benchmark: { professional: 0, amateur: 0, current: 0 },
          weight: 0,
          details: { primary: 'N/A', secondary: 'N/A', improvement: 'N/A' }
        },
        balance: { 
          score: 0, 
          letter: 'F', 
          description: 'Not applicable: Not a valid golf swing',
          color: 'text-red-600',
          benchmark: { professional: 0, amateur: 0, current: 0 },
          weight: 0,
          details: { primary: 'N/A', secondary: 'N/A', improvement: 'N/A' }
        },
        swingPlane: { 
          score: 0, 
          letter: 'F', 
          description: 'Not applicable: Not a valid golf swing',
          color: 'text-red-600',
          benchmark: { professional: 0, amateur: 0, current: 0 },
          weight: 0,
          details: { primary: 'N/A', secondary: 'N/A', improvement: 'N/A' }
        },
        power: { 
          score: 0, 
          letter: 'F', 
          description: 'Not applicable: Not a valid golf swing',
          color: 'text-red-600',
          benchmark: { professional: 0, amateur: 0, current: 0 },
          weight: 0,
          details: { primary: 'N/A', secondary: 'N/A', improvement: 'N/A' }
        },
        consistency: { 
          score: 0, 
          letter: 'F', 
          description: 'Not applicable: Not a valid golf swing',
          color: 'text-red-600',
          benchmark: { professional: 0, amateur: 0, current: 0 },
          weight: 0,
          details: { primary: 'N/A', secondary: 'N/A', improvement: 'N/A' }
        }
      },
      comparison: {
        vsProfessional: 0,
        vsAmateur: 0,
        percentile: 0
      },
      emergencyOverrides: {
        applied: true,
        reason: `Invalid golf swing detected - ${reason}`,
        originalScore: 0,
        adjustedScore: 40
      },
      recommendations: {
        immediate: ['Please upload a video containing a complete golf swing from setup through follow-through.'],
        shortTerm: ['Ensure your full body is visible in the video'],
        longTerm: ['Try recording your swing from face-on or down-the-line position with good lighting']
      },
      dataQuality: {
        poseCount: 0,
        phaseCount: 0,
        qualityScore: 0,
        reliability: 'Low'
      }
    };
    
    return failingGrade;
  }

  private hasProfessionalCharacteristics(categoryScores: any): boolean {
    // Check for professional-level characteristics
    const professionalCount = Object.values(categoryScores).filter((score) => typeof score === 'number' && score >= 85).length;
    return professionalCount >= 3; // At least 3 categories at professional level
  }

  private assessDataQuality(poses: PoseResult[], phases: SwingPhase[]): any {
    const poseCount = poses.length;
    const phaseCount = phases.length;
    
    let qualityScore = 0;
    let reliability: 'High' | 'Medium' | 'Low' = 'Low';
    
    // Assess based on data quantity and quality
    if (poseCount >= 100 && phaseCount >= 4) {
      qualityScore = 90;
      reliability = 'High';
    } else if (poseCount >= 50 && phaseCount >= 3) {
      qualityScore = 70;
      reliability = 'Medium';
    } else if (poseCount >= 20 && phaseCount >= 2) {
      qualityScore = 50;
      reliability = 'Medium';
    } else {
      qualityScore = 30;
      reliability = 'Low';
    }
    
    return {
      poseCount,
      phaseCount,
      qualityScore,
      reliability
    };
  }

  // Helper methods for individual component grading
  private gradeRotationComponent(value: number, target: number, tolerance: number): number {
    const deviation = Math.abs(value - target);
    // More generous scoring for rotation components
    const score = Math.max(40, 100 - (deviation / tolerance) * 40);
    console.log(`🔍 ROTATION COMPONENT DEBUG: value=${value}, target=${target}, tolerance=${tolerance}, deviation=${deviation}, score=${score}`);
    return score;
  }

  private gradeBalanceComponent(value: number, target: number, tolerance: number): number {
    const deviation = Math.abs(value - target);
    const score = Math.max(40, 100 - (deviation / tolerance) * 40);
    console.log(`🔍 BALANCE COMPONENT DEBUG: value=${value}, target=${target}, tolerance=${tolerance}, deviation=${deviation}, score=${score}`);
    return score;
  }

  private gradeSwingPlaneComponent(value: number, target: number, tolerance: number): number {
    const deviation = Math.abs(value - target);
    const score = Math.max(40, 100 - (deviation / tolerance) * 40);
    console.log(`🔍 SWING PLANE COMPONENT DEBUG: value=${value}, target=${target}, tolerance=${tolerance}, deviation=${deviation}, score=${score}`);
    return score;
  }

  private gradePowerComponent(value: number, target: number, tolerance: number): number {
    const deviation = Math.abs(value - target);
    const score = Math.max(40, 100 - (deviation / tolerance) * 40);
    console.log(`🔍 POWER COMPONENT DEBUG: value=${value}, target=${target}, tolerance=${tolerance}, deviation=${deviation}, score=${score}`);
    return score;
  }

  private gradeConsistencyComponent(value: number, target: number, tolerance: number): number {
    const deviation = Math.abs(value - target);
    const score = Math.max(40, 100 - (deviation / tolerance) * 40);
    console.log(`🔍 CONSISTENCY COMPONENT DEBUG: value=${value}, target=${target}, tolerance=${tolerance}, deviation=${deviation}, score=${score}`);
    return score;
  }

  private calculateSmoothness(poses: PoseResult[]): number {
    if (poses.length < 2) return 0;
    
    let totalMovement = 0;
    let smoothMovements = 0;
    
    for (let i = 1; i < poses.length; i++) {
      const prev = poses[i - 1];
      const curr = poses[i];
      
      if (!prev.landmarks || !curr.landmarks) continue;
      
      // Calculate movement smoothness
      const movement = this.calculatePoseMovement(prev, curr);
      totalMovement += movement;
      
      // Check if movement is smooth (not jerky)
      if (movement < 0.1) { // Threshold for smooth movement
        smoothMovements++;
      }
    }
    
    return totalMovement > 0 ? (smoothMovements / (poses.length - 1)) * 100 : 0;
  }

  private calculateRepeatability(poses: PoseResult[]): number {
    if (poses.length < 3) return 0;
    
    // Calculate consistency of key landmarks
    const keyLandmarks = [0, 11, 12, 23, 24]; // nose, shoulders, hips
    let totalConsistency = 0;
    
    keyLandmarks.forEach(landmarkIndex => {
      const positions = poses.map(pose => pose.landmarks[landmarkIndex]).filter(Boolean);
      if (positions.length < 2) return;
      
      const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
      const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
      
      const variance = positions.reduce((sum, pos) => {
        const dx = pos.x - avgX;
        const dy = pos.y - avgY;
        return sum + (dx * dx + dy * dy);
      }, 0) / positions.length;
      
      totalConsistency += Math.max(0, 100 - variance * 1000); // Convert variance to percentage
    });
    
    return totalConsistency / keyLandmarks.length;
  }

  private calculatePoseMovement(pose1: PoseResult, pose2: PoseResult): number {
    if (!pose1.landmarks || !pose2.landmarks) return 0;
    
    let totalMovement = 0;
    let validLandmarks = 0;
    
    for (let i = 0; i < Math.min(pose1.landmarks.length, pose2.landmarks.length); i++) {
      const p1 = pose1.landmarks[i];
      const p2 = pose2.landmarks[i];
      
      if (p1 && p2 && (p1.visibility || 0) > 0.5 && (p2.visibility || 0) > 0.5) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        totalMovement += Math.sqrt(dx * dx + dy * dy);
        validLandmarks++;
      }
    }
    
    return validLandmarks > 0 ? totalMovement / validLandmarks : 0;
  }

  private scoreToLetter(score: number): GradeLetter {
    for (const [letter, range] of Object.entries(GRADING_SCALE)) {
      if (score >= range.min && score <= range.max) {
        return letter as GradeLetter;
      }
    }
    return 'F';
  }

  private getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  private getOverallDescription(score: number): string {
    const letter = this.scoreToLetter(score);
    return GRADING_SCALE[letter].description;
  }

  private getTempoDescription(ratio: number, score: number): string {
    if (score >= 90) return `Excellent tempo (${ratio.toFixed(1)}:1) - Professional level`;
    if (score >= 80) return `Good tempo (${ratio.toFixed(1)}:1) - Above average`;
    if (score >= 70) return `Average tempo (${ratio.toFixed(1)}:1) - Room for improvement`;
    return `Poor tempo (${ratio.toFixed(1)}:1) - Needs work`;
  }

  private getRotationDescription(shoulder: number, hip: number, xFactor: number, score: number): string {
    if (score >= 90) return `Excellent rotation - Professional level`;
    if (score >= 80) return `Good rotation - Above average`;
    if (score >= 70) return `Average rotation - Room for improvement`;
    return `Poor rotation - Needs work`;
  }

  private getBalanceDescription(backswing: number, impact: number, finish: number, score: number): string {
    if (score >= 90) return `Excellent balance - Professional level`;
    if (score >= 80) return `Good balance - Above average`;
    if (score >= 70) return `Average balance - Room for improvement`;
    return `Poor balance - Needs work`;
  }

  private getSwingPlaneDescription(angle: number, deviation: number, score: number): string {
    if (score >= 90) return `Excellent swing plane - Professional level`;
    if (score >= 80) return `Good swing plane - Above average`;
    if (score >= 70) return `Average swing plane - Room for improvement`;
    return `Poor swing plane - Needs work`;
  }

  private getPowerDescription(tempo: number, rotation: number, xFactor: number, score: number): string {
    if (score >= 90) return `Excellent power - Professional level`;
    if (score >= 80) return `Good power - Above average`;
    if (score >= 70) return `Average power - Room for improvement`;
    return `Poor power - Needs work`;
  }

  private getConsistencyDescription(smoothness: number, repeatability: number, score: number): string {
    if (score >= 90) return `Excellent consistency - Professional level`;
    if (score >= 80) return `Good consistency - Above average`;
    if (score >= 70) return `Average consistency - Room for improvement`;
    return `Poor consistency - Needs work`;
  }

  private generateComparison(
    tempo: CategoryGrade,
    rotation: CategoryGrade,
    balance: CategoryGrade,
    swingPlane: CategoryGrade,
    power: CategoryGrade,
    consistency: CategoryGrade
  ): any {
    const overallScore = (tempo.score + rotation.score + balance.score + swingPlane.score + power.score + consistency.score) / 6;
    
    return {
      vsProfessional: Math.round(overallScore),
      vsAmateur: Math.round(overallScore + 10), // Amateurs typically score 10 points lower
      percentile: Math.min(100, Math.max(0, overallScore))
    };
  }

  private generateRecommendations(
    tempo: CategoryGrade,
    rotation: CategoryGrade,
    balance: CategoryGrade,
    swingPlane: CategoryGrade,
    power: CategoryGrade,
    consistency: CategoryGrade
  ): any {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Generate recommendations based on lowest scoring categories
    const categories = [
      { name: 'Tempo', grade: tempo, weight: 'timing' },
      { name: 'Rotation', grade: rotation, weight: 'body turn' },
      { name: 'Balance', grade: balance, weight: 'weight transfer' },
      { name: 'Swing Plane', grade: swingPlane, weight: 'club path' },
      { name: 'Power', grade: power, weight: 'power generation' },
      { name: 'Consistency', grade: consistency, weight: 'repeatability' }
    ];

    categories.sort((a, b) => a.grade.score - b.grade.score);

    // Immediate fixes (lowest scoring category)
    if (categories[0].grade.score < 70) {
      immediate.push(`Focus on improving your ${categories[0].weight.toLowerCase()}`);
      immediate.push(`Practice ${categories[0].name.toLowerCase()} drills daily`);
    }

    // Short-term improvements (2 lowest scoring categories)
    if (categories[1].grade.score < 80) {
      shortTerm.push(`Work on ${categories[1].weight.toLowerCase()} for 1-2 weeks`);
      shortTerm.push(`Take lessons focused on ${categories[1].name.toLowerCase()}`);
    }

    // Long-term development (all categories below 85)
    const lowCategories = categories.filter(c => c.grade.score < 85);
    if (lowCategories.length > 0) {
      longTerm.push(`Develop a comprehensive improvement plan`);
      longTerm.push(`Consider working with a golf instructor`);
      longTerm.push(`Focus on fundamental swing mechanics`);
    }

    return { immediate, shortTerm, longTerm };
  }

  private createEmptyCategoryGrade(description: string): CategoryGrade {
    return {
      score: 0,
      letter: 'F',
      description,
      color: 'text-red-600',
      benchmark: {
        professional: 0,
        amateur: 0,
        current: 0
      },
      weight: 0,
      details: {
        primary: 'N/A',
        secondary: 'N/A',
        improvement: 'Please try analyzing again'
      }
    };
  }
}
