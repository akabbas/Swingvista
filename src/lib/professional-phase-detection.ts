import { PoseResult } from './mediapipe';

export interface SwingPhaseAnalysis {
  address: { start: number; end: number; duration: number; confidence: number };
  approach: { start: number; end: number; duration: number; confidence: number };
  backswing: { start: number; end: number; duration: number; confidence: number };
  top: { start: number; end: number; duration: number; confidence: number };
  downswing: { start: number; end: number; duration: number; confidence: number };
  impact: { start: number; end: number; duration: number; confidence: number };
  followThrough: { start: number; end: number; duration: number; confidence: number };
  totalDuration: number;
  overallConfidence: number;
}

interface PhaseDetectionData {
  frameIndex: number;
  timestamp: number;
  clubHeadPosition: { x: number; y: number };
  clubHeadVelocity: { x: number; y: number };
  clubHeadAcceleration: { x: number; y: number };
  weightTransfer: number; // 0-100% on lead foot
  shoulderAngle: number;
  hipAngle: number;
  spineAngle: number;
  handPosition: { x: number; y: number };
  headPosition: { x: number; y: number };
}

export function detectSwingPhases(poses: PoseResult[]): SwingPhaseAnalysis {
  if (!poses || poses.length < 30) {
    throw new Error('Insufficient pose data for accurate phase detection. Need at least 30 frames.');
  }

  // Extract detection data from poses
  const detectionData = extractDetectionData(poses);
  
  // Detect phases using multiple methods
  const phaseMarkers = detectPhaseMarkers(detectionData);
  
  // Validate and refine phase detection
  const validatedPhases = validatePhaseDetection(phaseMarkers, detectionData);
  
  // Calculate phase durations and confidence scores
  const phaseAnalysis = calculatePhaseAnalysis(validatedPhases, detectionData);
  
  return phaseAnalysis;
}

function extractDetectionData(poses: PoseResult[]): PhaseDetectionData[] {
  return poses.map((pose, index) => {
    const keypoints = pose.pose?.keypoints || [];
    
    // Extract key body points
    const leftWrist = keypoints.find(kp => kp.name === 'left_wrist') || { x: 0, y: 0, score: 0 };
    const rightWrist = keypoints.find(kp => kp.name === 'right_wrist') || { x: 0, y: 0, score: 0 };
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder') || { x: 0, y: 0, score: 0 };
    const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder') || { x: 0, y: 0, score: 0 };
    const leftHip = keypoints.find(kp => kp.name === 'left_hip') || { x: 0, y: 0, score: 0 };
    const rightHip = keypoints.find(kp => kp.name === 'right_hip') || { x: 0, y: 0, score: 0 };
    const nose = keypoints.find(kp => kp.name === 'nose') || { x: 0, y: 0, score: 0 };
    
    // Calculate club head position (estimated from hands)
    const clubHeadPosition = {
      x: (leftWrist.x + rightWrist.x) / 2,
      y: Math.min(leftWrist.y, rightWrist.y) - 20 // Club extends below hands
    };
    
    // Calculate velocities and accelerations
    const velocity = calculateVelocity(clubHeadPosition, index, poses);
    const acceleration = calculateAcceleration(velocity, index, poses);
    
    // Calculate weight transfer (estimated from hip position)
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const weightTransfer = Math.max(0, Math.min(100, (hipCenterX / 640) * 100)); // Assuming 640px width
    
    // Calculate angles
    const shoulderAngle = calculateAngle(leftShoulder, rightShoulder);
    const hipAngle = calculateAngle(leftHip, rightHip);
    const spineAngle = calculateSpineAngle(leftShoulder, rightShoulder, leftHip, rightHip);
    
    return {
      frameIndex: index,
      timestamp: index / 30, // Assuming 30fps
      clubHeadPosition,
      clubHeadVelocity: velocity,
      clubHeadAcceleration: acceleration,
      weightTransfer,
      shoulderAngle,
      hipAngle,
      spineAngle,
      handPosition: {
        x: (leftWrist.x + rightWrist.x) / 2,
        y: (leftWrist.y + rightWrist.y) / 2
      },
      headPosition: { x: nose.x, y: nose.y }
    };
  });
}

function calculateVelocity(position: { x: number; y: number }, index: number, poses: PoseResult[]): { x: number; y: number } {
  if (index === 0) return { x: 0, y: 0 };
  
  const prevData = extractDetectionData(poses)[index - 1];
  const dt = 1 / 30; // 30fps
  
  return {
    x: (position.x - prevData.clubHeadPosition.x) / dt,
    y: (position.y - prevData.clubHeadPosition.y) / dt
  };
}

function calculateAcceleration(velocity: { x: number; y: number }, index: number, poses: PoseResult[]): { x: number; y: number } {
  if (index === 0) return { x: 0, y: 0 };
  
  const prevData = extractDetectionData(poses)[index - 1];
  const dt = 1 / 30; // 30fps
  
  return {
    x: (velocity.x - prevData.clubHeadVelocity.x) / dt,
    y: (velocity.y - prevData.clubHeadVelocity.y) / dt
  };
}

function calculateAngle(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x) * (180 / Math.PI);
}

function calculateSpineAngle(leftShoulder: { x: number; y: number }, rightShoulder: { x: number; y: number }, 
                           leftHip: { x: number; y: number }, rightHip: { x: number; y: number }): number {
  const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
  const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
  
  return Math.atan2(hipCenter.y - shoulderCenter.y, hipCenter.x - shoulderCenter.x) * (180 / Math.PI);
}

function detectPhaseMarkers(data: PhaseDetectionData[]): { [key: string]: number } {
  const markers: { [key: string]: number } = {};
  
  // 1. Address phase - stable position at start
  markers.address = detectAddressPhase(data);
  
  // 2. Approach phase - initial movement
  markers.approach = detectApproachPhase(data, markers.address);
  
  // 3. Backswing phase - club going back
  markers.backswing = detectBackswingPhase(data, markers.approach);
  
  // 4. Top phase - maximum backswing
  markers.top = detectTopPhase(data, markers.backswing);
  
  // 5. Downswing phase - club coming down
  markers.downswing = detectDownswingPhase(data, markers.top);
  
  // 6. Impact phase - ball contact
  markers.impact = detectImpactPhase(data, markers.downswing);
  
  // 7. Follow-through phase - finish
  markers.followThrough = detectFollowThroughPhase(data, markers.impact);
  
  return markers;
}

function detectAddressPhase(data: PhaseDetectionData[]): number {
  // Find stable position at start (low velocity, consistent position)
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const velocity = Math.sqrt(data[i].clubHeadVelocity.x ** 2 + data[i].clubHeadVelocity.y ** 2);
    if (velocity < 5) { // Low velocity threshold
      return i;
    }
  }
  return 0;
}

function detectApproachPhase(data: PhaseDetectionData[], addressStart: number): number {
  // Find when club starts moving from address
  for (let i = addressStart; i < data.length; i++) {
    const velocity = Math.sqrt(data[i].clubHeadVelocity.x ** 2 + data[i].clubHeadVelocity.y ** 2);
    if (velocity > 10) { // Movement threshold
      return i;
    }
  }
  return addressStart + 1;
}

function detectBackswingPhase(data: PhaseDetectionData[], approachStart: number): number {
  // Find when club starts going back (negative Y velocity)
  for (let i = approachStart; i < data.length; i++) {
    if (data[i].clubHeadVelocity.y < -5) { // Upward movement
      return i;
    }
  }
  return approachStart + 1;
}

function detectTopPhase(data: PhaseDetectionData[], backswingStart: number): number {
  // Find maximum backswing (velocity changes from negative to positive)
  let maxY = data[backswingStart].clubHeadPosition.y;
  let topIndex = backswingStart;
  
  for (let i = backswingStart; i < data.length; i++) {
    if (data[i].clubHeadVelocity.y > 0) { // Velocity changed direction
      return i;
    }
    if (data[i].clubHeadPosition.y < maxY) {
      maxY = data[i].clubHeadPosition.y;
      topIndex = i;
    }
  }
  return topIndex;
}

function detectDownswingPhase(data: PhaseDetectionData[], topStart: number): number {
  // Find when club starts coming down (positive Y velocity)
  for (let i = topStart; i < data.length; i++) {
    if (data[i].clubHeadVelocity.y > 5) { // Downward movement
      return i;
    }
  }
  return topStart + 1;
}

function detectImpactPhase(data: PhaseDetectionData[], downswingStart: number): number {
  // Find impact (maximum velocity or lowest point)
  let maxVelocity = 0;
  let impactIndex = downswingStart;
  
  for (let i = downswingStart; i < data.length; i++) {
    const velocity = Math.sqrt(data[i].clubHeadVelocity.x ** 2 + data[i].clubHeadVelocity.y ** 2);
    if (velocity > maxVelocity) {
      maxVelocity = velocity;
      impactIndex = i;
    }
  }
  return impactIndex;
}

function detectFollowThroughPhase(data: PhaseDetectionData[], impactStart: number): number {
  // Find when club slows down after impact
  for (let i = impactStart; i < data.length; i++) {
    const velocity = Math.sqrt(data[i].clubHeadVelocity.x ** 2 + data[i].clubHeadVelocity.y ** 2);
    if (velocity < 10) { // Slowed down
      return i;
    }
  }
  return data.length - 1;
}

function validatePhaseDetection(markers: { [key: string]: number }, data: PhaseDetectionData[]): { [key: string]: number } {
  const validated = { ...markers };
  
  // Ensure phases are in correct order
  const phaseOrder = ['address', 'approach', 'backswing', 'top', 'downswing', 'impact', 'followThrough'];
  
  for (let i = 1; i < phaseOrder.length; i++) {
    const currentPhase = phaseOrder[i];
    const prevPhase = phaseOrder[i - 1];
    
    if (validated[currentPhase] <= validated[prevPhase]) {
      validated[currentPhase] = validated[prevPhase] + 1;
    }
  }
  
  // Ensure phases don't exceed data length
  for (const phase of phaseOrder) {
    if (validated[phase] >= data.length) {
      validated[phase] = data.length - 1;
    }
  }
  
  return validated;
}

function calculatePhaseAnalysis(markers: { [key: string]: number }, data: PhaseDetectionData[]): SwingPhaseAnalysis {
  const phaseOrder = ['address', 'approach', 'backswing', 'top', 'downswing', 'impact', 'followThrough'];
  const phases: any = {};
  
  for (let i = 0; i < phaseOrder.length; i++) {
    const phaseName = phaseOrder[i];
    const start = markers[phaseName];
    const end = i < phaseOrder.length - 1 ? markers[phaseOrder[i + 1]] : data.length - 1;
    const duration = (end - start) / 30; // Convert frames to seconds
    
    // Calculate confidence based on data quality
    const confidence = calculatePhaseConfidence(data, start, end, phaseName);
    
    phases[phaseName] = {
      start,
      end,
      duration,
      confidence
    };
  }
  
  const totalDuration = (data.length - 1) / 30;
  const overallConfidence = Object.values(phases).reduce((acc: number, phase: any) => acc + phase.confidence, 0) / phaseOrder.length;
  
  return {
    ...phases,
    totalDuration,
    overallConfidence
  };
}

function calculatePhaseConfidence(data: PhaseDetectionData[], start: number, end: number, phaseName: string): number {
  if (end <= start) return 0;
  
  let confidence = 1.0;
  
  // Check data quality
  const phaseData = data.slice(start, end);
  const avgVelocity = phaseData.reduce((acc, d) => acc + Math.sqrt(d.clubHeadVelocity.x ** 2 + d.clubHeadVelocity.y ** 2), 0) / phaseData.length;
  
  // Adjust confidence based on phase characteristics
  switch (phaseName) {
    case 'address':
      // Should have low velocity
      confidence *= Math.max(0.5, 1 - (avgVelocity / 20));
      break;
    case 'backswing':
      // Should have upward movement
      const avgYVelocity = phaseData.reduce((acc, d) => acc + d.clubHeadVelocity.y, 0) / phaseData.length;
      confidence *= avgYVelocity < 0 ? 1.0 : 0.5;
      break;
    case 'downswing':
      // Should have downward movement
      const avgDownYVelocity = phaseData.reduce((acc, d) => acc + d.clubHeadVelocity.y, 0) / phaseData.length;
      confidence *= avgDownYVelocity > 0 ? 1.0 : 0.5;
      break;
    case 'impact':
      // Should have high velocity
      confidence *= Math.min(1.0, avgVelocity / 50);
      break;
  }
  
  return Math.max(0, Math.min(1, confidence));
}








