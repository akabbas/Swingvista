'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { PoseResult, PoseLandmark } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import { 
  performProfessionalGolfAnalysis,
  type ProfessionalGolfMetrics,
  type ClubPathAnalysis,
  type SwingPlaneEfficiency,
  type WeightTransferAnalysis,
  type SpineAngleConsistency,
  type HeadMovementStability
} from '@/lib/professional-golf-metrics';

export interface ProfessionalGolfVisualizationProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  poses: PoseResult[];
  phases?: EnhancedSwingPhase[];
  currentTime?: number;
  showProfessionalMetrics?: boolean;
  showClubPathAnalysis?: boolean;
  showSwingPlaneAnalysis?: boolean;
  showWeightTransferAnalysis?: boolean;
  showSpineAngleAnalysis?: boolean;
  showHeadStabilityAnalysis?: boolean;
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

export default function ProfessionalGolfVisualization({
  videoRef,
  canvasRef,
  poses,
  phases = [],
  currentTime = 0,
  showProfessionalMetrics = true,
  showClubPathAnalysis = true,
  showSwingPlaneAnalysis = true,
  showWeightTransferAnalysis = true,
  showSpineAngleAnalysis = true,
  showHeadStabilityAnalysis = true,
  className = ''
}: ProfessionalGolfVisualizationProps) {
  const [professionalMetrics, setProfessionalMetrics] = useState<ProfessionalGolfMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Perform professional analysis when poses change
  useEffect(() => {
    if (poses.length === 0 || phases.length === 0) return;

    setIsAnalyzing(true);
    
    try {
      const analysis = performProfessionalGolfAnalysis(poses, phases);
      setProfessionalMetrics(analysis);
    } catch (error) {
      console.error('Error performing professional golf analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
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

    // Draw professional analysis overlays
    if (showProfessionalMetrics && professionalMetrics) {
      if (showClubPathAnalysis) {
        drawClubPathAnalysis(ctx, professionalMetrics.clubPath, currentTime, canvas.width, canvas.height);
      }
      
      if (showSwingPlaneAnalysis) {
        drawSwingPlaneAnalysis(ctx, professionalMetrics.swingPlane, landmarks, canvas.width, canvas.height);
      }
      
      if (showWeightTransferAnalysis) {
        drawWeightTransferAnalysis(ctx, professionalMetrics.weightTransfer, currentTime, canvas.width, canvas.height);
      }
      
      if (showSpineAngleAnalysis) {
        drawSpineAngleAnalysis(ctx, professionalMetrics.spineAngle, landmarks, canvas.width, canvas.height);
      }
      
      if (showHeadStabilityAnalysis) {
        drawHeadStabilityAnalysis(ctx, professionalMetrics.headStability, landmarks, canvas.width, canvas.height);
      }
      
      // Draw professional metrics dashboard
      drawProfessionalMetricsDashboard(ctx, professionalMetrics, canvas.width, canvas.height);
    }

  }, [
    currentTime, poses, phases, professionalMetrics,
    showProfessionalMetrics, showClubPathAnalysis, showSwingPlaneAnalysis,
    showWeightTransferAnalysis, showSpineAngleAnalysis, showHeadStabilityAnalysis
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
    
    if (start && end && (start.visibility ?? 0) > 0.5 && (end.visibility ?? 0) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();
    }
  });

  // Draw key landmarks with different colors
  landmarks.forEach((landmark, index) => {
    if ((landmark.visibility ?? 0) > 0.5) {
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

function drawClubPathAnalysis(ctx: CanvasRenderingContext2D, clubPath: ClubPathAnalysis, currentTime: number, width: number, height: number) {
  // Draw club path analysis box
  const analysisX = 10;
  const analysisY = 10;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(analysisX, analysisY, 300, 120);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Club Path Analysis', analysisX + 10, analysisY + 25);
  
  ctx.font = '14px Arial';
  ctx.fillText(`Path Type: ${clubPath.pathType.toUpperCase()}`, analysisX + 10, analysisY + 45);
  ctx.fillText(`Deviation: ${clubPath.pathDeviation.toFixed(2)}°`, analysisX + 10, analysisY + 65);
  ctx.fillText(`Efficiency: ${(clubPath.pathEfficiency * 100).toFixed(0)}%`, analysisX + 10, analysisY + 85);
  ctx.fillText(`Consistency: ${(clubPath.pathConsistency * 100).toFixed(0)}%`, analysisX + 10, analysisY + 105);
  
  // Draw path type indicator
  const indicatorX = analysisX + 200;
  const indicatorY = analysisY + 40;
  const indicatorSize = 20;
  
  ctx.fillStyle = clubPath.pathType === 'inside-out' ? 'rgba(0, 255, 0, 0.8)' :
                  clubPath.pathType === 'outside-in' ? 'rgba(255, 0, 0, 0.8)' :
                  clubPath.pathType === 'straight' ? 'rgba(0, 0, 255, 0.8)' : 'rgba(128, 128, 128, 0.8)';
  ctx.beginPath();
  ctx.arc(indicatorX, indicatorY, indicatorSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw path efficiency bar
  const barX = analysisX + 10;
  const barY = analysisY + 90;
  const barWidth = 200;
  const barHeight = 10;
  
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  const efficiencyWidth = clubPath.pathEfficiency * barWidth;
  ctx.fillStyle = clubPath.pathEfficiency > 0.7 ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
  ctx.fillRect(barX, barY, efficiencyWidth, barHeight);
}

function drawSwingPlaneAnalysis(ctx: CanvasRenderingContext2D, swingPlane: SwingPlaneEfficiency, landmarks: PoseLandmark[], width: number, height: number) {
  // Draw swing plane analysis box
  const analysisX = width - 320;
  const analysisY = 10;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(analysisX, analysisY, 300, 120);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Swing Plane Analysis', analysisX + 10, analysisY + 25);
  
  ctx.font = '14px Arial';
  ctx.fillText(`Plane Angle: ${swingPlane.planeAngle.toFixed(1)}°`, analysisX + 10, analysisY + 45);
  ctx.fillText(`Consistency: ${(swingPlane.planeConsistency * 100).toFixed(0)}%`, analysisX + 10, analysisY + 65);
  ctx.fillText(`Stability: ${(swingPlane.planeStability * 100).toFixed(0)}%`, analysisX + 10, analysisY + 85);
  ctx.fillText(`Efficiency: ${(swingPlane.efficiencyScore * 100).toFixed(0)}%`, analysisX + 10, analysisY + 105);
  
  // Draw swing plane visualization
  if (landmarks && landmarks.length > 0) {
    const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
    const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_LANDMARKS.rightHip];
    
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      
      // Draw current swing plane
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(shoulderCenter.x * width, shoulderCenter.y * height);
      ctx.lineTo(hipCenter.x * width, hipCenter.y * height);
      ctx.stroke();
      
      // Draw ideal swing plane
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(shoulderCenter.x * width, shoulderCenter.y * height);
      ctx.lineTo(hipCenter.x * width, hipCenter.y * height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawWeightTransferAnalysis(ctx: CanvasRenderingContext2D, weightTransfer: WeightTransferAnalysis, currentTime: number, width: number, height: number) {
  // Draw weight transfer analysis box
  const analysisX = 10;
  const analysisY = height - 140;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(analysisX, analysisY, 300, 120);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Weight Transfer Analysis', analysisX + 10, analysisY + 25);
  
  ctx.font = '14px Arial';
  ctx.fillText(`Pressure Shift: ${(weightTransfer.pressureShift * 100).toFixed(0)}%`, analysisX + 10, analysisY + 45);
  ctx.fillText(`Smoothness: ${(weightTransfer.weightTransferSmoothness * 100).toFixed(0)}%`, analysisX + 10, analysisY + 65);
  ctx.fillText(`Timing: ${(weightTransfer.weightTransferTiming * 100).toFixed(0)}%`, analysisX + 10, analysisY + 85);
  ctx.fillText(`Efficiency: ${(weightTransfer.transferEfficiency * 100).toFixed(0)}%`, analysisX + 10, analysisY + 105);
  
  // Draw weight transfer visualization
  const barX = analysisX + 10;
  const barY = analysisY + 50;
  const barWidth = 200;
  const barHeight = 20;
  
  // Background
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Left foot pressure
  const leftFootWidth = weightTransfer.pressureDistribution.leftFoot * barWidth;
  ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.fillRect(barX, barY, leftFootWidth, barHeight);
  
  // Right foot pressure
  const rightFootWidth = weightTransfer.pressureDistribution.rightFoot * barWidth;
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.fillRect(barX + leftFootWidth, barY, rightFootWidth, barHeight);
  
  // Center of pressure indicator
  const centerX = barX + (weightTransfer.pressureDistribution.centerOfPressure * barWidth);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, barY);
  ctx.lineTo(centerX, barY + barHeight);
  ctx.stroke();
}

function drawSpineAngleAnalysis(ctx: CanvasRenderingContext2D, spineAngle: SpineAngleConsistency, landmarks: PoseLandmark[], width: number, height: number) {
  // Draw spine angle analysis box
  const analysisX = width - 320;
  const analysisY = height - 140;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(analysisX, analysisY, 300, 120);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Spine Angle Analysis', analysisX + 10, analysisY + 25);
  
  ctx.font = '14px Arial';
  ctx.fillText(`Avg Angle: ${spineAngle.averageSpineAngle.toFixed(1)}°`, analysisX + 10, analysisY + 45);
  ctx.fillText(`Variance: ${spineAngle.spineAngleVariance.toFixed(1)}°`, analysisX + 10, analysisY + 65);
  ctx.fillText(`Consistency: ${(spineAngle.consistencyScore * 100).toFixed(0)}%`, analysisX + 10, analysisY + 85);
  ctx.fillText(`Stability: ${(spineAngle.spineStability * 100).toFixed(0)}%`, analysisX + 10, analysisY + 105);
  
  // Draw spine angle visualization
  if (landmarks && landmarks.length > 0) {
    const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
    const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_LANDMARKS.rightHip];
    
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      
      // Draw spine line
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(shoulderCenter.x * width, shoulderCenter.y * height);
      ctx.lineTo(hipCenter.x * width, hipCenter.y * height);
      ctx.stroke();
      
      // Draw spine angle indicator
      const angle = Math.atan2(
        hipCenter.x - shoulderCenter.x,
        hipCenter.y - shoulderCenter.y
      ) * (180 / Math.PI);
      
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Spine: ${Math.abs(angle).toFixed(1)}°`, shoulderCenter.x * width + 10, shoulderCenter.y * height - 10);
    }
  }
}

function drawHeadStabilityAnalysis(ctx: CanvasRenderingContext2D, headStability: HeadMovementStability, landmarks: PoseLandmark[], width: number, height: number) {
  // Draw head stability analysis box
  const analysisX = width / 2 - 150;
  const analysisY = 10;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(analysisX, analysisY, 300, 120);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Head Stability Analysis', analysisX + 10, analysisY + 25);
  
  ctx.font = '14px Arial';
  ctx.fillText(`Variance: ${headStability.headPositionVariance.toFixed(3)}`, analysisX + 10, analysisY + 45);
  ctx.fillText(`Movement Range: ${headStability.headMovementRange.toFixed(3)}`, analysisX + 10, analysisY + 65);
  ctx.fillText(`Stability: ${(headStability.stabilityScore * 100).toFixed(0)}%`, analysisX + 10, analysisY + 85);
  ctx.fillText(`Pattern: ${headStability.movementPattern.toUpperCase()}`, analysisX + 10, analysisY + 105);
  
  // Draw head stability indicator
  const indicatorX = analysisX + 200;
  const indicatorY = analysisY + 40;
  const indicatorSize = 20;
  
  ctx.fillStyle = headStability.movementPattern === 'stable' ? 'rgba(0, 255, 0, 0.8)' :
                  headStability.movementPattern === 'excessive' ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 255, 0, 0.8)';
  ctx.beginPath();
  ctx.arc(indicatorX, indicatorY, indicatorSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw head position if available
  if (landmarks && landmarks.length > 0) {
    const head = landmarks[GOLF_LANDMARKS.head];
    if (head) {
      const x = head.x * width;
      const y = head.y * height;
      
      // Draw head position circle
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw stability zone
      const stabilityRadius = 20 + (headStability.stabilityScore * 30);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(x, y, stabilityRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawProfessionalMetricsDashboard(ctx: CanvasRenderingContext2D, metrics: ProfessionalGolfMetrics, width: number, height: number) {
  // Draw overall professional score
  const dashboardX = width / 2 - 200;
  const dashboardY = height / 2 - 100;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(dashboardX, dashboardY, 400, 200);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('Professional Golf Analysis', dashboardX + 20, dashboardY + 30);
  
  ctx.font = '18px Arial';
  ctx.fillText(`Overall Score: ${(metrics.overallProfessionalScore * 100).toFixed(0)}%`, dashboardX + 20, dashboardY + 60);
  ctx.fillText(`Professional Grade: ${metrics.professionalGrade}`, dashboardX + 20, dashboardY + 85);
  
  // Draw metric scores
  const metricsY = dashboardY + 110;
  const metricHeight = 20;
  const metricSpacing = 25;
  
  const metricScores = [
    { name: 'Club Path', score: metrics.clubPath.pathEfficiency, color: 'rgba(0, 255, 0, 0.8)' },
    { name: 'Swing Plane', score: metrics.swingPlane.efficiencyScore, color: 'rgba(255, 0, 0, 0.8)' },
    { name: 'Weight Transfer', score: metrics.weightTransfer.transferEfficiency, color: 'rgba(0, 0, 255, 0.8)' },
    { name: 'Spine Angle', score: metrics.spineAngle.consistencyScore, color: 'rgba(255, 255, 0, 0.8)' },
    { name: 'Head Stability', score: metrics.headStability.stabilityScore, color: 'rgba(255, 0, 255, 0.8)' }
  ];
  
  metricScores.forEach((metric, index) => {
    const y = metricsY + (index * metricSpacing);
    
    // Draw metric bar
    const barX = dashboardX + 20;
    const barY = y;
    const barWidth = 200;
    const barHeight = metricHeight;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const scoreWidth = metric.score * barWidth;
    ctx.fillStyle = metric.color;
    ctx.fillRect(barX, barY, scoreWidth, barHeight);
    
    // Draw metric label and score
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(metric.name, barX + barWidth + 10, barY + 15);
    ctx.fillText(`${(metric.score * 100).toFixed(0)}%`, barX + barWidth + 120, barY + 15);
  });
  
  // Draw key recommendations
  if (metrics.keyRecommendations.length > 0) {
    const recY = dashboardY + 250;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(dashboardX, recY, 400, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Key Recommendations', dashboardX + 20, recY + 25);
    
    ctx.font = '12px Arial';
    metrics.keyRecommendations.forEach((rec, index) => {
      ctx.fillText(`• ${rec}`, dashboardX + 20, recY + 45 + (index * 15));
    });
  }
}
