#!/usr/bin/env node

// Test script to verify the grading fixes
const { ComprehensiveGolfGradingSystem } = require('./src/lib/comprehensive-golf-grading.ts');

// Mock pose data for testing
const mockPoses = Array.from({ length: 50 }, (_, i) => ({
  landmarks: Array.from({ length: 33 }, (_, j) => ({
    x: 0.5 + Math.sin(i * 0.1) * 0.1,
    y: 0.5 + Math.cos(i * 0.1) * 0.1,
    z: 0,
    visibility: 0.9
  })),
  timestamp: i * 100
}));

// Mock trajectory data
const mockTrajectory = {
  rightWrist: Array.from({ length: 50 }, (_, i) => ({
    x: 0.5 + Math.sin(i * 0.2) * 0.2,
    y: 0.5 + Math.cos(i * 0.2) * 0.2,
    z: 0,
    timestamp: i * 100,
    frame: i
  })),
  leftWrist: Array.from({ length: 50 }, (_, i) => ({
    x: 0.4 + Math.sin(i * 0.2) * 0.15,
    y: 0.5 + Math.cos(i * 0.2) * 0.15,
    z: 0,
    timestamp: i * 100,
    frame: i
  }))
};

// Mock phases data
const mockPhases = [
  { name: 'address', startFrame: 0, endFrame: 5, duration: 250 },
  { name: 'backswing', startFrame: 5, endFrame: 15, duration: 500 },
  { name: 'downswing', startFrame: 15, endFrame: 25, duration: 333 },
  { name: 'impact', startFrame: 25, endFrame: 30, duration: 167 },
  { name: 'followThrough', startFrame: 30, endFrame: 50, duration: 667 }
];

console.log('🧪 Testing grading system fixes...');

try {
  const gradingSystem = new ComprehensiveGolfGradingSystem();
  const grade = gradingSystem.gradeSwing(mockPoses, mockTrajectory, mockPhases, 'driver');
  
  console.log('✅ Grading system test completed');
  console.log('📊 Overall Score:', grade.overall.score);
  console.log('📊 Overall Letter:', grade.overall.letter);
  console.log('📊 Category Scores:');
  Object.entries(grade.categories).forEach(([key, value]) => {
    console.log(`  ${key}: ${value.score}/100 (${value.letter})`);
  });
  
  // Check if scores are reasonable (not all 20/100)
  const allScores = Object.values(grade.categories).map(cat => cat.score);
  const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  
  if (avgScore > 30) {
    console.log('✅ PASS: Average score is reasonable:', avgScore.toFixed(1));
  } else {
    console.log('❌ FAIL: Average score is too low:', avgScore.toFixed(1));
  }
  
} catch (error) {
  console.error('❌ Grading system test failed:', error.message);
}
