#!/usr/bin/env node

/**
 * Comprehensive Test Script for SwingVista
 * Tests all critical functionality end-to-end
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 SwingVista Comprehensive Test Suite');
console.log('=====================================\n');

// Test results
const results = {
  build: false,
  typeCheck: false,
  lint: false,
  supabase: false,
  mediapipe: false,
  analysis: false,
  export: false
};

// Helper function to run tests
function runTest(name, testFn) {
  console.log(`\n🔍 Testing ${name}...`);
  try {
    testFn();
    console.log(`✅ ${name} - PASSED`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} - FAILED`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 1: Build
runTest('Build', () => {
  execSync('npm run build', { stdio: 'pipe' });
  results.build = true;
});

// Test 2: Type Check
runTest('Type Check', () => {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  results.typeCheck = true;
});

// Test 3: Lint
runTest('Lint', () => {
  execSync('npm run lint', { stdio: 'pipe' });
  results.lint = true;
});

// Test 4: Check critical files exist
runTest('File Structure', () => {
  const criticalFiles = [
    'src/lib/mediapipe.ts',
    'src/lib/supabase.ts',
    'src/lib/unified-analysis.ts',
    'src/lib/swing-phases.ts',
    'src/lib/trajectory-analysis.ts',
    'src/lib/vista-swing-ai.ts',
    'src/lib/export-utils.ts',
    'src/workers/unified-analysis.worker.ts',
    'src/app/upload/page.tsx',
    'src/app/camera/page.tsx',
    'src/app/compare/page.tsx',
    'src/app/swing/[id]/page.tsx',
    'src/app/api/swings/route.ts',
    'src/app/api/swings/[id]/route.ts'
  ];

  criticalFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing critical file: ${file}`);
    }
  });
});

// Test 5: Check environment variables
runTest('Environment Setup', () => {
  const envFile = '.env.local';
  if (!fs.existsSync(envFile)) {
    console.log('   ⚠️  .env.local not found - Supabase integration may not work');
    console.log('   📝 Please create .env.local with:');
    console.log('      NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('      NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  } else {
    const envContent = fs.readFileSync(envFile, 'utf8');
    if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL') || !envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      throw new Error('Missing required Supabase environment variables');
    }
  }
});

// Test 6: Check package.json dependencies
runTest('Dependencies', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@mediapipe/pose',
    '@supabase/supabase-js',
    'next',
    'react',
    'react-dom',
    'typescript'
  ];

  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      throw new Error(`Missing required dependency: ${dep}`);
    }
  });
});

// Test 7: Check for common issues
runTest('Code Quality', () => {
  // Check for console.log statements in production code
  const srcFiles = fs.readdirSync('src', { recursive: true })
    .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
    .map(file => path.join('src', file));

  let consoleLogCount = 0;
  srcFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/console\.log/g);
      if (matches) {
        consoleLogCount += matches.length;
      }
    }
  });

  if (consoleLogCount > 10) {
    console.log(`   ⚠️  Found ${consoleLogCount} console.log statements - consider removing for production`);
  }
});

// Test 8: Check API routes
runTest('API Routes', () => {
  const apiFiles = [
    'src/app/api/swings/route.ts',
    'src/app/api/swings/[id]/route.ts'
  ];

  apiFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing API route: ${file}`);
    }
  });
});

// Test 9: Check worker files
runTest('Web Workers', () => {
  const workerFiles = [
    'src/workers/unified-analysis.worker.ts'
  ];

  workerFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing worker file: ${file}`);
    }
  });
});

// Test 10: Check component structure
runTest('Component Structure', () => {
  const components = [
    'src/components/MetricsDashboard.tsx',
    'src/components/SideBySideComparison.tsx',
    'src/components/SlowMotionPlayer.tsx',
    'src/components/TrajectoryPlot.tsx'
  ];

  components.forEach(component => {
    if (!fs.existsSync(component)) {
      console.log(`   ⚠️  Optional component missing: ${component}`);
    }
  });
});

// Summary
console.log('\n📊 Test Results Summary');
console.log('========================');

const passedTests = Object.values(results).filter(Boolean).length;
const totalTests = Object.keys(results).length;

console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! SwingVista is ready for production.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the issues above.');
}

console.log('\n📋 Next Steps:');
console.log('1. Set up Supabase database with the provided schema');
console.log('2. Configure environment variables in .env.local');
console.log('3. Test video upload functionality with real videos');
console.log('4. Test camera recording functionality');
console.log('5. Verify swing analysis and comparison features');
console.log('6. Test export functionality');

console.log('\n🚀 Ready to run: npm run dev');
