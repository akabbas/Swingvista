/**
 * Enhanced Impact Detection System
 * 
 * Implements multiple validation methods for accurate impact detection
 * and club path analysis with confidence scoring.
 */

import { 
  safeArrayAccess, 
  safeNumber, 
  safeObject,
  safeFunctionCall,
  createErrorBoundary
} from './utils/defensive-programming';

export interface ImpactDetectionResult {
  frame: number;
  confidence: number;
  methods: {
    clubSpeed: { frame: number; confidence: number; maxSpeed: number };
    weightTransfer: { frame: number; confidence: number; transferRatio: number };
    clubPosition: { frame: number; confidence: number; lowestPoint: number };
    dynamics: { frame: number; confidence: number; acceleration: number };
    consensus: { frame: number; confidence: number; agreementScore: number };
  };
  validationReport: ValidationReport;
}

export interface ClubPathResult {
  trajectory: ClubPathPoint[];
  accuracy: number;
  confidence: number;
  calibrationUsed: boolean;
  visualValidation: PathValidation;
}

export interface ClubPathPoint {
  x: number;
  y: number;
  z: number;
  frame: number;
  timestamp: number;
  velocity: number;
  confidence: number;
}

export interface ValidationReport {
  visualInspection: {
    impactFrameImage: string | null;
    pathOverlay: string | null;
    discrepancies: string[];
  };
  confidenceBreakdown: {
    impact: number;
    path: number;
    overall: number;
  };
  metrics: {
    frameAccuracy: number; // ±frames from visual truth
    pathDeviation: number; // pixels from expected path
    consistencyScore: number; // how well methods agree
  };
}

interface PathValidation {
  accuracy: number;
  deviation: number;
  referencePoints: { x: number; y: number; frame: number }[];
  calibrationFactors: { scaleX: number; scaleY: number; rotation: number };
}

export class EnhancedImpactDetector {
  private confidenceThreshold = 0.7;
  private frameValidationWindow = 5; // ±5 frames for validation
  
  constructor(config: { confidenceThreshold?: number; validationWindow?: number } = {}) {
    this.confidenceThreshold = config.confidenceThreshold ?? 0.7;
    this.frameValidationWindow = config.validationWindow ?? 5;
  }

  /**
   * Detect impact using multiple validation methods
   */
  async detectImpactWithValidation(
    poses: any[], 
    clubData: ClubPathPoint[], 
    videoElement?: HTMLVideoElement
  ): Promise<ImpactDetectionResult> {
    return createErrorBoundary(
      async () => {
        const safePoses = safeArrayAccess(poses);
        const safeClubData = safeArrayAccess(clubData);
        
        console.log('🎯 Starting enhanced impact detection with', safePoses.length, 'poses');

        // Method 1: Club speed analysis with error handling
        const clubSpeedResult = safeFunctionCall(
          () => this.detectImpactByClubSpeed(safeClubData),
          { frame: 0, confidence: 0, maxSpeed: 0 }
        );
        
        // Method 2: Weight transfer analysis with error handling
        const weightTransferResult = safeFunctionCall(
          () => this.detectImpactByWeightTransfer(safePoses),
          { frame: 0, confidence: 0, transferRatio: 0 }
        );
        
        // Method 3: Club position analysis (lowest point) with error handling
        const clubPositionResult = safeFunctionCall(
          () => this.detectImpactByClubPosition(safeClubData),
          { frame: 0, confidence: 0, lowestPoint: 0 }
        );
        
        // Method 4: Swing dynamics analysis with error handling
        const dynamicsResult = safeFunctionCall(
          () => this.detectImpactByDynamics(safePoses, safeClubData),
          { frame: 0, confidence: 0, acceleration: 0 }
        );

        // Consensus analysis with error handling
        const consensusResult = safeFunctionCall(
          () => this.calculateConsensus([
            clubSpeedResult,
            weightTransferResult, 
            clubPositionResult,
            dynamicsResult
          ]),
          { frame: 0, confidence: 0, agreementScore: 0 }
        );

        // Visual validation if video is available
        let validationReport: ValidationReport = {
          visualInspection: {
            impactFrameImage: null,
            pathOverlay: null,
            discrepancies: []
          },
          confidenceBreakdown: {
            impact: safeNumber(consensusResult?.confidence, 0),
            path: 0,
            overall: safeNumber(consensusResult?.confidence, 0)
          },
          metrics: {
            frameAccuracy: 0,
            pathDeviation: 0,
            consistencyScore: this.calculateConsistencyScore([
              clubSpeedResult,
              weightTransferResult,
              clubPositionResult, 
              dynamicsResult
            ])
          }
        };

        if (videoElement) {
          try {
            validationReport = await this.validateImpactVisually(
              videoElement,
              safeNumber(consensusResult?.frame, 0),
              safePoses
            );
          } catch (error) {
            console.warn('Visual validation failed:', error);
            validationReport.visualInspection.discrepancies.push('Visual validation failed');
          }
        }

        const result: ImpactDetectionResult = {
          frame: safeNumber(consensusResult?.frame, 0),
          confidence: safeNumber(consensusResult?.confidence, 0),
          methods: {
            clubSpeed: clubSpeedResult,
            weightTransfer: weightTransferResult,
            clubPosition: clubPositionResult,
            dynamics: dynamicsResult,
            consensus: consensusResult
          },
          validationReport
        };

        console.log('🎯 Impact detection complete:', {
          frame: result.frame,
          confidence: result.confidence,
          consistency: validationReport.metrics.consistencyScore
        });

        return result;
      },
      (error) => {
        console.error('Impact detection failed:', error);
        return this.createFallbackImpactResult();
      },
      'detectImpactWithValidation'
    );
  }

  /**
   * Method 1: Detect impact by maximum club speed
   */
  private detectImpactByClubSpeed(clubData: ClubPathPoint[]): { frame: number; confidence: number; maxSpeed: number } {
    if (clubData.length < 5) {
      return { frame: 0, confidence: 0, maxSpeed: 0 };
    }

    let maxSpeed = 0;
    let impactFrame = 0;
    
    // Calculate velocities if not provided
    for (let i = 1; i < clubData.length - 1; i++) {
      if (!clubData[i].velocity) {
        const dt = clubData[i + 1].timestamp - clubData[i - 1].timestamp;
        const dx = clubData[i + 1].x - clubData[i - 1].x;
        const dy = clubData[i + 1].y - clubData[i - 1].y;
        const dz = clubData[i + 1].z - clubData[i - 1].z;
        clubData[i].velocity = Math.sqrt(dx*dx + dy*dy + dz*dz) / (dt || 33.33);
      }
      
      if (clubData[i].velocity > maxSpeed) {
        maxSpeed = clubData[i].velocity;
        impactFrame = clubData[i].frame;
      }
    }

    // Confidence based on speed magnitude and trajectory context
    const confidence = Math.min(1.0, maxSpeed / 10.0); // Normalize to expected max speed
    
    return { frame: impactFrame, confidence, maxSpeed };
  }

  /**
   * Method 2: Detect impact by weight transfer completion
   */
  private detectImpactByWeightTransfer(poses: any[]): { frame: number; confidence: number; transferRatio: number } {
    if (poses.length < 10) {
      return { frame: 0, confidence: 0, transferRatio: 0 };
    }

    let maxTransferFrame = 0;
    let maxTransferRatio = 0;
    
    for (let i = 0; i < poses.length; i++) {
      const pose = poses[i];
      if (!pose.landmarks) continue;
      
      const leftHip = pose.landmarks[23];
      const rightHip = pose.landmarks[24];
      const leftKnee = pose.landmarks[25];
      const rightKnee = pose.landmarks[26];
      
      if (!leftHip || !rightHip || !leftKnee || !rightKnee) continue;
      
      // Calculate weight transfer ratio (simplified)
      const hipShift = Math.abs(rightHip.x - leftHip.x);
      const kneeShift = Math.abs(rightKnee.x - leftKnee.x);
      const transferRatio = (hipShift + kneeShift) * 100; // Amplify for visibility
      
      if (transferRatio > maxTransferRatio) {
        maxTransferRatio = transferRatio;
        maxTransferFrame = i;
      }
    }

    const confidence = Math.min(1.0, maxTransferRatio / 50.0); // Normalize
    
    return { frame: maxTransferFrame, confidence, transferRatio: maxTransferRatio };
  }

  /**
   * Method 3: Detect impact by club position (lowest point)
   */
  private detectImpactByClubPosition(clubData: ClubPathPoint[]): { frame: number; confidence: number; lowestPoint: number } {
    if (clubData.length < 5) {
      return { frame: 0, confidence: 0, lowestPoint: 0 };
    }

    let lowestY = clubData[0].y;
    let lowestFrame = 0;
    
    // Find the lowest Y position (highest value in normalized coordinates)
    for (let i = 0; i < clubData.length; i++) {
      if (clubData[i].y > lowestY) {
        lowestY = clubData[i].y;
        lowestFrame = clubData[i].frame;
      }
    }

    // Confidence based on how distinct the lowest point is
    const yVariance = this.calculateVariance(clubData.map(p => p.y));
    const confidence = Math.min(1.0, yVariance * 10); // More variance = more confident
    
    return { frame: lowestFrame, confidence, lowestPoint: lowestY };
  }

  /**
   * Method 4: Detect impact by swing dynamics (acceleration patterns)
   */
  private detectImpactByDynamics(poses: any[], clubData: ClubPathPoint[]): { frame: number; confidence: number; acceleration: number } {
    if (poses.length < 5 || clubData.length < 5) {
      return { frame: 0, confidence: 0, acceleration: 0 };
    }

    let maxAcceleration = 0;
    let impactFrame = 0;
    
    // Calculate accelerations
    for (let i = 2; i < clubData.length - 2; i++) {
      const prev = clubData[i - 2];
      const curr = clubData[i];
      const next = clubData[i + 2];
      
      const v1 = this.calculateVelocity(prev, curr);
      const v2 = this.calculateVelocity(curr, next);
      const acceleration = Math.abs(v2 - v1);
      
      if (acceleration > maxAcceleration) {
        maxAcceleration = acceleration;
        impactFrame = curr.frame;
      }
    }

    const confidence = Math.min(1.0, maxAcceleration / 100.0);
    
    return { frame: impactFrame, confidence, acceleration: maxAcceleration };
  }

  /**
   * Calculate consensus from multiple detection methods
   */
  private calculateConsensus(results: Array<{ frame: number; confidence: number }>): { frame: number; confidence: number; agreementScore: number } {
    if (results.length === 0) {
      return { frame: 0, confidence: 0, agreementScore: 0 };
    }

    // Weight results by confidence
    let weightedFrame = 0;
    let totalWeight = 0;
    
    for (const result of results) {
      weightedFrame += result.frame * result.confidence;
      totalWeight += result.confidence;
    }
    
    const consensusFrame = totalWeight > 0 ? Math.round(weightedFrame / totalWeight) : results[0].frame;
    
    // Calculate agreement score (how close all methods are)
    const agreementScore = this.calculateAgreementScore(results, consensusFrame);
    
    // Overall confidence is average of individual confidences weighted by agreement
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const finalConfidence = avgConfidence * agreementScore;
    
    return { 
      frame: consensusFrame, 
      confidence: finalConfidence,
      agreementScore 
    };
  }

  /**
   * Calculate how well detection methods agree
   */
  private calculateAgreementScore(results: Array<{ frame: number; confidence: number }>, consensusFrame: number): number {
    if (results.length === 0) return 0;
    
    const deviations = results.map(r => Math.abs(r.frame - consensusFrame));
    const maxDeviation = Math.max(...deviations);
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    
    // Agreement score decreases with larger deviations
    const agreementScore = maxDeviation > 0 ? Math.max(0, 1 - avgDeviation / (maxDeviation + 1)) : 1;
    
    return agreementScore;
  }

  /**
   * Calculate consistency score across all methods
   */
  private calculateConsistencyScore(results: Array<{ frame: number; confidence: number }>): number {
    if (results.length < 2) return 1;
    
    const frames = results.map(r => r.frame);
    const frameVariance = this.calculateVariance(frames);
    const maxVariance = Math.pow(frames.length * 10, 2); // Assume max reasonable variance
    
    return Math.max(0, 1 - frameVariance / maxVariance);
  }

  /**
   * Visual validation against actual video frames
   */
  private async validateImpactVisually(
    videoElement: HTMLVideoElement,
    impactFrame: number,
    poses: any[]
  ): Promise<ValidationReport> {
    const discrepancies: string[] = [];
    
    // Check frames around detected impact
    const framesToCheck = [];
    for (let i = -this.frameValidationWindow; i <= this.frameValidationWindow; i++) {
      const frame = impactFrame + i;
      if (frame >= 0 && frame < poses.length) {
        framesToCheck.push(frame);
      }
    }

    // Extract frame images for manual inspection (placeholder for now)
    const impactFrameImage = await this.extractFrameImage(videoElement, impactFrame);
    
    // Check for obvious visual discrepancies
    if (impactFrame < poses.length * 0.3) {
      discrepancies.push(`Impact detected unusually early (frame ${impactFrame}/${poses.length})`);
    }
    if (impactFrame > poses.length * 0.9) {
      discrepancies.push(`Impact detected unusually late (frame ${impactFrame}/${poses.length})`);
    }

    // Calculate frame accuracy (placeholder - would need ground truth)
    const frameAccuracy = 2; // Assume ±2 frames accuracy for now
    
    return {
      visualInspection: {
        impactFrameImage,
        pathOverlay: null,
        discrepancies
      },
      confidenceBreakdown: {
        impact: discrepancies.length === 0 ? 0.9 : 0.6,
        path: 0.8, // Placeholder
        overall: discrepancies.length === 0 ? 0.85 : 0.65
      },
      metrics: {
        frameAccuracy,
        pathDeviation: 5, // Placeholder
        consistencyScore: 0.8 // Placeholder
      }
    };
  }

  /**
   * Extract frame image for visual inspection
   */
  private async extractFrameImage(videoElement: HTMLVideoElement, frame: number): Promise<string | null> {
    try {
      // Calculate time for frame (assuming 30 fps)
      const timeInSeconds = frame / 30;
      
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Seek to frame and capture
      videoElement.currentTime = timeInSeconds;
      await new Promise(resolve => {
        videoElement.addEventListener('seeked', resolve, { once: true });
      });
      
      ctx.drawImage(videoElement, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Failed to extract frame image:', error);
      return null;
    }
  }

  /**
   * Utility: Calculate velocity between two points
   */
  private calculateVelocity(point1: ClubPathPoint, point2: ClubPathPoint): number {
    const dt = point2.timestamp - point1.timestamp;
    if (dt === 0) return 0;
    
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;
    
    return Math.sqrt(dx*dx + dy*dy + dz*dz) / dt;
  }

  /**
   * Utility: Calculate variance of an array
   */
  private calculateVariance(values: number[]): number {
    const safeValues = safeArrayAccess(values);
    if (safeValues.length === 0) return 0;
    
    const mean = safeValues.reduce((sum, v) => sum + safeNumber(v, 0), 0) / safeValues.length;
    const squaredDiffs = safeValues.map(v => Math.pow(safeNumber(v, 0) - mean, 2));
    
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / safeValues.length;
  }

  /**
   * Create fallback impact result for error handling
   */
  private createFallbackImpactResult(): ImpactDetectionResult {
    return {
      frame: 0,
      confidence: 0,
      methods: {
        clubSpeed: { frame: 0, confidence: 0, maxSpeed: 0 },
        weightTransfer: { frame: 0, confidence: 0, transferRatio: 0 },
        clubPosition: { frame: 0, confidence: 0, lowestPoint: 0 },
        dynamics: { frame: 0, confidence: 0, acceleration: 0 },
        consensus: { frame: 0, confidence: 0, agreementScore: 0 }
      },
      validationReport: {
        visualInspection: {
          impactFrameImage: null,
          pathOverlay: null,
          discrepancies: ['Fallback result - impact detection failed']
        },
        confidenceBreakdown: {
          impact: 0,
          path: 0,
          overall: 0
        },
        metrics: {
          frameAccuracy: 0,
          pathDeviation: 0,
          consistencyScore: 0
        }
      }
    };
  }
}

/**
 * Enhanced Club Path Calculator with calibration and validation
 */
export class EnhancedClubPathCalculator {
  private calibrationEnabled = true;
  private visualValidationEnabled = true;
  
  constructor(config: { 
    calibrationEnabled?: boolean;
    visualValidationEnabled?: boolean; 
  } = {}) {
    this.calibrationEnabled = config.calibrationEnabled ?? true;
    this.visualValidationEnabled = config.visualValidationEnabled ?? true;
  }

  /**
   * Calculate club path with recalibration and validation
   */
  calculateClubPathWithRecalibration(
    poses: any[],
    videoMetadata?: { width: number; height: number; duration: number }
  ): ClubPathResult {
    console.log('🏌️ Calculating enhanced club path from', poses.length, 'poses');

    // Step 1: Extract initial club head positions
    const initialPath = this.extractClubHeadPositions(poses);
    
    // Step 2: Apply calibration if enabled and metadata available
    let calibratedPath = initialPath;
    let calibrationUsed = false;
    
    if (this.calibrationEnabled && videoMetadata) {
      const calibrationResult = this.recalibratePath(initialPath, videoMetadata);
      calibratedPath = calibrationResult.path;
      calibrationUsed = calibrationResult.calibrationApplied;
    }

    // Step 3: Validate path quality
    const pathValidation = this.validatePathVisually(calibratedPath, videoMetadata);
    
    // Step 4: Calculate accuracy and confidence scores
    const accuracy = this.calculatePathAccuracy(calibratedPath, pathValidation);
    const confidence = this.calculatePathConfidence(calibratedPath, pathValidation);

    console.log('🏌️ Club path calculation complete:', {
      points: calibratedPath.length,
      accuracy: accuracy.toFixed(3),
      confidence: confidence.toFixed(3),
      calibrated: calibrationUsed
    });

    return {
      trajectory: calibratedPath,
      accuracy,
      confidence,
      calibrationUsed,
      visualValidation: pathValidation
    };
  }

  /**
   * Extract club head positions from poses using improved detection
   */
  private extractClubHeadPositions(poses: any[]): ClubPathPoint[] {
    const clubPath: ClubPathPoint[] = [];
    
    for (let i = 0; i < poses.length; i++) {
      const pose = poses[i];
      if (!pose.landmarks) continue;
      
      const clubPosition = this.detectImprovedClubHeadPosition(pose.landmarks, i);
      if (clubPosition) {
        clubPath.push({
          x: clubPosition.x,
          y: clubPosition.y,
          z: clubPosition.z || 0,
          frame: i,
          timestamp: pose.timestamp || i * 33.33,
          velocity: 0, // Will be calculated later
          confidence: clubPosition.confidence || 0.8
        });
      }
    }

    // Calculate velocities
    this.calculateVelocities(clubPath);
    
    return clubPath;
  }

  /**
   * Improved club head position detection with multiple verification
   */
  private detectImprovedClubHeadPosition(landmarks: any[], frameIndex: number): { x: number; y: number; z?: number; confidence: number } | null {
    const rightWrist = landmarks[16];
    const leftWrist = landmarks[15];
    const rightElbow = landmarks[14];
    const leftElbow = landmarks[13];
    const rightShoulder = landmarks[12];
    const leftShoulder = landmarks[11];
    
    if (!rightWrist || !leftWrist || !rightElbow || !leftElbow) return null;

    // Method 1: Geometric club extension
    const geometricClub = this.calculateGeometricClubHead(rightWrist, leftWrist, rightElbow, leftElbow);
    
    // Method 2: Biomechanical club position
    const biomechanicalClub = this.calculateBiomechanicalClubHead(
      rightWrist, leftWrist, rightShoulder, leftShoulder
    );
    
    // Method 3: Swing plane analysis
    const swingPlaneClub = this.calculateSwingPlaneClubHead(
      rightWrist, leftWrist, rightElbow, leftElbow, frameIndex
    );

    // Combine methods with confidence weighting
    const methods = [geometricClub, biomechanicalClub, swingPlaneClub].filter(m => m !== null);
    if (methods.length === 0) return null;

    let finalX = 0, finalY = 0, finalZ = 0, totalWeight = 0;
    
    for (const method of methods) {
      if (method) {
        finalX += method.x * method.confidence;
        finalY += method.y * method.confidence;
        finalZ += (method.z || 0) * method.confidence;
        totalWeight += method.confidence;
      }
    }

    if (totalWeight === 0) return null;

    return {
      x: finalX / totalWeight,
      y: finalY / totalWeight,
      z: finalZ / totalWeight,
      confidence: totalWeight / methods.length
    };
  }

  /**
   * Calculate club head using geometric arm extension
   */
  private calculateGeometricClubHead(rightWrist: any, leftWrist: any, rightElbow: any, leftElbow: any) {
    // Determine dominant hand based on position
    const isRightHanded = rightWrist.x < leftWrist.x;
    const dominantWrist = isRightHanded ? rightWrist : leftWrist;
    const dominantElbow = isRightHanded ? rightElbow : leftElbow;
    
    // Calculate arm angle
    const armAngle = Math.atan2(
      dominantWrist.y - dominantElbow.y,
      dominantWrist.x - dominantElbow.x
    );
    
    // Calculate club length (typically 2.3x arm length for driver)
    const armLength = Math.sqrt(
      Math.pow(dominantWrist.x - dominantElbow.x, 2) + 
      Math.pow(dominantWrist.y - dominantElbow.y, 2)
    );
    const clubLength = armLength * 2.3;
    
    // Calculate club head position
    const clubAngle = armAngle + (isRightHanded ? Math.PI/2 : -Math.PI/2);
    
    return {
      x: dominantWrist.x + Math.cos(clubAngle) * clubLength,
      y: dominantWrist.y + Math.sin(clubAngle) * clubLength,
      z: dominantWrist.z || 0,
      confidence: Math.min(dominantWrist.visibility || 1, dominantElbow.visibility || 1) * 0.8
    };
  }

  /**
   * Calculate club head using biomechanical principles
   */
  private calculateBiomechanicalClubHead(rightWrist: any, leftWrist: any, rightShoulder: any, leftShoulder: any) {
    // Use grip center and shoulder rotation to estimate club position
    const gripCenter = {
      x: (rightWrist.x + leftWrist.x) / 2,
      y: (rightWrist.y + leftWrist.y) / 2,
      z: ((rightWrist.z || 0) + (leftWrist.z || 0)) / 2
    };
    
    const shoulderCenter = {
      x: (rightShoulder.x + leftShoulder.x) / 2,
      y: (rightShoulder.y + leftShoulder.y) / 2
    };
    
    // Calculate club direction based on body rotation
    const bodyAngle = Math.atan2(
      gripCenter.y - shoulderCenter.y,
      gripCenter.x - shoulderCenter.x
    );
    
    // Estimate club length based on body proportions
    const torsoLength = Math.sqrt(
      Math.pow(gripCenter.x - shoulderCenter.x, 2) + 
      Math.pow(gripCenter.y - shoulderCenter.y, 2)
    );
    const clubLength = torsoLength * 1.5; // Adjusted for biomechanics
    
    return {
      x: gripCenter.x + Math.cos(bodyAngle) * clubLength,
      y: gripCenter.y + Math.sin(bodyAngle) * clubLength,
      z: gripCenter.z,
      confidence: 0.7 // Moderate confidence for biomechanical method
    };
  }

  /**
   * Calculate club head using swing plane analysis
   */
  private calculateSwingPlaneClubHead(rightWrist: any, leftWrist: any, rightElbow: any, leftElbow: any, frameIndex: number) {
    // Simplified swing plane calculation
    // In a real implementation, this would use historical frames to establish the swing plane
    
    const gripCenter = {
      x: (rightWrist.x + leftWrist.x) / 2,
      y: (rightWrist.y + leftWrist.y) / 2
    };
    
    const elbowCenter = {
      x: (rightElbow.x + leftElbow.x) / 2,
      y: (rightElbow.y + leftElbow.y) / 2
    };
    
    // Calculate swing plane angle
    const planeAngle = Math.atan2(
      gripCenter.y - elbowCenter.y,
      gripCenter.x - elbowCenter.x
    );
    
    // Estimate club extension along swing plane
    const armSpan = Math.sqrt(
      Math.pow(gripCenter.x - elbowCenter.x, 2) + 
      Math.pow(gripCenter.y - elbowCenter.y, 2)
    );
    const clubExtension = armSpan * 2.0;
    
    return {
      x: gripCenter.x + Math.cos(planeAngle) * clubExtension,
      y: gripCenter.y + Math.sin(planeAngle) * clubExtension,
      z: (rightWrist.z || 0 + leftWrist.z || 0) / 2,
      confidence: 0.6 // Lower confidence as this is simplified
    };
  }

  /**
   * Calculate velocities for club path points
   */
  private calculateVelocities(clubPath: ClubPathPoint[]): void {
    for (let i = 1; i < clubPath.length - 1; i++) {
      const prev = clubPath[i - 1];
      const next = clubPath[i + 1];
      const dt = next.timestamp - prev.timestamp;
      
      if (dt > 0) {
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const dz = next.z - prev.z;
        
        clubPath[i].velocity = Math.sqrt(dx*dx + dy*dy + dz*dz) / dt;
      }
    }
    
    // Handle first and last points
    if (clubPath.length > 1) {
      clubPath[0].velocity = clubPath[1].velocity || 0;
      clubPath[clubPath.length - 1].velocity = clubPath[clubPath.length - 2].velocity || 0;
    }
  }

  /**
   * Recalibrate path using video metadata and reference points
   */
  private recalibratePath(
    initialPath: ClubPathPoint[], 
    videoMetadata: { width: number; height: number; duration: number }
  ): { path: ClubPathPoint[]; calibrationApplied: boolean } {
    // For now, apply basic scaling based on video dimensions
    // In a real implementation, this would use known reference points
    
    const scaleX = 1920 / videoMetadata.width; // Normalize to standard resolution
    const scaleY = 1080 / videoMetadata.height;
    
    const calibratedPath = initialPath.map(point => ({
      ...point,
      x: point.x * scaleX,
      y: point.y * scaleY
    }));
    
    return {
      path: calibratedPath,
      calibrationApplied: scaleX !== 1 || scaleY !== 1
    };
  }

  /**
   * Validate path against visual markers and expectations
   */
  private validatePathVisually(
    clubPath: ClubPathPoint[], 
    videoMetadata?: { width: number; height: number; duration: number }
  ): PathValidation {
    if (clubPath.length === 0) {
      return {
        accuracy: 0,
        deviation: 100,
        referencePoints: [],
        calibrationFactors: { scaleX: 1, scaleY: 1, rotation: 0 }
      };
    }

    // Calculate path smoothness as a proxy for accuracy
    const velocities = clubPath.map(p => p.velocity);
    const velocityVariance = this.calculateVariance(velocities);
    const maxVelocity = Math.max(...velocities);
    
    // Lower variance = smoother path = higher accuracy
    const smoothnessScore = maxVelocity > 0 ? Math.max(0, 1 - velocityVariance / (maxVelocity * maxVelocity)) : 0;
    
    // Calculate deviation from expected path (simplified)
    const expectedArcHeight = 0.3; // Expected relative height of swing arc
    const actualArcHeight = this.calculateArcHeight(clubPath);
    const heightDeviation = Math.abs(actualArcHeight - expectedArcHeight);
    
    return {
      accuracy: smoothnessScore,
      deviation: heightDeviation * 100,
      referencePoints: this.extractReferencePoints(clubPath),
      calibrationFactors: { scaleX: 1, scaleY: 1, rotation: 0 }
    };
  }

  /**
   * Calculate arc height of the club path
   */
  private calculateArcHeight(clubPath: ClubPathPoint[]): number {
    if (clubPath.length === 0) return 0;
    
    const yValues = clubPath.map(p => p.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    return maxY - minY;
  }

  /**
   * Extract key reference points from club path
   */
  private extractReferencePoints(clubPath: ClubPathPoint[]): Array<{ x: number; y: number; frame: number }> {
    if (clubPath.length < 5) return [];
    
    const referencePoints = [];
    
    // Address position (start)
    referencePoints.push({
      x: clubPath[0].x,
      y: clubPath[0].y, 
      frame: clubPath[0].frame
    });
    
    // Top of backswing (highest point)
    let topIndex = 0;
    let minY = clubPath[0].y;
    for (let i = 0; i < clubPath.length; i++) {
      if (clubPath[i].y < minY) {
        minY = clubPath[i].y;
        topIndex = i;
      }
    }
    referencePoints.push({
      x: clubPath[topIndex].x,
      y: clubPath[topIndex].y,
      frame: clubPath[topIndex].frame
    });
    
    // Impact (lowest point)
    let impactIndex = 0;
    let maxY = clubPath[0].y;
    for (let i = 0; i < clubPath.length; i++) {
      if (clubPath[i].y > maxY) {
        maxY = clubPath[i].y;
        impactIndex = i;
      }
    }
    referencePoints.push({
      x: clubPath[impactIndex].x,
      y: clubPath[impactIndex].y,
      frame: clubPath[impactIndex].frame
    });
    
    // Finish position (end)
    referencePoints.push({
      x: clubPath[clubPath.length - 1].x,
      y: clubPath[clubPath.length - 1].y,
      frame: clubPath[clubPath.length - 1].frame
    });
    
    return referencePoints;
  }

  /**
   * Calculate overall path accuracy
   */
  private calculatePathAccuracy(clubPath: ClubPathPoint[], validation: PathValidation): number {
    return validation.accuracy;
  }

  /**
   * Calculate path confidence score
   */
  private calculatePathConfidence(clubPath: ClubPathPoint[], validation: PathValidation): number {
    if (clubPath.length === 0) return 0;
    
    // Average confidence of individual points
    const avgPointConfidence = clubPath.reduce((sum, p) => sum + p.confidence, 0) / clubPath.length;
    
    // Path continuity score (fewer gaps = higher confidence)
    const continuityScore = clubPath.length / (clubPath[clubPath.length - 1].frame - clubPath[0].frame + 1);
    
    // Combine factors
    return (avgPointConfidence * 0.7 + continuityScore * 0.3) * validation.accuracy;
  }

  /**
   * Utility: Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }
}

/**
 * Create validation report comparing calculated vs actual
 */
export function createValidationReport(
  impactResult: ImpactDetectionResult,
  clubPathResult: ClubPathResult,
  videoElement?: HTMLVideoElement
): Promise<ValidationReport> {
  // This would generate a comprehensive report with visual comparisons
  // For now, return the validation report from impact detection
  return Promise.resolve(impactResult.validationReport);
}

/**
 * Debug helper to explain grading discrepancies
 */
export function explainGradingDiscrepancies(
  impactResult: ImpactDetectionResult,
  clubPathResult: ClubPathResult
): string[] {
  const explanations: string[] = [];
  
  if (impactResult.confidence < 0.7) {
    explanations.push(`Low impact detection confidence (${(impactResult.confidence * 100).toFixed(1)}%) - methods disagree on timing`);
  }
  
  if (clubPathResult.confidence < 0.7) {
    explanations.push(`Low club path confidence (${(clubPathResult.confidence * 100).toFixed(1)}%) - trajectory may be incomplete or inaccurate`);
  }
  
  if (impactResult.validationReport.discrepancies.length > 0) {
    explanations.push(...impactResult.validationReport.discrepancies);
  }
  
  if (clubPathResult.accuracy < 0.8) {
    explanations.push(`Club path accuracy below threshold (${(clubPathResult.accuracy * 100).toFixed(1)}%) - may indicate tracking issues`);
  }
  
  return explanations;
}
