'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { PoseResult, PoseLandmark } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface GolfAnalysisOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  poses: PoseResult[];
  phases?: EnhancedSwingPhase[];
  currentTime?: number;
  overlaySettings?: {
    showStickFigure?: boolean;
    showClubPath?: boolean;
    showAngleMeasurements?: boolean;
    showPhaseIndicators?: boolean;
    showComparison?: boolean;
    showSwingPlane?: boolean;
    showWeightTransfer?: boolean;
    showTempoGuide?: boolean;
  };
  comparisonPoses?: PoseResult[];
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

export default function GolfAnalysisOverlay({
  videoRef,
  canvasRef,
  poses,
  phases = [],
  currentTime = 0,
  overlaySettings = {
    showStickFigure: true,
    showClubPath: true,
    showAngleMeasurements: true,
    showPhaseIndicators: true,
    showComparison: false,
    showSwingPlane: true,
    showWeightTransfer: true,
    showTempoGuide: true,
  },
  comparisonPoses = [],
  className = ''
}: GolfAnalysisOverlayProps) {
  const [clubPathHistory, setClubPathHistory] = useState<{ x: number; y: number; timestamp: number; phase?: string }[]>([]);
  const [angleHistory, setAngleHistory] = useState<{ timestamp: number; shoulderAngle: number; hipAngle: number; spineAngle: number }[]>([]);
  const [weightTransferHistory, setWeightTransferHistory] = useState<{ timestamp: number; weight: number }[]>([]);
  const [tempoData, setTempoData] = useState<{ beats: number[]; currentBeat: number }>({ beats: [], currentBeat: 0 });

  // Update club path history
  useEffect(() => {
    if (!poses || poses.length === 0) return;

    const currentPose = poses[Math.floor(currentTime * 30)];
    if (!currentPose?.landmarks) return;

    const landmarks = currentPose.landmarks;
    const leftWrist = landmarks[GOLF_LANDMARKS.leftWrist];
    const rightWrist = landmarks[GOLF_LANDMARKS.rightWrist];

    if (leftWrist && rightWrist && leftWrist.visibility > 0.5 && rightWrist.visibility > 0.5) {
      // Calculate club head position (estimated from wrists)
      const clubHeadX = (leftWrist.x + rightWrist.x) / 2;
      const clubHeadY = Math.min(leftWrist.y, rightWrist.y) - 0.05; // Offset for club head

      // Get current phase
      const currentPhase = phases.find(phase => 
        currentTime >= phase.startTime && currentTime <= phase.endTime
      );

      setClubPathHistory(prev => [
        ...prev,
        {
          x: clubHeadX,
          y: clubHeadY,
          timestamp: currentTime,
          phase: currentPhase?.name
        }
      ].slice(-200)); // Keep last 200 points
    }
  }, [currentTime, poses, phases]);

  // Update angle measurements
  useEffect(() => {
    if (!poses || poses.length === 0) return;

    const currentPose = poses[Math.floor(currentTime * 30)];
    if (!currentPose?.landmarks) return;

    const landmarks = currentPose.landmarks;
    const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
    const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_LANDMARKS.rightHip];

    if (leftShoulder && rightShoulder && leftHip && rightHip &&
        leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5 &&
        leftHip.visibility > 0.5 && rightHip.visibility > 0.5) {

      // Calculate shoulder angle (rotation from horizontal)
      const shoulderAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      ) * (180 / Math.PI);

      // Calculate hip angle (rotation from horizontal)
      const hipAngle = Math.atan2(
        rightHip.y - leftHip.y,
        rightHip.x - leftHip.x
      ) * (180 / Math.PI);

      // Calculate spine angle (tilt from vertical)
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      const spineAngle = Math.atan2(
        hipCenter.x - shoulderCenter.x,
        hipCenter.y - shoulderCenter.y
      ) * (180 / Math.PI);

      setAngleHistory(prev => [
        ...prev,
        {
          timestamp: currentTime,
          shoulderAngle,
          hipAngle,
          spineAngle
        }
      ].slice(-100)); // Keep last 100 measurements
    }
  }, [currentTime, poses]);

  // Update weight transfer
  useEffect(() => {
    if (!poses || poses.length === 0) return;

    const currentPose = poses[Math.floor(currentTime * 30)];
    if (!currentPose?.landmarks) return;

    const landmarks = currentPose.landmarks;
    const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_LANDMARKS.rightHip];

    if (leftHip && rightHip && leftHip.visibility > 0.5 && rightHip.visibility > 0.5) {
      const hipCenterX = (leftHip.x + rightHip.x) / 2;
      const weightTransfer = Math.max(0, Math.min(100, (hipCenterX / 0.5) * 100));
      
      setWeightTransferHistory(prev => [
        ...prev,
        { timestamp: currentTime, weight: weightTransfer }
      ].slice(-100));
    }
  }, [currentTime, poses]);

  // Update tempo data
  useEffect(() => {
    if (phases && phases.length > 0) {
      const totalDuration = phases[phases.length - 1]?.endTime || 1;
      const beatInterval = totalDuration / 4; // 4 beats per swing
      
      const beats = [];
      for (let i = 0; i < 4; i++) {
        beats.push(i * beatInterval);
      }
      
      const currentBeat = Math.floor(currentTime / beatInterval);
      setTempoData({ beats, currentBeat });
    }
  }, [phases, currentTime]);

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

    // Draw stick figure if enabled
    if (overlaySettings.showStickFigure) {
      drawStickFigure(ctx, landmarks, canvas.width, canvas.height);
    }

    // Draw club path if enabled
    if (overlaySettings.showClubPath) {
      drawClubPath(ctx, clubPathHistory, canvas.width, canvas.height);
    }

    // Draw swing plane if enabled
    if (overlaySettings.showSwingPlane) {
      drawSwingPlane(ctx, landmarks, canvas.width, canvas.height);
    }

    // Draw angle measurements if enabled
    if (overlaySettings.showAngleMeasurements) {
      drawAngleMeasurements(ctx, landmarks, angleHistory, canvas.width, canvas.height);
    }

    // Draw phase indicators if enabled
    if (overlaySettings.showPhaseIndicators) {
      drawPhaseIndicators(ctx, phases, currentTime, canvas.width, canvas.height);
    }

    // Draw weight transfer if enabled
    if (overlaySettings.showWeightTransfer) {
      drawWeightTransfer(ctx, weightTransferHistory, currentTime, canvas.width, canvas.height);
    }

    // Draw tempo guide if enabled
    if (overlaySettings.showTempoGuide) {
      drawTempoGuide(ctx, tempoData, currentTime, canvas.width, canvas.height);
    }

    // Draw comparison view if enabled
    if (overlaySettings.showComparison && comparisonPoses.length > 0) {
      drawComparisonView(ctx, landmarks, comparisonPoses, currentTime, canvas.width, canvas.height);
    }

  }, [
    currentTime, poses, phases, clubPathHistory, angleHistory, weightTransferHistory, tempoData,
    overlaySettings, comparisonPoses
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

function drawClubPath(ctx: CanvasRenderingContext2D, clubPathHistory: { x: number; y: number; timestamp: number; phase?: string }[], width: number, height: number) {
  if (clubPathHistory.length < 2) return;

  // Draw club path with phase-based coloring
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Group path by phases
  const phaseGroups: { [key: string]: { x: number; y: number }[] } = {};
  clubPathHistory.forEach(point => {
    const phase = point.phase || 'unknown';
    if (!phaseGroups[phase]) phaseGroups[phase] = [];
    phaseGroups[phase].push({ x: point.x * width, y: point.y * height });
  });

  // Draw each phase with different color
  const phaseColors: { [key: string]: string } = {
    'address': 'rgba(0, 255, 0, 0.8)',
    'backswing': 'rgba(255, 255, 0, 0.8)',
    'top': 'rgba(255, 165, 0, 0.8)',
    'downswing': 'rgba(255, 0, 0, 0.8)',
    'impact': 'rgba(255, 0, 255, 0.8)',
    'follow-through': 'rgba(0, 255, 255, 0.8)',
    'unknown': 'rgba(128, 128, 128, 0.8)'
  };

  Object.entries(phaseGroups).forEach(([phase, points]) => {
    if (points.length < 2) return;

    ctx.strokeStyle = phaseColors[phase] || phaseColors.unknown;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  });

  // Draw current club head position
  if (clubPathHistory.length > 0) {
    const currentPoint = clubPathHistory[clubPathHistory.length - 1];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(currentPoint.x * width, currentPoint.y * height, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw club head outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(currentPoint.x * width, currentPoint.y * height, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSwingPlane(ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], width: number, height: number) {
  if (!landmarks || landmarks.length === 0) return;

  const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
  const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
  const rightHip = landmarks[GOLF_LANDMARKS.rightHip];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };

  // Draw ideal swing plane (vertical line)
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(shoulderCenter.x * width, shoulderCenter.y * height);
  ctx.lineTo(hipCenter.x * width, hipCenter.y * height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw actual swing plane
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(shoulderCenter.x * width, shoulderCenter.y * height);
  ctx.lineTo(hipCenter.x * width, hipCenter.y * height);
  ctx.stroke();

  // Draw swing plane angle
  const angle = Math.atan2(
    hipCenter.x - shoulderCenter.x,
    hipCenter.y - shoulderCenter.y
  ) * (180 / Math.PI);
  
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(`Swing Plane: ${Math.abs(angle).toFixed(1)}°`, 10, 30);
}

function drawAngleMeasurements(ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], angleHistory: { timestamp: number; shoulderAngle: number; hipAngle: number; spineAngle: number }[], width: number, height: number) {
  if (!landmarks || landmarks.length === 0) return;

  const leftShoulder = landmarks[GOLF_LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[GOLF_LANDMARKS.rightShoulder];
  const leftHip = landmarks[GOLF_LANDMARKS.leftHip];
  const rightHip = landmarks[GOLF_LANDMARKS.rightHip];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

  // Draw shoulder angle measurement
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };

  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };

  // Draw angle arc for shoulder rotation
  const shoulderAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  ) * (180 / Math.PI);

  ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    shoulderCenter.x * width, shoulderCenter.y * height,
    30, 0, Math.abs(shoulderAngle) * Math.PI / 180
  );
  ctx.stroke();

  // Draw angle arc for hip rotation
  const hipAngle = Math.atan2(
    rightHip.y - leftHip.y,
    rightHip.x - leftHip.x
  ) * (180 / Math.PI);

  ctx.strokeStyle = 'rgba(255, 150, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    hipCenter.x * width, hipCenter.y * height,
    25, 0, Math.abs(hipAngle) * Math.PI / 180
  );
  ctx.stroke();

  // Draw spine angle line
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(shoulderCenter.x * width, shoulderCenter.y * height);
  ctx.lineTo(hipCenter.x * width, hipCenter.y * height);
  ctx.stroke();

  // Draw angle measurements text
  const metricsX = 10;
  const metricsY = 60;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(metricsX, metricsY - 20, 200, 100);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Angle Measurements', metricsX + 10, metricsY);
  
  ctx.font = '12px Arial';
  ctx.fillText(`Shoulder: ${Math.abs(shoulderAngle).toFixed(1)}°`, metricsX + 10, metricsY + 20);
  ctx.fillText(`Hip: ${Math.abs(hipAngle).toFixed(1)}°`, metricsX + 10, metricsY + 35);
  
  const spineAngle = Math.atan2(
    hipCenter.x - shoulderCenter.x,
    hipCenter.y - shoulderCenter.y
  ) * (180 / Math.PI);
  ctx.fillText(`Spine: ${Math.abs(spineAngle).toFixed(1)}°`, metricsX + 10, metricsY + 50);
}

function drawPhaseIndicators(ctx: CanvasRenderingContext2D, phases: EnhancedSwingPhase[], currentTime: number, width: number, height: number) {
  if (!phases || phases.length === 0) return;

  // Find current phase
  const currentPhase = phases.find(phase => 
    currentTime >= phase.startTime && currentTime <= phase.endTime
  );

  if (!currentPhase) return;

  // Draw phase indicator bar at top
  ctx.fillStyle = `${currentPhase.color}80`;
  ctx.fillRect(0, 0, width, 8);
  ctx.fillRect(0, height - 8, width, 8);

  // Draw phase info box
  const infoX = width - 250;
  const infoY = 10;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(infoX, infoY, 240, 80);
  
  ctx.fillStyle = currentPhase.color;
  ctx.font = 'bold 16px Arial';
  ctx.fillText(currentPhase.name.toUpperCase(), infoX + 10, infoY + 25);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText(`Grade: ${currentPhase.grade}`, infoX + 10, infoY + 45);
  ctx.fillText(`Confidence: ${(currentPhase.confidence * 100).toFixed(0)}%`, infoX + 10, infoY + 60);
  ctx.fillText(`Duration: ${(currentPhase.endTime - currentPhase.startTime).toFixed(2)}s`, infoX + 10, infoY + 75);

  // Draw phase timeline
  const timelineY = height - 40;
  const timelineHeight = 20;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(10, timelineY, width - 20, timelineHeight);
  
  phases.forEach((phase, index) => {
    const phaseStart = (phase.startTime / phases[phases.length - 1].endTime) * (width - 20);
    const phaseEnd = (phase.endTime / phases[phases.length - 1].endTime) * (width - 20);
    
    ctx.fillStyle = phase.color;
    ctx.fillRect(10 + phaseStart, timelineY, phaseEnd - phaseStart, timelineHeight);
    
    // Draw phase labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.fillText(phase.name, 10 + phaseStart + 5, timelineY + 15);
  });
}

function drawWeightTransfer(ctx: CanvasRenderingContext2D, weightTransferHistory: { timestamp: number; weight: number }[], currentTime: number, width: number, height: number) {
  if (weightTransferHistory.length < 2) return;

  // Draw weight transfer bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = width - barWidth - 10;
  const barY = 100;
  
  // Background
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Current weight transfer
  const currentWeight = weightTransferHistory[weightTransferHistory.length - 1]?.weight || 50;
  const weightBarWidth = (currentWeight / 100) * barWidth;
  
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(barX, barY, weightBarWidth, barHeight);
  
  // Labels
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('Weight Transfer', barX, barY - 5);
  ctx.fillText(`${currentWeight.toFixed(0)}%`, barX + barWidth + 10, barY + 15);
}

function drawTempoGuide(ctx: CanvasRenderingContext2D, tempoData: { beats: number[]; currentBeat: number }, currentTime: number, width: number, height: number) {
  const beatRadius = 20;
  const centerX = width - 50;
  const centerY = height - 50;
  
  // Draw tempo circle
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, beatRadius, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Draw beats
  tempoData.beats.forEach((beat, index) => {
    const angle = (index / tempoData.beats.length) * 2 * Math.PI;
    const x = centerX + Math.cos(angle) * beatRadius;
    const y = centerY + Math.sin(angle) * beatRadius;
    
    ctx.fillStyle = index === tempoData.currentBeat ? '#ff0000' : '#666666';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  // Draw current beat indicator
  const currentAngle = (tempoData.currentBeat / tempoData.beats.length) * 2 * Math.PI;
  const currentX = centerX + Math.cos(currentAngle) * beatRadius;
  const currentY = centerY + Math.sin(currentAngle) * beatRadius;
  
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();
}

function drawComparisonView(ctx: CanvasRenderingContext2D, currentLandmarks: PoseLandmark[], comparisonPoses: PoseResult[], currentTime: number, width: number, height: number) {
  if (!comparisonPoses || comparisonPoses.length === 0) return;

  // Find comparison pose at current time
  const comparisonPose = comparisonPoses[Math.floor(currentTime * 30)];
  if (!comparisonPose?.landmarks) return;

  const comparisonLandmarks = comparisonPose.landmarks;

  // Draw comparison stick figure in semi-transparent overlay
  ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = comparisonLandmarks[startIdx];
    const end = comparisonLandmarks[endIdx];
    
    if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();
    }
  });

  // Draw comparison landmarks
  comparisonLandmarks.forEach((landmark, index) => {
    if (landmark.visibility > 0.5) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      ctx.fillStyle = 'rgba(255, 0, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Draw comparison label
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(width - 150, 10, 140, 30);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('COMPARISON', width - 140, 30);
}
