/**
 * Real Club Detection Example
 * 
 * Demonstrates how to use the new club detection system to replace
 * hand estimation with actual club position and orientation analysis.
 */

import { ClubDetector, ClubDetection, createClubDetector, validateClubDetection } from './club-detection';
import { EnhancedPhaseDetectorWithClub } from './enhanced-phase-detector-with-club';
import { PoseResult } from './mediapipe';

// 🎯 CLUB DETECTION EXAMPLES

/**
 * Example 1: Basic club detection
 */
export function basicClubDetection(poses: PoseResult[]): void {
  console.log('🏌️ BASIC CLUB DETECTION: Running basic club detection...');
  
  const detector = createClubDetector();
  
  try {
    poses.forEach((pose, frameIndex) => {
      try {
        const club = detector.detectClub(pose, frameIndex);
        
        console.log(`\nFrame ${frameIndex}:`);
        console.log(`  Grip Position: (${club.grip.center.x.toFixed(3)}, ${club.grip.center.y.toFixed(3)})`);
        console.log(`  Club Head: (${club.head.position.x.toFixed(3)}, ${club.head.position.y.toFixed(3)})`);
        console.log(`  Shaft Angle: ${club.shaft.angle.toFixed(1)}°`);
        console.log(`  Face Angle: ${club.head.angle.toFixed(1)}°`);
        console.log(`  Club Speed: ${Math.sqrt(club.head.velocity.x * club.head.velocity.x + club.head.velocity.y * club.head.velocity.y).toFixed(3)}`);
        console.log(`  Confidence: ${club.overall.confidence.toFixed(3)}`);
        console.log(`  Quality: ${club.overall.quality}`);
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Club detection failed - ${error.message}`);
      }
    });
    
    const stats = detector.getClubDetectionStats();
    console.log('\n📊 CLUB DETECTION STATISTICS:');
    console.log(`   History Length: ${stats.historyLength}`);
    console.log(`   Average Confidence: ${stats.averageConfidence.toFixed(3)}`);
    console.log(`   Average Stability: ${stats.averageStability.toFixed(3)}`);
    
  } finally {
    detector.reset();
  }
}

/**
 * Example 2: Compare hand estimation vs club detection
 */
export function compareHandVsClubDetection(poses: PoseResult[]): void {
  console.log('🔍 COMPARISON: Comparing hand estimation vs club detection...');
  
  const detector = createClubDetector();
  
  try {
    const handEstimations: any[] = [];
    const clubDetections: ClubDetection[] = [];
    
    poses.forEach((pose, frameIndex) => {
      try {
        // Simulate hand estimation (from original phase detector)
        const leftWrist = pose.landmarks[15];
        const rightWrist = pose.landmarks[16];
        
        if (leftWrist && rightWrist) {
          const handEstimation = {
            frame: frameIndex,
            clubPosition: {
              x: (leftWrist.x + rightWrist.x) / 2,
              y: (leftWrist.y + rightWrist.y) / 2,
              z: ((leftWrist.z || 0) + (rightWrist.z || 0)) / 2
            },
            confidence: Math.min(leftWrist.visibility || 1, rightWrist.visibility || 1)
          };
          handEstimations.push(handEstimation);
        }
        
        // Get club detection
        const clubDetection = detector.detectClub(pose, frameIndex);
        clubDetections.push(clubDetection);
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Detection failed - ${error.message}`);
      }
    });
    
    // Analyze differences
    console.log('\n📊 COMPARISON RESULTS:');
    console.log(`   Hand Estimations: ${handEstimations.length}`);
    console.log(`   Club Detections: ${clubDetections.length}`);
    
    // Compare confidence levels
    const handConfidence = handEstimations.reduce((sum, h) => sum + h.confidence, 0) / handEstimations.length;
    const clubConfidence = clubDetections.reduce((sum, c) => sum + c.overall.confidence, 0) / clubDetections.length;
    
    console.log(`   Hand Estimation Confidence: ${handConfidence.toFixed(3)}`);
    console.log(`   Club Detection Confidence: ${clubConfidence.toFixed(3)}`);
    console.log(`   Improvement: ${((clubConfidence - handConfidence) / handConfidence * 100).toFixed(1)}%`);
    
    // Compare position accuracy
    const positionDifferences = handEstimations.map((hand, index) => {
      if (index >= clubDetections.length) return 0;
      
      const club = clubDetections[index];
      const dx = hand.clubPosition.x - club.head.position.x;
      const dy = hand.clubPosition.y - club.head.position.y;
      return Math.sqrt(dx * dx + dy * dy);
    });
    
    const avgPositionDifference = positionDifferences.reduce((sum, diff) => sum + diff, 0) / positionDifferences.length;
    console.log(`   Average Position Difference: ${avgPositionDifference.toFixed(3)}`);
    
    // Show sample positions
    console.log('\n📍 SAMPLE POSITIONS:');
    handEstimations.slice(0, 5).forEach((hand, index) => {
      if (index < clubDetections.length) {
        const club = clubDetections[index];
        console.log(`   Frame ${index}:`);
        console.log(`     Hand Estimation: (${hand.clubPosition.x.toFixed(3)}, ${hand.clubPosition.y.toFixed(3)})`);
        console.log(`     Club Detection: (${club.head.position.x.toFixed(3)}, ${club.head.position.y.toFixed(3)})`);
        console.log(`     Difference: ${positionDifferences[index].toFixed(3)}`);
      }
    });
    
  } finally {
    detector.reset();
  }
}

/**
 * Example 3: Analyze club dynamics by phase
 */
export function analyzeClubDynamicsByPhase(poses: PoseResult[]): void {
  console.log('⚡ CLUB DYNAMICS: Analyzing club dynamics by phase...');
  
  const detector = createClubDetector();
  
  try {
    const clubDetections: ClubDetection[] = [];
    
    poses.forEach((pose, frameIndex) => {
      try {
        const clubDetection = detector.detectClub(pose, frameIndex);
        clubDetections.push(clubDetection);
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Club detection failed - ${error.message}`);
      }
    });
    
    // Analyze club dynamics
    console.log('\n📊 CLUB DYNAMICS ANALYSIS:');
    
    const shaftAngles = clubDetections.map(c => c.shaft.angle);
    const clubSpeeds = clubDetections.map(c => Math.sqrt(c.head.velocity.x * c.head.velocity.x + c.head.velocity.y * c.head.velocity.y));
    const faceAngles = clubDetections.map(c => c.head.angle);
    const confidences = clubDetections.map(c => c.overall.confidence);
    
    console.log(`   Total Frames: ${clubDetections.length}`);
    console.log(`   Shaft Angle Range: ${Math.min(...shaftAngles).toFixed(1)}° to ${Math.max(...shaftAngles).toFixed(1)}°`);
    console.log(`   Club Speed Range: ${Math.min(...clubSpeeds).toFixed(3)} to ${Math.max(...clubSpeeds).toFixed(3)}`);
    console.log(`   Face Angle Range: ${Math.min(...faceAngles).toFixed(1)}° to ${Math.max(...faceAngles).toFixed(1)}°`);
    console.log(`   Average Confidence: ${(confidences.reduce((sum, c) => sum + c, 0) / confidences.length).toFixed(3)}`);
    
    // Analyze by quality
    const qualityCounts: { [key: string]: number } = {};
    clubDetections.forEach(club => {
      qualityCounts[club.overall.quality] = (qualityCounts[club.overall.quality] || 0) + 1;
    });
    
    console.log('\n📈 QUALITY DISTRIBUTION:');
    Object.entries(qualityCounts).forEach(([quality, count]) => {
      const percentage = (count / clubDetections.length * 100).toFixed(1);
      console.log(`   ${quality}: ${count} frames (${percentage}%)`);
    });
    
    // Show velocity patterns
    console.log('\n⚡ VELOCITY PATTERNS:');
    const velocityMagnitudes = clubDetections.map(c => Math.sqrt(c.head.velocity.x * c.head.velocity.x + c.head.velocity.y * c.head.velocity.y + c.head.velocity.z * c.head.velocity.z));
    const maxVelocity = Math.max(...velocityMagnitudes);
    const maxVelocityFrame = velocityMagnitudes.indexOf(maxVelocity);
    
    console.log(`   Maximum Velocity: ${maxVelocity.toFixed(3)} at frame ${maxVelocityFrame}`);
    console.log(`   Average Velocity: ${(velocityMagnitudes.reduce((sum, v) => sum + v, 0) / velocityMagnitudes.length).toFixed(3)}`);
    
  } finally {
    detector.reset();
  }
}

/**
 * Example 4: Real-time club detection
 */
export function realTimeClubDetection(poses: PoseResult[]): void {
  console.log('📹 REAL-TIME: Running real-time club detection...');
  
  const detector = createClubDetector();
  
  try {
    poses.forEach((pose, frameIndex) => {
      try {
        const club = detector.detectClub(pose, frameIndex);
        
        // Real-time display
        console.log(`\n🏌️‍♂️ FRAME ${frameIndex}`);
        console.log(`   Club Head: (${club.head.position.x.toFixed(3)}, ${club.head.position.y.toFixed(3)})`);
        console.log(`   Shaft Angle: ${club.shaft.angle.toFixed(1)}°`);
        console.log(`   Face Angle: ${club.head.angle.toFixed(1)}°`);
        console.log(`   Club Speed: ${Math.sqrt(club.head.velocity.x * club.head.velocity.x + club.head.velocity.y * club.head.velocity.y).toFixed(3)}`);
        console.log(`   Confidence: ${club.overall.confidence.toFixed(3)}`);
        console.log(`   Quality: ${club.overall.quality}`);
        console.log(`   Stability: ${club.overall.stability.toFixed(3)}`);
        
        // Show grip analysis
        console.log(`   Grip Center: (${club.grip.center.x.toFixed(3)}, ${club.grip.center.y.toFixed(3)})`);
        console.log(`   Grip Confidence: ${club.grip.confidence.toFixed(3)}`);
        
        // Show shaft analysis
        console.log(`   Shaft Length: ${club.shaft.length.toFixed(3)}`);
        console.log(`   Shaft Confidence: ${club.shaft.confidence.toFixed(3)}`);
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Real-time detection failed - ${error.message}`);
      }
    });
    
  } finally {
    detector.reset();
  }
}

/**
 * Example 5: Validate club detection results
 */
export function validateClubDetectionResults(poses: PoseResult[]): void {
  console.log('✅ VALIDATION: Validating club detection results...');
  
  const detector = createClubDetector();
  
  try {
    const validationResults: { frame: number; isValid: boolean; errors: string[] }[] = [];
    
    poses.forEach((pose, frameIndex) => {
      try {
        const club = detector.detectClub(pose, frameIndex);
        const validation = validateClubDetection(club);
        
        validationResults.push({
          frame: frameIndex,
          isValid: validation.isValid,
          errors: validation.errors
        });
        
        if (!validation.isValid) {
          console.warn(`Frame ${frameIndex}: Validation failed - ${validation.errors.join(', ')}`);
        }
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Club detection failed - ${error.message}`);
        validationResults.push({
          frame: frameIndex,
          isValid: false,
          errors: [error.message]
        });
      }
    });
    
    // Analyze validation results
    const validFrames = validationResults.filter(r => r.isValid).length;
    const totalFrames = validationResults.length;
    const validationRate = (validFrames / totalFrames * 100).toFixed(1);
    
    console.log('\n📊 VALIDATION RESULTS:');
    console.log(`   Total Frames: ${totalFrames}`);
    console.log(`   Valid Frames: ${validFrames}`);
    console.log(`   Validation Rate: ${validationRate}%`);
    
    // Show error distribution
    const errorCounts: { [key: string]: number } = {};
    validationResults.forEach(result => {
      result.errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
    });
    
    if (Object.keys(errorCounts).length > 0) {
      console.log('\n❌ ERROR DISTRIBUTION:');
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`   ${error}: ${count} occurrences`);
      });
    }
    
  } finally {
    detector.reset();
  }
}

/**
 * Example 6: Enhanced phase detection with club
 */
export function enhancedPhaseDetectionWithClub(poses: PoseResult[]): void {
  console.log('🏌️ ENHANCED: Running enhanced phase detection with club...');
  
  const detector = new EnhancedPhaseDetectorWithClub();
  
  try {
    detector.initialize();
    
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30); // Assuming 30 FPS
      
      try {
        const enhancedPhase = detector.detectSwingPhaseWithClub(poses, frameIndex, currentTime);
        
        console.log(`\nFrame ${frameIndex}: ${enhancedPhase.name.toUpperCase()}`);
        console.log(`   Club Head: (${enhancedPhase.clubDetection.head.position.x.toFixed(3)}, ${enhancedPhase.clubDetection.head.position.y.toFixed(3)})`);
        console.log(`   Shaft Angle: ${enhancedPhase.clubMetrics.shaftAngle.toFixed(1)}°`);
        console.log(`   Club Speed: ${enhancedPhase.clubMetrics.clubHeadSpeed.toFixed(3)}`);
        console.log(`   Face Angle: ${enhancedPhase.clubMetrics.faceAngle.toFixed(1)}°`);
        console.log(`   Swing Path: ${enhancedPhase.clubMetrics.swingPath.toFixed(1)}°`);
        console.log(`   Phase Confidence: ${enhancedPhase.confidence.toFixed(3)}`);
        console.log(`   Club Confidence: ${enhancedPhase.clubDetection.overall.confidence.toFixed(3)}`);
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Enhanced detection failed - ${error.message}`);
      }
    });
    
    const stats = detector.getEnhancedDetectionStats();
    console.log('\n📊 ENHANCED DETECTION STATISTICS:');
    console.log(`   Club History Length: ${stats.clubHistoryLength}`);
    console.log(`   Average Club Confidence: ${stats.averageClubConfidence.toFixed(3)}`);
    console.log(`   Phase Detector Stats: ${JSON.stringify(stats.phaseDetector)}`);
    console.log(`   Club Detector Stats: ${JSON.stringify(stats.clubDetector)}`);
    
  } finally {
    detector.reset();
  }
}

// 🎯 USAGE EXAMPLES

/**
 * Run all club detection examples
 */
export function runAllClubDetectionExamples(poses: PoseResult[]): void {
  console.log('🚀 CLUB DETECTION: Running all club detection examples...');
  
  try {
    console.log('\n1. Basic Club Detection:');
    basicClubDetection(poses);
    
    console.log('\n2. Hand vs Club Comparison:');
    compareHandVsClubDetection(poses);
    
    console.log('\n3. Club Dynamics Analysis:');
    analyzeClubDynamicsByPhase(poses);
    
    console.log('\n4. Real-time Club Detection:');
    realTimeClubDetection(poses);
    
    console.log('\n5. Validation:');
    validateClubDetectionResults(poses);
    
    console.log('\n6. Enhanced Phase Detection:');
    enhancedPhaseDetectionWithClub(poses);
    
    console.log('\n✅ CLUB DETECTION: All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ CLUB DETECTION: Examples failed:', error);
  }
}

export default {
  basicClubDetection,
  compareHandVsClubDetection,
  analyzeClubDynamicsByPhase,
  realTimeClubDetection,
  validateClubDetectionResults,
  enhancedPhaseDetectionWithClub,
  runAllClubDetectionExamples
};
