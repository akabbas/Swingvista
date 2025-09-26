/**
 * Swing History Storage - Incremental Implementation
 * 
 * Step 1: Just store swing history without changing existing functionality
 * This is the smallest, safest first step for consistency scoring.
 */

import { ComprehensiveGolfGrade } from './comprehensive-golf-grading';
import { PoseResult } from './mediapipe';

// 🎯 MINIMAL SWING HISTORY INTERFACE
export interface SwingHistoryEntry {
  id: string;
  timestamp: number;
  sessionId?: string;
  grade: {
    overall: {
      score: number;
      letter: string;
    };
    categories: {
      tempo: { score: number; letter: string };
      rotation: { score: number; letter: string };
      balance: { score: number; letter: string };
      swingPlane: { score: number; letter: string };
      power: { score: number; letter: string };
      consistency: { score: number; letter: string };
    };
  };
  metadata: {
    poseCount: number;
    phaseCount: number;
    dataQuality: number;
    processingTime?: number;
  };
}

// 🚀 SIMPLE SWING HISTORY STORAGE
export class SwingHistoryStorage {
  private static STORAGE_KEY = 'swingvista-history';
  private static MAX_HISTORY_SIZE = 100; // Keep last 100 swings

  /**
   * Store a swing analysis in history
   */
  static storeSwingAnalysis(
    grade: ComprehensiveGolfGrade,
    metadata: {
      poseCount: number;
      phaseCount: number;
      dataQuality: number;
      processingTime?: number;
    },
    sessionId?: string
  ): string {
    const swingId = this.generateSwingId();
    const timestamp = Date.now();
    
    const historyEntry: SwingHistoryEntry = {
      id: swingId,
      timestamp,
      sessionId,
      grade: {
        overall: {
          score: grade.overall.score,
          letter: grade.overall.letter
        },
        categories: {
          tempo: {
            score: grade.categories.tempo.score,
            letter: grade.categories.tempo.letter
          },
          rotation: {
            score: grade.categories.rotation.score,
            letter: grade.categories.rotation.letter
          },
          balance: {
            score: grade.categories.balance.score,
            letter: grade.categories.balance.letter
          },
          swingPlane: {
            score: grade.categories.swingPlane.score,
            letter: grade.categories.swingPlane.letter
          },
          power: {
            score: grade.categories.power.score,
            letter: grade.categories.power.letter
          },
          consistency: {
            score: grade.categories.consistency.score,
            letter: grade.categories.consistency.letter
          }
        }
      },
      metadata
    };

    // Get existing history
    const history = this.getHistory();
    history.push(historyEntry);
    
    // Keep only last N swings to prevent storage bloat
    const trimmedHistory = history.slice(-this.MAX_HISTORY_SIZE);
    
    // Store in localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
      console.log(`📊 SWING HISTORY: Stored swing ${swingId} (${trimmedHistory.length} total)`);
    } catch (error) {
      console.warn('Failed to store swing history:', error);
    }
    
    return swingId;
  }

  /**
   * Get swing history
   */
  static getHistory(): SwingHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.warn('Failed to load swing history:', error);
      return [];
    }
  }

  /**
   * Get history for a specific session
   */
  static getSessionHistory(sessionId: string): SwingHistoryEntry[] {
    const history = this.getHistory();
    return history.filter(entry => entry.sessionId === sessionId);
  }

  /**
   * Get recent swings (last N)
   */
  static getRecentSwings(count: number = 10): SwingHistoryEntry[] {
    const history = this.getHistory();
    return history.slice(-count);
  }

  /**
   * Get basic statistics
   */
  static getBasicStats(): {
    totalSwings: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    recentTrend: 'improving' | 'declining' | 'stable';
  } {
    const history = this.getHistory();
    
    if (history.length === 0) {
      return {
        totalSwings: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        recentTrend: 'stable'
      };
    }

    const scores = history.map(entry => entry.grade.overall.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    
    // Calculate recent trend (last 5 swings)
    const recentTrend = this.calculateRecentTrend(history.slice(-5));
    
    return {
      totalSwings: history.length,
      averageScore: Math.round(averageScore),
      bestScore,
      worstScore,
      recentTrend
    };
  }

  /**
   * Clear history (for testing)
   */
  static clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('📊 SWING HISTORY: History cleared');
  }

  // 🎯 PRIVATE METHODS

  private static generateSwingId(): string {
    return `swing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static calculateRecentTrend(recentSwings: SwingHistoryEntry[]): 'improving' | 'declining' | 'stable' {
    if (recentSwings.length < 3) return 'stable';
    
    const scores = recentSwings.map(entry => entry.grade.overall.score);
    
    // Simple trend calculation
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }
}

// 🎯 INTEGRATION HELPER
export class SwingHistoryIntegration {
  private static isEnabled = true;

  /**
   * Enable/disable swing history storage
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📊 SWING HISTORY: ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Store swing analysis with automatic history tracking
   */
  static storeSwingWithHistory(
    grade: ComprehensiveGolfGrade,
    metadata: {
      poseCount: number;
      phaseCount: number;
      dataQuality: number;
      processingTime?: number;
    },
    sessionId?: string
  ): string | null {
    if (!this.isEnabled) {
      console.log('📊 SWING HISTORY: History storage disabled, skipping');
      return null;
    }

    try {
      return SwingHistoryStorage.storeSwingAnalysis(grade, metadata, sessionId);
    } catch (error) {
      console.warn('Failed to store swing in history:', error);
      return null;
    }
  }

  /**
   * Get history statistics
   */
  static getHistoryStats(): any {
    if (!this.isEnabled) {
      return { enabled: false };
    }

    const stats = SwingHistoryStorage.getBasicStats();
    const history = SwingHistoryStorage.getHistory();
    
    return {
      enabled: true,
      ...stats,
      historyLength: history.length,
      lastSwing: history.length > 0 ? history[history.length - 1] : null
    };
  }
}

// 🎯 USAGE EXAMPLES

/**
 * Example: Basic swing history storage
 */
export function basicSwingHistoryExample(): void {
  console.log('📊 SWING HISTORY: Running basic swing history example...');
  
  // Enable history storage
  SwingHistoryIntegration.setEnabled(true);
  
  // Mock a swing analysis result
  const mockGrade: ComprehensiveGolfGrade = {
    overall: { score: 85, letter: 'B', description: 'Good swing', color: 'text-blue-600' },
    categories: {
      tempo: { score: 80, letter: 'B', description: 'Good tempo', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 80 }, weight: 0.15, details: { primary: 'Tempo: 2.8:1', secondary: 'Good rhythm', improvement: 'Maintain current tempo' } },
      rotation: { score: 85, letter: 'B', description: 'Good rotation', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 85 }, weight: 0.20, details: { primary: 'Shoulder: 85°', secondary: 'Hip: 45°', improvement: 'Increase shoulder turn' } },
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
  
  const metadata = {
    poseCount: 50,
    phaseCount: 6,
    dataQuality: 85,
    processingTime: 1500
  };
  
  // Store the swing
  const swingId = SwingHistoryIntegration.storeSwingWithHistory(mockGrade, metadata, 'session-1');
  
  if (swingId) {
    console.log(`✅ Stored swing: ${swingId}`);
    
    // Get statistics
    const stats = SwingHistoryIntegration.getHistoryStats();
    console.log('📊 History Statistics:', stats);
    
    // Get recent swings
    const recentSwings = SwingHistoryStorage.getRecentSwings(5);
    console.log(`📈 Recent Swings: ${recentSwings.length} swings`);
    
    // Get session history
    const sessionHistory = SwingHistoryStorage.getSessionHistory('session-1');
    console.log(`📊 Session History: ${sessionHistory.length} swings`);
  }
}

/**
 * Example: Multiple swings in a session
 */
export function multiSwingSessionExample(): void {
  console.log('📊 MULTI-SWING SESSION: Running multi-swing session example...');
  
  const sessionId = 'session-' + Date.now();
  
  // Simulate multiple swings
  for (let i = 0; i < 5; i++) {
    const mockGrade: ComprehensiveGolfGrade = {
      overall: { score: 80 + i * 2, letter: 'B', description: 'Good swing', color: 'text-blue-600' },
      categories: {
        tempo: { score: 80 + i, letter: 'B', description: 'Good tempo', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 80 + i }, weight: 0.15, details: { primary: 'Tempo: 2.8:1', secondary: 'Good rhythm', improvement: 'Maintain tempo' } },
        rotation: { score: 85 + i, letter: 'B', description: 'Good rotation', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 85 + i }, weight: 0.20, details: { primary: 'Shoulder: 85°', secondary: 'Hip: 45°', improvement: 'Increase rotation' } },
        balance: { score: 90, letter: 'A-', description: 'Excellent balance', color: 'text-green-600', benchmark: { professional: 90, amateur: 70, current: 90 }, weight: 0.15, details: { primary: 'Weight: 85%', secondary: 'Stable', improvement: 'Maintain balance' } },
        swingPlane: { score: 75 + i, letter: 'C+', description: 'Average plane', color: 'text-yellow-600', benchmark: { professional: 90, amateur: 70, current: 75 + i }, weight: 0.15, details: { primary: 'Angle: 12°', secondary: 'Consistent', improvement: 'Work on plane' } },
        power: { score: 88 + i, letter: 'B+', description: 'Good power', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 88 + i }, weight: 0.20, details: { primary: 'Speed: 95mph', secondary: 'Efficient', improvement: 'Increase speed' } },
        consistency: { score: 82 + i, letter: 'B', description: 'Good consistency', color: 'text-blue-600', benchmark: { professional: 90, amateur: 70, current: 82 + i }, weight: 0.15, details: { primary: 'Repeatable', secondary: 'Smooth', improvement: 'Practice more' } }
      },
      comparison: { vsProfessional: 85 + i, vsAmateur: 95, percentile: 75 + i },
      emergencyOverrides: { applied: false, reason: '', originalScore: 80 + i * 2, adjustedScore: 80 + i * 2 },
      recommendations: { immediate: ['Focus on swing plane'], shortTerm: ['Work on consistency'], longTerm: ['Practice regularly'] },
      dataQuality: { poseCount: 50 + i * 5, phaseCount: 6, qualityScore: 85 + i, reliability: 'High' }
    };
    
    const metadata = {
      poseCount: 50 + i * 5,
      phaseCount: 6,
      dataQuality: 85 + i,
      processingTime: 1500 + i * 100
    };
    
    const swingId = SwingHistoryIntegration.storeSwingWithHistory(mockGrade, metadata, sessionId);
    console.log(`Swing ${i + 1}: ${swingId} (Score: ${mockGrade.overall.score})`);
  }
  
  // Get session statistics
  const sessionHistory = SwingHistoryStorage.getSessionHistory(sessionId);
  const stats = SwingHistoryIntegration.getHistoryStats();
  
  console.log('\n📊 SESSION RESULTS:');
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   Total Swings: ${sessionHistory.length}`);
  console.log(`   Average Score: ${stats.averageScore}`);
  console.log(`   Best Score: ${stats.bestScore}`);
  console.log(`   Worst Score: ${stats.worstScore}`);
  console.log(`   Recent Trend: ${stats.recentTrend}`);
}

export default SwingHistoryStorage;
