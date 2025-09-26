/**
 * Consistency Scoring System
 * 
 * Stores and compares multiple swing analyses to calculate
 * swing-to-swing consistency metrics and grade based on variability.
 */

import { ComprehensiveGolfGrade, CategoryGrade } from './comprehensive-golf-grading';
import { PoseResult } from './mediapipe';

// 🎯 CONSISTENCY SCORING INTERFACES
export interface SwingAnalysis {
  id: string;
  timestamp: number;
  grade: ComprehensiveGolfGrade;
  metrics: {
    tempo: number;
    rotation: number;
    balance: number;
    swingPlane: number;
    power: number;
    consistency: number;
  };
  metadata: {
    poseCount: number;
    phaseCount: number;
    dataQuality: number;
    sessionId?: string;
  };
}

export interface ConsistencyMetrics {
  overall: {
    score: number;
    letter: string;
    description: string;
    color: string;
  };
  categories: {
    tempo: ConsistencyCategory;
    rotation: ConsistencyCategory;
    balance: ConsistencyCategory;
    swingPlane: ConsistencyCategory;
    power: ConsistencyCategory;
    consistency: ConsistencyCategory;
  };
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  statistics: {
    totalSwings: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  };
}

export interface ConsistencyCategory {
  score: number;
  letter: string;
  description: string;
  color: string;
  variability: {
    standardDeviation: number;
    coefficientOfVariation: number;
    range: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  benchmark: {
    professional: number;
    amateur: number;
    current: number;
  };
  details: {
    primary: string;
    secondary: string;
    improvement: string;
  };
}

export interface SwingComparison {
  current: SwingAnalysis;
  previous: SwingAnalysis;
  improvement: {
    overall: number;
    categories: {
      tempo: number;
      rotation: number;
      balance: number;
      swingPlane: number;
      power: number;
      consistency: number;
    };
  };
  changes: {
    improved: string[];
    declined: string[];
    unchanged: string[];
  };
}

// 🚀 CONSISTENCY SCORING CLASS
export class ConsistencyScoringSystem {
  private swingHistory: SwingAnalysis[] = [];
  private maxHistorySize: number = 50; // Keep last 50 swings
  private isInitialized = false;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
    this.isInitialized = true;
  }

  /**
   * Add a new swing analysis to the history
   */
  addSwingAnalysis(grade: ComprehensiveGolfGrade, metadata: any): string {
    if (!this.isInitialized) {
      throw new Error('Consistency scoring system not initialized');
    }

    const swingId = this.generateSwingId();
    const timestamp = Date.now();
    
    const swingAnalysis: SwingAnalysis = {
      id: swingId,
      timestamp,
      grade,
      metrics: {
        tempo: grade.categories.tempo.score,
        rotation: grade.categories.rotation.score,
        balance: grade.categories.balance.score,
        swingPlane: grade.categories.swingPlane.score,
        power: grade.categories.power.score,
        consistency: grade.categories.consistency.score
      },
      metadata: {
        poseCount: grade.dataQuality.poseCount,
        phaseCount: grade.dataQuality.phaseCount,
        dataQuality: grade.dataQuality.qualityScore,
        sessionId: metadata.sessionId
      }
    };

    this.swingHistory.push(swingAnalysis);
    
    // Maintain history size
    if (this.swingHistory.length > this.maxHistorySize) {
      this.swingHistory.shift();
    }

    console.log(`📊 CONSISTENCY: Added swing analysis ${swingId} to history (${this.swingHistory.length} total)`);
    return swingId;
  }

  /**
   * Calculate consistency metrics across all swings
   */
  calculateConsistencyMetrics(): ConsistencyMetrics {
    if (this.swingHistory.length < 2) {
      return this.createInsufficientDataMetrics();
    }

    console.log(`📊 CONSISTENCY: Calculating consistency metrics for ${this.swingHistory.length} swings...`);

    // Calculate overall consistency
    const overallConsistency = this.calculateOverallConsistency();
    
    // Calculate category consistency
    const categoryConsistency = this.calculateCategoryConsistency();
    
    // Calculate trends
    const trends = this.calculateTrends();
    
    // Generate recommendations
    const recommendations = this.generateConsistencyRecommendations(categoryConsistency);
    
    // Calculate statistics
    const statistics = this.calculateStatistics();

    return {
      overall: overallConsistency,
      categories: categoryConsistency,
      trends,
      recommendations,
      statistics
    };
  }

  /**
   * Compare current swing with previous swing
   */
  compareWithPrevious(swingId: string): SwingComparison | null {
    const currentIndex = this.swingHistory.findIndex(swing => swing.id === swingId);
    if (currentIndex === -1 || currentIndex === 0) {
      return null; // No previous swing to compare
    }

    const current = this.swingHistory[currentIndex];
    const previous = this.swingHistory[currentIndex - 1];

    const improvement = this.calculateImprovement(current, previous);
    const changes = this.identifyChanges(current, previous);

    return {
      current,
      previous,
      improvement,
      changes
    };
  }

  /**
   * Get swing history for analysis
   */
  getSwingHistory(): SwingAnalysis[] {
    return [...this.swingHistory];
  }

  /**
   * Get consistency statistics
   */
  getConsistencyStatistics(): any {
    if (this.swingHistory.length < 2) {
      return {
        totalSwings: this.swingHistory.length,
        averageScore: this.swingHistory.length > 0 ? this.swingHistory[0].grade.overall.score : 0,
        bestScore: this.swingHistory.length > 0 ? this.swingHistory[0].grade.overall.score : 0,
        worstScore: this.swingHistory.length > 0 ? this.swingHistory[0].grade.overall.score : 0,
        standardDeviation: 0,
        coefficientOfVariation: 0
      };
    }

    const scores = this.swingHistory.map(swing => swing.grade.overall.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    const standardDeviation = this.calculateStandardDeviation(scores);
    const coefficientOfVariation = standardDeviation / averageScore;

    return {
      totalSwings: this.swingHistory.length,
      averageScore: Math.round(averageScore),
      bestScore,
      worstScore,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100
    };
  }

  /**
   * Reset consistency scoring system
   */
  reset(): void {
    this.swingHistory = [];
    console.log('📊 CONSISTENCY: Consistency scoring system reset');
  }

  // 🎯 PRIVATE METHODS

  private generateSwingId(): string {
    return `swing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateOverallConsistency(): {
    score: number;
    letter: string;
    description: string;
    color: string;
  } {
    const scores = this.swingHistory.map(swing => swing.grade.overall.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const standardDeviation = this.calculateStandardDeviation(scores);
    const coefficientOfVariation = standardDeviation / averageScore;

    // Consistency score is based on low variability (high consistency)
    const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100));
    
    return {
      score: Math.round(consistencyScore),
      letter: this.scoreToLetter(consistencyScore),
      description: this.getConsistencyDescription(consistencyScore, coefficientOfVariation),
      color: this.getScoreColor(consistencyScore)
    };
  }

  private calculateCategoryConsistency(): {
    tempo: ConsistencyCategory;
    rotation: ConsistencyCategory;
    balance: ConsistencyCategory;
    swingPlane: ConsistencyCategory;
    power: ConsistencyCategory;
    consistency: ConsistencyCategory;
  } {
    const categories = ['tempo', 'rotation', 'balance', 'swingPlane', 'power', 'consistency'] as const;
    const result: any = {};

    categories.forEach(category => {
      const scores = this.swingHistory.map(swing => swing.metrics[category]);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const standardDeviation = this.calculateStandardDeviation(scores);
      const coefficientOfVariation = standardDeviation / averageScore;
      const range = Math.max(...scores) - Math.min(...scores);
      const trend = this.calculateTrend(scores);

      const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100));

      result[category] = {
        score: Math.round(consistencyScore),
        letter: this.scoreToLetter(consistencyScore),
        description: this.getCategoryConsistencyDescription(category, consistencyScore, coefficientOfVariation),
        color: this.getScoreColor(consistencyScore),
        variability: {
          standardDeviation: Math.round(standardDeviation * 100) / 100,
          coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
          range: Math.round(range),
          trend
        },
        benchmark: {
          professional: 90,
          amateur: 70,
          current: Math.round(averageScore)
        },
        details: {
          primary: `${category} consistency: ${Math.round(consistencyScore)}%`,
          secondary: `Variability: ${Math.round(coefficientOfVariation * 100)}%`,
          improvement: this.getCategoryImprovement(category, consistencyScore, trend)
        }
      };
    });

    return result;
  }

  private calculateTrends(): {
    improving: string[];
    declining: string[];
    stable: string[];
  } {
    const categories = ['tempo', 'rotation', 'balance', 'swingPlane', 'power', 'consistency'] as const;
    const trends = {
      improving: [] as string[],
      declining: [] as string[],
      stable: [] as string[]
    };

    categories.forEach(category => {
      const scores = this.swingHistory.map(swing => swing.metrics[category]);
      const trend = this.calculateTrend(scores);
      
      if (trend === 'improving') {
        trends.improving.push(category);
      } else if (trend === 'declining') {
        trends.declining.push(category);
      } else {
        trends.stable.push(category);
      }
    });

    return trends;
  }

  private calculateTrend(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 3) return 'stable';

    // Calculate trend using linear regression
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (slope > 0.5) return 'improving';
    if (slope < -0.5) return 'declining';
    return 'stable';
  }

  private generateConsistencyRecommendations(categoryConsistency: any): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Find categories with low consistency
    const lowConsistencyCategories = Object.entries(categoryConsistency)
      .filter(([_, category]: [string, any]) => category.score < 70)
      .map(([name, _]) => name);

    if (lowConsistencyCategories.length > 0) {
      immediate.push(`Focus on improving consistency in: ${lowConsistencyCategories.join(', ')}`);
      immediate.push('Practice the same swing motion repeatedly');
    }

    // Find categories with high variability
    const highVariabilityCategories = Object.entries(categoryConsistency)
      .filter(([_, category]: [string, any]) => category.variability.coefficientOfVariation > 0.2)
      .map(([name, _]) => name);

    if (highVariabilityCategories.length > 0) {
      shortTerm.push(`Work on reducing variability in: ${highVariabilityCategories.join(', ')}`);
      shortTerm.push('Focus on one aspect at a time');
    }

    // Long-term recommendations
    if (lowConsistencyCategories.length > 2) {
      longTerm.push('Develop a consistent practice routine');
      longTerm.push('Work with a golf instructor on fundamentals');
      longTerm.push('Focus on muscle memory development');
    }

    return { immediate, shortTerm, longTerm };
  }

  private calculateStatistics(): {
    totalSwings: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  } {
    const scores = this.swingHistory.map(swing => swing.grade.overall.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    const standardDeviation = this.calculateStandardDeviation(scores);
    const coefficientOfVariation = standardDeviation / averageScore;

    return {
      totalSwings: this.swingHistory.length,
      averageScore: Math.round(averageScore),
      bestScore,
      worstScore,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100
    };
  }

  private calculateImprovement(current: SwingAnalysis, previous: SwingAnalysis): {
    overall: number;
    categories: {
      tempo: number;
      rotation: number;
      balance: number;
      swingPlane: number;
      power: number;
      consistency: number;
    };
  } {
    const overallImprovement = current.grade.overall.score - previous.grade.overall.score;
    
    const categoryImprovements = {
      tempo: current.metrics.tempo - previous.metrics.tempo,
      rotation: current.metrics.rotation - previous.metrics.rotation,
      balance: current.metrics.balance - previous.metrics.balance,
      swingPlane: current.metrics.swingPlane - previous.metrics.swingPlane,
      power: current.metrics.power - previous.metrics.power,
      consistency: current.metrics.consistency - previous.metrics.consistency
    };

    return {
      overall: overallImprovement,
      categories: categoryImprovements
    };
  }

  private identifyChanges(current: SwingAnalysis, previous: SwingAnalysis): {
    improved: string[];
    declined: string[];
    unchanged: string[];
  } {
    const changes = {
      improved: [] as string[],
      declined: [] as string[],
      unchanged: [] as string[]
    };

    const categories = ['tempo', 'rotation', 'balance', 'swingPlane', 'power', 'consistency'] as const;
    
    categories.forEach(category => {
      const currentScore = current.metrics[category];
      const previousScore = previous.metrics[category];
      const difference = currentScore - previousScore;

      if (difference > 5) {
        changes.improved.push(category);
      } else if (difference < -5) {
        changes.declined.push(category);
      } else {
        changes.unchanged.push(category);
      }
    });

    return changes;
  }

  private calculateStandardDeviation(scores: number[]): number {
    if (scores.length < 2) return 0;

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  private createInsufficientDataMetrics(): ConsistencyMetrics {
    return {
      overall: {
        score: 0,
        letter: 'F',
        description: 'Insufficient data for consistency analysis',
        color: 'text-red-600'
      },
      categories: {
        tempo: this.createEmptyConsistencyCategory('tempo'),
        rotation: this.createEmptyConsistencyCategory('rotation'),
        balance: this.createEmptyConsistencyCategory('balance'),
        swingPlane: this.createEmptyConsistencyCategory('swingPlane'),
        power: this.createEmptyConsistencyCategory('power'),
        consistency: this.createEmptyConsistencyCategory('consistency')
      },
      trends: {
        improving: [],
        declining: [],
        stable: []
      },
      recommendations: {
        immediate: ['Record more swings to analyze consistency'],
        shortTerm: ['Practice regularly to build data'],
        longTerm: ['Develop a consistent practice routine']
      },
      statistics: {
        totalSwings: this.swingHistory.length,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        standardDeviation: 0,
        coefficientOfVariation: 0
      }
    };
  }

  private createEmptyConsistencyCategory(category: string): ConsistencyCategory {
    return {
      score: 0,
      letter: 'F',
      description: `Insufficient data for ${category} consistency`,
      color: 'text-red-600',
      variability: {
        standardDeviation: 0,
        coefficientOfVariation: 0,
        range: 0,
        trend: 'stable'
      },
      benchmark: {
        professional: 90,
        amateur: 70,
        current: 0
      },
      details: {
        primary: 'N/A',
        secondary: 'N/A',
        improvement: 'Record more swings'
      }
    };
  }

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

  private getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  private getConsistencyDescription(score: number, coefficientOfVariation: number): string {
    if (score >= 90) return `Excellent consistency (${Math.round(coefficientOfVariation * 100)}% variability)`;
    if (score >= 80) return `Good consistency (${Math.round(coefficientOfVariation * 100)}% variability)`;
    if (score >= 70) return `Average consistency (${Math.round(coefficientOfVariation * 100)}% variability)`;
    return `Poor consistency (${Math.round(coefficientOfVariation * 100)}% variability)`;
  }

  private getCategoryConsistencyDescription(category: string, score: number, coefficientOfVariation: number): string {
    if (score >= 90) return `Excellent ${category} consistency`;
    if (score >= 80) return `Good ${category} consistency`;
    if (score >= 70) return `Average ${category} consistency`;
    return `Poor ${category} consistency`;
  }

  private getCategoryImprovement(category: string, score: number, trend: string): string {
    if (score < 70) return `Focus on improving ${category} consistency`;
    if (trend === 'declining') return `Work on maintaining ${category} consistency`;
    if (trend === 'improving') return `Continue improving ${category} consistency`;
    return `Maintain current ${category} consistency`;
  }
}

// 🎯 UTILITY FUNCTIONS

/**
 * Create a new consistency scoring system
 */
export function createConsistencyScoringSystem(maxHistorySize: number = 50): ConsistencyScoringSystem {
  return new ConsistencyScoringSystem(maxHistorySize);
}

/**
 * Quick consistency analysis
 */
export function analyzeConsistency(swingHistory: SwingAnalysis[]): ConsistencyMetrics {
  const system = createConsistencyScoringSystem();
  
  // Add all swings to the system
  swingHistory.forEach(swing => {
    system.addSwingAnalysis(swing.grade, swing.metadata);
  });
  
  return system.calculateConsistencyMetrics();
}

export default ConsistencyScoringSystem;
