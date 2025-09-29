#!/usr/bin/env node

/**
 * SWINGVISTA FIXES VERIFICATION SCRIPT
 * 
 * This script helps verify all the fixes are working correctly
 * Run this after the fixes have been applied
 */

console.log('🧪 SWINGVISTA FIXES VERIFICATION');
console.log('================================');

// Test 1: Check if test page is accessible
async function testPageAccess() {
  console.log('\n1. Testing test page accessibility...');
  try {
    const response = await fetch('http://localhost:3001/test-implementation');
    if (response.ok) {
      console.log('✅ Test page is accessible');
      return true;
    } else {
      console.log('❌ Test page not accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Test page not accessible:', error.message);
    return false;
  }
}

// Test 2: Check emergency mode environment variable
function testEmergencyMode() {
  console.log('\n2. Testing emergency mode toggle...');
  const forceEmergency = process.env.SV_FORCE_EMERGENCY === '1' || process.env.NEXT_PUBLIC_SV_FORCE_EMERGENCY === '1';
  if (forceEmergency) {
    console.log('✅ Emergency mode toggle working');
    console.log('   SV_FORCE_EMERGENCY:', process.env.SV_FORCE_EMERGENCY);
    console.log('   NEXT_PUBLIC_SV_FORCE_EMERGENCY:', process.env.NEXT_PUBLIC_SV_FORCE_EMERGENCY);
  } else {
    console.log('⚠️  Emergency mode not enabled (this is normal)');
    console.log('   To test: export SV_FORCE_EMERGENCY=1');
  }
  return true;
}

// Test 3: Check if all required files exist
function testFileStructure() {
  console.log('\n3. Testing file structure...');
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'src/lib/test-implementation.ts',
    'src/lib/mediapipe.ts',
    'src/lib/simple-golf-analysis.ts',
    'src/app/test-implementation/page.tsx',
    '.github/workflows/ci.yml',
    'next.config.ts'
  ];
  
  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Test 4: Check Next.js configuration
function testNextConfig() {
  console.log('\n4. Testing Next.js configuration...');
  const fs = require('fs');
  
  if (fs.existsSync('next.config.ts')) {
    const config = fs.readFileSync('next.config.ts', 'utf8');
    if (config.includes('outputFileTracingRoot')) {
      console.log('✅ Next.js config has outputFileTracingRoot');
    } else {
      console.log('❌ Next.js config missing outputFileTracingRoot');
      return false;
    }
  } else {
    console.log('❌ next.config.ts not found');
    return false;
  }
  
  return true;
}

// Test 5: Check for duplicate lockfiles
function testLockfiles() {
  console.log('\n5. Testing lockfile configuration...');
  const fs = require('fs');
  const path = require('path');
  
  const currentDir = process.cwd();
  const parentDir = path.dirname(currentDir);
  const parentLockfile = path.join(parentDir, 'package-lock.json');
  
  if (fs.existsSync(parentLockfile)) {
    console.log('⚠️  Duplicate lockfile found in parent directory');
    console.log('   Consider removing:', parentLockfile);
  } else {
    console.log('✅ No duplicate lockfiles found');
  }
  
  return true;
}

// Main verification function
async function runVerification() {
  console.log('Starting verification process...\n');
  
  const results = {
    pageAccess: await testPageAccess(),
    emergencyMode: testEmergencyMode(),
    fileStructure: testFileStructure(),
    nextConfig: testNextConfig(),
    lockfiles: testLockfiles()
  };
  
  console.log('\n📊 VERIFICATION RESULTS');
  console.log('======================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL VERIFICATIONS PASSED!');
    console.log('\nNext steps:');
    console.log('1. Navigate to http://localhost:3001/test-implementation');
    console.log('2. Click "Run All Implementation Tests"');
    console.log('3. Verify all 8 tests pass (8/8 ✅)');
    console.log('4. Test with real golf swing videos');
  } else {
    console.log('\n⚠️  Some verifications failed');
    console.log('Check the issues above and fix them before testing');
  }
  
  return results;
}

// Run verification if this script is executed directly
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = { runVerification };
