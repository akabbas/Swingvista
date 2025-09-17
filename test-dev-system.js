#!/usr/bin/env node

/**
 * Quick Development System Test
 * Verifies the real pose detection system is ready for testing
 */

console.log('🚀 SWINGVISTA DEVELOPMENT SYSTEM TEST');
console.log('=====================================');

// Test 1: Check if dev server dependencies are ready
console.log('\n1. Checking development dependencies...');
try {
  const packageJson = require('./package.json');
  const devDeps = packageJson.devDependencies || {};
  const deps = packageJson.dependencies || {};
  
  const requiredDeps = [
    'next',
    'react',
    'react-dom',
    '@tensorflow/tfjs',
    '@tensorflow-models/pose-detection'
  ];
  
  requiredDeps.forEach(dep => {
    const version = deps[dep] || devDeps[dep];
    if (version) {
      console.log(`  ✅ ${dep}: ${version}`);
    } else {
      console.log(`  ❌ ${dep}: NOT FOUND`);
    }
  });
} catch (error) {
  console.log('  ❌ Could not read package.json');
}

// Test 2: Check if real pose detection files exist
console.log('\n2. Checking real pose detection files...');
const poseFiles = [
  'src/lib/video-poses.ts',
  'src/lib/alternative-pose-detection.ts',
  'src/lib/mediapipe.ts'
];

poseFiles.forEach(file => {
  const fs = require('fs');
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} missing`);
  }
});

// Test 3: Check if mock data has been removed
console.log('\n3. Verifying mock data removal...');
const fs = require('fs');
const filesToCheck = [
  'src/lib/video-poses.ts',
  'src/lib/alternative-pose-detection.ts',
  'src/app/upload/page.tsx'
];

let mockDataFound = false;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('createWorkingMockData') || content.includes('extractPosesEmergency')) {
      console.log(`  ❌ ${file}: Mock data functions still present`);
      mockDataFound = true;
    } else {
      console.log(`  ✅ ${file}: Mock data removed`);
    }
  }
});

if (!mockDataFound) {
  console.log('  ✅ All mock data functions successfully removed');
}

// Test 4: Check for real detection implementations
console.log('\n4. Checking real detection implementations...');
const realDetectionChecks = [
  { file: 'src/lib/video-poses.ts', pattern: 'extractPosesWithMediaPipe', name: 'MediaPipe' },
  { file: 'src/lib/video-poses.ts', pattern: 'detectPosesWithServerAPI', name: 'Server API' },
  { file: 'src/lib/alternative-pose-detection.ts', pattern: 'detectPosesWithTensorFlow', name: 'TensorFlow.js' }
];

realDetectionChecks.forEach(check => {
  if (fs.existsSync(check.file)) {
    const content = fs.readFileSync(check.file, 'utf8');
    if (content.includes(check.pattern)) {
      console.log(`  ✅ ${check.name} implementation found`);
    } else {
      console.log(`  ❌ ${check.name} implementation missing`);
    }
  }
});

console.log('\n🎯 TESTING INSTRUCTIONS:');
console.log('========================');
console.log('1. Open browser to: http://localhost:3000/upload');
console.log('2. Click "Try Sample Videos" dropdown');
console.log('3. Select any sample video (Tiger Woods, Ludvig Aberg, Max Homa)');
console.log('4. Watch console for debug messages:');
console.log('   - Look for "🔍 PIPELINE DEBUG" messages');
console.log('   - Verify "REAL DATA - VALID" appears');
console.log('   - Should NOT see "MOCK DATA" warnings');
console.log('   - Should see "PIPELINE COMPLETE" at the end');

console.log('\n🔍 EXPECTED CONSOLE OUTPUT:');
console.log('===========================');
console.log('🎥 SAMPLE VIDEO DEBUG: Selected sample video: [video name]');
console.log('🔍 PIPELINE DEBUG: ===== VIDEO TO ANALYSIS PIPELINE =====');
console.log('🔍 PIPELINE DEBUG: Step 1 - Starting pose extraction...');
console.log('🔄 REAL POSE DETECTION: Attempting MediaPipe pose detection...');
console.log('✅ REAL POSE DETECTION: MediaPipe succeeded with real data!');
console.log('🔍 PIPELINE DEBUG: Step 2 - Starting swing mechanics analysis...');
console.log('🔍 PIPELINE DEBUG: Step 3 - Setting analysis result...');
console.log('🔍 PIPELINE DEBUG: Step 4 - Starting AI analysis...');
console.log('🔍 PIPELINE DEBUG: ===== PIPELINE COMPLETE =====');

console.log('\n⚠️  CRITICAL CHECKS:');
console.log('===================');
console.log('❌ If you see "MOCK DATA - INVALID" - pose detection failed');
console.log('❌ If you see "FALLBACK DATA - INVALID" - analysis failed');
console.log('✅ Should see "REAL DATA - VALID" throughout pipeline');
console.log('✅ Professional swings should get 90+/100 scores');
console.log('✅ No more 7/100 or 9/100 scores from mock data');

console.log('\n🚀 READY FOR TESTING!');
console.log('=====================');
console.log('The development server should be running at http://localhost:3000');
console.log('Open the upload page and test with sample videos!');
