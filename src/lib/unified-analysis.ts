import { PoseResult, TrajectoryPoint, SwingTrajectory } from './mediapipe';
import { calculateSwingMetrics } from './golf-metrics';
import { VistaSwingAI, SwingReportCard } from './vista-swing-ai';
import { SwingPhase, SwingPhaseDetector, SwingPhaseAnalysis } from './swing-phases';
import { TrajectoryAnalyzer, TrajectoryMetrics, SwingPathAnalysis } from './trajectory-analysis';

import { SwingMetrics } from './golf-metrics';

export interface UnifiedSwingData {
  swingId: string;
  userId?: string;
  club: string;
  source: 'upload' | 'camera';
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
  metrics: SwingMetrics;
  aiFeedback: { reportCard: SwingReportCard; feedback: string[]; overallScore: string; keyImprovements: string[]; };
  trajectory: SwingTrajectory;
  phases: SwingPhase[];
  phaseAnalysis: SwingPhaseAnalysis;
  trajectoryMetrics: TrajectoryMetrics;
  swingPathAnalysis: SwingPathAnalysis;
  processingTime: number;
  frameCount: number;
  landmarks: PoseResult[];
}

export interface AnalysisInput {
  poses: PoseResult[];
  club: string;
  swingId: string;
  userId?: string;
  source: 'upload' | 'camera';
  videoUrl?: string;
}

export type ProgressCallback = (step: string, progress: number) => void;

export async function analyzeSwing(
  input: AnalysisInput,
  onProgress?: ProgressCallback
): Promise<UnifiedSwingData> {
  const startTime = Date.now();
  if (input.poses.length < 10) throw new Error('Insufficient pose data for analysis. Please record a longer swing.');
  // More granular progress updates
  onProgress?.('Preparing pose data...', 10);
  const landmarksArray = input.poses.map(pose => pose.landmarks);
  const timestamps = input.poses.map(pose => pose.timestamp || 0);
  
  onProgress?.('Converting poses to trajectory...', 20);
  const trajectory = convertPosesToTrajectory(input.poses);
  
  onProgress?.('Initializing phase detection...', 30);
  const phaseDetector = new SwingPhaseDetector();
  
  onProgress?.('Detecting swing phases...', 40);
  const phaseAnalysis = phaseDetector.detectPhases(landmarksArray, trajectory, timestamps);
  const phases = phaseAnalysis.phases;
  
  onProgress?.('Initializing trajectory analysis...', 50);
  const trajectoryAnalyzer = new TrajectoryAnalyzer();
  
  onProgress?.('Analyzing trajectory...', 60);
  const trajectoryMetrics = trajectoryAnalyzer.analyzeTrajectory(trajectory.rightWrist);
  
  onProgress?.('Analyzing swing path...', 70);
  const swingPathAnalysis = trajectoryAnalyzer.analyzeSwingPath(trajectory, phases);
  
  onProgress?.('Generating AI analysis...', 80);
  const reportCard = VistaSwingAI.analyzeSwing({ landmarks: landmarksArray, timestamps, club: input.club, swingId: input.swingId });
  // Calculate comprehensive swing metrics
  const metrics = calculateSwingMetrics(input.poses, phases, trajectory);
  const feedback = [
    `Swing plane angle: ${metrics.swingPlane.shaftAngle.toFixed(1)}°`,
    `Tempo ratio: ${metrics.tempo.tempoRatio.toFixed(2)}:1`,
    `Hip rotation: ${metrics.rotation.hipTurn.toFixed(1)}°`,
    `Shoulder rotation: ${metrics.rotation.shoulderTurn.toFixed(1)}°`,
    `X-Factor: ${metrics.rotation.xFactor.toFixed(1)}°`,
    `Weight transfer: ${metrics.weightTransfer.impact.toFixed(1)}% at impact`,
    `Overall grade: ${metrics.letterGrade} (${metrics.overallScore.toFixed(1)})`
  ];
  const keyImprovements = [
    reportCard.setup.tip,
    reportCard.grip.tip,
    reportCard.alignment.tip,
    reportCard.rotation.tip,
    reportCard.impact.tip,
    reportCard.followThrough.tip
  ].filter(tip => tip && tip.length > 0);
  const processingTime = Date.now() - startTime; const now = new Date().toISOString();
  onProgress?.('Analysis complete!', 100);
  return {
    swingId: input.swingId,
    userId: input.userId,
    club: input.club,
    source: input.source,
    videoUrl: input.videoUrl,
    createdAt: now,
    updatedAt: now,
    metrics,
    aiFeedback: { reportCard, feedback, overallScore: metrics.letterGrade, keyImprovements },
    trajectory,
    phases,
    phaseAnalysis,
    trajectoryMetrics,
    swingPathAnalysis,
    processingTime,
    frameCount: input.poses.length,
    landmarks: input.poses
  };
}

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
    const rw = landmarks[16]; const lw = landmarks[15]; const rs = landmarks[12]; const ls = landmarks[11]; const rh = landmarks[24]; const lh = landmarks[23];
    const club = { x: (rw.x + lw.x) / 2, y: (rw.y + lw.y) / 2, z: (rw.z + lw.z) / 2, visibility: Math.min(rw.visibility || 0, lw.visibility || 0) };
    rightWrist.push({ x: rw.x, y: rw.y, z: rw.z, timestamp: pose.timestamp || 0, frame: index });
    leftWrist.push({ x: lw.x, y: lw.y, z: lw.z, timestamp: pose.timestamp || 0, frame: index });
    rightShoulder.push({ x: rs.x, y: rs.y, z: rs.z, timestamp: pose.timestamp || 0, frame: index });
    leftShoulder.push({ x: ls.x, y: ls.y, z: ls.z, timestamp: pose.timestamp || 0, frame: index });
    rightHip.push({ x: rh.x, y: rh.y, z: rh.z, timestamp: pose.timestamp || 0, frame: index });
    leftHip.push({ x: lh.x, y: lh.y, z: lh.z, timestamp: pose.timestamp || 0, frame: index });
    clubhead.push({ x: club.x, y: club.y, z: club.z, timestamp: pose.timestamp || 0, frame: index });
  });
  return { rightWrist, leftWrist, rightShoulder, leftShoulder, rightHip, leftHip, clubhead };
}

function calculateClubheadSpeed(clubheadTrajectory: TrajectoryPoint[]): number {
  if (clubheadTrajectory.length < 2) return 0;
  let maxSpeed = 0;
  for (let i = 1; i < clubheadTrajectory.length; i++) {
    const prev = clubheadTrajectory[i - 1];
    const curr = clubheadTrajectory[i];
    const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
    if (timeDiff <= 0) continue;
    const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2) + Math.pow(curr.z - prev.z, 2));
    const speed = distance / timeDiff; maxSpeed = Math.max(maxSpeed, speed);
  }
  return maxSpeed * 0.1;
}


