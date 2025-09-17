#!/usr/bin/env node

/**
 * Test Sample Video Functionality
 * Verifies that sample videos exist and are accessible
 */

const fs = require('fs');
const path = require('path');

console.log('🎥 TESTING SAMPLE VIDEO FUNCTIONALITY');
console.log('====================================');

// Test 1: Check if sample videos exist
console.log('\n1. Checking sample video files...');
const sampleVideos = [
  'tiger-woods-swing.mp4',
  'tiger-woods-swing-slow.mp4', 
  'ludvig_aberg_driver.mp4',
  'max_homa_iron.mp4'
];

const fixturesDir = 'public/fixtures/swings';
sampleVideos.forEach(video => {
  const filePath = path.join(fixturesDir, video);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${video} exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    console.log(`❌ ${video} missing`);
  }
});

// Test 2: Check SampleVideoSelector component
console.log('\n2. Checking SampleVideoSelector component...');
const componentPath = 'src/components/ui/SampleVideoSelector.tsx';
if (fs.existsSync(componentPath)) {
  const content = fs.readFileSync(componentPath, 'utf8');
  
  // Check for required elements
  const checks = [
    { name: 'Sample videos array', pattern: 'const sampleVideos = [' },
    { name: 'Dropdown button', pattern: 'Try Sample Videos' },
    { name: 'Video selection handler', pattern: 'handleVideoSelect' },
    { name: 'Debug logging', pattern: 'SAMPLE VIDEO DEBUG' }
  ];
  
  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  });
} else {
  console.log('❌ SampleVideoSelector component missing');
}

// Test 3: Check upload page integration
console.log('\n3. Checking upload page integration...');
const uploadPagePath = 'src/app/upload/page.tsx';
if (fs.existsSync(uploadPagePath)) {
  const content = fs.readFileSync(uploadPagePath, 'utf8');
  
  const checks = [
    { name: 'SampleVideoSelector import', pattern: 'import SampleVideoSelector' },
    { name: 'SampleVideoSelector usage', pattern: '<SampleVideoSelector' },
    { name: 'handleSampleVideoSelect function', pattern: 'handleSampleVideoSelect' },
    { name: 'Sample video debug logging', pattern: 'SAMPLE VIDEO DEBUG' },
    { name: 'Sample video URL handling', pattern: 'sampleVideoUrl' }
  ];
  
  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  });
} else {
  console.log('❌ Upload page missing');
}

console.log('\n🎯 EXPECTED FUNCTIONALITY:');
console.log('==========================');
console.log('✅ Click "Try Sample Videos" button should open dropdown');
console.log('✅ Dropdown should show 4 sample video options');
console.log('✅ Clicking a sample video should trigger analysis');
console.log('✅ Sample videos should load and display in video player');
console.log('✅ Analysis should work the same as uploaded videos');

console.log('\n🔍 DEBUGGING:');
console.log('=============');
console.log('1. Open browser console');
console.log('2. Click "Try Sample Videos" button');
console.log('3. Look for "🎥 SAMPLE VIDEO DEBUG" messages');
console.log('4. Select a sample video and watch the analysis process');

console.log('\n📝 SAMPLE VIDEOS AVAILABLE:');
console.log('============================');
console.log('🏌️ Tiger Woods Driver Swing - Professional driver swing');
console.log('🎬 Tiger Woods Driver Swing (Slow Motion) - Detailed analysis');
console.log('🏆 Ludvig Aberg Driver Swing - Modern professional technique');
console.log('⛳ Max Homa Iron Swing - Iron swing with excellent tempo');
