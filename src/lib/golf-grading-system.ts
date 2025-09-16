'use client';

import { PoseResult, TrajectoryPoint } from './mediapipe';
import { SwingPhase } from './swing-phases';

export interface GolfGrade {
  overall: {
    score: number; // 0-100
    letter: string; // A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F
    description: string;
  };
  categories: {
    tempo: GradeCategory;
    rotation: GradeCategory;
    balance: GradeCategory;
    plane: GradeCategory;
    power: GradeCategory;
    consistency: GradeCategory;
  };
  comparison: {
    vsProfessional: number; // Percentage of professional level
    vsAmateur: number; // Percentage above average amateur
    percentile: number; // Where they rank (0-100)
  };
  recommendations: {
    immediate: string[]; // Quick fixes
    shortTerm: string[]; // 1-2 week improvements
    longTerm: string[]; // 1+ month development
  };
}

export interface GradeCategory {
  score: number;
  letter: string;
  description: string;
  benchmark: {
    professional: number;
    amateur: number;
    beginner: number;
  };
  current: number;
}

// Professional golf swing benchmarks (based on PGA Tour data)
const PROFESSIONAL_BENCHMARKS = {
  tempo: {
    ratio: 3.0, // 3:1 backswing to downswing
    tolerance: 0.3, // ±0.3 acceptable
    weight: 0.15 // 15% of overall grade
  },
  rotation: {
    shoulders: 95, // degrees
    hips: 45, // degrees
    xFactor: 25, // degrees separation
    weight: 0.20 // 20% of overall grade
  },
  balance: {
    stability: 0.95, // 95% stability score
    weight: 0.15 // 15% of overall grade
  },
  plane: {
    consistency: 0.90, // 90% consistency
    angle: 45, // degrees (varies by club)
    weight: 0.15 // 15% of overall grade
  },
  power: {
    clubheadSpeed: 110, // mph (driver)
    acceleration: 0.8, // g's
    weight: 0.20 // 20% of overall grade
  },
  consistency: {
    repeatability: 0.85, // 85% repeatability
    weight: 0.15 // 15% of overall grade
  }
};

export class GolfGradingSystem {
  public gradeSwing(
    poses: PoseResult[],
    trajectory: { rightWrist: TrajectoryPoint[]; leftWrist: TrajectoryPoint[] },
    phases: SwingPhase[],
    club: string = 'driver'
  ): GolfGrade {
    // Calculate individual metrics
    const tempo = this.gradeTempo(phases);
    const rotation = this.gradeRotation(poses, phases);
    const balance = this.gradeBalance(poses, trajectory);
    const plane = this.gradeSwingPlane(trajectory, phases);
    const power = this.gradePower(trajectory, phases, club);
    const consistency = this.gradeConsistency(poses, trajectory);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(tempo, rotation, balance, plane, power, consistency);
    
    // Generate comparison metrics
    const comparison = this.generateComparison(tempo, rotation, balance, plane, power, consistency);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(tempo, rotation, balance, plane, power, consistency);

    return {
      overall: {
        score: overallScore,
        letter: this.scoreToLetter(overallScore),
        description: this.getOverallDescription(overallScore)
      },
      categories: {
        tempo,
        rotation,
        balance,
        plane,
        power,
        consistency
      },
      comparison,
      recommendations
    };
  }

  private gradeTempo(phases: SwingPhase[]): GradeCategory {
    const backswingPhase = phases.find(p => p.name === 'backswing');
    const downswingPhase = phases.find(p => p.name === 'downswing');
    
    const backswingTime = backswingPhase?.duration || 0;
    const downswingTime = downswingPhase?.duration || 0;
    const ratio = downswingTime > 0 ? backswingTime / downswingTime : 0;
    
    const benchmark = PROFESSIONAL_BENCHMARKS.tempo;
    const deviation = Math.abs(ratio - benchmark.ratio);
    const score = Math.max(0, 100 - (deviation / benchmark.tolerance) * 100);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getTempoDescription(ratio, score),
      benchmark: {
        professional: benchmark.ratio,
        amateur: 2.5,
        beginner: 2.0
      },
      current: ratio
    };
  }

  private gradeRotation(poses: PoseResult[], phases: SwingPhase[]): GradeCategory {
    const setupFrame = poses[0];
    const topFrame = phases.find(p => p.name === 'backswing')?.endFrame || Math.floor(poses.length * 0.6);
    const topPose = poses[topFrame] || poses[poses.length - 1];
    
    if (!setupFrame || !topPose) {
      return this.createEmptyGrade('Insufficient data for rotation analysis');
    }
    
    const shoulderRotation = this.calculateRotation(setupFrame, topPose, 11, 12);
    const hipRotation = this.calculateRotation(setupFrame, topPose, 23, 24);
    const xFactor = shoulderRotation - hipRotation;
    
    // Grade each component
    const shoulderScore = this.gradeRotationComponent(shoulderRotation, PROFESSIONAL_BENCHMARKS.rotation.shoulders, 15);
    const hipScore = this.gradeRotationComponent(hipRotation, PROFESSIONAL_BENCHMARKS.rotation.hips, 10);
    const xFactorScore = this.gradeRotationComponent(xFactor, PROFESSIONAL_BENCHMARKS.rotation.xFactor, 8);
    
    const score = (shoulderScore * 0.5) + (hipScore * 0.3) + (xFactorScore * 0.2);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getRotationDescription(shoulderRotation, hipRotation, xFactor, score),
      benchmark: {
        professional: PROFESSIONAL_BENCHMARKS.rotation.shoulders,
        amateur: 85,
        beginner: 70
      },
      current: shoulderRotation
    };
  }

  private gradeBalance(poses: PoseResult[], _trajectory: { rightWrist: TrajectoryPoint[] }): GradeCategory {
    let totalDeviation = 0;
    let validFrames = 0;
    
    for (let i = 0; i < poses.length; i++) {
      const pose = poses[i];
      const leftAnkle = pose.landmarks[27];
      const rightAnkle = pose.landmarks[28];
      
      if (leftAnkle && rightAnkle && 
          leftAnkle.visibility && leftAnkle.visibility > 0.5 &&
          rightAnkle.visibility && rightAnkle.visibility > 0.5) {
        
        const centerX = (leftAnkle.x + rightAnkle.x) / 2;
        const deviation = Math.abs(centerX - 0.5); // 0.5 is center of frame
        totalDeviation += deviation;
        validFrames++;
      }
    }
    
    const avgDeviation = validFrames > 0 ? totalDeviation / validFrames : 0;
    const stability = Math.max(0, 1 - avgDeviation * 2); // Convert to 0-1 scale
    const score = stability * 100;
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getBalanceDescription(stability, score),
      benchmark: {
        professional: 95,
        amateur: 80,
        beginner: 60
      },
      current: Math.round(stability * 100)
    };
  }

  private gradeSwingPlane(trajectory: { rightWrist: TrajectoryPoint[] }, _phases: SwingPhase[]): GradeCategory {
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 10) {
      return this.createEmptyGrade('Insufficient data for plane analysis');
    }
    
    // Calculate consistency
    let totalDeviation = 0;
    for (let i = 1; i < rightWrist.length - 1; i++) {
      const prev = rightWrist[i - 1];
      const curr = rightWrist[i];
      const next = rightWrist[i + 1];
      
      const expectedY = prev.y + (next.y - prev.y) / 2;
      const deviation = Math.abs(curr.y - expectedY);
      totalDeviation += deviation;
    }
    
    const consistency = Math.max(0, 1 - (totalDeviation / rightWrist.length));
    const score = consistency * 100;
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getPlaneDescription(consistency, score),
      benchmark: {
        professional: 90,
        amateur: 75,
        beginner: 60
      },
      current: Math.round(consistency * 100)
    };
  }

  private gradePower(trajectory: { rightWrist: TrajectoryPoint[] }, phases: SwingPhase[], club: string): GradeCategory {
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 2) {
      return this.createEmptyGrade('Insufficient data for power analysis');
    }
    
    // Calculate clubhead speed (simplified)
    let maxSpeed = 0;
    for (let i = 1; i < rightWrist.length; i++) {
      const prev = rightWrist[i - 1];
      const curr = rightWrist[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      if (timeDiff <= 0) continue;
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + 
        Math.pow(curr.y - prev.y, 2) + 
        Math.pow(curr.z - prev.z, 2)
      );
      const speed = distance / timeDiff;
      maxSpeed = Math.max(maxSpeed, speed);
    }
    
    // Convert to mph (rough approximation)
    const clubheadSpeed = maxSpeed * 0.1;
    
    // Grade based on club type
    const benchmarks = this.getPowerBenchmarks(club);
    const score = Math.min(100, (clubheadSpeed / benchmarks.professional) * 100);
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getPowerDescription(clubheadSpeed, club, score),
      benchmark: {
        professional: benchmarks.professional,
        amateur: benchmarks.amateur,
        beginner: benchmarks.beginner
      },
      current: Math.round(clubheadSpeed)
    };
  }

  private gradeConsistency(poses: PoseResult[], trajectory: { rightWrist: TrajectoryPoint[] }): GradeCategory {
    // Analyze repeatability across the swing
    const rightWrist = trajectory.rightWrist;
    if (rightWrist.length < 10) {
      return this.createEmptyGrade('Insufficient data for consistency analysis');
    }
    
    // Calculate variance in key positions
    const positions = rightWrist.map(point => ({ x: point.x, y: point.y }));
    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
    
    const variance = positions.reduce((sum, p) => {
      const dx = p.x - avgX;
      const dy = p.y - avgY;
      return sum + (dx * dx + dy * dy);
    }, 0) / positions.length;
    
    const consistency = Math.max(0, 1 - Math.sqrt(variance) * 10);
    const score = consistency * 100;
    
    return {
      score: Math.round(score),
      letter: this.scoreToLetter(score),
      description: this.getConsistencyDescription(consistency, score),
      benchmark: {
        professional: 85,
        amateur: 70,
        beginner: 50
      },
      current: Math.round(consistency * 100)
    };
  }

  private calculateOverallScore(tempo: GradeCategory, rotation: GradeCategory, balance: GradeCategory, 
                              plane: GradeCategory, power: GradeCategory, consistency: GradeCategory): number {
    const weights = PROFESSIONAL_BENCHMARKS;
    
    return Math.round(
      tempo.score * weights.tempo.weight +
      rotation.score * weights.rotation.weight +
      balance.score * weights.balance.weight +
      plane.score * weights.plane.weight +
      power.score * weights.power.weight +
      consistency.score * weights.consistency.weight
    );
  }

  private generateComparison(tempo: GradeCategory, rotation: GradeCategory, balance: GradeCategory,
                           plane: GradeCategory, power: GradeCategory, consistency: GradeCategory) {
    const overallScore = this.calculateOverallScore(tempo, rotation, balance, plane, power, consistency);
    
    return {
      vsProfessional: Math.round((overallScore / 100) * 100),
      vsAmateur: Math.round(((overallScore - 60) / 40) * 100), // Assuming 60 is amateur baseline
      percentile: this.calculatePercentile(overallScore)
    };
  }

  private generateRecommendations(tempo: GradeCategory, rotation: GradeCategory, balance: GradeCategory,
                                plane: GradeCategory, power: GradeCategory, consistency: GradeCategory) {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(tempo, rotation, balance, plane, power, consistency);
    
    // Immediate fixes (score < 60)
    if (tempo.score < 60) immediate.push('Focus on smoother tempo - count "1-2-3" for backswing, "1" for downswing');
    if (balance.score < 60) immediate.push('Work on staying balanced - practice with feet closer together');
    if (plane.score < 60) immediate.push('Keep your swing on plane - imagine swinging inside a barrel');
    
    // Short-term improvements (score 60-80)
    if (rotation.score < 80 && rotation.score >= 60) shortTerm.push('Increase shoulder turn - feel your back turn to the target');
    if (power.score < 80 && power.score >= 60) shortTerm.push('Generate more clubhead speed - work on wrist hinge and release');
    if (consistency.score < 80 && consistency.score >= 60) shortTerm.push('Practice the same swing motion repeatedly');
    
    // Long-term development (any score)
    if (overallScore < 90) longTerm.push('Consider professional lessons for personalized instruction');
    if (overallScore < 80) longTerm.push('Develop a consistent pre-shot routine');
    if (overallScore < 70) longTerm.push('Focus on fundamentals before advanced techniques');
    
    return { immediate, shortTerm, longTerm };
  }

  // Helper methods
  private scoreToLetter(score: number): string {
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
    return 'F';
  }

  private calculateRotation(setup: PoseResult, top: PoseResult, leftIndex: number, rightIndex: number): number {
    const setupLeft = setup.landmarks[leftIndex];
    const setupRight = setup.landmarks[rightIndex];
    const topLeft = top.landmarks[leftIndex];
    const topRight = top.landmarks[rightIndex];
    
    if (!setupLeft || !setupRight || !topLeft || !topRight) return 0;
    
    const setupAngle = Math.atan2(setupRight.y - setupLeft.y, setupRight.x - setupLeft.x);
    const topAngle = Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x);
    
    return Math.abs(topAngle - setupAngle) * 180 / Math.PI;
  }

  private gradeRotationComponent(value: number, target: number, tolerance: number): number {
    const deviation = Math.abs(value - target);
    return Math.max(0, 100 - (deviation / tolerance) * 100);
  }

  private getPowerBenchmarks(club: string) {
    const benchmarks: { [key: string]: { professional: number; amateur: number; beginner: number } } = {
      driver: { professional: 110, amateur: 95, beginner: 80 },
      iron: { professional: 90, amateur: 80, beginner: 70 },
      wedge: { professional: 70, amateur: 60, beginner: 50 }
    };
    return benchmarks[club] || benchmarks.driver;
  }

  private calculatePercentile(score: number): number {
    // Rough percentile calculation based on typical golf score distribution
    if (score >= 95) return 95;
    if (score >= 90) return 85;
    if (score >= 85) return 75;
    if (score >= 80) return 65;
    if (score >= 75) return 55;
    if (score >= 70) return 45;
    if (score >= 65) return 35;
    if (score >= 60) return 25;
    if (score >= 55) return 15;
    return 5;
  }

  private createEmptyGrade(description: string): GradeCategory {
    return {
      score: 0,
      letter: 'F',
      description,
      benchmark: { professional: 0, amateur: 0, beginner: 0 },
      current: 0
    };
  }

  // Description methods
  private getOverallDescription(score: number): string {
    if (score >= 90) return 'Exceptional swing! You\'re performing at a professional level.';
    if (score >= 80) return 'Great swing! You\'re above average with room for minor improvements.';
    if (score >= 70) return 'Good swing! Focus on consistency and fundamentals.';
    if (score >= 60) return 'Decent swing! Several areas need improvement.';
    return 'Needs significant work. Focus on fundamentals and consider lessons.';
  }

  private getTempoDescription(ratio: number, score: number): string {
    if (score >= 90) return `Excellent tempo at ${ratio.toFixed(2)}:1 ratio.`;
    if (score >= 70) return `Good tempo at ${ratio.toFixed(2)}:1 ratio.`;
    return `Tempo needs work at ${ratio.toFixed(2)}:1 ratio. Target 3:1.`;
  }

  private getRotationDescription(shoulders: number, hips: number, xFactor: number, score: number): string {
    if (score >= 90) return `Excellent rotation: ${shoulders.toFixed(0)}° shoulders, ${xFactor.toFixed(0)}° separation.`;
    if (score >= 70) return `Good rotation: ${shoulders.toFixed(0)}° shoulders, ${xFactor.toFixed(0)}° separation.`;
    return `Rotation needs work: ${shoulders.toFixed(0)}° shoulders, ${xFactor.toFixed(0)}° separation.`;
  }

  private getBalanceDescription(stability: number, score: number): string {
    if (score >= 90) return `Excellent balance throughout the swing.`;
    if (score >= 70) return `Good balance with minor improvements needed.`;
    return `Balance needs work - focus on staying centered.`;
  }

  private getPlaneDescription(consistency: number, score: number): string {
    if (score >= 90) return `Very consistent swing plane.`;
    if (score >= 70) return `Good swing plane with room for improvement.`;
    return `Swing plane needs work - focus on consistency.`;
  }

  private getPowerDescription(speed: number, club: string, score: number): string {
    if (score >= 90) return `Excellent power: ${speed.toFixed(0)} mph with ${club}.`;
    if (score >= 70) return `Good power: ${speed.toFixed(0)} mph with ${club}.`;
    return `Power needs work: ${speed.toFixed(0)} mph with ${club}.`;
  }

  private getConsistencyDescription(consistency: number, score: number): string {
    if (score >= 90) return `Very consistent swing motion.`;
    if (score >= 70) return `Good consistency with room for improvement.`;
    return `Consistency needs work - practice the same motion.`;
  }
}
