/**
 * Enhanced Grading System with Consistency Scoring
 * 
 * Integrates consistency scoring with the existing grading system
 * to provide more sophisticated evaluation based on variability
 * across multiple swings.
 */

import { ComprehensiveGolfGradingSystem, ComprehensiveGolfGrade } from './comprehensive-golf-grading';
import { ConsistencyScoringSystem, ConsistencyMetrics, SwingAnalysis } from './consistency-scoring';
import { PoseResult } from './mediapipe';

// 🎯 ENHANCED GRADING INTERFACES
export interface EnhancedGolfGrade extends ComprehensiveGolfGrade {
  consistency: {
    overall: ConsistencyMetrics;
    comparison: {
      current: number;
      average: number;
      trend: 'improving' | 'declining' | 'stable';
      variability: number;
    };
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  };
  session: {
    sessionId: string;
    swingCount: number;
    sessionStart: number;
    sessionEnd: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
  };
}

export interface GradingSession {
  sessionId: string;
  startTime: number;
  endTime: number;
  swings: SwingAnalysis[];
  averageScore: number;
  bestScore: number;
  worstScore: number;
  consistency: ConsistencyMetrics;
}

// 🚀 ENHANCED GRADING SYSTEM CLASS
export class EnhancedGradingSystem {
  private gradingSystem: ComprehensiveGolfGradingSystem;
  private consistencySystem: ConsistencyScoringSystem;
  private currentSession: GradingSession | null = null;
  private isInitialized = false;

  constructor() {
    this.gradingSystem = new ComprehensiveGolfGradingSystem();
    this.consistencySystem = new ConsistencyScoringSystem();
  }

  /**
   * Initialize the enhanced grading system
   */
  async initialize(): Promise<void> {
    try {
      console.log('🏌️ ENHANCED GRADING: Initializing enhanced grading system...');
      
      this.isInitialized = true;
      console.log('✅ ENHANCED GRADING: Enhanced grading system ready');
      
    } catch (error) {
      console.error('❌ ENHANCED GRADING: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start a new grading session
   */
  startSession(sessionId?: string): string {
    if (!this.isInitialized) {
      throw new Error('Enhanced grading system not initialized');
    }

    const newSessionId = sessionId || this.generateSessionId();
    const startTime = Date.now();
    
    this.currentSession = {
      sessionId: newSessionId,
      startTime,
      endTime: startTime,
      swings: [],
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      consistency: this.consistencySystem.calculateConsistencyMetrics()
    };

    console.log(`🏌️ ENHANCED GRADING: Started new session ${newSessionId}`);
    return newSessionId;
  }

  /**
   * Grade a swing with consistency analysis
   */
  gradeSwingWithConsistency(
    poses: PoseResult[],
    trajectory: any,
    phases: any[],
    club: string = 'driver'
  ): EnhancedGolfGrade {
    if (!this.isInitialized) {
      throw new Error('Enhanced grading system not initialized');
    }

    if (!this.currentSession) {
      this.startSession();
    }

    try {
      console.log('🏌️ ENHANCED GRADING: Grading swing with consistency analysis...');
      
      // Grade the swing using the existing system
      const baseGrade = this.gradingSystem.gradeSwing(poses, trajectory, phases, club);
      
      // Add to consistency system
      const swingId = this.consistencySystem.addSwingAnalysis(baseGrade, {
        sessionId: this.currentSession!.sessionId,
        timestamp: Date.now()
      });
      
      // Calculate consistency metrics
      const consistencyMetrics = this.consistencySystem.calculateConsistencyMetrics();
      
      // Update session
      this.updateSession(baseGrade);
      
      // Create enhanced grade
      const enhancedGrade = this.createEnhancedGrade(baseGrade, consistencyMetrics);
      
      console.log(`✅ ENHANCED GRADING: Swing graded with consistency analysis (ID: ${swingId})`);
      return enhancedGrade;
      
    } catch (error) {
      console.error('❌ ENHANCED GRADING: Failed to grade swing with consistency:', error);
      throw error;
    }
  }

  /**
   * Get current session information
   */
  getCurrentSession(): GradingSession | null {
    return this.currentSession;
  }

  /**
   * Get consistency metrics for current session
   */
  getConsistencyMetrics(): ConsistencyMetrics {
    return this.consistencySystem.calculateConsistencyMetrics();
  }

  /**
   * Get swing history
   */
  getSwingHistory(): SwingAnalysis[] {
    return this.consistencySystem.getSwingHistory();
  }

  /**
   * Compare current swing with previous
   */
  compareWithPrevious(swingId: string): any {
    return this.consistencySystem.compareWithPrevious(swingId);
  }

  /**
   * End current session
   */
  endSession(): GradingSession | null {
    if (!this.currentSession) {
      return null;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.consistency = this.consistencySystem.calculateConsistencyMetrics();
    
    const session = { ...this.currentSession };
    this.currentSession = null;
    
    console.log(`🏌️ ENHANCED GRADING: Ended session ${session.sessionId}`);
    return session;
  }

  /**
   * Reset the enhanced grading system
   */
  reset(): void {
    this.consistencySystem.reset();
    this.currentSession = null;
    console.log('🏌️ ENHANCED GRADING: Enhanced grading system reset');
  }

  // 🎯 PRIVATE METHODS

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateSession(grade: ComprehensiveGolfGrade): void {
    if (!this.currentSession) return;

    const swingAnalysis: SwingAnalysis = {
      id: `swing_${Date.now()}`,
      timestamp: Date.now(),
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
        sessionId: this.currentSession.sessionId
      }
    };

    this.currentSession.swings.push(swingAnalysis);
    this.currentSession.endTime = Date.now();
    
    // Update session statistics
    const scores = this.currentSession.swings.map(swing => swing.grade.overall.score);
    this.currentSession.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    this.currentSession.bestScore = Math.max(...scores);
    this.currentSession.worstScore = Math.min(...scores);
  }

  private createEnhancedGrade(baseGrade: ComprehensiveGolfGrade, consistencyMetrics: ConsistencyMetrics): EnhancedGolfGrade {
    const swingHistory = this.consistencySystem.getSwingHistory();
    const currentScore = baseGrade.overall.score;
    const averageScore = swingHistory.length > 0 
      ? swingHistory.reduce((sum, swing) => sum + swing.grade.overall.score, 0) / swingHistory.length 
      : currentScore;
    
    const trend = this.calculateTrend(swingHistory);
    const variability = this.calculateVariability(swingHistory);

    return {
      ...baseGrade,
      consistency: {
        overall: consistencyMetrics,
        comparison: {
          current: currentScore,
          average: Math.round(averageScore),
          trend,
          variability: Math.round(variability * 100) / 100
        },
        recommendations: this.generateConsistencyRecommendations(consistencyMetrics, trend, variability)
      },
      session: {
        sessionId: this.currentSession?.sessionId || 'unknown',
        swingCount: swingHistory.length,
        sessionStart: this.currentSession?.startTime || Date.now(),
        sessionEnd: this.currentSession?.endTime || Date.now(),
        averageScore: Math.round(averageScore),
        bestScore: Math.max(...swingHistory.map(swing => swing.grade.overall.score)),
        worstScore: Math.min(...swingHistory.map(swing => swing.grade.overall.score))
      }
    };
  }

  private calculateTrend(swingHistory: SwingAnalysis[]): 'improving' | 'declining' | 'stable' {
    if (swingHistory.length < 3) return 'stable';

    const scores = swingHistory.map(swing => swing.grade.overall.score);
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

  private calculateVariability(swingHistory: SwingAnalysis[]): number {
    if (swingHistory.length < 2) return 0;

    const scores = swingHistory.map(swing => swing.grade.overall.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    return standardDeviation / mean; // Coefficient of variation
  }

  private generateConsistencyRecommendations(
    consistencyMetrics: ConsistencyMetrics,
    trend: string,
    variability: number
  ): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate recommendations based on consistency
    if (consistencyMetrics.overall.score < 70) {
      immediate.push('Focus on improving swing consistency');
      immediate.push('Practice the same swing motion repeatedly');
    }

    if (variability > 0.2) {
      immediate.push('Work on reducing swing-to-swing variability');
    }

    // Short-term recommendations
    if (trend === 'declining') {
      shortTerm.push('Focus on maintaining current performance level');
      shortTerm.push('Identify and address declining areas');
    } else if (trend === 'improving') {
      shortTerm.push('Continue current improvement trajectory');
      shortTerm.push('Build on recent improvements');
    }

    // Long-term recommendations
    if (consistencyMetrics.statistics.totalSwings < 10) {
      longTerm.push('Record more swings to build consistency data');
      longTerm.push('Develop a regular practice routine');
    } else if (consistencyMetrics.overall.score < 80) {
      longTerm.push('Work with a golf instructor on consistency');
      longTerm.push('Focus on fundamental swing mechanics');
    }

    return { immediate, shortTerm, longTerm };
  }
}

// 🎯 USAGE EXAMPLES

/**
 * Example: Basic enhanced grading with consistency
 */
export function basicEnhancedGrading(poses: PoseResult[], trajectory: any, phases: any[]): void {
  console.log('🏌️ ENHANCED GRADING: Running basic enhanced grading with consistency...');
  
  const system = new EnhancedGradingSystem();
  
  try {
    system.initialize();
    system.startSession();
    
    const enhancedGrade = system.gradeSwingWithConsistency(poses, trajectory, phases);
    
    console.log('\n📊 ENHANCED GRADING RESULTS:');
    console.log(`   Overall Score: ${enhancedGrade.overall.score} (${enhancedGrade.overall.letter})`);
    console.log(`   Consistency Score: ${enhancedGrade.consistency.overall.overall.score} (${enhancedGrade.consistency.overall.overall.letter})`);
    console.log(`   Trend: ${enhancedGrade.consistency.comparison.trend}`);
    console.log(`   Variability: ${enhancedGrade.consistency.comparison.variability}%`);
    console.log(`   Session Swings: ${enhancedGrade.session.swingCount}`);
    
    // Show consistency recommendations
    console.log('\n💡 CONSISTENCY RECOMMENDATIONS:');
    enhancedGrade.consistency.recommendations.immediate.forEach(rec => {
      console.log(`   Immediate: ${rec}`);
    });
    enhancedGrade.consistency.recommendations.shortTerm.forEach(rec => {
      console.log(`   Short-term: ${rec}`);
    });
    enhancedGrade.consistency.recommendations.longTerm.forEach(rec => {
      console.log(`   Long-term: ${rec}`);
    });
    
  } finally {
    system.reset();
  }
}

/**
 * Example: Multi-swing consistency analysis
 */
export function multiSwingConsistencyAnalysis(swingData: { poses: PoseResult[]; trajectory: any; phases: any[] }[]): void {
  console.log('📊 CONSISTENCY ANALYSIS: Running multi-swing consistency analysis...');
  
  const system = new EnhancedGradingSystem();
  
  try {
    system.initialize();
    const sessionId = system.startSession();
    
    const enhancedGrades: EnhancedGolfGrade[] = [];
    
    // Grade each swing
    swingData.forEach((swing, index) => {
      console.log(`\n🏌️ Grading swing ${index + 1}/${swingData.length}...`);
      
      const enhancedGrade = system.gradeSwingWithConsistency(
        swing.poses,
        swing.trajectory,
        swing.phases
      );
      
      enhancedGrades.push(enhancedGrade);
      
      console.log(`   Score: ${enhancedGrade.overall.score} (${enhancedGrade.overall.letter})`);
      console.log(`   Consistency: ${enhancedGrade.consistency.overall.overall.score} (${enhancedGrade.consistency.overall.overall.letter})`);
      console.log(`   Trend: ${enhancedGrade.consistency.comparison.trend}`);
    });
    
    // Get final consistency metrics
    const finalConsistency = system.getConsistencyMetrics();
    const session = system.endSession();
    
    console.log('\n📊 FINAL CONSISTENCY ANALYSIS:');
    console.log(`   Total Swings: ${finalConsistency.statistics.totalSwings}`);
    console.log(`   Average Score: ${finalConsistency.statistics.averageScore}`);
    console.log(`   Best Score: ${finalConsistency.statistics.bestScore}`);
    console.log(`   Worst Score: ${finalConsistency.statistics.worstScore}`);
    console.log(`   Standard Deviation: ${finalConsistency.statistics.standardDeviation}`);
    console.log(`   Coefficient of Variation: ${finalConsistency.statistics.coefficientOfVariation}%`);
    
    // Show category consistency
    console.log('\n📈 CATEGORY CONSISTENCY:');
    Object.entries(finalConsistency.categories).forEach(([category, data]) => {
      console.log(`   ${category}: ${data.score}% (${data.letter}) - Variability: ${data.variability.coefficientOfVariation}%`);
    });
    
    // Show trends
    console.log('\n📈 TRENDS:');
    console.log(`   Improving: ${finalConsistency.trends.improving.join(', ') || 'None'}`);
    console.log(`   Declining: ${finalConsistency.trends.declining.join(', ') || 'None'}`);
    console.log(`   Stable: ${finalConsistency.trends.stable.join(', ') || 'None'}`);
    
  } finally {
    system.reset();
  }
}

/**
 * Example: Session-based grading
 */
export function sessionBasedGrading(swingData: { poses: PoseResult[]; trajectory: any; phases: any[] }[]): void {
  console.log('🏌️ SESSION GRADING: Running session-based grading...');
  
  const system = new EnhancedGradingSystem();
  
  try {
    system.initialize();
    const sessionId = system.startSession();
    
    console.log(`📊 Started session: ${sessionId}`);
    
    // Grade all swings in the session
    swingData.forEach((swing, index) => {
      const enhancedGrade = system.gradeSwingWithConsistency(
        swing.poses,
        swing.trajectory,
        swing.phases
      );
      
      console.log(`Swing ${index + 1}: ${enhancedGrade.overall.score} (${enhancedGrade.overall.letter})`);
    });
    
    // End session and get results
    const session = system.endSession();
    
    if (session) {
      console.log('\n📊 SESSION RESULTS:');
      console.log(`   Session ID: ${session.sessionId}`);
      console.log(`   Duration: ${((session.endTime - session.startTime) / 1000).toFixed(1)}s`);
      console.log(`   Total Swings: ${session.swings.length}`);
      console.log(`   Average Score: ${session.averageScore.toFixed(1)}`);
      console.log(`   Best Score: ${session.bestScore}`);
      console.log(`   Worst Score: ${session.worstScore}`);
      console.log(`   Consistency Score: ${session.consistency.overall.overall.score} (${session.consistency.overall.overall.letter})`);
    }
    
  } finally {
    system.reset();
  }
}

export default EnhancedGradingSystem;
