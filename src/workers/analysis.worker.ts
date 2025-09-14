import { PoseLandmark } from '../lib/mediapipe';
import { defaultMetricsConfig, feedbackMessages, MetricsConfig } from '../lib/metrics.config';
import { VistaSwingAI, SwingReportCard } from '../lib/vista-swing-ai';

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

// Main analysis function
export function analyzeSwing(data: SwingAnalysisData, config: MetricsConfig = defaultMetricsConfig): SwingMetrics {
  const { landmarks, timestamps, club, swingId } = data;
  
  if (landmarks.length < 10) {
    throw new Error('Insufficient landmarks for analysis');
  }
  
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
  
  const metrics: SwingMetrics['metrics'] = {
    swingPlaneAngle,
    tempoRatio,
    hipRotation,
    shoulderRotation,
    impactFrame,
    backswingTime,
    downswingTime
  };
  
  const feedback = generateFeedback(metrics, config);
  
  // Generate VistaSwing AI coaching report card
  let reportCard: SwingReportCard | undefined;
  try {
    reportCard = VistaSwingAI.analyzeSwing(data);
  } catch (error) {
    console.warn('VistaSwing AI analysis failed:', error);
  }
  
  return {
    swingId,
    club,
    metrics,
    feedback,
    reportCard,
    timestamps: {
      setup: timestamps[0] || 0,
      backswingTop: timestamps[Math.floor(impactFrame * 0.7)] || 0,
      impact: timestamps[impactFrame] || 0,
      followThrough: timestamps[landmarks.length - 1] || 0
    }
  };
}

// Web Worker message handler
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    if (type === 'ANALYZE_SWING') {
      const result = analyzeSwing(data);
      self.postMessage({ type: 'SWING_ANALYZED', data: result });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
