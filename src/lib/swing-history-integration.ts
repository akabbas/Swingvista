/**
 * Swing History Integration - Safe Integration Point
 * 
 * This is the smallest, safest first step for consistency scoring.
 * Just add this to your existing swing analysis without changing anything else.
 */

import { ComprehensiveGolfGrade } from './comprehensive-golf-grading';
import { SwingHistoryIntegration } from './swing-history-storage';

// 🎯 SAFE INTEGRATION WRAPPER
export class SafeSwingHistoryIntegration {
  private static isEnabled = true;
  private static sessionId: string | null = null;

  /**
   * Start a new session (optional)
   */
  static startSession(sessionId?: string): string {
    this.sessionId = sessionId || `session_${Date.now()}`;
    console.log(`📊 SWING HISTORY: Started session ${this.sessionId}`);
    return this.sessionId;
  }

  /**
   * End current session
   */
  static endSession(): string | null {
    const endedSession = this.sessionId;
    this.sessionId = null;
    console.log(`📊 SWING HISTORY: Ended session ${endedSession}`);
    return endedSession;
  }

  /**
   * Enable/disable history storage
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📊 SWING HISTORY: ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Store swing analysis - SAFE to add to existing code
   * 
   * Just call this after your existing swing analysis completes
   */
  static storeSwingAnalysis(
    grade: ComprehensiveGolfGrade,
    metadata: {
      poseCount: number;
      phaseCount: number;
      dataQuality: number;
      processingTime?: number;
    }
  ): string | null {
    if (!this.isEnabled) {
      return null;
    }

    try {
      return SwingHistoryIntegration.storeSwingWithHistory(
        grade,
        metadata,
        this.sessionId || undefined
      );
    } catch (error) {
      console.warn('Failed to store swing in history:', error);
      return null;
    }
  }

  /**
   * Get basic history statistics
   */
  static getHistoryStats(): any {
    if (!this.isEnabled) {
      return { enabled: false };
    }

    return SwingHistoryIntegration.getHistoryStats();
  }

  /**
   * Get session history
   */
  static getSessionHistory(sessionId?: string): any[] {
    if (!this.isEnabled) {
      return [];
    }

    const targetSessionId = sessionId || this.sessionId;
    if (!targetSessionId) {
      return [];
    }

    // Import here to avoid circular dependency
    const { SwingHistoryStorage } = require('./swing-history-storage');
    return SwingHistoryStorage.getSessionHistory(targetSessionId);
  }
}

// 🎯 EASY INTEGRATION POINTS

/**
 * Add this to your existing swing analysis completion
 * 
 * Example usage in your existing code:
 * 
 * // After swing analysis completes
 * const grade = gradingSystem.gradeSwing(poses, trajectory, phases);
 * 
 * // ADD THIS LINE - it's safe and won't break anything
 * SafeSwingHistoryIntegration.storeSwingAnalysis(grade, {
 *   poseCount: poses.length,
 *   phaseCount: phases.length,
 *   dataQuality: grade.dataQuality.qualityScore,
 *   processingTime: Date.now() - startTime
 * });
 */
export function integrateSwingHistory(
  grade: ComprehensiveGolfGrade,
  metadata: {
    poseCount: number;
    phaseCount: number;
    dataQuality: number;
    processingTime?: number;
  }
): void {
  SafeSwingHistoryIntegration.storeSwingAnalysis(grade, metadata);
}

/**
 * Get history statistics for display
 */
export function getSwingHistoryStats(): any {
  return SafeSwingHistoryIntegration.getHistoryStats();
}

/**
 * Start a practice session
 */
export function startPracticeSession(sessionId?: string): string {
  return SafeSwingHistoryIntegration.startSession(sessionId);
}

/**
 * End a practice session
 */
export function endPracticeSession(): string | null {
  return SafeSwingHistoryIntegration.endSession();
}

// 🎯 USAGE EXAMPLES

/**
 * Example: How to integrate with existing code
 */
export function integrationExample(): void {
  console.log('📊 INTEGRATION EXAMPLE: How to add swing history to existing code...');
  
  // 1. Enable history storage (optional, enabled by default)
  SafeSwingHistoryIntegration.setEnabled(true);
  
  // 2. Start a session (optional)
  const sessionId = SafeSwingHistoryIntegration.startSession('practice-session-1');
  
  // 3. Simulate your existing swing analysis
  const mockGrade: ComprehensiveGolfGrade = {
    overall: { score: 85, letter: 'B', description: 'Good swing', color: 'text-blue-600' },
    categories: {
      tempo: { score: 80, letter: 'B', description: 'Good tempo', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 80 }, weight: 0.15, details: { primary: 'Tempo: 2.8:1', secondary: 'Good rhythm', improvement: 'Maintain tempo' } },
      rotation: { score: 85, letter: 'B', description: 'Good rotation', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 85 }, weight: 0.20, details: { primary: 'Shoulder: 85°', secondary: 'Hip: 45°', improvement: 'Increase rotation' } },
      balance: { score: 90, letter: 'A-', description: 'Excellent balance', color: 'text-green-600', benchmark: { professional: 90, amateur: 70, current: 90 }, weight: 0.15, details: { primary: 'Weight: 85%', secondary: 'Stable', improvement: 'Maintain balance' } },
      swingPlane: { score: 75, letter: 'C+', description: 'Average plane', color: 'text-yellow-600', benchmark: { professional: 90, amateur: 70, current: 75 }, weight: 0.15, details: { primary: 'Angle: 12°', secondary: 'Consistent', improvement: 'Work on plane' } },
      power: { score: 88, letter: 'B+', description: 'Good power', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 88 }, weight: 0.20, details: { primary: 'Speed: 95mph', secondary: 'Efficient', improvement: 'Increase speed' } },
      consistency: { score: 82, letter: 'B', description: 'Good consistency', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 82 }, weight: 0.15, details: { primary: 'Repeatable', secondary: 'Smooth', improvement: 'Practice more' } }
    },
    comparison: { vsProfessional: 85, vsAmateur: 95, percentile: 75 },
    emergencyOverrides: { applied: false, reason: '', originalScore: 85, adjustedScore: 85 },
    recommendations: { immediate: ['Focus on swing plane'], shortTerm: ['Work on consistency'], longTerm: ['Practice regularly'] },
    dataQuality: { poseCount: 50, phaseCount: 6, qualityScore: 85, reliability: 'High' }
  };
  
  // 4. ADD THIS LINE after your existing swing analysis completes
  // This is the ONLY line you need to add to your existing code
  const swingId = SafeSwingHistoryIntegration.storeSwingAnalysis(mockGrade, {
    poseCount: 50,
    phaseCount: 6,
    dataQuality: 85,
    processingTime: 1500
  });
  
  console.log(`✅ Stored swing: ${swingId}`);
  
  // 5. Get statistics (optional)
  const stats = SafeSwingHistoryIntegration.getHistoryStats();
  console.log('📊 History Statistics:', stats);
  
  // 6. End session (optional)
  SafeSwingHistoryIntegration.endSession();
}

/**
 * Example: Multiple swings in a session
 */
export function multiSwingIntegrationExample(): void {
  console.log('📊 MULTI-SWING INTEGRATION: Running multi-swing integration example...');
  
  // Start a session
  const sessionId = SafeSwingHistoryIntegration.startSession('practice-session-2');
  
  // Simulate multiple swings
  for (let i = 0; i < 3; i++) {
    const mockGrade: ComprehensiveGolfGrade = {
      overall: { score: 80 + i * 3, letter: 'B', description: 'Good swing', color: 'text-blue-600' },
      categories: {
        tempo: { score: 80 + i, letter: 'B', description: 'Good tempo', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 80 + i }, weight: 0.15, details: { primary: 'Tempo: 2.8:1', secondary: 'Good rhythm', improvement: 'Maintain tempo' } },
        rotation: { score: 85 + i, letter: 'B', description: 'Good rotation', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 85 + i }, weight: 0.20, details: { primary: 'Shoulder: 85°', secondary: 'Hip: 45°', improvement: 'Increase rotation' } },
        balance: { score: 90, letter: 'A-', description: 'Excellent balance', color: 'text-green-600', benchmark: { professional: 90, amateur: 70, current: 90 }, weight: 0.15, details: { primary: 'Weight: 85%', secondary: 'Stable', improvement: 'Maintain balance' } },
        swingPlane: { score: 75 + i, letter: 'C+', description: 'Average plane', color: 'text-yellow-600', benchmark: { professional: 90, amateur: 70, current: 75 + i }, weight: 0.15, details: { primary: 'Angle: 12°', secondary: 'Consistent', improvement: 'Work on plane' } },
        power: { score: 88 + i, letter: 'B+', description: 'Good power', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 88 + i }, weight: 0.20, details: { primary: 'Speed: 95mph', secondary: 'Efficient', improvement: 'Increase speed' } },
        consistency: { score: 82 + i, letter: 'B', description: 'Good consistency', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 82 + i }, weight: 0.15, details: { primary: 'Repeatable', secondary: 'Smooth', improvement: 'Practice more' } }
      },
      comparison: { vsProfessional: 85 + i, vsAmateur: 95, percentile: 75 + i },
      emergencyOverrides: { applied: false, reason: '', originalScore: 80 + i * 3, adjustedScore: 80 + i * 3 },
      recommendations: { immediate: ['Focus on swing plane'], shortTerm: ['Work on consistency'], longTerm: ['Practice regularly'] },
      dataQuality: { poseCount: 50 + i * 5, phaseCount: 6, qualityScore: 85 + i, reliability: 'High' }
    };
    
    // ADD THIS LINE after each swing analysis completes
    const swingId = SafeSwingHistoryIntegration.storeSwingAnalysis(mockGrade, {
      poseCount: 50 + i * 5,
      phaseCount: 6,
      dataQuality: 85 + i,
      processingTime: 1500 + i * 100
    });
    
    console.log(`Swing ${i + 1}: ${swingId} (Score: ${mockGrade.overall.score})`);
  }
  
  // Get session statistics
  const sessionHistory = SafeSwingHistoryIntegration.getSessionHistory();
  const stats = SafeSwingHistoryIntegration.getHistoryStats();
  
  console.log('\n📊 SESSION RESULTS:');
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   Total Swings: ${sessionHistory.length}`);
  console.log(`   Average Score: ${stats.averageScore}`);
  console.log(`   Best Score: ${stats.bestScore}`);
  console.log(`   Worst Score: ${stats.worstScore}`);
  console.log(`   Recent Trend: ${stats.recentTrend}`);
  
  // End session
  SafeSwingHistoryIntegration.endSession();
}

export default SafeSwingHistoryIntegration;
