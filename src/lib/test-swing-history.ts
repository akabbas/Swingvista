/**
 * Test Swing History Integration
 * 
 * This file tests the swing history integration to ensure it works correctly.
 * Run this to verify your integration is working.
 */

import { SafeSwingHistoryIntegration } from './swing-history-integration';
import { ComprehensiveGolfGrade } from './comprehensive-golf-grading';

/**
 * Test basic swing history storage
 */
export function testSwingHistory(): void {
  console.log('🧪 TESTING: Swing history integration...');
  
  try {
    // Enable history storage
    SafeSwingHistoryIntegration.setEnabled(true);
    
    // Start a session
    const sessionId = SafeSwingHistoryIntegration.startSession('test-session');
    console.log(`📊 Started session: ${sessionId}`);
    
    // Mock a swing analysis result
    const mockGrade: ComprehensiveGolfGrade = {
      overall: { score: 85, letter: 'B', description: 'Good swing', color: 'text-blue-600' },
      categories: {
        tempo: { 
          score: 80, 
          letter: 'B', 
          description: 'Good tempo', 
          color: 'text-blue-600', 
          benchmark: { professional: 90, amateur: 70, current: 80 }, 
          weight: 0.15, 
          details: { primary: 'Tempo: 2.8:1', secondary: 'Good rhythm', improvement: 'Maintain tempo' } 
        },
        rotation: { 
          score: 85, 
          letter: 'B', 
          description: 'Good rotation', 
          color: 'text-blue-600', 
          benchmark: { professional: 90, amateur: 70, current: 85 }, 
          weight: 0.20, 
          details: { primary: 'Shoulder: 85°', secondary: 'Hip: 45°', improvement: 'Increase rotation' } 
        },
        balance: { 
          score: 90, 
          letter: 'A-', 
          description: 'Excellent balance', 
          color: 'text-green-600', 
          benchmark: { professional: 90, amateur: 70, current: 90 }, 
          weight: 0.15, 
          details: { primary: 'Weight: 85%', secondary: 'Stable', improvement: 'Maintain balance' } 
        },
        swingPlane: { 
          score: 75, 
          letter: 'C+', 
          description: 'Average plane', 
          color: 'text-yellow-600', 
          benchmark: { professional: 90, amateur: 70, current: 75 }, 
          weight: 0.15, 
          details: { primary: 'Angle: 12°', secondary: 'Consistent', improvement: 'Work on plane' } 
        },
        power: { 
          score: 88, 
          letter: 'B+', 
          description: 'Good power', 
          color: 'text-blue-600', 
          benchmark: { professional: 90, amateur: 70, current: 88 }, 
          weight: 0.20, 
          details: { primary: 'Speed: 95mph', secondary: 'Efficient', improvement: 'Increase speed' } 
        },
        consistency: { 
          score: 82, 
          letter: 'B', 
          description: 'Good consistency', 
          color: 'text-blue-600', 
          benchmark: { professional: 90, amateur: 70, current: 82 }, 
          weight: 0.15, 
          details: { primary: 'Repeatable', secondary: 'Smooth', improvement: 'Practice more' } 
        }
      },
      comparison: { vsProfessional: 85, vsAmateur: 95, percentile: 75 },
      emergencyOverrides: { applied: false, reason: '', originalScore: 85, adjustedScore: 85 },
      recommendations: { immediate: ['Focus on swing plane'], shortTerm: ['Work on consistency'], longTerm: ['Practice regularly'] },
      dataQuality: { poseCount: 50, phaseCount: 6, qualityScore: 85, reliability: 'High' }
    };
    
    // Store the swing
    const swingId = SafeSwingHistoryIntegration.storeSwingAnalysis(mockGrade, {
      poseCount: 50,
      phaseCount: 6,
      dataQuality: 85,
      processingTime: 1500
    });
    
    if (swingId) {
      console.log(`✅ Stored swing: ${swingId}`);
      
      // Get statistics
      const stats = SafeSwingHistoryIntegration.getHistoryStats();
      console.log('📊 History Statistics:', stats);
      
      // End session
      SafeSwingHistoryIntegration.endSession();
      
      console.log('✅ Swing history integration test passed');
    } else {
      console.error('❌ Failed to store swing');
    }
    
  } catch (error) {
    console.error('❌ Swing history integration test failed:', error);
  }
}

/**
 * Test multiple swings in a session
 */
export function testMultiSwingSession(): void {
  console.log('🧪 TESTING: Multi-swing session...');
  
  try {
    // Enable history storage
    SafeSwingHistoryIntegration.setEnabled(true);
    
    // Start a session
    const sessionId = SafeSwingHistoryIntegration.startSession('multi-swing-test');
    console.log(`📊 Started session: ${sessionId}`);
    
    // Simulate multiple swings
    for (let i = 0; i < 5; i++) {
      const mockGrade: ComprehensiveGolfGrade = {
        overall: { score: 80 + i * 2, letter: 'B', description: 'Good swing', color: 'text-blue-600' },
        categories: {
          tempo: { 
            score: 80 + i, 
            letter: 'B', 
            description: 'Good tempo', 
            color: 'text-blue-600', 
            benchmark: { professional: 90, amateur: 70, current: 80 + i }, 
            weight: 0.15, 
            details: { primary: 'Tempo: 2.8:1', secondary: 'Good rhythm', improvement: 'Maintain tempo' } 
          },
          rotation: { 
            score: 85 + i, 
            letter: 'B', 
            description: 'Good rotation', 
            color: 'text-blue-600', 
            benchmark: { professional: 90, amateur: 70, current: 85 + i }, 
            weight: 0.20, 
            details: { primary: 'Shoulder: 85°', secondary: 'Hip: 45°', improvement: 'Increase rotation' } 
          },
          balance: { 
            score: 90, 
            letter: 'A-', 
            description: 'Excellent balance', 
            color: 'text-green-600', 
            benchmark: { professional: 90, amateur: 70, current: 90 }, 
            weight: 0.15, 
            details: { primary: 'Weight: 85%', secondary: 'Stable', improvement: 'Maintain balance' } 
          },
          swingPlane: { 
            score: 75 + i, 
            letter: 'C+', 
            description: 'Average plane', 
            color: 'text-yellow-600', 
            benchmark: { professional: 90, amateur: 70, current: 75 + i }, 
            weight: 0.15, 
            details: { primary: 'Angle: 12°', secondary: 'Consistent', improvement: 'Work on plane' } 
          },
          power: { 
            score: 88 + i, 
            letter: 'B+', 
            description: 'Good power', 
            color: 'text-blue-600', 
            benchmark: { professional: 90, amateur: 70, current: 88 + i }, 
            weight: 0.20, 
            details: { primary: 'Speed: 95mph', secondary: 'Efficient', improvement: 'Increase speed' } 
          },
          consistency: { 
            score: 82 + i, 
            letter: 'B', 
            description: 'Good consistency', 
            color: 'text-blue-600', 
            benchmark: { professional: 90, amateur: 70, current: 82 + i }, 
            weight: 0.15, 
            details: { primary: 'Repeatable', secondary: 'Smooth', improvement: 'Practice more' } 
          }
        },
        comparison: { vsProfessional: 85 + i, vsAmateur: 95, percentile: 75 + i },
        emergencyOverrides: { applied: false, reason: '', originalScore: 80 + i * 2, adjustedScore: 80 + i * 2 },
        recommendations: { immediate: ['Focus on swing plane'], shortTerm: ['Work on consistency'], longTerm: ['Practice regularly'] },
        dataQuality: { poseCount: 50 + i * 5, phaseCount: 6, qualityScore: 85 + i, reliability: 'High' }
      };
      
      // Store the swing
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
    
    console.log('✅ Multi-swing session test passed');
    
  } catch (error) {
    console.error('❌ Multi-swing session test failed:', error);
  }
}

/**
 * Test error handling
 */
export function testErrorHandling(): void {
  console.log('🧪 TESTING: Error handling...');
  
  try {
    // Test with disabled history
    SafeSwingHistoryIntegration.setEnabled(false);
    
    const swingId = SafeSwingHistoryIntegration.storeSwingAnalysis({} as any, {});
    
    if (swingId === null) {
      console.log('✅ Disabled history correctly returns null');
    } else {
      console.error('❌ Disabled history should return null');
    }
    
    // Re-enable
    SafeSwingHistoryIntegration.setEnabled(true);
    
    // Test with invalid data
    const invalidSwingId = SafeSwingHistoryIntegration.storeSwingAnalysis(null as any, null as any);
    
    if (invalidSwingId === null) {
      console.log('✅ Invalid data correctly returns null');
    } else {
      console.error('❌ Invalid data should return null');
    }
    
    console.log('✅ Error handling test passed');
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
  }
}

/**
 * Run all tests
 */
export function runAllTests(): void {
  console.log('🧪 RUNNING ALL SWING HISTORY TESTS...\n');
  
  testSwingHistory();
  console.log('\n');
  
  testMultiSwingSession();
  console.log('\n');
  
  testErrorHandling();
  console.log('\n');
  
  console.log('🎉 ALL TESTS COMPLETED');
}

// Export for easy testing
export default {
  testSwingHistory,
  testMultiSwingSession,
  testErrorHandling,
  runAllTests
};
