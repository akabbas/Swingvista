#!/usr/bin/env node

/**
 * Test Scoring Algorithm Fix
 * Verifies that the scoring algorithm now gives reasonable scores
 */

console.log('🔍 TESTING SCORING ALGORITHM FIX');
console.log('================================');

// Test the old vs new scoring algorithm
function oldScoreMetric(value, benchmark) {
  const { min, ideal, max } = benchmark;
  
  if (value >= min && value <= max) {
    const deviation = Math.abs(value - ideal);
    const range = Math.max(ideal - min, max - ideal);
    return Math.max(0, 100 - (deviation / range) * 30);
  }
  else if (value < min) {
    const ratio = value / min;
    return Math.max(0, 60 * ratio); // This was the problem!
  }
  else {
    const excess = (value - max) / max;
    return Math.max(0, 100 - 40 * excess);
  }
}

function newScoreMetric(value, benchmark) {
  const { min, ideal, max } = benchmark;
  
  if (value >= min && value <= max) {
    const deviation = Math.abs(value - ideal);
    const range = Math.max(ideal - min, max - ideal);
    return Math.max(0, 100 - (deviation / range) * 20);
  }
  else if (value < min) {
    const deviation = min - value;
    const range = ideal - min;
    // Ensure minimum score of 20 for any reasonable attempt
    return Math.max(20, 100 - (deviation / range) * 60);
  }
  else {
    const deviation = value - max;
    const range = max - ideal;
    // Ensure minimum score of 20 for any reasonable attempt
    return Math.max(20, 100 - (deviation / range) * 60);
  }
}

// Test cases that were giving low scores
const testCases = [
  { name: 'Low shoulder turn (10 degrees)', value: 10, benchmark: { min: 85, ideal: 90, max: 95 } },
  { name: 'Low hip turn (20 degrees)', value: 20, benchmark: { min: 45, ideal: 50, max: 55 } },
  { name: 'Low tempo ratio (1.5)', value: 1.5, benchmark: { min: 2.8, ideal: 3.0, max: 3.2 } },
  { name: 'Good shoulder turn (90 degrees)', value: 90, benchmark: { min: 85, ideal: 90, max: 95 } },
  { name: 'Excellent shoulder turn (92 degrees)', value: 92, benchmark: { min: 85, ideal: 90, max: 95 } }
];

console.log('\n📊 SCORING COMPARISON:');
console.log('======================');

testCases.forEach(testCase => {
  const oldScore = oldScoreMetric(testCase.value, testCase.benchmark);
  const newScore = newScoreMetric(testCase.value, testCase.benchmark);
  
  console.log(`\n${testCase.name}:`);
  console.log(`  Value: ${testCase.value}, Benchmark: ${testCase.benchmark.min}-${testCase.benchmark.ideal}-${testCase.benchmark.max}`);
  console.log(`  Old Score: ${oldScore.toFixed(1)} (${oldScore < 20 ? '❌ VERY LOW' : oldScore < 50 ? '⚠️ LOW' : '✅ OK'})`);
  console.log(`  New Score: ${newScore.toFixed(1)} (${newScore < 20 ? '❌ VERY LOW' : newScore < 50 ? '⚠️ LOW' : '✅ OK'})`);
  console.log(`  Improvement: ${(newScore - oldScore).toFixed(1)} points`);
});

console.log('\n🎯 EXPECTED RESULTS:');
console.log('===================');
console.log('✅ Professional swings should now get 90+/100');
console.log('✅ Good amateur swings should get 70-89/100');
console.log('✅ Poor swings should get 50-69/100');
console.log('✅ Very poor swings should get 30-49/100');
console.log('❌ No more 7/100 or 9/100 scores for reasonable swings');

console.log('\n🔍 NEXT STEPS:');
console.log('==============');
console.log('1. Test with a real video upload');
console.log('2. Check browser console for debug logs');
console.log('3. Verify scores are now reasonable');
console.log('4. Professional swings should get A grades (90+)');
