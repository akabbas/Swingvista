import { PoseResult, TrajectoryPoint, SwingTrajectory } from '../lib/mediapipe';
import { VistaSwingAI, SwingReportCard } from '../lib/vista-swing-ai';
import { SwingPhase, SwingPhaseDetector, SwingPhaseAnalysis } from '../lib/swing-phases';
import { TrajectoryAnalyzer, TrajectoryMetrics, SwingPathAnalysis } from '../lib/trajectory-analysis';

export interface CameraAnalysisData {
  poses: PoseResult[];
  club: string;
  swingId: string;
}

export interface CameraAnalysisResult {
  swingId: string;
  club: string;
  basicMetrics: {
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
    reportCard: SwingReportCard;
    timestamps: {
      setup: number;
      backswingTop: number;
      impact: number;
      followThrough: number;
    };
  };
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  phaseAnalysis: SwingPhaseAnalysis;
  trajectoryMetrics: TrajectoryMetrics;
  swingPathAnalysis: SwingPathAnalysis;
  reportCard: SwingReportCard;
  processingTime: number;
  frameCount: number;
}

// Convert poses to trajectory format
function convertPosesToTrajectory(poses: PoseResult[]): SwingTrajectory {
  const rightWrist: TrajectoryPoint[] = [];
  const leftWrist: TrajectoryPoint[] = [];
  const rightShoulder: TrajectoryPoint[] = [];
  const leftShoulder: TrajectoryPoint[] = [];
  const rightHip: TrajectoryPoint[] = [];
  const leftHip: TrajectoryPoint[] = [];
  const clubhead: TrajectoryPoint[] = [];

  poses.forEach((pose, index) => {
    const landmarks = pose.landmarks;
    
    // Extract key landmarks (using MediaPipe pose landmark indices)
    const rightWristLandmark = landmarks[16]; // Right wrist
    const leftWristLandmark = landmarks[15]; // Left wrist
    const rightShoulderLandmark = landmarks[12]; // Right shoulder
    const leftShoulderLandmark = landmarks[11]; // Left shoulder
    const rightHipLandmark = landmarks[24]; // Right hip
    const leftHipLandmark = landmarks[23]; // Left hip
    
    // Estimate clubhead position (midpoint between wrists)
    const clubheadLandmark = {
      x: (rightWristLandmark.x + leftWristLandmark.x) / 2,
      y: (rightWristLandmark.y + leftWristLandmark.y) / 2,
      z: (rightWristLandmark.z + leftWristLandmark.z) / 2,
      visibility: Math.min(rightWristLandmark.visibility || 0, leftWristLandmark.visibility || 0)
    };

    rightWrist.push({
      x: rightWristLandmark.x,
      y: rightWristLandmark.y,
      z: rightWristLandmark.z,
      timestamp: pose.timestamp || 0,
      frame: index
    });

    leftWrist.push({
      x: leftWristLandmark.x,
      y: leftWristLandmark.y,
      z: leftWristLandmark.z,
      timestamp: pose.timestamp || 0,
      frame: index
    });

    rightShoulder.push({
      x: rightShoulderLandmark.x,
      y: rightShoulderLandmark.y,
      z: rightShoulderLandmark.z,
      timestamp: pose.timestamp || 0,
      frame: index
    });

    leftShoulder.push({
      x: leftShoulderLandmark.x,
      y: leftShoulderLandmark.y,
      z: leftShoulderLandmark.z,
      timestamp: pose.timestamp || 0,
      frame: index
    });

    rightHip.push({
      x: rightHipLandmark.x,
      y: rightHipLandmark.y,
      z: rightHipLandmark.z,
      timestamp: pose.timestamp || 0,
      frame: index
    });

    leftHip.push({
      x: leftHipLandmark.x,
      y: leftHipLandmark.y,
      z: leftHipLandmark.z,
      timestamp: pose.timestamp || 0,
      frame: index
    });

    clubhead.push({
      x: clubheadLandmark.x,
      y: clubheadLandmark.y,
      z: clubheadLandmark.z,
      timestamp: pose.timestamp || 0,
      frame: index
    });
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

// Main analysis function
async function analyzeSwing(data: CameraAnalysisData): Promise<CameraAnalysisResult> {
  const startTime = Date.now();
  
  try {
    if (data.poses.length < 10) {
      throw new Error('Insufficient pose data for analysis. Please record a longer swing.');
    }

    // Convert poses to trajectory
    self.postMessage({ type: 'PROGRESS', data: { step: 'Converting poses to trajectory...', progress: 20 } });
    const trajectory = convertPosesToTrajectory(data.poses);

    // Detect swing phases
    self.postMessage({ type: 'PROGRESS', data: { step: 'Detecting swing phases...', progress: 40 } });
    const phaseDetector = new SwingPhaseDetector();
    
    // Convert trajectory points to landmarks format
    const landmarksArray = data.poses.map(pose => pose.landmarks);
    const timestamps = data.poses.map(pose => pose.timestamp || 0);
    
    const phaseAnalysis = phaseDetector.detectPhases(landmarksArray, trajectory, timestamps);
    const phases = phaseAnalysis.phases;

    // Analyze trajectory
    self.postMessage({ type: 'PROGRESS', data: { step: 'Analyzing trajectory...', progress: 60 } });
    const trajectoryAnalyzer = new TrajectoryAnalyzer();
    const trajectoryMetrics = trajectoryAnalyzer.analyzeTrajectory(trajectory.rightWrist);
    const swingPathAnalysis = trajectoryAnalyzer.analyzeSwingPath(trajectory, phases);

    // Generate AI report card
    self.postMessage({ type: 'PROGRESS', data: { step: 'Generating AI analysis...', progress: 80 } });
    const reportCard = VistaSwingAI.analyzeSwing({
      landmarks: landmarksArray,
      timestamps: timestamps,
      club: data.club,
      swingId: data.swingId
    });

    // Calculate basic metrics
    const swingPlaneAngle = Math.abs(swingPathAnalysis.swingPlane);
    const tempoRatio = phaseAnalysis.tempoRatio;
    const hipRotation = Math.abs(phaseAnalysis.rotation.hip);
    const shoulderRotation = Math.abs(phaseAnalysis.rotation.shoulder);
    const impactFrame = phases.find(p => p.name === 'impact')?.endFrame || Math.floor(data.poses.length * 0.6);
    const backswingTime = phases.find(p => p.name === 'backswing')?.duration || 0.8;
    const downswingTime = phases.find(p => p.name === 'downswing')?.duration || 0.4;

    const basicMetrics = {
      swingId: data.swingId,
      club: data.club,
      metrics: {
        swingPlaneAngle,
        tempoRatio,
        hipRotation,
        shoulderRotation,
        impactFrame,
        backswingTime,
        downswingTime
      },
      feedback: [
        `Swing plane angle: ${swingPlaneAngle.toFixed(1)}°`,
        `Tempo ratio: ${tempoRatio.toFixed(2)}`,
        `Hip rotation: ${hipRotation.toFixed(1)}°`,
        `Shoulder rotation: ${shoulderRotation.toFixed(1)}°`
      ],
      reportCard,
      timestamps: {
        setup: phases.find(p => p.name === 'setup')?.startTime || 0,
        backswingTop: phases.find(p => p.name === 'backswing')?.endTime || 1000,
        impact: phases.find(p => p.name === 'impact')?.startTime || 2000,
        followThrough: phases.find(p => p.name === 'followthrough')?.endTime || 3000
      }
    };

    const processingTime = Date.now() - startTime;

    self.postMessage({ type: 'PROGRESS', data: { step: 'Analysis complete!', progress: 100 } });

    return {
      swingId: data.swingId,
      club: data.club,
      basicMetrics,
      trajectory,
      phases,
      phaseAnalysis,
      trajectoryMetrics,
      swingPathAnalysis,
      reportCard,
      processingTime,
      frameCount: data.poses.length
    };

  } catch (error) {
    console.error('Camera analysis error:', error);
    throw error;
  }
}

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'ANALYZE_SWING':
        const result = await analyzeSwing(data);
        self.postMessage({ type: 'SWING_ANALYZED', data: result });
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      data: { 
        error: error instanceof Error ? error.message : 'Unknown error occurred during analysis' 
      } 
    });
  }
};
