import { PoseResult, TrajectoryPoint, SwingTrajectory } from './mediapipe';
import { VistaSwingAI, SwingReportCard } from './vista-swing-ai';
import { SwingPhase, SwingPhaseDetector, SwingPhaseAnalysis } from './swing-phases';
import { TrajectoryAnalyzer, TrajectoryMetrics, SwingPathAnalysis } from './trajectory-analysis';

// Unified swing data structure
export interface UnifiedSwingData {
  swingId: string;
  userId?: string;
  club: string;
  source: 'upload' | 'camera';
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Core analysis data
  metrics: {
    swingPlaneAngle: number;
    tempoRatio: number;
    hipRotation: number;
    shoulderRotation: number;
    impactFrame: number;
    backswingTime: number;
    downswingTime: number;
    clubheadSpeed?: number;
    swingPath?: number;
  };
  
  // AI feedback
  aiFeedback: {
    reportCard: SwingReportCard;
    feedback: string[];
    overallScore: string;
    keyImprovements: string[];
  };
  
  // Technical data
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  phaseAnalysis: SwingPhaseAnalysis;
  trajectoryMetrics: TrajectoryMetrics;
  swingPathAnalysis: SwingPathAnalysis;
  
  // Processing metadata
  processingTime: number;
  frameCount: number;
  landmarks: PoseResult[];
}

// Analysis input data
export interface AnalysisInput {
  poses: PoseResult[];
  club: string;
  swingId: string;
  userId?: string;
  source: 'upload' | 'camera';
  videoUrl?: string;
}

// Progress callback type
export type ProgressCallback = (step: string, progress: number) => void;

// Unified analysis function
export async function analyzeSwing(
  input: AnalysisInput,
  onProgress?: ProgressCallback
): Promise<UnifiedSwingData> {
  const startTime = Date.now();
  
  try {
    if (input.poses.length < 10) {
      throw new Error('Insufficient pose data for analysis. Please record a longer swing.');
    }

    // Step 1: Convert poses to trajectory
    onProgress?.('Converting poses to trajectory...', 20);
    const trajectory = convertPosesToTrajectory(input.poses);

    // Step 2: Detect swing phases
    onProgress?.('Detecting swing phases...', 40);
    const phaseDetector = new SwingPhaseDetector();
    
    // Convert trajectory points to landmarks format for phase detection
    const landmarksArray = input.poses.map(pose => pose.landmarks);
    const timestamps = input.poses.map(pose => pose.timestamp || 0);
    
    const phaseAnalysis = phaseDetector.detectPhases(landmarksArray, trajectory, timestamps);
    const phases = phaseAnalysis.phases;

    // Step 3: Analyze trajectory
    onProgress?.('Analyzing trajectory...', 60);
    const trajectoryAnalyzer = new TrajectoryAnalyzer();
    const trajectoryMetrics = trajectoryAnalyzer.analyzeTrajectory(trajectory.rightWrist);
    const swingPathAnalysis = trajectoryAnalyzer.analyzeSwingPath(trajectory, phases);

    // Step 4: Generate AI report card
    onProgress?.('Generating AI analysis...', 80);
    const reportCard = VistaSwingAI.analyzeSwing({
      landmarks: landmarksArray,
      timestamps: timestamps,
      club: input.club,
      swingId: input.swingId
    });

    // Step 5: Calculate unified metrics
    const swingPlaneAngle = Math.abs(swingPathAnalysis.swingPlane);
    const tempoRatio = phaseAnalysis.tempoRatio;
    const hipRotation = Math.abs(phaseAnalysis.rotation.hip);
    const shoulderRotation = Math.abs(phaseAnalysis.rotation.shoulder);
    const impactFrame = phases.find(p => p.name === 'impact')?.endFrame || Math.floor(input.poses.length * 0.6);
    const backswingTime = phases.find(p => p.name === 'backswing')?.duration || 0.8;
    const downswingTime = phases.find(p => p.name === 'downswing')?.duration || 0.4;

    // Calculate additional metrics
    const clubheadSpeed = calculateClubheadSpeed(trajectory.clubhead);
    const swingPath = swingPathAnalysis.swingPlane;

    // Generate feedback messages
    const feedback = [
      `Swing plane angle: ${swingPlaneAngle.toFixed(1)}°`,
      `Tempo ratio: ${tempoRatio.toFixed(2)}`,
      `Hip rotation: ${hipRotation.toFixed(1)}°`,
      `Shoulder rotation: ${shoulderRotation.toFixed(1)}°`,
      `Clubhead speed: ${clubheadSpeed.toFixed(1)} mph`
    ];

    // Extract key improvements from report card
    const keyImprovements = [
      reportCard.setup.tip,
      reportCard.grip.tip,
      reportCard.alignment.tip,
      reportCard.rotation.tip,
      reportCard.impact.tip,
      reportCard.followThrough.tip
    ].filter(tip => tip && tip.length > 0);

    const processingTime = Date.now() - startTime;
    const now = new Date().toISOString();

    onProgress?.('Analysis complete!', 100);

    return {
      swingId: input.swingId,
      userId: input.userId,
      club: input.club,
      source: input.source,
      videoUrl: input.videoUrl,
      createdAt: now,
      updatedAt: now,
      
      metrics: {
        swingPlaneAngle,
        tempoRatio,
        hipRotation,
        shoulderRotation,
        impactFrame,
        backswingTime,
        downswingTime,
        clubheadSpeed,
        swingPath
      },
      
      aiFeedback: {
        reportCard,
        feedback,
        overallScore: reportCard.overall.score,
        keyImprovements
      },
      
      trajectory,
      phases,
      phaseAnalysis,
      trajectoryMetrics,
      swingPathAnalysis,
      
      processingTime,
      frameCount: input.poses.length,
      landmarks: input.poses
    };

  } catch (error) {
    console.error('Unified analysis error:', error);
    throw error;
  }
}

// Convert poses to trajectory format (unified implementation)
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

// Calculate clubhead speed from trajectory
function calculateClubheadSpeed(clubheadTrajectory: TrajectoryPoint[]): number {
  if (clubheadTrajectory.length < 2) return 0;
  
  let maxSpeed = 0;
  
  for (let i = 1; i < clubheadTrajectory.length; i++) {
    const prev = clubheadTrajectory[i - 1];
    const curr = clubheadTrajectory[i];
    
    const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // Convert to seconds
    if (timeDiff <= 0) continue;
    
    const distance = Math.sqrt(
      Math.pow(curr.x - prev.x, 2) + 
      Math.pow(curr.y - prev.y, 2) + 
      Math.pow(curr.z - prev.z, 2)
    );
    
    const speed = distance / timeDiff; // pixels per second
    maxSpeed = Math.max(maxSpeed, speed);
  }
  
  // Convert to mph (rough approximation - would need calibration in real use)
  return maxSpeed * 0.1; // Adjust multiplier based on video resolution and real-world calibration
}
