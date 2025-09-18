/**
 * Swing Analysis Validator
 * 
 * Provides debug tools and visual comparison utilities for validating
 * swing analysis accuracy against actual video content.
 */

import { EnhancedImpactDetector, EnhancedClubPathCalculator, ImpactDetectionResult, ClubPathResult } from './enhanced-impact-detection';
import { 
  safeArrayAccess, 
  safePropertyAccess, 
  safeNumber, 
  safeObject,
  safeFunctionCall,
  safeAsyncFunctionCall,
  cleanClassName,
  withTimeout,
  createErrorBoundary,
  validatePoseData,
  validateClubPathData
} from './utils/defensive-programming';

export interface DebugFrame {
  frameNumber: number;
  timestamp: number;
  image: string; // Base64 encoded image
  annotations: FrameAnnotation[];
  metrics: FrameMetrics;
}

export interface FrameAnnotation {
  type: 'impact_detected' | 'club_position' | 'phase_marker' | 'issue';
  x: number;
  y: number;
  label: string;
  confidence?: number;
  color: string;
}

export interface FrameMetrics {
  clubHeadPosition: { x: number; y: number; confidence: number };
  clubVelocity: number;
  impactProbability: number;
  phaseDetection: string;
  qualityScore: number;
}

export interface ValidationComparison {
  calculatedImpact: number;
  visualImpact: number | null;
  frameDifference: number;
  accuracy: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string[];
}

export interface DebugReport {
  videoInfo: {
    filename: string;
    duration: number;
    frameCount: number;
    fps: number;
  };
  impactAnalysis: {
    detected: ImpactDetectionResult;
    validation: ValidationComparison;
    keyFrames: DebugFrame[];
  };
  clubPathAnalysis: {
    calculated: ClubPathResult;
    visualValidation: PathValidationResult;
    keyPoints: Array<{ frame: number; issue: string; severity: 'low' | 'medium' | 'high' }>;
  };
  overallAssessment: {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    reliability: number;
    recommendations: string[];
  };
}

export interface PathValidationResult {
  smoothness: number;
  consistency: number;
  physicalPlausibility: number;
  visualAlignment: number;
  issues: Array<{ frame: number; description: string }>;
}

export class SwingAnalysisValidator {
  private impactDetector: EnhancedImpactDetector;
  private clubPathCalculator: EnhancedClubPathCalculator;
  private debugEnabled: boolean;
  
  constructor(config: { debugEnabled?: boolean } = {}) {
    this.impactDetector = new EnhancedImpactDetector();
    this.clubPathCalculator = new EnhancedClubPathCalculator();
    this.debugEnabled = config.debugEnabled ?? true;
  }

  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport(
    poses: any[],
    videoElement: HTMLVideoElement,
    filename: string = 'unknown'
  ): Promise<DebugReport> {
    return createErrorBoundary(
      async () => {
        console.log('🔍 Generating validation report for', filename);

        // Validate input data
        const safePoses = safeArrayAccess(poses);
        if (!validatePoseData(safePoses)) {
          console.warn('Invalid pose data provided, using fallback');
        }

        // Extract basic video info with safe access
        const videoInfo = {
          filename: safePropertyAccess(filename, '', 'unknown'),
          duration: safeNumber(videoElement?.duration, 0),
          frameCount: safePoses.length,
          fps: safePoses.length > 0 && videoElement?.duration > 0 ? safePoses.length / videoElement.duration : 30
        };

        // Enhanced impact detection with error handling
        const clubData = await safeAsyncFunctionCall(
          () => this.extractClubData(safePoses),
          []
        );
        
        const impactResult = await safeAsyncFunctionCall(
          () => this.impactDetector.detectImpactWithValidation(safePoses, clubData, videoElement),
          this.createFallbackImpactResult()
        );
        
        // Enhanced club path calculation with error handling
        const clubPathResult = await safeAsyncFunctionCall(
          () => this.clubPathCalculator.calculateClubPathWithRecalibration(safePoses, {
            width: safeNumber(videoElement?.videoWidth, 640),
            height: safeNumber(videoElement?.videoHeight, 480),
            duration: safeNumber(videoElement?.duration, 10)
          }),
          this.createFallbackClubPathResult()
        );

        // Generate validation comparison with error handling
        const impactValidation = await safeAsyncFunctionCall(
          () => this.validateImpactDetection(impactResult, videoElement, safePoses),
          this.createFallbackValidationComparison()
        );
        
        // Generate key debug frames with error handling
        const keyFrames = await safeAsyncFunctionCall(
          () => this.generateKeyFrames(impactResult, clubPathResult, videoElement, safePoses),
          []
        );
        
        // Validate club path with error handling
        const pathValidation = safeFunctionCall(
          () => this.validateClubPath(clubPathResult, safePoses),
          this.createFallbackPathValidation()
        );
        
        // Generate overall assessment with error handling
        const overallAssessment = safeFunctionCall(
          () => this.generateOverallAssessment(impactResult, clubPathResult, impactValidation, pathValidation),
          this.createFallbackOverallAssessment()
        );

        const report: DebugReport = {
          videoInfo,
          impactAnalysis: {
            detected: impactResult,
            validation: impactValidation,
            keyFrames
          },
          clubPathAnalysis: {
            calculated: clubPathResult,
            visualValidation: pathValidation,
            keyPoints: this.identifyClubPathIssues(clubPathResult, safePoses)
          },
          overallAssessment
        };

        if (this.debugEnabled) {
          console.log('🔍 Validation report generated:', {
            impact: safeNumber(impactResult?.frame, 0),
            confidence: safeNumber(impactResult?.confidence, 0),
            pathPoints: safeArrayAccess(clubPathResult?.trajectory).length,
            accuracy: safePropertyAccess(overallAssessment, 'grade', 'F')
          });
        }

        return report;
      },
      (error) => {
        console.error('Failed to generate validation report:', error);
        return this.createFallbackDebugReport(filename);
      },
      'generateValidationReport'
    );
  }

  /**
   * Generate side-by-side comparison of calculated vs actual frames
   */
  async generateSideBySideComparison(
    impactResult: ImpactDetectionResult,
    videoElement: HTMLVideoElement,
    poses: any[]
  ): Promise<{ calculated: string; manual: string; difference: number }> {
    const calculatedFrame = impactResult.frame;
    
    // Extract calculated impact frame
    const calculatedImage = await this.extractAnnotatedFrame(videoElement, calculatedFrame, {
      annotations: [
        {
          type: 'impact_detected',
          x: 0.5,
          y: 0.5,
          label: `Calculated Impact (Frame ${calculatedFrame})`,
          confidence: impactResult.confidence,
          color: '#ff0000'
        }
      ]
    });

    // For manual comparison, we'd ideally have ground truth data
    // For now, we'll extract the frame that "looks most like impact" based on visual cues
    const manualFrame = await this.findVisualImpactFrame(videoElement, poses, calculatedFrame);
    const manualImage = await this.extractAnnotatedFrame(videoElement, manualFrame, {
      annotations: [
        {
          type: 'impact_detected',
          x: 0.5,
          y: 0.5,
          label: `Visual Impact (Frame ${manualFrame})`,
          color: '#00ff00'
        }
      ]
    });

    return {
      calculated: calculatedImage,
      manual: manualImage,
      difference: Math.abs(calculatedFrame - manualFrame)
    };
  }

  /**
   * Create debug overlay showing calculation process
   */
  async createDebugOverlay(
    impactResult: ImpactDetectionResult,
    clubPathResult: ClubPathResult,
    videoElement: HTMLVideoElement
  ): Promise<string> {
    // Create canvas for debug overlay
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot create canvas context');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Draw current frame
    ctx.drawImage(videoElement, 0, 0);

    // Draw club path
    this.drawClubPath(ctx, clubPathResult.trajectory, canvas.width, canvas.height);
    
    // Draw impact detection markers
    this.drawImpactMarkers(ctx, impactResult, canvas.width, canvas.height);
    
    // Draw confidence indicators
    this.drawConfidenceIndicators(ctx, impactResult, clubPathResult, canvas.width, canvas.height);

    return canvas.toDataURL('image/png');
  }

  /**
   * Validate impact detection against visual inspection
   */
  private async validateImpactDetection(
    impactResult: ImpactDetectionResult,
    videoElement: HTMLVideoElement,
    poses: any[]
  ): Promise<ValidationComparison> {
    const calculatedImpact = impactResult.frame;
    
    // Attempt to find visual impact through heuristics
    const visualImpact = await this.findVisualImpactFrame(videoElement, poses, calculatedImpact);
    const frameDifference = Math.abs(calculatedImpact - visualImpact);
    
    // Determine accuracy grade
    let accuracy: 'excellent' | 'good' | 'fair' | 'poor';
    const notes: string[] = [];
    
    if (frameDifference <= 2) {
      accuracy = 'excellent';
      notes.push('Impact detection within ±2 frames of visual inspection');
    } else if (frameDifference <= 5) {
      accuracy = 'good';
      notes.push('Impact detection within ±5 frames of visual inspection');
    } else if (frameDifference <= 10) {
      accuracy = 'fair';
      notes.push(`Impact detection ${frameDifference} frames off from visual inspection`);
    } else {
      accuracy = 'poor';
      notes.push(`Impact detection significantly off (${frameDifference} frames) from visual inspection`);
    }

    // Add confidence-based notes
    if (impactResult.confidence < 0.5) {
      notes.push('Low confidence detection - multiple methods disagreed');
    } else if (impactResult.confidence < 0.7) {
      notes.push('Moderate confidence detection - some method disagreement');
    } else {
      notes.push('High confidence detection - methods aligned well');
    }

    return {
      calculatedImpact,
      visualImpact,
      frameDifference,
      accuracy,
      notes
    };
  }

  /**
   * Find visual impact frame using heuristics
   */
  private async findVisualImpactFrame(
    videoElement: HTMLVideoElement,
    poses: any[],
    calculatedFrame: number
  ): Promise<number> {
    // Search around the calculated frame for visual cues
    const searchRadius = 10;
    const startFrame = Math.max(0, calculatedFrame - searchRadius);
    const endFrame = Math.min(poses.length - 1, calculatedFrame + searchRadius);
    
    let bestFrame = calculatedFrame;
    let maxScore = 0;
    
    for (let frame = startFrame; frame <= endFrame; frame++) {
      const score = await this.calculateVisualImpactScore(videoElement, poses[frame], frame);
      if (score > maxScore) {
        maxScore = score;
        bestFrame = frame;
      }
    }
    
    return bestFrame;
  }

  /**
   * Calculate visual impact score for a frame
   */
  private async calculateVisualImpactScore(
    videoElement: HTMLVideoElement,
    pose: any,
    frame: number
  ): Promise<number> {
    let score = 0;
    
    if (!pose || !pose.landmarks) return 0;
    
    // Factor 1: Body position suggests impact
    const leftHip = pose.landmarks[23];
    const rightHip = pose.landmarks[24];
    const leftShoulder = pose.landmarks[11];
    const rightShoulder = pose.landmarks[12];
    
    if (leftHip && rightHip && leftShoulder && rightShoulder) {
      // Weight transfer: left hip ahead of right hip at impact
      if (leftHip.x < rightHip.x) score += 0.3;
      
      // Shoulder rotation: left shoulder higher than right at impact
      if (leftShoulder.y < rightShoulder.y) score += 0.2;
    }
    
    // Factor 2: Arm extension suggests impact
    const leftWrist = pose.landmarks[15];
    const rightWrist = pose.landmarks[16];
    const leftElbow = pose.landmarks[13];
    const rightElbow = pose.landmarks[14];
    
    if (leftWrist && rightWrist && leftElbow && rightElbow) {
      // Arms should be extended at impact
      const leftArmExtension = Math.sqrt(
        Math.pow(leftWrist.x - leftElbow.x, 2) + 
        Math.pow(leftWrist.y - leftElbow.y, 2)
      );
      const rightArmExtension = Math.sqrt(
        Math.pow(rightWrist.x - rightElbow.x, 2) + 
        Math.pow(rightWrist.y - rightElbow.y, 2)
      );
      
      // Higher extension = more likely impact
      score += (leftArmExtension + rightArmExtension) * 0.25;
    }
    
    // Factor 3: Visual analysis of frame content (simplified)
    try {
      const frameScore = await this.analyzeFrameContent(videoElement, frame);
      score += frameScore * 0.2;
    } catch (error) {
      // Frame analysis failed, skip this factor
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Analyze frame content for visual impact cues
   */
  private async analyzeFrameContent(videoElement: HTMLVideoElement, frame: number): Promise<number> {
    // Seek to frame
    videoElement.currentTime = frame / 30; // Assume 30 fps
    await new Promise(resolve => {
      videoElement.addEventListener('seeked', resolve, { once: true });
    });
    
    // Create canvas for analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);
    
    // Analyze image data for motion blur, contrast changes, etc.
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate image sharpness (inverse of blur) as proxy for motion
    let sharpness = 0;
    for (let i = 0; i < data.length - 4; i += 4) {
      const r1 = data[i];
      const r2 = data[i + 4];
      sharpness += Math.abs(r1 - r2);
    }
    
    // Normalize sharpness score
    const normalizedSharpness = sharpness / (data.length / 4);
    
    // Lower sharpness (more blur) might indicate high-speed motion at impact
    return Math.max(0, 1 - normalizedSharpness / 100);
  }

  /**
   * Generate key debug frames around impact
   */
  private async generateKeyFrames(
    impactResult: ImpactDetectionResult,
    clubPathResult: ClubPathResult,
    videoElement: HTMLVideoElement,
    poses: any[]
  ): Promise<DebugFrame[]> {
    const keyFrames: DebugFrame[] = [];
    const impactFrame = impactResult.frame;
    
    // Generate frames: before, at, and after impact
    const framesToCapture = [
      impactFrame - 5,
      impactFrame - 2,
      impactFrame,
      impactFrame + 2,
      impactFrame + 5
    ].filter(f => f >= 0 && f < poses.length);
    
    for (const frameNum of framesToCapture) {
      const debugFrame = await this.createDebugFrame(frameNum, videoElement, poses[frameNum], impactResult, clubPathResult);
      keyFrames.push(debugFrame);
    }
    
    return keyFrames;
  }

  /**
   * Create a debug frame with annotations
   */
  private async createDebugFrame(
    frameNumber: number,
    videoElement: HTMLVideoElement,
    pose: any,
    impactResult: ImpactDetectionResult,
    clubPathResult: ClubPathResult
  ): Promise<DebugFrame> {
    // Seek to frame and capture
    videoElement.currentTime = frameNumber / 30;
    await new Promise(resolve => {
      videoElement.addEventListener('seeked', resolve, { once: true });
    });
    
    const image = await this.extractAnnotatedFrame(videoElement, frameNumber, {
      annotations: this.generateFrameAnnotations(frameNumber, pose, impactResult, clubPathResult)
    });
    
    const metrics = this.calculateFrameMetrics(frameNumber, pose, impactResult, clubPathResult);
    
    return {
      frameNumber,
      timestamp: frameNumber / 30,
      image,
      annotations: [],
      metrics
    };
  }

  /**
   * Generate annotations for a frame
   */
  private generateFrameAnnotations(
    frameNumber: number,
    pose: any,
    impactResult: ImpactDetectionResult,
    clubPathResult: ClubPathResult
  ): FrameAnnotation[] {
    const annotations: FrameAnnotation[] = [];
    
    // Mark if this is the detected impact frame
    if (frameNumber === impactResult.frame) {
      annotations.push({
        type: 'impact_detected',
        x: 0.5,
        y: 0.1,
        label: `IMPACT (Confidence: ${(impactResult.confidence * 100).toFixed(1)}%)`,
        confidence: impactResult.confidence,
        color: '#ff0000'
      });
    }
    
    // Mark club position if available
    const clubPoint = clubPathResult.trajectory.find(p => p.frame === frameNumber);
    if (clubPoint) {
      annotations.push({
        type: 'club_position',
        x: clubPoint.x,
        y: clubPoint.y,
        label: `Club Head (V: ${clubPoint.velocity.toFixed(1)})`,
        confidence: clubPoint.confidence,
        color: '#00ff00'
      });
    }
    
    // Mark any issues with safe access
    const discrepancies = safeArrayAccess(
      safePropertyAccess(impactResult, 'validationReport.discrepancies', [])
    );
    
    if (discrepancies.length > 0 && frameNumber === safeNumber(impactResult?.frame, 0)) {
      annotations.push({
        type: 'issue',
        x: 0.5,
        y: 0.9,
        label: 'Validation Issues Detected',
        color: '#ffaa00'
      });
    }
    
    return annotations;
  }

  /**
   * Calculate metrics for a frame
   */
  private calculateFrameMetrics(
    frameNumber: number,
    pose: any,
    impactResult: ImpactDetectionResult,
    clubPathResult: ClubPathResult
  ): FrameMetrics {
    const clubPoint = clubPathResult.trajectory.find(p => p.frame === frameNumber);
    
    // Calculate impact probability for this frame
    const impactProbability = this.calculateImpactProbabilityForFrame(frameNumber, impactResult);
    
    // Determine phase
    let phaseDetection = 'unknown';
    if (frameNumber < impactResult.frame * 0.3) phaseDetection = 'address/takeaway';
    else if (frameNumber < impactResult.frame * 0.7) phaseDetection = 'backswing';
    else if (frameNumber < impactResult.frame * 1.1) phaseDetection = 'downswing';
    else if (frameNumber < impactResult.frame * 1.3) phaseDetection = 'impact';
    else phaseDetection = 'follow-through';
    
    return {
      clubHeadPosition: clubPoint ? 
        { x: clubPoint.x, y: clubPoint.y, confidence: clubPoint.confidence } :
        { x: 0, y: 0, confidence: 0 },
      clubVelocity: clubPoint?.velocity || 0,
      impactProbability,
      phaseDetection,
      qualityScore: clubPoint?.confidence || 0
    };
  }

  /**
   * Calculate impact probability for a specific frame
   */
  private calculateImpactProbabilityForFrame(frameNumber: number, impactResult: ImpactDetectionResult): number {
    const distance = Math.abs(frameNumber - impactResult.frame);
    const maxDistance = 10; // Frames beyond which probability is 0
    
    if (distance >= maxDistance) return 0;
    
    // Gaussian-like probability distribution around detected impact
    const probability = Math.exp(-(distance * distance) / (2 * 4 * 4)) * impactResult.confidence;
    
    return probability;
  }

  /**
   * Extract club data from poses
   */
  private extractClubData(poses: any[]): any[] {
    return poses.map((pose, index) => {
      if (!pose.landmarks) return null;
      
      const rightWrist = pose.landmarks[16];
      const leftWrist = pose.landmarks[15];
      
      if (!rightWrist || !leftWrist) return null;
      
      return {
        x: (rightWrist.x + leftWrist.x) / 2,
        y: (rightWrist.y + leftWrist.y) / 2,
        z: 0,
        frame: index,
        timestamp: pose.timestamp || index * 33.33,
        velocity: 0,
        confidence: Math.min(rightWrist.visibility || 1, leftWrist.visibility || 1)
      };
    }).filter(Boolean);
  }

  /**
   * Extract annotated frame
   */
  private async extractAnnotatedFrame(
    videoElement: HTMLVideoElement,
    frameNumber: number,
    options: { annotations?: FrameAnnotation[] } = {}
  ): Promise<string> {
    // Seek to frame
    videoElement.currentTime = frameNumber / 30;
    await new Promise(resolve => {
      videoElement.addEventListener('seeked', resolve, { once: true });
    });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot create canvas context');
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw video frame
    ctx.drawImage(videoElement, 0, 0);
    
    // Draw annotations
    if (options.annotations) {
      for (const annotation of options.annotations) {
        this.drawAnnotation(ctx, annotation, canvas.width, canvas.height);
      }
    }
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Draw annotation on canvas
   */
  private drawAnnotation(
    ctx: CanvasRenderingContext2D,
    annotation: FrameAnnotation,
    width: number,
    height: number
  ): void {
    const x = annotation.x * width;
    const y = annotation.y * height;
    
    // Draw marker
    ctx.strokeStyle = annotation.color;
    ctx.fillStyle = annotation.color;
    ctx.lineWidth = 3;
    
    if (annotation.type === 'impact_detected') {
      // Draw crosshair
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x + 20, y);
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x, y + 20);
      ctx.stroke();
    } else if (annotation.type === 'club_position') {
      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw label
    ctx.fillStyle = annotation.color;
    ctx.font = '14px Arial';
    ctx.fillText(annotation.label, x + 25, y - 10);
  }

  /**
   * Draw club path on canvas
   */
  private drawClubPath(
    ctx: CanvasRenderingContext2D,
    trajectory: any[],
    width: number,
    height: number
  ): void {
    if (trajectory.length < 2) return;
    
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const firstPoint = trajectory[0];
    ctx.moveTo(firstPoint.x * width, firstPoint.y * height);
    
    for (let i = 1; i < trajectory.length; i++) {
      const point = trajectory[i];
      ctx.lineTo(point.x * width, point.y * height);
    }
    
    ctx.stroke();
  }

  /**
   * Draw impact markers on canvas
   */
  private drawImpactMarkers(
    ctx: CanvasRenderingContext2D,
    impactResult: ImpactDetectionResult,
    width: number,
    height: number
  ): void {
    // Draw impact frame marker
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    
    // Draw vertical line at impact
    const x = width * 0.8; // Position at right side
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Add label
    ctx.fillStyle = '#ff0000';
    ctx.font = '16px Arial';
    ctx.fillText(`Impact Frame: ${impactResult.frame}`, x - 100, 30);
    ctx.fillText(`Confidence: ${(impactResult.confidence * 100).toFixed(1)}%`, x - 100, 50);
  }

  /**
   * Draw confidence indicators
   */
  private drawConfidenceIndicators(
    ctx: CanvasRenderingContext2D,
    impactResult: ImpactDetectionResult,
    clubPathResult: ClubPathResult,
    width: number,
    height: number
  ): void {
    // Draw confidence bars
    const barWidth = 150;
    const barHeight = 20;
    const startX = 20;
    const startY = height - 100;
    
    // Impact confidence
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(startX, startY, barWidth, barHeight);
    
    const impactConfidenceWidth = barWidth * impactResult.confidence;
    ctx.fillStyle = impactResult.confidence > 0.7 ? '#00ff00' : impactResult.confidence > 0.4 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(startX, startY, impactConfidenceWidth, barHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('Impact Confidence', startX, startY - 5);
    
    // Club path confidence
    const pathStartY = startY + 30;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(startX, pathStartY, barWidth, barHeight);
    
    const pathConfidenceWidth = barWidth * clubPathResult.confidence;
    ctx.fillStyle = clubPathResult.confidence > 0.7 ? '#00ff00' : clubPathResult.confidence > 0.4 ? '#ffaa00' : '#ff0000';
    ctx.fillRect(startX, pathStartY, pathConfidenceWidth, barHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Path Confidence', startX, pathStartY - 5);
  }

  /**
   * Validate club path quality
   */
  private validateClubPath(clubPathResult: ClubPathResult, poses: any[]): PathValidationResult {
    const trajectory = clubPathResult.trajectory;
    
    if (trajectory.length === 0) {
      return {
        smoothness: 0,
        consistency: 0,
        physicalPlausibility: 0,
        visualAlignment: 0,
        issues: [{ frame: 0, description: 'No club path data available' }]
      };
    }

    // Calculate smoothness (low velocity variance = smooth)
    const velocities = trajectory.map(p => p.velocity);
    const velocityVariance = this.calculateVariance(velocities);
    const maxVelocity = Math.max(...velocities);
    const smoothness = maxVelocity > 0 ? Math.max(0, 1 - velocityVariance / (maxVelocity * maxVelocity)) : 0;

    // Calculate consistency (consistent frame-to-frame tracking)
    const consistency = trajectory.length / (trajectory[trajectory.length - 1].frame - trajectory[0].frame + 1);

    // Physical plausibility (reasonable velocities, proper arc shape)
    const physicalPlausibility = this.assessPhysicalPlausibility(trajectory);

    // Visual alignment (how well path aligns with expected swing mechanics)
    const visualAlignment = this.assessVisualAlignment(trajectory, poses);

    // Identify specific issues
    const issues = this.identifyPathIssues(trajectory);

    return {
      smoothness,
      consistency,
      physicalPlausibility,
      visualAlignment,
      issues
    };
  }

  /**
   * Assess physical plausibility of club path
   */
  private assessPhysicalPlausibility(trajectory: any[]): number {
    if (trajectory.length < 5) return 0;
    
    let score = 1.0;
    
    // Check for reasonable velocities (not too high or too low)
    const velocities = trajectory.map(p => p.velocity);
    const maxVelocity = Math.max(...velocities);
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    
    if (maxVelocity > 50) score -= 0.3; // Unreasonably high speed
    if (avgVelocity < 1) score -= 0.3; // Unreasonably low speed
    
    // Check for proper arc shape (should be roughly parabolic)
    const yValues = trajectory.map(p => p.y);
    const yRange = Math.max(...yValues) - Math.min(...yValues);
    if (yRange < 0.1) score -= 0.4; // Too flat, no swing arc
    
    return Math.max(0, score);
  }

  /**
   * Assess visual alignment with expected swing mechanics
   */
  private assessVisualAlignment(trajectory: any[], poses: any[]): number {
    if (trajectory.length === 0 || poses.length === 0) return 0;
    
    let alignmentScore = 0.5; // Start with neutral score
    
    // Check if club path follows expected swing plane
    const startPoint = trajectory[0];
    const endPoint = trajectory[trajectory.length - 1];
    const midPoint = trajectory[Math.floor(trajectory.length / 2)];
    
    // Expected: club starts low, goes high, comes back low
    if (midPoint.y < startPoint.y && midPoint.y < endPoint.y) {
      alignmentScore += 0.3; // Good swing arc shape
    }
    
    // Check for proper tempo (gradual acceleration then deceleration)
    const velocities = trajectory.map(p => p.velocity);
    const peakVelocityIndex = velocities.indexOf(Math.max(...velocities));
    const peakPosition = peakVelocityIndex / velocities.length;
    
    if (peakPosition > 0.4 && peakPosition < 0.8) {
      alignmentScore += 0.2; // Peak velocity in reasonable position
    }
    
    return Math.min(1.0, alignmentScore);
  }

  /**
   * Identify specific issues with club path
   */
  private identifyPathIssues(trajectory: any[]): Array<{ frame: number; description: string }> {
    const issues: Array<{ frame: number; description: string }> = [];
    
    if (trajectory.length < 10) {
      issues.push({ frame: 0, description: 'Insufficient club path data - too few tracking points' });
      return issues;
    }
    
    // Check for sudden jumps in position
    for (let i = 1; i < trajectory.length; i++) {
      const prev = trajectory[i - 1];
      const curr = trajectory[i];
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + 
        Math.pow(curr.y - prev.y, 2)
      );
      
      if (distance > 0.2) { // Sudden large movement
        issues.push({ 
          frame: curr.frame, 
          description: `Large position jump detected (${(distance * 100).toFixed(1)}% of screen)` 
        });
      }
    }
    
    // Check for tracking gaps
    for (let i = 1; i < trajectory.length; i++) {
      const frameGap = trajectory[i].frame - trajectory[i - 1].frame;
      if (frameGap > 5) {
        issues.push({ 
          frame: trajectory[i].frame, 
          description: `Tracking gap of ${frameGap} frames detected` 
        });
      }
    }
    
    // Check for low confidence regions
    const lowConfidencePoints = trajectory.filter(p => p.confidence < 0.5);
    if (lowConfidencePoints.length > trajectory.length * 0.3) {
      issues.push({ 
        frame: 0, 
        description: `${lowConfidencePoints.length} points with low tracking confidence` 
      });
    }
    
    return issues;
  }

  /**
   * Identify club path issues for report
   */
  private identifyClubPathIssues(clubPathResult: ClubPathResult, poses: any[]): Array<{ frame: number; issue: string; severity: 'low' | 'medium' | 'high' }> {
    const issues: Array<{ frame: number; issue: string; severity: 'low' | 'medium' | 'high' }> = [];
    
    if (clubPathResult.confidence < 0.5) {
      issues.push({
        frame: 0,
        issue: 'Low overall club path confidence',
        severity: 'high'
      });
    }
    
    if (clubPathResult.accuracy < 0.6) {
      issues.push({
        frame: 0,
        issue: 'Club path accuracy below acceptable threshold',
        severity: 'high'
      });
    }
    
    const pathIssues = this.identifyPathIssues(clubPathResult.trajectory);
    for (const pathIssue of pathIssues) {
      issues.push({
        frame: pathIssue.frame,
        issue: pathIssue.description,
        severity: pathIssue.description.includes('gap') ? 'high' : 'medium'
      });
    }
    
    return issues;
  }

  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    impactResult: ImpactDetectionResult,
    clubPathResult: ClubPathResult,
    impactValidation: ValidationComparison,
    pathValidation: PathValidationResult
  ): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; reliability: number; recommendations: string[] } {
    // Calculate overall score
    const impactScore = impactResult.confidence * (impactValidation.accuracy === 'excellent' ? 1.0 : 
                        impactValidation.accuracy === 'good' ? 0.8 : 
                        impactValidation.accuracy === 'fair' ? 0.6 : 0.4);
    
    const pathScore = clubPathResult.confidence * (pathValidation.smoothness + pathValidation.consistency + 
                      pathValidation.physicalPlausibility + pathValidation.visualAlignment) / 4;
    
    const overallScore = (impactScore + pathScore) / 2;
    
    // Assign grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 0.9) grade = 'A';
    else if (overallScore >= 0.8) grade = 'B';
    else if (overallScore >= 0.7) grade = 'C';
    else if (overallScore >= 0.6) grade = 'D';
    else grade = 'F';
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (impactResult.confidence < 0.7) {
      recommendations.push('Consider re-recording with clearer view of impact zone');
    }
    
    if (clubPathResult.confidence < 0.7) {
      recommendations.push('Improve lighting and contrast for better club tracking');
    }
    
    if (pathValidation.consistency < 0.8) {
      recommendations.push('Ensure consistent club visibility throughout swing');
    }
    
    if (impactValidation.frameDifference > 5) {
      recommendations.push('Manual verification of impact timing recommended');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Analysis quality is good - results should be reliable');
    }
    
    return {
      grade,
      reliability: overallScore,
      recommendations
    };
  }

  /**
   * Utility: Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const safeValues = safeArrayAccess(values);
    if (safeValues.length === 0) return 0;
    
    const mean = safeValues.reduce((sum, v) => sum + safeNumber(v, 0), 0) / safeValues.length;
    const squaredDiffs = safeValues.map(v => Math.pow(safeNumber(v, 0) - mean, 2));
    
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / safeValues.length;
  }

  /**
   * Fallback methods for error handling
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
          discrepancies: ['Fallback result - analysis failed']
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

  private createFallbackClubPathResult(): ClubPathResult {
    return {
      trajectory: [],
      accuracy: 0,
      confidence: 0,
      calibrationUsed: false,
      visualValidation: {
        accuracy: 0,
        deviation: 100,
        referencePoints: [],
        calibrationFactors: { scaleX: 1, scaleY: 1, rotation: 0 }
      }
    };
  }

  private createFallbackValidationComparison(): ValidationComparison {
    return {
      calculatedImpact: 0,
      visualImpact: null,
      frameDifference: 0,
      accuracy: 'poor',
      notes: ['Fallback result - validation failed']
    };
  }

  private createFallbackPathValidation(): PathValidationResult {
    return {
      smoothness: 0,
      consistency: 0,
      physicalPlausibility: 0,
      visualAlignment: 0,
      issues: [{ frame: 0, description: 'Fallback result - path validation failed' }]
    };
  }

  private createFallbackOverallAssessment(): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; reliability: number; recommendations: string[] } {
    return {
      grade: 'F',
      reliability: 0,
      recommendations: ['Analysis failed - please check input data and try again']
    };
  }

  private createFallbackDebugReport(filename: string): DebugReport {
    return {
      videoInfo: {
        filename,
        duration: 0,
        frameCount: 0,
        fps: 30
      },
      impactAnalysis: {
        detected: this.createFallbackImpactResult(),
        validation: this.createFallbackValidationComparison(),
        keyFrames: []
      },
      clubPathAnalysis: {
        calculated: this.createFallbackClubPathResult(),
        visualValidation: this.createFallbackPathValidation(),
        keyPoints: []
      },
      overallAssessment: this.createFallbackOverallAssessment()
    };
  }
}

/**
 * Export utility function for easy validation
 */
export async function validateSwingAnalysis(
  poses: any[],
  videoElement: HTMLVideoElement,
  filename?: string
): Promise<DebugReport> {
  const validator = new SwingAnalysisValidator({ debugEnabled: true });
  return await validator.generateValidationReport(poses, videoElement, filename);
}

/**
 * Export quick comparison function
 */
export async function quickComparisonReport(
  poses: any[],
  videoElement: HTMLVideoElement
): Promise<{ accuracy: string; confidence: number; issues: string[] }> {
  const validator = new SwingAnalysisValidator({ debugEnabled: false });
  const report = await validator.generateValidationReport(poses, videoElement);
  
  return {
    accuracy: report.overallAssessment.grade,
    confidence: report.overallAssessment.reliability,
    issues: report.overallAssessment.recommendations
  };
}
