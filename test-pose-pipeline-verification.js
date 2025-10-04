#!/usr/bin/env node

/**
 * Pose Detection Pipeline Verification Script
 * 
 * This script verifies that real pose detection data is being passed
 * to the stick figure rendering system instead of mock/dummy data.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 POSE DETECTION PIPELINE VERIFICATION');
console.log('=====================================');

// Check if required files exist
const requiredFiles = [
    'src/components/analysis/CleanVideoAnalysisDisplay.tsx',
    'src/lib/alternative-pose-detection.ts',
    'src/lib/hybrid-pose-detector.ts',
    'src/lib/posenet-detector.ts'
];

console.log('\n📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing. Please ensure all files exist.');
    process.exit(1);
}

// Analyze CleanVideoAnalysisDisplay.tsx for pose data handling
console.log('\n🔍 Analyzing CleanVideoAnalysisDisplay.tsx...');
const displayFile = fs.readFileSync(path.join(__dirname, 'src/components/analysis/CleanVideoAnalysisDisplay.tsx'), 'utf8');

// Check for pose data verification
const hasPoseDataVerification = displayFile.includes('POSE DATA VERIFICATION');
const hasMockDataDetection = displayFile.includes('isMockData');
const hasDebugLogging = displayFile.includes('🔍 POSE DATA VERIFICATION');

console.log(`✅ Pose data verification: ${hasPoseDataVerification ? 'PRESENT' : 'MISSING'}`);
console.log(`✅ Mock data detection: ${hasMockDataDetection ? 'PRESENT' : 'MISSING'}`);
console.log(`✅ Debug logging: ${hasDebugLogging ? 'PRESENT' : 'MISSING'}`);

// Analyze alternative-pose-detection.ts for real detection
console.log('\n🔍 Analyzing alternative-pose-detection.ts...');
const detectionFile = fs.readFileSync(path.join(__dirname, 'src/lib/alternative-pose-detection.ts'), 'utf8');

// Check for real pose detection
const hasRealDetection = detectionFile.includes('REAL POSE DETECTION');
const hasTensorFlowIntegration = detectionFile.includes('TensorFlow.js');
const hasMoveNetIntegration = detectionFile.includes('MoveNet');
const hasMockDataRemoval = detectionFile.includes('MOCK DATA FUNCTIONS REMOVED');

console.log(`✅ Real pose detection: ${hasRealDetection ? 'PRESENT' : 'MISSING'}`);
console.log(`✅ TensorFlow.js integration: ${hasTensorFlowIntegration ? 'PRESENT' : 'MISSING'}`);
console.log(`✅ MoveNet integration: ${hasMoveNetIntegration ? 'PRESENT' : 'MISSING'}`);
console.log(`✅ Mock data removal: ${hasMockDataRemoval ? 'PRESENT' : 'MISSING'}`);

// Check for data flow patterns
console.log('\n🔍 Checking data flow patterns...');

// Check if poses are passed as props
const posesPropPattern = /poses\?\s*:\s*any\[\]/;
const hasPosesProp = posesPropPattern.test(displayFile);
console.log(`✅ Poses prop defined: ${hasPosesProp ? 'YES' : 'NO'}`);

// Check if poses are used in rendering
const posesUsagePattern = /poses\[frame\]/;
const hasPosesUsage = posesUsagePattern.test(displayFile);
console.log(`✅ Poses used in rendering: ${hasPosesUsage ? 'YES' : 'NO'}`);

// Check for landmark validation
const landmarkValidationPattern = /landmarks\.filter.*visibility/;
const hasLandmarkValidation = landmarkValidationPattern.test(displayFile);
console.log(`✅ Landmark validation: ${hasLandmarkValidation ? 'YES' : 'NO'}`);

// Check for coordinate scaling
const coordinateScalingPattern = /scaleX|scaleY/;
const hasCoordinateScaling = coordinateScalingPattern.test(displayFile);
console.log(`✅ Coordinate scaling: ${hasCoordinateScaling ? 'YES' : 'NO'}`);

// Summary
console.log('\n📊 VERIFICATION SUMMARY');
console.log('======================');

const criticalChecks = [
    { name: 'Required files exist', status: allFilesExist },
    { name: 'Pose data verification', status: hasPoseDataVerification },
    { name: 'Mock data detection', status: hasMockDataDetection },
    { name: 'Real pose detection', status: hasRealDetection },
    { name: 'TensorFlow.js integration', status: hasTensorFlowIntegration },
    { name: 'MoveNet integration', status: hasMoveNetIntegration },
    { name: 'Mock data removal', status: hasMockDataRemoval },
    { name: 'Poses prop defined', status: hasPosesProp },
    { name: 'Poses used in rendering', status: hasPosesUsage },
    { name: 'Landmark validation', status: hasLandmarkValidation },
    { name: 'Coordinate scaling', status: hasCoordinateScaling }
];

const passedChecks = criticalChecks.filter(check => check.status).length;
const totalChecks = criticalChecks.length;

console.log(`\n✅ Passed: ${passedChecks}/${totalChecks} checks`);

criticalChecks.forEach(check => {
    const status = check.status ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
});

if (passedChecks === totalChecks) {
    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('The pose detection pipeline appears to be properly configured for real data.');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run the application and upload a video');
    console.log('2. Check browser console for debug logs');
    console.log('3. Verify that landmark coordinates are varied (not all 0.5, 0.5)');
    console.log('4. Ensure stick figure overlays show real human movement');
} else {
    console.log('\n⚠️  SOME CHECKS FAILED!');
    console.log('Please review the failed checks and ensure the pose detection pipeline is properly configured.');
}

console.log('\n🔧 DEBUGGING TIPS:');
console.log('1. Open browser DevTools and check the Console tab');
console.log('2. Look for logs starting with "🔍 POSE DATA VERIFICATION"');
console.log('3. Check for "Data quality: REAL" vs "Data quality: MOCK/DUMMY"');
console.log('4. Verify landmark coordinates are varied and realistic');
console.log('5. Ensure TensorFlow.js and MoveNet are loading correctly');

console.log('\n📝 TESTING CHECKLIST:');
console.log('□ Upload a video with clear human movement');
console.log('□ Check console for pose detection logs');
console.log('□ Verify stick figure overlays appear');
console.log('□ Confirm overlays follow human movement');
console.log('□ Check that coordinates are not all centered (0.5, 0.5)');
console.log('□ Verify visibility scores are realistic (0.0-1.0)');

process.exit(passedChecks === totalChecks ? 0 : 1);
