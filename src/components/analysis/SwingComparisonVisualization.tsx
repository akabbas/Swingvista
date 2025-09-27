'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { PoseResult, PoseLandmark } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import type { SwingComparisonResult, ProGolferSwing, SwingSession } from '@/lib/swing-comparison';

export interface SwingComparisonVisualizationProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  comparisonResult: SwingComparisonResult;
  currentTime?: number;
  showSideBySide?: boolean;
  showMetrics?: boolean;
  showRecommendations?: boolean;
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

export default function SwingComparisonVisualization({
  videoRef,
  canvasRef,
  comparisonResult,
  currentTime = 0,
  showSideBySide = true,
  showMetrics = true,
  showRecommendations = true,
  className = ''
}: SwingComparisonVisualizationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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

    if (showSideBySide) {
      drawSideBySideComparison(ctx, comparisonResult, currentTime, canvas.width, canvas.height);
    }

    if (showMetrics) {
      drawComparisonMetrics(ctx, comparisonResult, canvas.width, canvas.height);
    }

    if (showRecommendations) {
      drawRecommendations(ctx, comparisonResult, canvas.width, canvas.height);
    }

  }, [
    currentTime, comparisonResult, showSideBySide, showMetrics, showRecommendations
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

function drawSideBySideComparison(
  ctx: CanvasRenderingContext2D, 
  comparisonResult: SwingComparisonResult, 
  currentTime: number, 
  width: number, 
  height: number
) {
  const { userSwing, proSwing, sideBySideData } = comparisonResult;
  
  // Calculate frame index
  const frameIndex = Math.floor(currentTime * 30);
  
  // Get current poses
  const userPose = sideBySideData.userPoses[frameIndex];
  const proPose = sideBySideData.proPoses[frameIndex];
  
  if (!userPose || !proPose) return;
  
  // Split canvas into two halves
  const leftWidth = width / 2;
  const rightWidth = width / 2;
  
  // Draw user swing on left side
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, leftWidth, height);
  ctx.clip();
  
  drawSwingOverlay(ctx, userPose, userSwing, leftWidth, height, 'User Swing', 'rgba(0, 255, 0, 0.8)');
  
  ctx.restore();
  
  // Draw pro swing on right side
  ctx.save();
  ctx.beginPath();
  ctx.rect(leftWidth, 0, rightWidth, height);
  ctx.clip();
  
  drawSwingOverlay(ctx, proPose, proSwing, rightWidth, height, `${proSwing.golferInfo.name}`, 'rgba(255, 0, 0, 0.8)');
  
  ctx.restore();
  
  // Draw comparison divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftWidth, 0);
  ctx.lineTo(leftWidth, height);
  ctx.stroke();
}

function drawSwingOverlay(
  ctx: CanvasRenderingContext2D,
  pose: PoseResult,
  swingData: any,
  width: number,
  height: number,
  label: string,
  color: string
) {
  if (!pose.landmarks) return;
  
  const landmarks = pose.landmarks;
  
  // Draw stick figure
  ctx.strokeStyle = color;
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
  
  // Draw key landmarks
  landmarks.forEach((landmark, index) => {
    if ((landmark.visibility ?? 0) > 0.5) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      let size = 4;
      if (index === GOLF_LANDMARKS.head) {
        size = 6;
      } else if (index === GOLF_LANDMARKS.leftWrist || index === GOLF_LANDMARKS.rightWrist) {
        size = 5;
      }
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Draw label
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(10, 10, 200, 40);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(label, 20, 30);
  
  // Draw current phase
  const currentPhase = swingData.phases?.find((phase: any) => 
    currentTime >= phase.startTime && currentTime <= phase.endTime
  );
  
  if (currentPhase) {
    ctx.fillStyle = currentPhase.color;
    ctx.font = '14px Arial';
    ctx.fillText(currentPhase.name.toUpperCase(), 20, 50);
  }
}

function drawComparisonMetrics(
  ctx: CanvasRenderingContext2D,
  comparisonResult: SwingComparisonResult,
  width: number,
  height: number
) {
  const { comparisonAnalysis, similarityScore } = comparisonResult;
  
  // Draw metrics panel
  const panelX = width - 300;
  const panelY = 10;
  const panelWidth = 280;
  const panelHeight = 200;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Comparison Metrics', panelX + 10, panelY + 25);
  
  // Draw similarity score
  ctx.font = '14px Arial';
  ctx.fillText(`Similarity: ${(similarityScore * 100).toFixed(0)}%`, panelX + 10, panelY + 50);
  
  // Draw timing comparison
  ctx.fillText(`Timing Difference: ${comparisonAnalysis.timingComparison.timingDifference.toFixed(2)}s`, panelX + 10, panelY + 70);
  
  // Draw position comparison
  const avgPositionDiff = comparisonAnalysis.positionComparison.positionDifferences.reduce((sum: number, diff: number) => sum + diff, 0) / comparisonAnalysis.positionComparison.positionDifferences.length;
  ctx.fillText(`Position Difference: ${avgPositionDiff.toFixed(3)}`, panelX + 10, panelY + 90);
  
  // Draw efficiency comparison
  ctx.fillText(`Efficiency Gap: ${(comparisonAnalysis.efficiencyComparison.efficiencyGap * 100).toFixed(0)}%`, panelX + 10, panelY + 110);
  
  // Draw progress bars
  const barY = panelY + 130;
  const barWidth = 200;
  const barHeight = 15;
  
  // Similarity bar
  ctx.fillStyle = '#333333';
  ctx.fillRect(panelX + 10, barY, barWidth, barHeight);
  
  const similarityWidth = similarityScore * barWidth;
  ctx.fillStyle = similarityScore > 0.7 ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
  ctx.fillRect(panelX + 10, barY, similarityWidth, barHeight);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('Similarity', panelX + 10, barY - 5);
  
  // Efficiency gap bar
  const efficiencyGap = comparisonAnalysis.efficiencyComparison.efficiencyGap;
  const efficiencyWidth = (1 - efficiencyGap) * barWidth;
  
  ctx.fillStyle = '#333333';
  ctx.fillRect(panelX + 10, barY + 25, barWidth, barHeight);
  
  ctx.fillStyle = efficiencyGap < 0.2 ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
  ctx.fillRect(panelX + 10, barY + 25, efficiencyWidth, barHeight);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('Efficiency Match', panelX + 10, barY + 20);
}

function drawRecommendations(
  ctx: CanvasRenderingContext2D,
  comparisonResult: SwingComparisonResult,
  width: number,
  height: number
) {
  const { recommendations } = comparisonResult;
  
  // Draw recommendations panel
  const panelX = 10;
  const panelY = height - 150;
  const panelWidth = 400;
  const panelHeight = 140;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Comparison Recommendations', panelX + 10, panelY + 25);
  
  // Draw recommendations
  ctx.font = '12px Arial';
  recommendations.forEach((rec, index) => {
    const y = panelY + 45 + (index * 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`• ${rec}`, panelX + 10, y);
  });
  
  // Draw improvement areas
  const improvementAreas = generateImprovementAreas(comparisonResult);
  if (improvementAreas.length > 0) {
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Key Improvement Areas:', panelX + 10, panelY + 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    improvementAreas.slice(0, 2).forEach((area, index) => {
      const y = panelY + 115 + (index * 15);
      ctx.fillText(`• ${area}`, panelX + 10, y);
    });
  }
}

function generateImprovementAreas(comparisonResult: SwingComparisonResult): string[] {
  const areas: string[] = [];
  const { comparisonAnalysis } = comparisonResult;
  
  if (comparisonAnalysis.timingComparison.timingDifference > 0.5) {
    areas.push('Swing timing needs improvement');
  }
  
  if (comparisonAnalysis.efficiencyComparison.efficiencyGap > 0.3) {
    areas.push('Overall efficiency needs work');
  }
  
  const avgPositionDiff = comparisonAnalysis.positionComparison.positionDifferences.reduce((sum: number, diff: number) => sum + diff, 0) / comparisonAnalysis.positionComparison.positionDifferences.length;
  if (avgPositionDiff > 0.1) {
    areas.push('Body positioning needs adjustment');
  }
  
  return areas;
}
