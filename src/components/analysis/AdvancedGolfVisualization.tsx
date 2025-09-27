'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { PoseResult, PoseLandmark } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import { 
  performAdvancedGolfAnalysis, 
  estimateClubPath, 
  analyzeSwingTempo, 
  calculateBodyRotationMetrics, 
  assessFollowThrough,
  type AdvancedGolfAnalysis,
  type ClubPathPoint,
  type SwingTempoAnalysis,
  type BodyRotationMetrics,
  type FollowThroughAssessment
} from '@/lib/advanced-golf-analysis';

export interface AdvancedGolfVisualizationProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  poses: PoseResult[];
  phases?: EnhancedSwingPhase[];
  currentTime?: number;
  showAdvancedMetrics?: boolean;
  showClubPath?: boolean;
  showTempoAnalysis?: boolean;
  showBodyRotation?: boolean;
  showFollowThrough?: boolean;
  className?: string;
}

// Golf-specific landmark indices
const GOLF_LANDMARKS = {
  head: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

// Pose connections for stick figure
const POSE_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  
  // Arms
  [11, 13], [13, 15], [12, 14], [14, 16],
  
  // Legs
  [23, 25], [25, 27], [24, 26], [26, 28],
  
  // Feet
  [27, 29], [29, 31], [31, 27],
  [28, 30], [30, 32], [32, 28],
];

export default function AdvancedGolfVisualization({
  videoRef,
  canvasRef,
  poses,
  phases = [],
  currentTime = 0,
  showAdvancedMetrics = true,
  showClubPath = true,
  showTempoAnalysis = true,
  showBodyRotation = true,
  showFollowThrough = true,
  className = ''
}: AdvancedGolfVisualizationProps) {
  const [analysis, setAnalysis] = useState<AdvancedGolfAnalysis | null>(null);
  const [clubPath, setClubPath] = useState<ClubPathPoint[]>([]);
  const [tempoAnalysis, setTempoAnalysis] = useState<SwingTempoAnalysis | null>(null);
  const [bodyRotation, setBodyRotation] = useState<BodyRotationMetrics | null>(null);
  const [followThrough, setFollowThrough] = useState<FollowThroughAssessment | null>(null);

  // Perform advanced analysis when poses or phases change
  useEffect(() => {
    if (poses.length === 0 || phases.length === 0) return;

    const advancedAnalysis = performAdvancedGolfAnalysis(poses, phases);
    setAnalysis(advancedAnalysis);
    setClubPath(advancedAnalysis.clubPath);
    setTempoAnalysis(advancedAnalysis.swingTempo);
    setBodyRotation(advancedAnalysis.bodyRotation);
    setFollowThrough(advancedAnalysis.followThrough);
  }, [poses, phases]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    
    if (videoWidth && videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current pose
    const currentPose = poses[Math.floor(currentTime * 30)];
    if (!currentPose?.landmarks) return;

    const landmarks = currentPose.landmarks;

    // Draw stick figure
    drawStickFigure(ctx, landmarks, canvas.width, canvas.height);

    // Draw club path if enabled
    if (showClubPath && clubPath.length > 0) {
      drawAdvancedClubPath(ctx, clubPath, currentTime, canvas.width, canvas.height);
    }

    // Draw tempo analysis if enabled
    if (showTempoAnalysis && tempoAnalysis) {
      drawTempoAnalysis(ctx, tempoAnalysis, currentTime, canvas.width, canvas.height);
    }

    // Draw body rotation metrics if enabled
    if (showBodyRotation && bodyRotation) {
      drawBodyRotationMetrics(ctx, landmarks, bodyRotation, canvas.width, canvas.height);
    }

    // Draw follow-through assessment if enabled
    if (showFollowThrough && followThrough) {
      drawFollowThroughAssessment(ctx, followThrough, canvas.width, canvas.height);
    }

    // Draw advanced metrics if enabled
    if (showAdvancedMetrics && analysis) {
      drawAdvancedMetrics(ctx, analysis, currentTime, canvas.width, canvas.height);
    }

  }, [
    currentTime, poses, phases, clubPath, tempoAnalysis, bodyRotation, followThrough, analysis,
    showClubPath, showTempoAnalysis, showBodyRotation, showFollowThrough, showAdvancedMetrics
  ]);

  // Render loop
  useEffect(() => {
    const animate = () => {
      render();
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  return null; // This component only renders to canvas
}

// Drawing functions

function drawStickFigure(ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], width: number, height: number) {
  if (!landmarks || landmarks.length === 0) return;

  // Draw connections
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    
    if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();
    }
  });

  // Draw key landmarks with different colors
  landmarks.forEach((landmark, index) => {
    if (landmark.visibility > 0.5) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      let color = 'rgba(0, 255, 0, 0.9)';
      let size = 4;
      
      // Color code important landmarks
      if (index === GOLF_LANDMARKS.head) {
        color = 'rgba(255, 100, 100, 0.9)';
        size = 6;
      } else if (index === GOLF_LANDMARKS.leftWrist || index === GOLF_LANDMARKS.rightWrist) {
        color = 'rgba(255, 255, 0, 0.9)';
        size = 5;
      } else if (index === GOLF_LANDMARKS.leftShoulder || index === GOLF_LANDMARKS.rightShoulder) {
        color = 'rgba(0, 200, 255, 0.9)';
        size = 5;
      } else if (index === GOLF_LANDMARKS.leftHip || index === GOLF_LANDMARKS.rightHip) {
        color = 'rgba(255, 150, 0, 0.9)';
        size = 5;
      }
      
      // Draw landmark with glow
      ctx.beginPath();
      ctx.arc(x, y, size + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  });
}

function drawAdvancedClubPath(ctx: CanvasRenderingContext2D, clubPath: ClubPathPoint[], currentTime: number, width: number, height: number) {
  if (clubPath.length < 2) return;

  // Draw club path with velocity-based coloring
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Group path by phases
  const phaseGroups: { [key: string]: ClubPathPoint[] } = {};
  clubPath.forEach(point => {
    if (!phaseGroups[point.phase]) {
      phaseGroups[point.phase] = [];
    }
    phaseGroups[point.phase].push(point);
  });

  // Draw each phase with different color and velocity-based intensity
  const phaseColors: { [key: string]: string } = {
    'address': 'rgba(0, 255, 0, 0.8)',
    'backswing': 'rgba(255, 255, 0, 0.8)',
    'transition': 'rgba(255, 165, 0, 0.8)',
    'downswing': 'rgba(255, 0, 0, 0.8)',
    'impact': 'rgba(255, 0, 255, 0.8)',
    'follow-through': 'rgba(0, 255, 255, 0.8)',
    'unknown': 'rgba(128, 128, 128, 0.8)'
  };

  Object.entries(phaseGroups).forEach(([phase, points]) => {
    if (points.length < 2) return;

    const baseColor = phaseColors[phase] || phaseColors.unknown;
    
    // Draw path with velocity-based intensity
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      
      // Calculate velocity-based alpha
      const maxVelocity = Math.max(...points.map(p => p.velocity));
      const velocityRatio = maxVelocity > 0 ? currentPoint.velocity / maxVelocity : 0;
      const alpha = 0.3 + (velocityRatio * 0.7);
      
      ctx.strokeStyle = baseColor.replace('0.8', alpha.toString());
      ctx.lineWidth = 2 + (velocityRatio * 4);
      
      ctx.beginPath();
      ctx.moveTo(prevPoint.x * width, prevPoint.y * height);
      ctx.lineTo(currentPoint.x * width, currentPoint.y * height);
      ctx.stroke();
    }
  });

  // Draw current club head position with velocity indicator
  const currentPoint = clubPath.find(point => 
    Math.abs(point.timestamp - currentTime) < 0.1
  );
  
  if (currentPoint) {
    const x = currentPoint.x * width;
    const y = currentPoint.y * height;
    
    // Draw velocity circle
    const velocityRadius = Math.min(20, Math.max(5, currentPoint.velocity * 10));
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.9, currentPoint.velocity * 0.5)})`;
    ctx.beginPath();
    ctx.arc(x, y, velocityRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw club head
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTempoAnalysis(ctx: CanvasRenderingContext2D, tempoAnalysis: SwingTempoAnalysis, currentTime: number, width: number, height: number) {
  const metricsX = 10;
  const metricsY = 100;
  
  // Draw tempo analysis box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(metricsX, metricsY - 20, 250, 120);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Swing Tempo Analysis', metricsX + 10, metricsY);
  
  ctx.font = '12px Arial';
  ctx.fillText(`Backswing: ${tempoAnalysis.backswingTempo.toFixed(2)}`, metricsX + 10, metricsY + 20);
  ctx.fillText(`Transition: ${tempoAnalysis.transitionTempo.toFixed(2)}`, metricsX + 10, metricsY + 35);
  ctx.fillText(`Downswing: ${tempoAnalysis.downswingTempo.toFixed(2)}`, metricsX + 10, metricsY + 50);
  ctx.fillText(`Follow-through: ${tempoAnalysis.followThroughTempo.toFixed(2)}`, metricsX + 10, metricsY + 65);
  ctx.fillText(`Consistency: ${(tempoAnalysis.tempoConsistency * 100).toFixed(0)}%`, metricsX + 10, metricsY + 80);
  ctx.fillText(`Overall: ${tempoAnalysis.overallTempo.toFixed(2)}`, metricsX + 10, metricsY + 95);
  
  // Draw tempo visualization
  const tempoX = width - 200;
  const tempoY = 50;
  const tempoWidth = 180;
  const tempoHeight = 100;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(tempoX, tempoY, tempoWidth, tempoHeight);
  
  // Draw tempo bars
  const tempos = [
    { name: 'Backswing', value: tempoAnalysis.backswingTempo, color: 'rgba(255, 255, 0, 0.8)' },
    { name: 'Transition', value: tempoAnalysis.transitionTempo, color: 'rgba(255, 165, 0, 0.8)' },
    { name: 'Downswing', value: tempoAnalysis.downswingTempo, color: 'rgba(255, 0, 0, 0.8)' },
    { name: 'Follow-through', value: tempoAnalysis.followThroughTempo, color: 'rgba(0, 255, 255, 0.8)' }
  ];
  
  const maxTempo = Math.max(...tempos.map(t => t.value));
  
  tempos.forEach((tempo, index) => {
    const barHeight = (tempo.value / maxTempo) * (tempoHeight - 20);
    const barY = tempoY + tempoHeight - barHeight - 10;
    
    ctx.fillStyle = tempo.color;
    ctx.fillRect(tempoX + 10 + (index * 40), barY, 30, barHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.fillText(tempo.name, tempoX + 10 + (index * 40), tempoY + tempoHeight - 5);
  });
}

function drawBodyRotationMetrics(ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], bodyRotation: BodyRotationMetrics, width: number, height: number) {
  const metricsX = 10;
  const metricsY = 250;
  
  // Draw body rotation metrics box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(metricsX, metricsY - 20, 250, 140);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Body Rotation Metrics', metricsX + 10, metricsY);
  
  ctx.font = '12px Arial';
  ctx.fillText(`Shoulder Max: ${bodyRotation.shoulderRotation.maxAngle.toFixed(1)}°`, metricsX + 10, metricsY + 20);
  ctx.fillText(`Hip Max: ${bodyRotation.hipRotation.maxAngle.toFixed(1)}°`, metricsX + 10, metricsY + 35);
  ctx.fillText(`Spine Tilt: ${bodyRotation.spineAngle.tilt.toFixed(1)}°`, metricsX + 10, metricsY + 50);
  ctx.fillText(`Sequence Quality: ${(bodyRotation.rotationSequence.sequenceQuality * 100).toFixed(0)}%`, metricsX + 10, metricsY + 65);
  ctx.fillText(`Hip Lead: ${bodyRotation.rotationSequence.hipLead.toFixed(2)}`, metricsX + 10, metricsY + 80);
  ctx.fillText(`Shoulder Lead: ${bodyRotation.rotationSequence.shoulderLead.toFixed(2)}`, metricsX + 10, metricsY + 95);
  ctx.fillText(`Spine Stability: ${(bodyRotation.spineAngle.stability * 100).toFixed(0)}%`, metricsX + 10, metricsY + 110);
  
  // Draw rotation visualization
  const rotationX = width - 200;
  const rotationY = 200;
  const rotationSize = 100;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(rotationX + rotationSize/2, rotationY + rotationSize/2, rotationSize/2, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw shoulder rotation
  const shoulderAngle = bodyRotation.shoulderRotation.currentAngle * Math.PI / 180;
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(rotationX + rotationSize/2, rotationY + rotationSize/2);
  ctx.lineTo(
    rotationX + rotationSize/2 + Math.cos(shoulderAngle) * rotationSize/3,
    rotationY + rotationSize/2 + Math.sin(shoulderAngle) * rotationSize/3
  );
  ctx.stroke();
  
  // Draw hip rotation
  const hipAngle = bodyRotation.hipRotation.currentAngle * Math.PI / 180;
  ctx.strokeStyle = 'rgba(255, 150, 0, 0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(rotationX + rotationSize/2, rotationY + rotationSize/2);
  ctx.lineTo(
    rotationX + rotationSize/2 + Math.cos(hipAngle) * rotationSize/4,
    rotationY + rotationSize/2 + Math.sin(hipAngle) * rotationSize/4
  );
  ctx.stroke();
}

function drawFollowThroughAssessment(ctx: CanvasRenderingContext2D, followThrough: FollowThroughAssessment, width: number, height: number) {
  const metricsX = 10;
  const metricsY = 420;
  
  // Draw follow-through assessment box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(metricsX, metricsY - 20, 300, 120);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Follow-through Assessment', metricsX + 10, metricsY);
  
  ctx.font = '12px Arial';
  ctx.fillText(`Extension: ${(followThrough.extension * 100).toFixed(0)}%`, metricsX + 10, metricsY + 20);
  ctx.fillText(`Balance: ${(followThrough.balance * 100).toFixed(0)}%`, metricsX + 10, metricsY + 35);
  ctx.fillText(`Finish: ${(followThrough.finish * 100).toFixed(0)}%`, metricsX + 10, metricsY + 50);
  ctx.fillText(`Overall Quality: ${(followThrough.overallQuality * 100).toFixed(0)}%`, metricsX + 10, metricsY + 65);
  
  // Draw recommendations
  ctx.fillText('Recommendations:', metricsX + 10, metricsY + 85);
  followThrough.recommendations.slice(0, 2).forEach((rec, index) => {
    ctx.fillText(`• ${rec}`, metricsX + 20, metricsY + 100 + (index * 15));
  });
}

function drawAdvancedMetrics(ctx: CanvasRenderingContext2D, analysis: AdvancedGolfAnalysis, currentTime: number, width: number, height: number) {
  const metricsX = width - 300;
  const metricsY = 10;
  
  // Draw overall analysis box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(metricsX, metricsY, 290, 150);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Advanced Golf Analysis', metricsX + 10, metricsY + 25);
  
  ctx.font = '14px Arial';
  ctx.fillText(`Overall Grade: ${analysis.overallGrade}`, metricsX + 10, metricsY + 50);
  
  ctx.font = '12px Arial';
  ctx.fillText(`Tempo Consistency: ${(analysis.swingTempo.tempoConsistency * 100).toFixed(0)}%`, metricsX + 10, metricsY + 70);
  ctx.fillText(`Rotation Sequence: ${(analysis.bodyRotation.rotationSequence.sequenceQuality * 100).toFixed(0)}%`, metricsX + 10, metricsY + 85);
  ctx.fillText(`Follow-through: ${(analysis.followThrough.overallQuality * 100).toFixed(0)}%`, metricsX + 10, metricsY + 100);
  
  // Draw recommendations
  ctx.fillText('Key Recommendations:', metricsX + 10, metricsY + 120);
  analysis.recommendations.slice(0, 2).forEach((rec, index) => {
    ctx.fillText(`• ${rec}`, metricsX + 20, metricsY + 135 + (index * 15));
  });
}
