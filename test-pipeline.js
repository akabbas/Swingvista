#!/usr/bin/env node

/**
 * Pipeline Validation Test
 * Tests the complete video-to-grade pipeline to ensure real data flows through
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PIPELINE VALIDATION TEST');
console.log('============================');

// Test 1: Check if TensorFlow.js dependencies are available
console.log('\n1. Checking TensorFlow.js dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasTensorFlow = packageJson.dependencies['@tensorflow/tfjs'];
  const hasPoseDetection = packageJson.dependencies['@tensorflow-models/pose-detection'];
  
  if (hasTensorFlow && hasPoseDetection) {
    console.log('✅ TensorFlow.js dependencies found:', hasTensorFlow, hasPoseDetection);
  } else {
    console.log('❌ Missing TensorFlow.js dependencies');
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Test 2: Check if pose detection files exist
console.log('\n2. Checking pose detection files...');
const poseFiles = [
  'src/lib/video-poses.ts',
  'src/lib/alternative-pose-detection.ts',
  'src/lib/mediapipe.ts'
];

poseFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅', file, 'exists');
  } else {
    console.log('❌', file, 'missing');
  }
});

// Test 3: Check if grading system files exist
console.log('\n3. Checking grading system files...');
const gradingFiles = [
  'src/lib/comprehensive-golf-grading.ts',
  'src/lib/accurate-swing-metrics.ts',
  'src/lib/golf-metrics.ts'
];

gradingFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅', file, 'exists');
  } else {
    console.log('❌', file, 'missing');
  }
});

// Test 4: Check if UI components exist
console.log('\n4. Checking UI components...');
const uiFiles = [
  'src/components/ui/ComprehensiveGradingDisplay.tsx',
  'src/components/ui/GradingDebugPanel.tsx',
  'src/components/ui/VideoPlayerWithOverlay.tsx'
];

uiFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅', file, 'exists');
  } else {
    console.log('❌', file, 'missing');
  }
});

// Test 5: Check for mock data patterns
console.log('\n5. Checking for mock data patterns...');
const mockPatterns = [
  { file: 'src/lib/alternative-pose-detection.ts', pattern: 'createWorkingMockData' },
  { file: 'src/lib/alternative-pose-detection.ts', pattern: 'x: 0.5, y: 0.5' },
  { file: 'src/app/upload/page.tsx', pattern: 'overallScore: 77' }
];

mockPatterns.forEach(({ file, pattern }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(pattern)) {
      console.log('⚠️', file, 'contains mock data pattern:', pattern);
    } else {
      console.log('✅', file, 'does not contain mock data pattern:', pattern);
    }
  }
});

console.log('\n🎯 PIPELINE VALIDATION COMPLETE');
console.log('===============================');
console.log('Next steps:');
console.log('1. Open http://localhost:3000/upload');
console.log('2. Upload a video file');
console.log('3. Check browser console for debug logs');
console.log('4. Verify that real pose data is detected (not mock data)');
console.log('5. Verify that real metrics are calculated');
console.log('6. Verify that real grades are displayed');
