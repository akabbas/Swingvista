import { MediaPipePoseDetector, PoseResult, TrajectoryPoint, SwingTrajectory } from '../lib/mediapipe';
import { VistaSwingAI, SwingReportCard } from '../lib/vista-swing-ai';
import { SwingPhase, SwingPhaseDetector, SwingPhaseAnalysis } from '../lib/swing-phases';
import { TrajectoryAnalyzer, TrajectoryMetrics, SwingPathAnalysis } from '../lib/trajectory-analysis';

export interface VideoAnalysisData {
  videoFile: File;
  club: string;
  swingId: string;
}

export interface VideoAnalysisResult {
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
  videoUrl: string;
  frameCount: number;
}

// Process video frames and extract pose landmarks
async function processVideoFrames(videoFile: File): Promise<{ landmarks: PoseResult[], videoUrl: string, frameCount: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    
    const landmarks: PoseResult[] = [];
    let frameCount = 0;
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Initialize MediaPipe pose detector
      const poseDetector = new MediaPipePoseDetector({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        smoothingWindow: 5
      });
      
      poseDetector.initialize().then(() => {
        processFrame();
      }).catch(reject);
      
      function processFrame() {
        if (video.ended) {
          poseDetector.destroy();
          resolve({ landmarks, videoUrl, frameCount });
          return;
        }
        
        // Draw current frame to canvas
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        // Detect pose in current frame
        poseDetector.detectPose(video).then((result) => {
          if (result) {
            landmarks.push({
              ...result,
              timestamp: video.currentTime * 1000 // Convert to milliseconds
            });
          }
          frameCount++;
          
          // Move to next frame (every 100ms for 10fps analysis)
          video.currentTime += 0.1;
          setTimeout(processFrame, 10);
        }).catch((error) => {
          console.warn('Pose detection failed for frame:', error);
          frameCount++;
          video.currentTime += 0.1;
          setTimeout(processFrame, 10);
        });
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
  });
}

// Convert landmarks to trajectory format
function convertLandmarksToTrajectory(landmarks: PoseResult[]): SwingTrajectory {
  const rightWrist: TrajectoryPoint[] = [];
  const leftWrist: TrajectoryPoint[] = [];
  const rightShoulder: TrajectoryPoint[] = [];
  const leftShoulder: TrajectoryPoint[] = [];
  const rightHip: TrajectoryPoint[] = [];
  const leftHip: TrajectoryPoint[] = [];
  const clubhead: TrajectoryPoint[] = [];

  landmarks.forEach((result) => {
    const poseLandmarks = result.landmarks;
    
    // Extract key landmarks (using MediaPipe pose landmark indices)
    const rightWristLandmark = poseLandmarks[16]; // Right wrist
    const leftWristLandmark = poseLandmarks[15]; // Left wrist
    const rightShoulderLandmark = poseLandmarks[12]; // Right shoulder
    const leftShoulderLandmark = poseLandmarks[11]; // Left shoulder
    const rightHipLandmark = poseLandmarks[24]; // Right hip
    const leftHipLandmark = poseLandmarks[23]; // Left hip
    
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
      timestamp: result.timestamp || 0,
      frame: landmarks.length
    });

    leftWrist.push({
      x: leftWristLandmark.x,
      y: leftWristLandmark.y,
      z: leftWristLandmark.z,
      timestamp: result.timestamp || 0,
      frame: landmarks.length
    });

    rightShoulder.push({
      x: rightShoulderLandmark.x,
      y: rightShoulderLandmark.y,
      z: rightShoulderLandmark.z,
      timestamp: result.timestamp || 0,
      frame: landmarks.length
    });

    leftShoulder.push({
      x: leftShoulderLandmark.x,
      y: leftShoulderLandmark.y,
      z: leftShoulderLandmark.z,
      timestamp: result.timestamp || 0,
      frame: landmarks.length
    });

    rightHip.push({
      x: rightHipLandmark.x,
      y: rightHipLandmark.y,
      z: rightHipLandmark.z,
      timestamp: result.timestamp || 0,
      frame: landmarks.length
    });

    leftHip.push({
      x: leftHipLandmark.x,
      y: leftHipLandmark.y,
      z: leftHipLandmark.z,
      timestamp: result.timestamp || 0,
      frame: landmarks.length
    });

    clubhead.push({
      x: clubheadLandmark.x,
      y: clubheadLandmark.y,
      z: clubheadLandmark.z,
      timestamp: result.timestamp || 0,
      frame: landmarks.length
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
async function analyzeVideo(data: VideoAnalysisData): Promise<VideoAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Process video frames
    self.postMessage({ type: 'PROGRESS', data: { step: 'Processing video frames...', progress: 10 } });
    const { landmarks, videoUrl, frameCount } = await processVideoFrames(data.videoFile);
    
    if (landmarks.length === 0) {
      throw new Error('No pose landmarks detected in video');
    }

    // Convert landmarks to trajectory
    self.postMessage({ type: 'PROGRESS', data: { step: 'Converting landmarks to trajectory...', progress: 30 } });
    const trajectory = convertLandmarksToTrajectory(landmarks);

    // Detect swing phases
    self.postMessage({ type: 'PROGRESS', data: { step: 'Detecting swing phases...', progress: 50 } });
    const phaseDetector = new SwingPhaseDetector();
    
    // Convert trajectory points to landmarks format
    const landmarksArray = landmarks.map(result => result.landmarks);
    const timestamps = landmarks.map(result => result.timestamp || 0);
    
    const phaseAnalysis = phaseDetector.detectPhases(landmarksArray, trajectory, timestamps);
    const phases = phaseAnalysis.phases;

    // Analyze trajectory
    self.postMessage({ type: 'PROGRESS', data: { step: 'Analyzing trajectory...', progress: 70 } });
    const trajectoryAnalyzer = new TrajectoryAnalyzer();
    const trajectoryMetrics = trajectoryAnalyzer.analyzeTrajectory(trajectory.rightWrist);
    const swingPathAnalysis = trajectoryAnalyzer.analyzeSwingPath(trajectory, phases);

    // Generate AI report card
    self.postMessage({ type: 'PROGRESS', data: { step: 'Generating AI analysis...', progress: 90 } });
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
    const impactFrame = phases.find(p => p.name === 'impact')?.endFrame || Math.floor(landmarks.length * 0.6);
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
      videoUrl,
      frameCount
    };

  } catch (error) {
    console.error('Video analysis error:', error);
    throw error;
  }
}

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  try {
    switch (type) {
      case 'ANALYZE_VIDEO':
        const result = await analyzeVideo(data);
        self.postMessage({ type: 'VIDEO_ANALYZED', data: result });
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      data: { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      } 
    });
  }
};
