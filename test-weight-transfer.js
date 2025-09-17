// Test script for weight transfer calculation
const { calculateAccurateWeightTransferMetrics } = require('./src/lib/accurate-swing-metrics.ts');

// Mock pose data for testing
const mockPoses = [
  // Address pose (frame 0)
  {
    landmarks: [
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // nose
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left eye
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right eye
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left ear
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right ear
      { x: 0.45, y: 0.4, z: 0, visibility: 0.9 }, // left shoulder
      { x: 0.55, y: 0.4, z: 0, visibility: 0.9 }, // right shoulder
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left elbow
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right elbow
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left wrist
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right wrist
      { x: 0.48, y: 0.6, z: 0, visibility: 0.9 }, // left hip
      { x: 0.52, y: 0.6, z: 0, visibility: 0.9 }, // right hip
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left knee
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right knee
      { x: 0.48, y: 0.8, z: 0, visibility: 0.9 }, // left ankle
      { x: 0.52, y: 0.8, z: 0, visibility: 0.9 }  // right ankle
    ]
  },
  // Top of backswing pose (frame 10)
  {
    landmarks: [
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // nose
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left eye
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right eye
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left ear
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right ear
      { x: 0.4, y: 0.3, z: 0, visibility: 0.9 }, // left shoulder
      { x: 0.6, y: 0.3, z: 0, visibility: 0.9 }, // right shoulder
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left elbow
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right elbow
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left wrist
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right wrist
      { x: 0.45, y: 0.6, z: 0, visibility: 0.9 }, // left hip (shifted left)
      { x: 0.55, y: 0.6, z: 0, visibility: 0.9 }, // right hip
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left knee
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right knee
      { x: 0.48, y: 0.8, z: 0, visibility: 0.9 }, // left ankle
      { x: 0.52, y: 0.8, z: 0, visibility: 0.9 }  // right ankle
    ]
  },
  // Impact pose (frame 45)
  {
    landmarks: [
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // nose
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left eye
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right eye
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left ear
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right ear
      { x: 0.5, y: 0.4, z: 0, visibility: 0.9 }, // left shoulder
      { x: 0.5, y: 0.4, z: 0, visibility: 0.9 }, // right shoulder
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left elbow
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right elbow
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left wrist
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right wrist
      { x: 0.52, y: 0.6, z: 0, visibility: 0.9 }, // left hip (shifted right)
      { x: 0.48, y: 0.6, z: 0, visibility: 0.9 }, // right hip
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left knee
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right knee
      { x: 0.48, y: 0.8, z: 0, visibility: 0.9 }, // left ankle
      { x: 0.52, y: 0.8, z: 0, visibility: 0.9 }  // right ankle
    ]
  },
  // Finish pose (frame 56)
  {
    landmarks: [
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // nose
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left eye
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right eye
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left ear
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right ear
      { x: 0.5, y: 0.4, z: 0, visibility: 0.9 }, // left shoulder
      { x: 0.5, y: 0.4, z: 0, visibility: 0.9 }, // right shoulder
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left elbow
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right elbow
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left wrist
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right wrist
      { x: 0.53, y: 0.6, z: 0, visibility: 0.9 }, // left hip (more right)
      { x: 0.47, y: 0.6, z: 0, visibility: 0.9 }, // right hip
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // left knee
      { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }, // right knee
      { x: 0.48, y: 0.8, z: 0, visibility: 0.9 }, // left ankle
      { x: 0.52, y: 0.8, z: 0, visibility: 0.9 }  // right ankle
    ]
  }
];

// Mock phases
const mockPhases = [
  { name: 'address', startFrame: 0, endFrame: 5 },
  { name: 'backswing', startFrame: 5, endFrame: 10 },
  { name: 'top', startFrame: 10, endFrame: 15 },
  { name: 'downswing', startFrame: 15, endFrame: 45 },
  { name: 'impact', startFrame: 45, endFrame: 50 },
  { name: 'followThrough', startFrame: 50, endFrame: 56 }
];

console.log('🧪 TESTING WEIGHT TRANSFER CALCULATION');
console.log('=====================================');

try {
  const result = calculateAccurateWeightTransferMetrics(mockPoses, mockPhases);
  console.log('✅ Weight Transfer Result:', result);
  
  // Validate results
  if (result.backswing > 0 && result.impact > 0 && result.finish > 0) {
    console.log('✅ SUCCESS: Weight transfer calculation working!');
    console.log(`   Backswing: ${result.backswing}%`);
    console.log(`   Impact: ${result.impact}%`);
    console.log(`   Finish: ${result.finish}%`);
    console.log(`   Score: ${result.score}/100`);
  } else {
    console.log('❌ FAILED: Still getting 0% values');
  }
} catch (error) {
  console.log('❌ ERROR:', error.message);
}
