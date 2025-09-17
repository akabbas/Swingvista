import { PoseResult } from './mediapipe';
import { SwingPhase } from './swing-phases';
import { SwingTrajectory } from './mediapipe';

/**
 * Golf swing validation system to prevent false high scores on non-golf videos
 * 
 * This system uses multiple tests to confirm that a video contains a real golf swing:
 * 1. Motion pattern validation - checks for distinctive golf swing motion patterns
 * 2. Phase detection validation - ensures proper golf swing phases are detected
 * 3. Trajectory validation - confirms the club path follows a golf swing pattern
 * 4. Timing validation - verifies the timing matches typical golf swing timing
 */

export interface SwingValidationResult {
  isValid: boolean;
  score: number; // 0-100 validation score
  errors: string[];
  warnings: string[];
  validationResults: {
    motionPattern: boolean;
    phaseDetection: boolean;
    trajectory: boolean;
    timing: boolean;
    landmarks: boolean;
  };
}

export class GolfSwingValidator {

  /**
   * Main validation method - runs all tests to determine if video contains a real golf swing
   */
  public validateSwing(
    poses: PoseResult[],
    phases: SwingPhase[],
    trajectory?: SwingTrajectory
  ): SwingValidationResult {
    console.log('🏌️ VALIDATION: Starting golf swing validation...');
    
    const errors: string[] = [];
    const warnings: string[] = [];

    // Run all validation tests
    const motionPatternValid = this.validateMotionPattern(poses);
    const phaseDetectionValid = this.validatePhaseDetection(phases);
    const trajectoryValid = this.validateTrajectory(trajectory);
    const timingValid = this.validateTiming(phases);
    const landmarksValid = this.validateLandmarks(poses);

    if (!motionPatternValid) {
      errors.push('Motion pattern does not match a golf swing');
    }

    if (!phaseDetectionValid) {
      if (phases.length === 0) {
        errors.push('No swing phases detected');
      } else {
        errors.push('Detected phases do not match a valid golf swing sequence');
      }
    }

    if (!trajectoryValid) {
      warnings.push('Club path trajectory does not match typical golf swing patterns');
    }

    if (!timingValid) {
      warnings.push('Swing timing does not match typical golf swing timing');
    }

    if (!landmarksValid) {
      errors.push('Pose data quality insufficient for reliable golf swing analysis');
    }

    // Calculate overall validation score
    const validationResults = {
      motionPattern: motionPatternValid,
      phaseDetection: phaseDetectionValid,
      trajectory: trajectoryValid,
      timing: timingValid,
      landmarks: landmarksValid
    };

    // Weight the tests (some tests are more important than others)
    const score = this.calculateValidationScore(validationResults);
    
    // Determine if swing is valid based on score threshold
    const isValid = score >= 60;

    if (!isValid) {
      console.warn('🏌️ VALIDATION: This does not appear to be a valid golf swing');
      console.warn('🏌️ VALIDATION: Score:', score, '(threshold: 60)');
      console.warn('🏌️ VALIDATION: Errors:', errors);
      console.warn('🏌️ VALIDATION: Warnings:', warnings);
    } else {
      console.log('🏌️ VALIDATION: Golf swing validated successfully');
      console.log('🏌️ VALIDATION: Score:', score);
    }

    return {
      isValid,
      score,
      errors,
      warnings,
      validationResults
    };
  }

  /**
   * Validate golf swing motion pattern
   * Checks for distinctive backswing, downswing, and follow-through motions
   */
  private validateMotionPattern(poses: PoseResult[]): boolean {
    if (!poses || poses.length < 10) {
      console.log('🏌️ VALIDATION: Insufficient poses for motion pattern validation');
      return false;
    }

    try {
      // Extract wrist positions to detect swing motion
      const wristPositions = poses
        .filter(pose => pose.landmarks && 
                pose.landmarks[16] && // Right wrist
                pose.landmarks[16].visibility && 
                pose.landmarks[16].visibility > 0.5)
        .map(pose => ({
          x: pose.landmarks[16].x,
          y: pose.landmarks[16].y,
          timestamp: pose.timestamp || 0
        }));

      if (wristPositions.length < 10) {
        console.log('🏌️ VALIDATION: Insufficient wrist positions for motion pattern validation');
        return false;
      }

      // Calculate horizontal and vertical movement ranges
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (const pos of wristPositions) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minY = Math.min(minY, pos.y);
        maxY = Math.max(maxY, pos.y);
      }

      const xRange = maxX - minX;
      const yRange = maxY - minY;

      // Golf swings typically have significant horizontal and vertical movement
      if (xRange < 0.15 || yRange < 0.15) {
        console.log('🏌️ VALIDATION: Wrist movement range too small for a golf swing', { xRange, yRange });
        return false;
      }

      // Check for distinct backswing and downswing
      // Find point where wrist is highest (top of backswing)
      let topIndex = 0;
      let topY = wristPositions[0].y;
      
      for (let i = 0; i < wristPositions.length; i++) {
        if (wristPositions[i].y < topY) {
          topY = wristPositions[i].y;
          topIndex = i;
        }
      }

      // Need sufficient samples before and after the top
      if (topIndex < 3 || topIndex > wristPositions.length - 3) {
        console.log('🏌️ VALIDATION: Top of swing not properly captured');
        return false;
      }

      // Calculate average vertical position before and after top
      let avgBeforeTop = 0;
      for (let i = 0; i < topIndex; i++) {
        avgBeforeTop += wristPositions[i].y;
      }
      avgBeforeTop /= topIndex;

      let avgAfterTop = 0;
      for (let i = topIndex; i < wristPositions.length; i++) {
        avgAfterTop += wristPositions[i].y;
      }
      avgAfterTop /= (wristPositions.length - topIndex);

      // Check if motion resembles a golf swing (goes up then down)
      if (avgBeforeTop < avgAfterTop) {
        console.log('🏌️ VALIDATION: Motion does not match golf swing pattern');
        return false;
      }

      console.log('🏌️ VALIDATION: Motion pattern validated as golf swing');
      return true;

    } catch (error) {
      console.error('🏌️ VALIDATION: Error validating motion pattern:', error);
      return false;
    }
  }

  /**
   * Validate golf swing phase detection
   * Checks if the detected phases match a typical golf swing sequence
   */
  private validatePhaseDetection(phases: SwingPhase[]): boolean {
    if (!phases || phases.length < 2) {
      console.log('🏌️ VALIDATION: Insufficient phases for validation');
      return false;
    }

    try {
      // Get phase names
      const phaseNames = phases.map(p => p.name.toLowerCase());
      console.log('🏌️ VALIDATION: Detected phases:', phaseNames.join(' -> '));

      // Essential golf swing phases
      const hasAddress = phaseNames.some(name => name.includes('address') || name.includes('setup'));
      const hasBackswing = phaseNames.some(name => name.includes('backswing'));
      const hasDownswing = phaseNames.some(name => 
        name.includes('downswing') || name.includes('down-swing')
      );
      const hasImpact = phaseNames.some(name => name.includes('impact'));
      const hasFollowThrough = phaseNames.some(name => 
        name.includes('follow') || name.includes('finish')
      );

      // Golf swings typically have these key phases
      const essentialPhasesPresent = hasBackswing && hasDownswing;
      const mostPhasesPresent = essentialPhasesPresent && 
        (hasAddress || hasImpact || hasFollowThrough);
      
      console.log('🏌️ VALIDATION: Phase detection:', {
        essentialPhasesPresent,
        mostPhasesPresent,
        hasAddress,
        hasBackswing,
        hasDownswing,
        hasImpact,
        hasFollowThrough
      });

      // For a valid golf swing, we need at least the essential phases
      return essentialPhasesPresent;

    } catch (error) {
      console.error('🏌️ VALIDATION: Error validating phases:', error);
      return false;
    }
  }

  /**
   * Validate golf swing trajectory
   * Checks if the club path matches typical golf swing patterns
   */
  private validateTrajectory(trajectory?: SwingTrajectory): boolean {
    if (!trajectory || !trajectory.rightWrist || trajectory.rightWrist.length < 10) {
      console.log('🏌️ VALIDATION: Insufficient trajectory data for validation');
      return false;
    }

    try {
      // Analyze trajectory shape - golf swing should have an arc-like path
      const points = trajectory.rightWrist;
      
      // Calculate vertical movement (should go up and down)
      let minY = 1, maxY = 0;
      const initialY = points[0].y;
      const finalY = points[points.length - 1].y;
      
      for (const point of points) {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
      
      const verticalRange = maxY - minY;
      
      // Check if trajectory follows an arc-like path
      // For a golf swing, wrist typically goes up then down
      const isArcLike = verticalRange > 0.1 && initialY > minY && finalY > minY;

      console.log('🏌️ VALIDATION: Trajectory validation:', {
        verticalRange,
        initialY,
        finalY,
        minY,
        isArcLike
      });

      return isArcLike;

    } catch (error) {
      console.error('🏌️ VALIDATION: Error validating trajectory:', error);
      return false;
    }
  }

  /**
   * Validate golf swing timing
   * Checks if the timing between phases matches typical golf swing timing
   */
  private validateTiming(phases: SwingPhase[]): boolean {
    if (!phases || phases.length < 2) {
      console.log('🏌️ VALIDATION: Insufficient phases for timing validation');
      return false;
    }

    try {
      // Find backswing and downswing phases
      const backswingPhase = phases.find(p => 
        p.name.toLowerCase().includes('backswing')
      );
      
      const downswingPhase = phases.find(p => 
        p.name.toLowerCase().includes('downswing')
      );
      
      if (!backswingPhase || !downswingPhase) {
        console.log('🏌️ VALIDATION: Missing key phases for timing validation');
        return false;
      }
      
      // Calculate timing metrics
      const backswingDuration = backswingPhase.duration || 0;
      const downswingDuration = downswingPhase.duration || 0;
      
      // Convert to seconds for easier interpretation
      const backswingSeconds = backswingDuration / 1000;
      const downswingSeconds = downswingDuration / 1000;
      
      // Typical golf swing timing:
      // - Backswing: 0.7-1.2 seconds
      // - Downswing: 0.2-0.3 seconds
      // - Ratio (backswing:downswing): 3:1 to 4:1
      const isValidBackswingTime = backswingSeconds > 0.4 && backswingSeconds < 2.0;
      const isValidDownswingTime = downswingSeconds > 0.1 && downswingSeconds < 0.5;
      const tempoRatio = backswingSeconds / downswingSeconds;
      const isValidTempoRatio = tempoRatio > 1.5 && tempoRatio < 6.0;
      
      console.log('🏌️ VALIDATION: Timing validation:', {
        backswingSeconds,
        downswingSeconds,
        tempoRatio,
        isValidBackswingTime,
        isValidDownswingTime,
        isValidTempoRatio
      });
      
      // All timing criteria must be met
      return isValidBackswingTime && isValidDownswingTime && isValidTempoRatio;

    } catch (error) {
      console.error('🏌️ VALIDATION: Error validating timing:', error);
      return false;
    }
  }

  /**
   * Validate landmarks quality
   * Checks if the pose data contains high-quality landmarks
   */
  private validateLandmarks(poses: PoseResult[]): boolean {
    if (!poses || poses.length < 10) {
      console.log('🏌️ VALIDATION: Insufficient poses for landmark validation');
      return false;
    }

    try {
      // Calculate average number of visible landmarks per pose
      let totalLandmarks = 0;
      let totalVisibleLandmarks = 0;
      
      poses.forEach(pose => {
        if (!pose.landmarks) return;
        
        totalLandmarks += pose.landmarks.length;
        
        const visibleLandmarks = pose.landmarks.filter(
          landmark => landmark && landmark.visibility && landmark.visibility > 0.5
        ).length;
        
        totalVisibleLandmarks += visibleLandmarks;
      });
      
      const avgVisibleLandmarks = totalVisibleLandmarks / poses.length;
      const visibilityRatio = totalVisibleLandmarks / totalLandmarks;
      
      // For reliable analysis, we need a minimum number of visible landmarks
      const hasMinimumLandmarks = avgVisibleLandmarks >= 10; // At least 10 visible landmarks
      const hasGoodVisibility = visibilityRatio >= 0.4; // At least 40% of landmarks visible
      
      console.log('🏌️ VALIDATION: Landmark validation:', {
        avgVisibleLandmarks,
        visibilityRatio,
        hasMinimumLandmarks,
        hasGoodVisibility
      });
      
      return hasMinimumLandmarks && hasGoodVisibility;

    } catch (error) {
      console.error('🏌️ VALIDATION: Error validating landmarks:', error);
      return false;
    }
  }

  /**
   * Calculate validation score based on test results
   */
  private calculateValidationScore(results: {
    motionPattern: boolean;
    phaseDetection: boolean;
    trajectory: boolean;
    timing: boolean;
    landmarks: boolean;
  }): number {
    // Weight each test by importance
    const weights = {
      motionPattern: 35, // Most important - is it a golf swing motion
      phaseDetection: 25, // Important - does it have golf swing phases
      trajectory: 20,    // Medium - does club follow golf swing path
      timing: 10,        // Less important - correct timing
      landmarks: 10      // Less important - good pose data
    };

    // Calculate weighted score
    let score = 0;
    if (results.motionPattern) score += weights.motionPattern;
    if (results.phaseDetection) score += weights.phaseDetection;
    if (results.trajectory) score += weights.trajectory;
    if (results.timing) score += weights.timing;
    if (results.landmarks) score += weights.landmarks;

    // Hard requirement: must have motion pattern to get any score
    if (!results.motionPattern) {
      return Math.min(score, 40); // Cap at 40 if motion pattern fails
    }

    // Hard requirement: must have phase detection to score above 60
    if (!results.phaseDetection) {
      return Math.min(score, 50); // Cap at 50 if phase detection fails
    }

    return score;
  }
}

/**
 * Check if a video contains a valid golf swing
 * Returns validation result with score and details
 */
export function validateGolfSwing(
  poses: PoseResult[],
  phases: SwingPhase[],
  trajectory?: SwingTrajectory
): SwingValidationResult {
  const validator = new GolfSwingValidator();
  return validator.validateSwing(poses, phases, trajectory);
}
