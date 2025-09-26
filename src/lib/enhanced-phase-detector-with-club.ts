/**
 * Enhanced Phase Detector with Real Club Detection
 * 
 * Integrates real club detection with smart phase detection for
 * accurate swing analysis. Replaces hand estimation with actual
 * club position and orientation.
 */

import { EnhancedPhaseDetector } from './enhanced-phase-detector';
import { ClubDetector, ClubDetection, createClubDetector } from './club-detection';
import { PoseResult } from './mediapipe';

// 🎯 ENHANCED PHASE DETECTOR WITH CLUB INTERFACES
export interface EnhancedSwingPhase {
  name: 'address' | 'backswing' | 'top' | 'downswing' | 'impact' | 'follow-through';
  startFrame: number;
  endFrame: number;
  startTime: number;
  endTime: number;
  duration: number;
  confidence: number;
  weightDistribution: any;
  clubDetection: ClubDetection;
  clubMetrics: {
    shaftAngle: number;
    clubHeadSpeed: number;
    swingPath: number;
    faceAngle: number;
  };
}

export interface ClubPhaseAnalysis {
  phase: string;
  clubDetection: ClubDetection;
  clubMetrics: {
    shaftAngle: number;
    clubHeadSpeed: number;
    swingPath: number;
    faceAngle: number;
    clubHeadPosition: { x: number; y: number; z: number };
    clubHeadVelocity: { x: number; y: number; z: number };
  };
  phaseConfidence: number;
  clubConfidence: number;
  overallConfidence: number;
}

// 🚀 ENHANCED PHASE DETECTOR WITH CLUB CLASS
export class EnhancedPhaseDetectorWithClub {
  private phaseDetector: EnhancedPhaseDetector;
  private clubDetector: ClubDetector;
  private clubHistory: ClubDetection[] = [];
  private isInitialized = false;

  constructor() {
    this.phaseDetector = new EnhancedPhaseDetector();
    this.clubDetector = createClubDetector();
  }

  /**
   * Initialize the enhanced phase detector with club detection
   */
  async initialize(): Promise<void> {
    try {
      console.log('🏌️ ENHANCED DETECTOR: Initializing enhanced phase detector with club detection...');
      
      // Initialize phase detector
      await this.phaseDetector.initialize();
      
      // Initialize club detector
      await this.clubDetector.initialize();
      
      this.isInitialized = true;
      console.log('✅ ENHANCED DETECTOR: Enhanced phase detector with club detection ready');
      
    } catch (error) {
      console.error('❌ ENHANCED DETECTOR: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect swing phase with real club detection
   */
  detectSwingPhaseWithClub(poses: PoseResult[], currentFrame: number, currentTime: number): EnhancedSwingPhase {
    if (!this.isInitialized) {
      throw new Error('Enhanced phase detector not initialized');
    }

    try {
      console.log(`🏌️ ENHANCED DETECTION: Detecting swing phase with club at frame ${currentFrame}...`);
      
      // Step 1: Detect club position and orientation
      const clubDetection = this.clubDetector.detectClub(poses[currentFrame], currentFrame);
      
      // Step 2: Detect swing phase using smart detection
      const phase = this.phaseDetector.detectSwingPhase(poses, currentFrame, currentTime);
      
      // Step 3: Calculate club metrics
      const clubMetrics = this.calculateClubMetrics(clubDetection);
      
      // Step 4: Combine phase and club analysis
      const enhancedPhase = this.combinePhaseAndClub(phase, clubDetection, clubMetrics);
      
      // Store club detection in history
      this.clubHistory.push(clubDetection);
      if (this.clubHistory.length > 10) {
        this.clubHistory.shift();
      }
      
      console.log(`✅ ENHANCED DETECTION: Phase=${enhancedPhase.name}, Club Confidence=${clubDetection.overall.confidence.toFixed(3)}`);
      return enhancedPhase;
      
    } catch (error) {
      console.error('❌ ENHANCED DETECTION: Failed to detect swing phase with club:', error);
      throw error;
    }
  }

  /**
   * Analyze club dynamics for a specific phase
   */
  analyzeClubPhase(poses: PoseResult[], currentFrame: number, currentTime: number): ClubPhaseAnalysis {
    if (!this.isInitialized) {
      throw new Error('Enhanced phase detector not initialized');
    }

    try {
      console.log(`🔍 CLUB ANALYSIS: Analyzing club dynamics at frame ${currentFrame}...`);
      
      // Detect club
      const clubDetection = this.clubDetector.detectClub(poses[currentFrame], currentFrame);
      
      // Detect phase
      const phase = this.phaseDetector.detectSwingPhase(poses, currentFrame, currentTime);
      
      // Calculate club metrics
      const clubMetrics = this.calculateClubMetrics(clubDetection);
      
      // Calculate confidences
      const phaseConfidence = phase.confidence;
      const clubConfidence = clubDetection.overall.confidence;
      const overallConfidence = (phaseConfidence + clubConfidence) / 2;
      
      const analysis: ClubPhaseAnalysis = {
        phase: phase.name,
        clubDetection,
        clubMetrics,
        phaseConfidence,
        clubConfidence,
        overallConfidence
      };
      
      console.log(`✅ CLUB ANALYSIS: ${phase.name} phase analyzed (confidence: ${overallConfidence.toFixed(3)})`);
      return analysis;
      
    } catch (error) {
      console.error('❌ CLUB ANALYSIS: Failed to analyze club phase:', error);
      throw error;
    }
  }

  /**
   * Calculate club metrics from club detection
   */
  private calculateClubMetrics(clubDetection: ClubDetection): {
    shaftAngle: number;
    clubHeadSpeed: number;
    swingPath: number;
    faceAngle: number;
  } {
    return {
      shaftAngle: clubDetection.shaft.angle,
      clubHeadSpeed: this.calculateClubHeadSpeed(clubDetection.head.velocity),
      swingPath: clubDetection.head.path,
      faceAngle: clubDetection.head.angle
    };
  }

  /**
   * Calculate club head speed from velocity
   */
  private calculateClubHeadSpeed(velocity: { x: number; y: number; z: number }): number {
    return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
  }

  /**
   * Combine phase and club analysis
   */
  private combinePhaseAndClub(phase: any, clubDetection: ClubDetection, clubMetrics: any): EnhancedSwingPhase {
    return {
      name: phase.name,
      startFrame: phase.startFrame,
      endFrame: phase.endFrame,
      startTime: phase.startTime,
      endTime: phase.endTime,
      duration: phase.duration,
      confidence: phase.confidence,
      weightDistribution: phase.weightDistribution,
      clubDetection,
      clubMetrics
    };
  }

  /**
   * Get enhanced detection statistics
   */
  getEnhancedDetectionStats(): any {
    return {
      isInitialized: this.isInitialized,
      phaseDetector: this.phaseDetector.getSmartDetectionStats(),
      clubDetector: this.clubDetector.getClubDetectionStats(),
      clubHistoryLength: this.clubHistory.length,
      averageClubConfidence: this.clubHistory.length > 0 
        ? this.clubHistory.reduce((sum, club) => sum + club.overall.confidence, 0) / this.clubHistory.length 
        : 0
    };
  }

  /**
   * Reset enhanced detector
   */
  reset(): void {
    this.phaseDetector.reset();
    this.clubDetector.reset();
    this.clubHistory = [];
  }
}

// 🎯 CLUB DETECTION INTEGRATION EXAMPLES

/**
 * Example: Basic club detection integration
 */
export function basicClubDetectionIntegration(poses: PoseResult[]): void {
  console.log('🏌️ CLUB INTEGRATION: Running basic club detection integration...');
  
  const detector = new EnhancedPhaseDetectorWithClub();
  
  try {
    detector.initialize();
    
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30); // Assuming 30 FPS
      
      try {
        const enhancedPhase = detector.detectSwingPhaseWithClub(poses, frameIndex, currentTime);
        
        console.log(`Frame ${frameIndex}: ${enhancedPhase.name} phase`);
        console.log(`  Club Head: (${enhancedPhase.clubDetection.head.position.x.toFixed(3)}, ${enhancedPhase.clubDetection.head.position.y.toFixed(3)})`);
        console.log(`  Shaft Angle: ${enhancedPhase.clubMetrics.shaftAngle.toFixed(1)}°`);
        console.log(`  Club Speed: ${enhancedPhase.clubMetrics.clubHeadSpeed.toFixed(3)}`);
        console.log(`  Face Angle: ${enhancedPhase.clubMetrics.faceAngle.toFixed(1)}°`);
        console.log(`  Confidence: ${enhancedPhase.confidence.toFixed(3)}`);
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Club detection failed - ${error.message}`);
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

/**
 * Example: Compare hand estimation vs club detection
 */
export function compareHandVsClubDetection(poses: PoseResult[]): void {
  console.log('🔍 COMPARISON: Comparing hand estimation vs club detection...');
  
  const detector = new EnhancedPhaseDetectorWithClub();
  
  try {
    detector.initialize();
    
    const handEstimations: any[] = [];
    const clubDetections: ClubDetection[] = [];
    
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30);
      
      try {
        // Get hand estimation (from original phase detector)
        const phase = detector.phaseDetector.detectSwingPhase(poses, frameIndex, currentTime);
        handEstimations.push({
          frame: frameIndex,
          clubPosition: phase.clubPosition,
          confidence: phase.confidence
        });
        
        // Get club detection
        const clubDetection = detector.clubDetector.detectClub(pose, frameIndex);
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
    
    // Show sample club positions
    console.log('\n📍 SAMPLE CLUB POSITIONS:');
    clubDetections.slice(0, 5).forEach((club, index) => {
      console.log(`   Frame ${index}: Club Head (${club.head.position.x.toFixed(3)}, ${club.head.position.y.toFixed(3)})`);
      console.log(`     Shaft Angle: ${club.shaft.angle.toFixed(1)}°`);
      console.log(`     Face Angle: ${club.head.angle.toFixed(1)}°`);
      console.log(`     Confidence: ${club.overall.confidence.toFixed(3)}`);
    });
    
  } finally {
    detector.reset();
  }
}

/**
 * Example: Analyze club dynamics by phase
 */
export function analyzeClubDynamicsByPhase(poses: PoseResult[]): void {
  console.log('⚡ CLUB DYNAMICS: Analyzing club dynamics by phase...');
  
  const detector = new EnhancedPhaseDetectorWithClub();
  
  try {
    detector.initialize();
    
    const phaseAnalysis: { [key: string]: any[] } = {};
    
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30);
      
      try {
        const analysis = detector.analyzeClubPhase(poses, frameIndex, currentTime);
        
        if (!phaseAnalysis[analysis.phase]) {
          phaseAnalysis[analysis.phase] = [];
        }
        
        phaseAnalysis[analysis.phase].push(analysis);
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Analysis failed - ${error.message}`);
      }
    });
    
    // Analyze each phase
    console.log('\n📊 CLUB DYNAMICS BY PHASE:');
    Object.entries(phaseAnalysis).forEach(([phase, analyses]) => {
      if (analyses.length === 0) return;
      
      const avgShaftAngle = analyses.reduce((sum, a) => sum + a.clubMetrics.shaftAngle, 0) / analyses.length;
      const avgClubSpeed = analyses.reduce((sum, a) => sum + a.clubMetrics.clubHeadSpeed, 0) / analyses.length;
      const avgFaceAngle = analyses.reduce((sum, a) => sum + a.clubMetrics.faceAngle, 0) / analyses.length;
      const avgConfidence = analyses.reduce((sum, a) => sum + a.overallConfidence, 0) / analyses.length;
      
      console.log(`\n   ${phase.toUpperCase()}:`);
      console.log(`     Frames: ${analyses.length}`);
      console.log(`     Avg Shaft Angle: ${avgShaftAngle.toFixed(1)}°`);
      console.log(`     Avg Club Speed: ${avgClubSpeed.toFixed(3)}`);
      console.log(`     Avg Face Angle: ${avgFaceAngle.toFixed(1)}°`);
      console.log(`     Avg Confidence: ${avgConfidence.toFixed(3)}`);
    });
    
  } finally {
    detector.reset();
  }
}

/**
 * Example: Real-time club detection
 */
export function realTimeClubDetection(poses: PoseResult[]): void {
  console.log('📹 REAL-TIME: Running real-time club detection...');
  
  const detector = new EnhancedPhaseDetectorWithClub();
  
  try {
    detector.initialize();
    
    poses.forEach((pose, frameIndex) => {
      const currentTime = frameIndex * (1000 / 30);
      
      try {
        const enhancedPhase = detector.detectSwingPhaseWithClub(poses, frameIndex, currentTime);
        
        // Real-time display
        console.log(`\n🏌️‍♂️ FRAME ${frameIndex} - ${enhancedPhase.name.toUpperCase()}`);
        console.log(`   Club Head: (${enhancedPhase.clubDetection.head.position.x.toFixed(3)}, ${enhancedPhase.clubDetection.head.position.y.toFixed(3)})`);
        console.log(`   Shaft Angle: ${enhancedPhase.clubMetrics.shaftAngle.toFixed(1)}°`);
        console.log(`   Club Speed: ${enhancedPhase.clubMetrics.clubHeadSpeed.toFixed(3)}`);
        console.log(`   Face Angle: ${enhancedPhase.clubMetrics.faceAngle.toFixed(1)}°`);
        console.log(`   Swing Path: ${enhancedPhase.clubMetrics.swingPath.toFixed(1)}°`);
        console.log(`   Confidence: ${enhancedPhase.confidence.toFixed(3)}`);
        
        // Show club quality
        const quality = enhancedPhase.clubDetection.overall.quality;
        const stability = enhancedPhase.clubDetection.overall.stability;
        console.log(`   Club Quality: ${quality} (stability: ${stability.toFixed(3)})`);
        
      } catch (error) {
        console.warn(`Frame ${frameIndex}: Real-time detection failed - ${error.message}`);
      }
    });
    
  } finally {
    detector.reset();
  }
}

export default EnhancedPhaseDetectorWithClub;
