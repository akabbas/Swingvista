/**
 * Consistency Grading Example
 * 
 * Demonstrates how to use the enhanced grading system with
 * consistency scoring across multiple swings.
 */

import { EnhancedGradingSystem } from './enhanced-grading-with-consistency';
import { ConsistencyScoringSystem, createConsistencyScoringSystem } from './consistency-scoring';
import { PoseResult } from './mediapipe';

// 🎯 CONSISTENCY GRADING EXAMPLES

/**
 * Example 1: Basic consistency grading
 */
export function basicConsistencyGrading(poses: PoseResult[], trajectory: any, phases: any[]): void {
  console.log('🏌️ CONSISTENCY GRADING: Running basic consistency grading...');
  
  const system = new EnhancedGradingSystem();
  
  try {
    system.initialize();
    system.startSession();
    
    const enhancedGrade = system.gradeSwingWithConsistency(poses, trajectory, phases);
    
    console.log('\n📊 CONSISTENCY GRADING RESULTS:');
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
 * Example 2: Multi-swing consistency analysis
 */
export function multiSwingConsistencyAnalysis(swingData: { poses: PoseResult[]; trajectory: any; phases: any[] }[]): void {
  console.log('📊 CONSISTENCY ANALYSIS: Running multi-swing consistency analysis...');
  
  const system = new EnhancedGradingSystem();
  
  try {
    system.initialize();
    const sessionId = system.startSession();
    
    const enhancedGrades: any[] = [];
    
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
 * Example 3: Session-based grading
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

/**
 * Example 4: Compare consistency across sessions
 */
export function compareConsistencyAcrossSessions(sessions: { sessionId: string; swingData: { poses: PoseResult[]; trajectory: any; phases: any[] }[] }[]): void {
  console.log('📊 SESSION COMPARISON: Comparing consistency across sessions...');
  
  const sessionResults: any[] = [];
  
  sessions.forEach((session, sessionIndex) => {
    console.log(`\n🏌️ Processing session ${sessionIndex + 1}/${sessions.length}: ${session.sessionId}`);
    
    const system = new EnhancedGradingSystem();
    
    try {
      system.initialize();
      system.startSession(session.sessionId);
      
      // Grade all swings in this session
      session.swingData.forEach((swing, swingIndex) => {
        const enhancedGrade = system.gradeSwingWithConsistency(
          swing.poses,
          swing.trajectory,
          swing.phases
        );
        
        console.log(`   Swing ${swingIndex + 1}: ${enhancedGrade.overall.score} (${enhancedGrade.overall.letter})`);
      });
      
      // Get session results
      const sessionResult = system.endSession();
      if (sessionResult) {
        sessionResults.push(sessionResult);
      }
      
    } finally {
      system.reset();
    }
  });
  
  // Compare sessions
  console.log('\n📊 SESSION COMPARISON RESULTS:');
  sessionResults.forEach((session, index) => {
    console.log(`\n   Session ${index + 1} (${session.sessionId}):`);
    console.log(`     Swings: ${session.swings.length}`);
    console.log(`     Average Score: ${session.averageScore.toFixed(1)}`);
    console.log(`     Best Score: ${session.bestScore}`);
    console.log(`     Worst Score: ${session.worstScore}`);
    console.log(`     Consistency: ${session.consistency.overall.overall.score} (${session.consistency.overall.overall.letter})`);
    console.log(`     Variability: ${session.consistency.statistics.coefficientOfVariation}%`);
  });
  
  // Find best and worst sessions
  const bestSession = sessionResults.reduce((best, current) => 
    current.consistency.overall.overall.score > best.consistency.overall.overall.score ? current : best
  );
  const worstSession = sessionResults.reduce((worst, current) => 
    current.consistency.overall.overall.score < worst.consistency.overall.overall.score ? current : worst
  );
  
  console.log('\n🏆 SESSION RANKINGS:');
  console.log(`   Best Consistency: Session ${bestSession.sessionId} (${bestSession.consistency.overall.overall.score}%)`);
  console.log(`   Worst Consistency: Session ${worstSession.sessionId} (${worstSession.consistency.overall.overall.score}%)`);
}

/**
 * Example 5: Track improvement over time
 */
export function trackImprovementOverTime(swingData: { poses: PoseResult[]; trajectory: any; phases: any[] }[]): void {
  console.log('📈 IMPROVEMENT TRACKING: Tracking improvement over time...');
  
  const system = new EnhancedGradingSystem();
  
  try {
    system.initialize();
    system.startSession();
    
    const improvementData: { swing: number; score: number; consistency: number; trend: string }[] = [];
    
    // Grade each swing and track improvement
    swingData.forEach((swing, index) => {
      const enhancedGrade = system.gradeSwingWithConsistency(
        swing.poses,
        swing.trajectory,
        swing.phases
      );
      
      improvementData.push({
        swing: index + 1,
        score: enhancedGrade.overall.score,
        consistency: enhancedGrade.consistency.overall.overall.score,
        trend: enhancedGrade.consistency.comparison.trend
      });
      
      console.log(`Swing ${index + 1}: Score=${enhancedGrade.overall.score}, Consistency=${enhancedGrade.consistency.overall.overall.score}, Trend=${enhancedGrade.consistency.comparison.trend}`);
    });
    
    // Analyze improvement trends
    console.log('\n📈 IMPROVEMENT ANALYSIS:');
    
    const scores = improvementData.map(d => d.score);
    const consistencies = improvementData.map(d => d.consistency);
    
    const scoreImprovement = scores[scores.length - 1] - scores[0];
    const consistencyImprovement = consistencies[consistencies.length - 1] - consistencies[0];
    
    console.log(`   Score Improvement: ${scoreImprovement > 0 ? '+' : ''}${scoreImprovement.toFixed(1)} points`);
    console.log(`   Consistency Improvement: ${consistencyImprovement > 0 ? '+' : ''}${consistencyImprovement.toFixed(1)} points`);
    
    // Calculate trend
    const trendCounts = { improving: 0, declining: 0, stable: 0 };
    improvementData.forEach(d => {
      trendCounts[d.trend as keyof typeof trendCounts]++;
    });
    
    console.log(`   Trend Distribution:`);
    console.log(`     Improving: ${trendCounts.improving} swings`);
    console.log(`     Declining: ${trendCounts.declining} swings`);
    console.log(`     Stable: ${trendCounts.stable} swings`);
    
    // Show improvement recommendations
    console.log('\n💡 IMPROVEMENT RECOMMENDATIONS:');
    if (scoreImprovement > 0) {
      console.log(`   ✅ Keep up the good work! Your scores are improving.`);
    } else if (scoreImprovement < -5) {
      console.log(`   ⚠️ Your scores are declining. Focus on fundamentals.`);
    } else {
      console.log(`   📈 Your scores are stable. Work on consistency.`);
    }
    
    if (consistencyImprovement > 0) {
      console.log(`   ✅ Your consistency is improving!`);
    } else if (consistencyImprovement < -5) {
      console.log(`   ⚠️ Your consistency is declining. Practice more regularly.`);
    } else {
      console.log(`   📈 Your consistency is stable. Focus on reducing variability.`);
    }
    
  } finally {
    system.reset();
  }
}

/**
 * Example 6: Consistency scoring standalone
 */
export function consistencyScoringStandalone(swingHistory: any[]): void {
  console.log('📊 CONSISTENCY SCORING: Running standalone consistency scoring...');
  
  const consistencySystem = createConsistencyScoringSystem();
  
  try {
    // Add swings to the system
    swingHistory.forEach((swing, index) => {
      const swingId = consistencySystem.addSwingAnalysis(swing.grade, swing.metadata);
      console.log(`Added swing ${index + 1}: ${swingId}`);
    });
    
    // Calculate consistency metrics
    const consistencyMetrics = consistencySystem.calculateConsistencyMetrics();
    
    console.log('\n📊 CONSISTENCY METRICS:');
    console.log(`   Overall Consistency: ${consistencyMetrics.overall.score}% (${consistencyMetrics.overall.letter})`);
    console.log(`   Total Swings: ${consistencyMetrics.statistics.totalSwings}`);
    console.log(`   Average Score: ${consistencyMetrics.statistics.averageScore}`);
    console.log(`   Standard Deviation: ${consistencyMetrics.statistics.standardDeviation}`);
    console.log(`   Coefficient of Variation: ${consistencyMetrics.statistics.coefficientOfVariation}%`);
    
    // Show category consistency
    console.log('\n📈 CATEGORY CONSISTENCY:');
    Object.entries(consistencyMetrics.categories).forEach(([category, data]) => {
      console.log(`   ${category}: ${data.score}% (${data.letter})`);
      console.log(`     Variability: ${data.variability.coefficientOfVariation}%`);
      console.log(`     Trend: ${data.variability.trend}`);
    });
    
    // Show trends
    console.log('\n📈 TRENDS:');
    console.log(`   Improving: ${consistencyMetrics.trends.improving.join(', ') || 'None'}`);
    console.log(`   Declining: ${consistencyMetrics.trends.declining.join(', ') || 'None'}`);
    console.log(`   Stable: ${consistencyMetrics.trends.stable.join(', ') || 'None'}`);
    
    // Show recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    consistencyMetrics.recommendations.immediate.forEach(rec => {
      console.log(`   Immediate: ${rec}`);
    });
    consistencyMetrics.recommendations.shortTerm.forEach(rec => {
      console.log(`   Short-term: ${rec}`);
    });
    consistencyMetrics.recommendations.longTerm.forEach(rec => {
      console.log(`   Long-term: ${rec}`);
    });
    
  } finally {
    consistencySystem.reset();
  }
}

// 🎯 USAGE EXAMPLES

/**
 * Run all consistency grading examples
 */
export function runAllConsistencyGradingExamples(swingData: { poses: PoseResult[]; trajectory: any; phases: any[] }[]): void {
  console.log('🚀 CONSISTENCY GRADING: Running all consistency grading examples...');
  
  try {
    console.log('\n1. Basic Consistency Grading:');
    basicConsistencyGrading(swingData[0].poses, swingData[0].trajectory, swingData[0].phases);
    
    console.log('\n2. Multi-Swing Consistency Analysis:');
    multiSwingConsistencyAnalysis(swingData);
    
    console.log('\n3. Session-Based Grading:');
    sessionBasedGrading(swingData);
    
    console.log('\n4. Track Improvement Over Time:');
    trackImprovementOverTime(swingData);
    
    console.log('\n✅ CONSISTENCY GRADING: All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ CONSISTENCY GRADING: Examples failed:', error);
  }
}

export default {
  basicConsistencyGrading,
  multiSwingConsistencyAnalysis,
  sessionBasedGrading,
  compareConsistencyAcrossSessions,
  trackImprovementOverTime,
  consistencyScoringStandalone,
  runAllConsistencyGradingExamples
};
