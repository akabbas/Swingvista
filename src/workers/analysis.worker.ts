import { PoseLandmark, TrajectoryPoint, SwingTrajectory } from '../lib/mediapipe';
import { defaultMetricsConfig, feedbackMessages, MetricsConfig } from '../lib/metrics.config';
import { VistaSwingAI, SwingReportCard } from '../lib/vista-swing-ai';
import { SwingPhase, SwingPhaseDetector, SwingPhaseAnalysis } from '../lib/swing-phases';
import { TrajectoryAnalyzer, TrajectoryMetrics, SwingPathAnalysis } from '../lib/trajectory-analysis';

export interface SwingMetrics {
  swingId: string;
  club: string;
  metrics: {
    swingPlaneAngle: number;
    tempoRatio: number;
    hipRotation: number;
    shoulderRotation: number;
    impactFrame: number;
    backswingTime: number;
    downswingTime: number;
  };
  feedback: string[];
  reportCard?: SwingReportCard; // VistaSwing AI coaching report card
  timestamps: {
    setup: number;
    backswingTop: number;
    impact: number;
    followThrough: number;
  };
}

export interface SwingAnalysisData {
  landmarks: PoseLandmark[][];
  timestamps: number[];
  club: string;
  swingId: string;
}

export interface EnhancedSwingAnalysis {
  swingId: string;
  club: string;
  basicMetrics: SwingMetrics;
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  phaseAnalysis: SwingPhaseAnalysis;
  trajectoryMetrics: TrajectoryMetrics;
  swingPathAnalysis: SwingPathAnalysis;
  reportCard: SwingReportCard;
  processingTime: number;
}

// Calculate angle between three points
function calculateAngle(p1: PoseLandmark, p2: PoseLandmark, p3: PoseLandmark): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  const angle = Math.acos(dot / (mag1 * mag2));
  return (angle * 180) / Math.PI;
}

// Calculate distance between two points
function calculateDistance(p1: PoseLandmark, p2: PoseLandmark): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Calculate swing plane angle
function calculateSwingPlaneAngle(landmarks: PoseLandmark[]): number {
  // Use shoulder and hip landmarks to estimate swing plane
  const leftShoulder = landmarks[11]; // Left shoulder
  const rightShoulder = landmarks[12]; // Right shoulder
  const leftHip = landmarks[23]; // Left hip
  const rightHip = landmarks[24]; // Right hip
  
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2
  };
  
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2
  };
  
  // Calculate angle from vertical (simplified)
  const verticalAngle = Math.atan2(hipCenter.x - shoulderCenter.x, hipCenter.y - shoulderCenter.y);
  return (verticalAngle * 180) / Math.PI;
}

// Calculate rotation between two poses
function calculateRotation(landmarks1: PoseLandmark[], landmarks2: PoseLandmark[]): number {
  const leftShoulder1 = landmarks1[11];
  const rightShoulder1 = landmarks1[12];
  const leftHip1 = landmarks1[23];
  const rightHip1 = landmarks1[24];
  
  const leftShoulder2 = landmarks2[11];
  const rightShoulder2 = landmarks2[12];
  const leftHip2 = landmarks2[23];
  const rightHip2 = landmarks2[24];
  
  // Calculate shoulder rotation
  const shoulderAngle1 = Math.atan2(rightShoulder1.y - leftShoulder1.y, rightShoulder1.x - leftShoulder1.x);
  const shoulderAngle2 = Math.atan2(rightShoulder2.y - leftShoulder2.y, rightShoulder2.x - leftShoulder2.x);
  
  return Math.abs(shoulderAngle2 - shoulderAngle1) * (180 / Math.PI);
}

// Detect impact frame based on acceleration
function detectImpactFrame(landmarks: PoseLandmark[][]): number {
  let maxAcceleration = 0;
  let impactFrame = Math.floor(landmarks.length * 0.7); // Default to 70% through swing
  
  for (let i = 1; i < landmarks.length - 1; i++) {
    const prev = landmarks[i - 1];
    const curr = landmarks[i];
    const next = landmarks[i + 1];
    
    // Calculate acceleration of right wrist (club head approximation)
    const rightWrist = 16; // Right wrist landmark index
    const velocity1 = calculateDistance(prev[rightWrist], curr[rightWrist]);
    const velocity2 = calculateDistance(curr[rightWrist], next[rightWrist]);
    const acceleration = Math.abs(velocity2 - velocity1);
    
    if (acceleration > maxAcceleration) {
      maxAcceleration = acceleration;
      impactFrame = i;
    }
  }
  
  // Ensure impact frame is not at the beginning or end
  return Math.max(1, Math.min(impactFrame, landmarks.length - 2));
}

// Calculate tempo ratio
function calculateTempoRatio(landmarks: PoseLandmark[][], impactFrame: number): number {
  const backswingTime = impactFrame * 0.033; // Assuming 30fps
  const downswingTime = (landmarks.length - impactFrame) * 0.033;
  
  // Avoid division by zero
  if (downswingTime <= 0) {
    return 1.0; // Default ratio if no downswing detected
  }
  
  return backswingTime / downswingTime;
}

// Generate feedback based on metrics
function generateFeedback(metrics: SwingMetrics['metrics'], config: MetricsConfig): string[] {
  const feedback: string[] = [];
  
  // Swing plane feedback
  if (metrics.swingPlaneAngle > config.swingPlane.steepThreshold) {
    feedback.push(feedbackMessages.swingPlane.steep);
  } else if (metrics.swingPlaneAngle < config.swingPlane.flatThreshold) {
    feedback.push(feedbackMessages.swingPlane.flat);
  } else {
    feedback.push(feedbackMessages.swingPlane.good);
  }
  
  // Tempo feedback
  if (metrics.tempoRatio > config.tempo.slowThreshold) {
    feedback.push(feedbackMessages.tempo.slow);
  } else if (metrics.tempoRatio < config.tempo.fastThreshold) {
    feedback.push(feedbackMessages.tempo.fast);
  } else {
    feedback.push(feedbackMessages.tempo.good);
  }
  
  // Rotation feedback
  if (metrics.hipRotation < config.rotation.hipMinRotation) {
    feedback.push(feedbackMessages.rotation.hip);
  } else if (metrics.shoulderRotation < config.rotation.shoulderMinRotation) {
    feedback.push(feedbackMessages.rotation.shoulder);
  } else {
    feedback.push(feedbackMessages.rotation.good);
  }
  
  return feedback;
}

// Enhanced analysis function with trajectory and phase analysis
export function analyzeSwingEnhanced(data: SwingAnalysisData, config: MetricsConfig = defaultMetricsConfig): EnhancedSwingAnalysis {
  const startTime = performance.now();
  const { landmarks, timestamps, club, swingId } = data;
  
  if (landmarks.length < 10) {
    throw new Error('Insufficient landmarks for analysis');
  }
  
  // Initialize analyzers
  const phaseDetector = new SwingPhaseDetector();
  const trajectoryAnalyzer = new TrajectoryAnalyzer();
  
  // Convert landmarks to trajectory format
  const trajectory = convertLandmarksToTrajectory(landmarks, timestamps);
  
  // Detect swing phases
  const phases = phaseDetector.detectPhases(landmarks, trajectory, timestamps).phases;
  const phaseAnalysis = phaseDetector.detectPhases(landmarks, trajectory, timestamps);
  
  // Analyze trajectory
  const trajectoryMetrics = trajectoryAnalyzer.analyzeTrajectory(trajectory.rightWrist);
  const swingPathAnalysis = trajectoryAnalyzer.analyzeSwingPath(trajectory, phases);
  
  // Detect impact frame
  const impactFrame = detectImpactFrame(landmarks);
  
  // Calculate swing plane angle (using first and impact frame)
  const swingPlaneAngle = calculateSwingPlaneAngle(landmarks[impactFrame]);
  
  // Calculate tempo ratio
  const tempoRatio = calculateTempoRatio(landmarks, impactFrame);
  
  // Calculate rotations
  const hipRotation = calculateRotation(landmarks[0], landmarks[impactFrame]);
  const shoulderRotation = calculateRotation(landmarks[0], landmarks[impactFrame]);
  
  // Calculate times
  const backswingTime = Math.max(impactFrame * 0.033, 0.1); // Minimum 0.1s
  const downswingTime = Math.max((landmarks.length - impactFrame) * 0.033, 0.1); // Minimum 0.1s
  
  const basicMetrics: SwingMetrics['metrics'] = {
    swingPlaneAngle,
    tempoRatio,
    hipRotation,
    shoulderRotation,
    impactFrame,
    backswingTime,
    downswingTime
  };
  
  const feedback = generateFeedback(basicMetrics, config);
  
  // Generate VistaSwing AI coaching report card
  let reportCard: SwingReportCard;
  try {
    reportCard = VistaSwingAI.analyzeSwing(data);
  } catch (error) {
    console.warn('VistaSwing AI analysis failed:', error);
    // Fallback report card
    reportCard = {
      setup: { grade: 'C', tip: 'Analysis incomplete' },
      grip: { grade: 'C', tip: 'Analysis incomplete' },
      alignment: { grade: 'C', tip: 'Analysis incomplete' },
      rotation: { grade: 'C', tip: 'Analysis incomplete' },
      impact: { grade: 'C', tip: 'Analysis incomplete' },
      followThrough: { grade: 'C', tip: 'Analysis incomplete' },
      overall: { score: 'C', tip: 'Analysis incomplete' }
    };
  }
  
  const processingTime = performance.now() - startTime;
  
  return {
    swingId,
    club,
    basicMetrics: {
      swingId,
      club,
      metrics: basicMetrics,
      feedback,
      reportCard,
      timestamps: {
        setup: timestamps[0] || 0,
        backswingTop: timestamps[Math.floor(impactFrame * 0.7)] || 0,
        impact: timestamps[impactFrame] || 0,
        followThrough: timestamps[landmarks.length - 1] || 0
      }
    },
    trajectory,
    phases,
    phaseAnalysis,
    trajectoryMetrics,
    swingPathAnalysis,
    reportCard,
    processingTime
  };
}

// Convert landmarks to trajectory format
function convertLandmarksToTrajectory(landmarks: PoseLandmark[][], timestamps: number[]): SwingTrajectory {
  const rightWrist: TrajectoryPoint[] = [];
  const leftWrist: TrajectoryPoint[] = [];
  const rightShoulder: TrajectoryPoint[] = [];
  const leftShoulder: TrajectoryPoint[] = [];
  const rightHip: TrajectoryPoint[] = [];
  const leftHip: TrajectoryPoint[] = [];
  const clubhead: TrajectoryPoint[] = [];

  landmarks.forEach((frame, index) => {
    const timestamp = timestamps[index] || index * 33.33;
    
    // Right wrist (index 16)
    if (frame[16]) {
      rightWrist.push({
        x: frame[16].x,
        y: frame[16].y,
        z: frame[16].z,
        timestamp,
        frame: index
      });
    }
    
    // Left wrist (index 15)
    if (frame[15]) {
      leftWrist.push({
        x: frame[15].x,
        y: frame[15].y,
        z: frame[15].z,
        timestamp,
        frame: index
      });
    }
    
    // Right shoulder (index 12)
    if (frame[12]) {
      rightShoulder.push({
        x: frame[12].x,
        y: frame[12].y,
        z: frame[12].z,
        timestamp,
        frame: index
      });
    }
    
    // Left shoulder (index 11)
    if (frame[11]) {
      leftShoulder.push({
        x: frame[11].x,
        y: frame[11].y,
        z: frame[11].z,
        timestamp,
        frame: index
      });
    }
    
    // Right hip (index 24)
    if (frame[24]) {
      rightHip.push({
        x: frame[24].x,
        y: frame[24].y,
        z: frame[24].z,
        timestamp,
        frame: index
      });
    }
    
    // Left hip (index 23)
    if (frame[23]) {
      leftHip.push({
        x: frame[23].x,
        y: frame[23].y,
        z: frame[23].z,
        timestamp,
        frame: index
      });
    }
    
    // Estimate clubhead position
    if (frame[16] && frame[12]) {
      const clubheadExtension = 0.3;
      const angle = Math.atan2(frame[16].y - frame[12].y, frame[16].x - frame[12].x);
      clubhead.push({
        x: frame[16].x + clubheadExtension * Math.cos(angle),
        y: frame[16].y + clubheadExtension * Math.sin(angle),
        z: frame[16].z,
        timestamp,
        frame: index
      });
    }
  });

  return {
    rightWrist,
    leftWrist,
    rightShoulder,
    leftShoulder,
    rightHip,
    leftHip,
    clubhead
  };
}

// Main analysis function (backward compatibility)
export function analyzeSwing(data: SwingAnalysisData, config: MetricsConfig = defaultMetricsConfig): SwingMetrics {
  const enhanced = analyzeSwingEnhanced(data, config);
  return enhanced.basicMetrics;
}

// Web Worker message handler
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    if (type === 'ANALYZE_SWING') {
      const result = analyzeSwing(data);
      self.postMessage({ type: 'SWING_ANALYZED', data: result });
    } else if (type === 'ANALYZE_SWING_ENHANCED') {
      const result = analyzeSwingEnhanced(data);
      self.postMessage({ type: 'SWING_ANALYZED_ENHANCED', data: result });
    } else if (type === 'ANALYZE_TRAJECTORY') {
      const { trajectory, phases } = data;
      const analyzer = new TrajectoryAnalyzer();
      const metrics = analyzer.analyzeTrajectory(trajectory.rightWrist);
      const pathAnalysis = analyzer.analyzeSwingPath(trajectory, phases);
      self.postMessage({ 
        type: 'TRAJECTORY_ANALYZED', 
        data: { metrics, pathAnalysis } 
      });
    } else if (type === 'DETECT_PHASES') {
      const { landmarks, trajectory, timestamps } = data;
      const phaseDetector = new SwingPhaseDetector();
      const result = phaseDetector.detectPhases(landmarks, trajectory, timestamps);
      self.postMessage({ type: 'PHASES_DETECTED', data: result });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
