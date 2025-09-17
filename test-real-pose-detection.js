#!/usr/bin/env node

/**
 * Test Real Pose Detection System
 * Verifies that mock data fallbacks have been removed and real detection is enforced
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING REAL POSE DETECTION SYSTEM');
console.log('====================================');

// Test 1: Check that mock data fallbacks are removed
console.log('\n1. Checking for removed mock data fallbacks...');
const filesToCheck = [
  'src/lib/video-poses.ts',
  'src/lib/alternative-pose-detection.ts',
  'src/app/upload/page.tsx'
];

const mockDataPatterns = [
  'createWorkingMockData',
  'extractPosesEmergency',
  'fallback to mock data',
  'using mock data as fallback',
  'Mock data has been disabled'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    console.log(`\n📁 ${file}:`);
    
    // Check for removed patterns
    mockDataPatterns.forEach(pattern => {
      const hasPattern = content.includes(pattern);
      if (pattern === 'Mock data has been disabled') {
        console.log(`  ${hasPattern ? '✅' : '❌'} ${pattern}: ${hasPattern ? 'FOUND (Good)' : 'NOT FOUND'}`);
      } else {
        console.log(`  ${hasPattern ? '❌' : '✅'} ${pattern}: ${hasPattern ? 'FOUND (Bad - should be removed)' : 'NOT FOUND (Good)'}`);
      }
    });
  } else {
    console.log(`❌ ${file} not found`);
  }
});

// Test 2: Check for real pose detection implementations
console.log('\n2. Checking for real pose detection implementations...');
const realDetectionPatterns = [
  { file: 'src/lib/video-poses.ts', pattern: 'extractPosesWithMediaPipe', description: 'MediaPipe implementation' },
  { file: 'src/lib/video-poses.ts', pattern: 'detectPosesWithServerAPI', description: 'Server API implementation' },
  { file: 'src/lib/alternative-pose-detection.ts', pattern: 'detectPosesWithTensorFlow', description: 'TensorFlow.js implementation' },
  { file: 'src/lib/alternative-pose-detection.ts', pattern: 'detectPosesWithAPI', description: 'API fallback' }
];

realDetectionPatterns.forEach(item => {
  if (fs.existsSync(item.file)) {
    const content = fs.readFileSync(item.file, 'utf8');
    const hasPattern = content.includes(item.pattern);
    console.log(`  ${hasPattern ? '✅' : '❌'} ${item.description}: ${hasPattern ? 'FOUND' : 'NOT FOUND'}`);
  } else {
    console.log(`  ❌ ${item.file} not found`);
  }
});

// Test 3: Check for data validation
console.log('\n3. Checking for data validation...');
const validationPatterns = [
  { file: 'src/app/upload/page.tsx', pattern: 'isMockData', description: 'Mock data detection' },
  { file: 'src/app/upload/page.tsx', pattern: 'PIPELINE DEBUG', description: 'Pipeline debugging' },
  { file: 'src/app/upload/page.tsx', pattern: 'Real pose data validated', description: 'Real data validation' },
  { file: 'src/lib/video-poses.ts', pattern: 'REAL POSE DETECTION', description: 'Real detection logging' }
];

validationPatterns.forEach(item => {
  if (fs.existsSync(item.file)) {
    const content = fs.readFileSync(item.file, 'utf8');
    const hasPattern = content.includes(item.pattern);
    console.log(`  ${hasPattern ? '✅' : '❌'} ${item.description}: ${hasPattern ? 'FOUND' : 'NOT FOUND'}`);
  } else {
    console.log(`  ❌ ${item.file} not found`);
  }
});

// Test 4: Check for error handling instead of mock fallbacks
console.log('\n4. Checking for proper error handling...');
const errorHandlingPatterns = [
  { file: 'src/lib/video-poses.ts', pattern: 'throw new Error', description: 'Error throwing instead of mock fallback' },
  { file: 'src/lib/alternative-pose-detection.ts', pattern: 'throw error', description: 'Error re-throwing' },
  { file: 'src/app/upload/page.tsx', pattern: 'throw new Error', description: 'Analysis error handling' }
];

errorHandlingPatterns.forEach(item => {
  if (fs.existsSync(item.file)) {
    const content = fs.readFileSync(item.file, 'utf8');
    const hasPattern = content.includes(item.pattern);
    console.log(`  ${hasPattern ? '✅' : '❌'} ${item.description}: ${hasPattern ? 'FOUND' : 'NOT FOUND'}`);
  } else {
    console.log(`  ❌ ${item.file} not found`);
  }
});

console.log('\n🎯 EXPECTED BEHAVIOR:');
console.log('====================');
console.log('✅ Videos should be processed with real pose detection');
console.log('✅ MediaPipe, TensorFlow.js, or Server API should be used');
console.log('✅ Mock data fallbacks should be completely removed');
console.log('✅ Analysis should fail with clear error messages if detection fails');
console.log('✅ No more 7/100 or 9/100 scores from mock data');

console.log('\n🔍 DEBUGGING STEPS:');
console.log('===================');
console.log('1. Open browser console');
console.log('2. Upload a video or select sample video');
console.log('3. Look for "🔍 PIPELINE DEBUG" messages');
console.log('4. Verify "REAL DATA - VALID" appears');
console.log('5. Check that no "MOCK DATA" warnings appear');

console.log('\n⚠️  CRITICAL CHECKS:');
console.log('===================');
console.log('❌ If you see "MOCK DATA - INVALID" - pose detection failed');
console.log('❌ If you see "FALLBACK DATA - INVALID" - analysis failed');
console.log('✅ Should see "REAL DATA - VALID" throughout pipeline');
console.log('✅ Should see "PIPELINE COMPLETE" at the end');

console.log('\n📝 TESTING COMMANDS:');
console.log('====================');
console.log('npm run dev');
console.log('Open http://localhost:3000/upload');
console.log('Try sample videos or upload your own');
console.log('Check console for debug messages');
