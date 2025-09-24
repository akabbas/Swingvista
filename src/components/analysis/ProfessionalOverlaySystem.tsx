'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { SwingPhaseAnalysis } from '@/lib/professional-phase-detection';

interface OverlaySettings {
  stickFigure: boolean;
  swingPlane: boolean;
  phaseMarkers: boolean;
  clubPath: boolean;
  impactZone: boolean;
  weightTransfer: boolean;
  spineAngle: boolean;
  tempoGuide: boolean;
  groundForce: boolean;
  releasePoint: boolean;
}

interface ProfessionalOverlaySystemProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  poses: PoseResult[];
  phaseAnalysis: SwingPhaseAnalysis;
  currentTime: number;
  overlaySettings: OverlaySettings;
  className?: string;
}

export default function ProfessionalOverlaySystem({
  videoRef,
  canvasRef,
  poses,
  phaseAnalysis,
  currentTime,
  overlaySettings,
  className = ''
}: ProfessionalOverlaySystemProps) {
  const [clubPathHistory, setClubPathHistory] = useState<{ x: number; y: number; timestamp: number }[]>([]);
  const [weightTransferHistory, setWeightTransferHistory] = useState<{ timestamp: number; weight: number }[]>([]);
  const [tempoData, setTempoData] = useState<{ beats: number[]; currentBeat: number }>({ beats: [], currentBeat: 0 });

  // Update club path history
  useEffect(() => {
    if (poses && poses.length > 0) {
      const currentPose = poses[Math.floor(currentTime * 30)]; // Assuming 30fps
      if (currentPose?.pose?.keypoints) {
        const keypoints = currentPose.pose.keypoints;
        const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
        const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
        
        if (leftWrist && rightWrist) {
          const clubHeadPos = {
            x: (leftWrist.x + rightWrist.x) / 2,
            y: Math.min(leftWrist.y, rightWrist.y) - 20,
            timestamp: currentTime
          };
          
          setClubPathHistory(prev => [...prev, clubHeadPos].slice(-100)); // Keep last 100 points
        }
      }
    }
  }, [currentTime, poses]);

  // Update weight transfer history
  useEffect(() => {
    if (poses && poses.length > 0) {
      const currentPose = poses[Math.floor(currentTime * 30)];
      if (currentPose?.pose?.keypoints) {
        const keypoints = currentPose.pose.keypoints;
        const leftHip = keypoints.find(kp => kp.name === 'left_hip');
        const rightHip = keypoints.find(kp => kp.name === 'right_hip');
        
        if (leftHip && rightHip) {
          const hipCenterX = (leftHip.x + rightHip.x) / 2;
          const weightTransfer = Math.max(0, Math.min(100, (hipCenterX / 640) * 100));
          
          setWeightTransferHistory(prev => [...prev, { timestamp: currentTime, weight: weightTransfer }].slice(-100));
        }
      }
    }
  }, [currentTime, poses]);

  // Update tempo data
  useEffect(() => {
    if (phaseAnalysis) {
      const beats = [];
      const totalDuration = phaseAnalysis.totalDuration;
      const beatInterval = totalDuration / 4; // 4 beats per swing
      
      for (let i = 0; i < 4; i++) {
        beats.push(i * beatInterval);
      }
      
      const currentBeat = Math.floor(currentTime / beatInterval);
      setTempoData({ beats, currentBeat });
    }
  }, [phaseAnalysis, currentTime]);

  // Render overlays
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get current pose
    const currentPose = poses[Math.floor(currentTime * 30)];
    if (!currentPose) return;
    
    // Render overlays based on settings
    if (overlaySettings.stickFigure) {
      drawStickFigure(ctx, currentPose, canvas);
    }
    
    if (overlaySettings.swingPlane) {
      drawSwingPlane(ctx, currentPose, canvas);
    }
    
    if (overlaySettings.phaseMarkers) {
      drawPhaseMarkers(ctx, phaseAnalysis, currentTime, canvas);
    }
    
    if (overlaySettings.clubPath) {
      drawClubPath(ctx, clubPathHistory, canvas);
    }
    
    if (overlaySettings.impactZone) {
      drawImpactZone(ctx, currentPose, canvas);
    }
    
    if (overlaySettings.weightTransfer) {
      drawWeightTransfer(ctx, weightTransferHistory, currentTime, canvas);
    }
    
    if (overlaySettings.spineAngle) {
      drawSpineAngle(ctx, currentPose, canvas);
    }
    
    if (overlaySettings.tempoGuide) {
      drawTempoGuide(ctx, tempoData, currentTime, canvas);
    }
    
    if (overlaySettings.groundForce) {
      drawGroundForce(ctx, currentPose, canvas);
    }
    
    if (overlaySettings.releasePoint) {
      drawReleasePoint(ctx, currentPose, canvas);
    }
    
  }, [overlaySettings, currentTime, poses, phaseAnalysis, clubPathHistory, weightTransferHistory, tempoData]);

  return null; // This component only renders to canvas
}

// Drawing functions for each overlay type

function drawStickFigure(ctx: CanvasRenderingContext2D, pose: PoseResult, canvas: HTMLCanvasElement) {
  const keypoints = pose.pose?.keypoints || [];
  if (keypoints.length === 0) return;
  
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#00ff00';
  
  // Draw skeleton connections
  const connections = [
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
    ['left_shoulder', 'nose'],
    ['right_shoulder', 'nose']
  ];
  
  connections.forEach(([start, end]) => {
    const startPoint = keypoints.find(kp => kp.name === start);
    const endPoint = keypoints.find(kp => kp.name === end);
    
    if (startPoint && endPoint && startPoint.score > 0.5 && endPoint.score > 0.5) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    }
  });
  
  // Draw keypoints
  keypoints.forEach(kp => {
    if (kp.score > 0.5) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

function drawSwingPlane(ctx: CanvasRenderingContext2D, pose: PoseResult, canvas: HTMLCanvasElement) {
  const keypoints = pose.pose?.keypoints || [];
  const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
  
  if (!leftWrist || !rightWrist) return;
  
  const clubHeadX = (leftWrist.x + rightWrist.x) / 2;
  const clubHeadY = Math.min(leftWrist.y, rightWrist.y) - 20;
  
  // Draw ideal swing plane
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.moveTo(clubHeadX - 100, clubHeadY + 100);
  ctx.lineTo(clubHeadX + 100, clubHeadY - 100);
  ctx.stroke();
  
  // Draw actual swing plane
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  
  ctx.beginPath();
  ctx.moveTo(clubHeadX - 80, clubHeadY + 80);
  ctx.lineTo(clubHeadX + 80, clubHeadY - 80);
  ctx.stroke();
  
  // Reset line dash
  ctx.setLineDash([]);
}

function drawPhaseMarkers(ctx: CanvasRenderingContext2D, phaseAnalysis: SwingPhaseAnalysis, currentTime: number, canvas: HTMLCanvasElement) {
  const phases = ['address', 'approach', 'backswing', 'top', 'downswing', 'impact', 'followThrough'];
  const colors = ['#00ff00', '#ffff00', '#ff8800', '#ff0000', '#8800ff', '#ff0088', '#00ffff'];
  
  phases.forEach((phase, index) => {
    const phaseData = phaseAnalysis[phase as keyof SwingPhaseAnalysis];
    if (phaseData && typeof phaseData === 'object' && 'start' in phaseData) {
      const phaseStart = phaseData.start / 30; // Convert frame to time
      const phaseEnd = phaseData.end / 30;
      
      if (currentTime >= phaseStart && currentTime <= phaseEnd) {
        // Draw phase indicator
        ctx.fillStyle = colors[index];
        ctx.fillRect(10, 10 + index * 30, 20, 20);
        
        // Draw phase name
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText(phase.toUpperCase(), 40, 25 + index * 30);
        
        // Draw phase duration
        ctx.fillStyle = '#cccccc';
        ctx.font = '12px Arial';
        ctx.fillText(`${phaseData.duration.toFixed(2)}s`, 40, 40 + index * 30);
      }
    }
  });
}

function drawClubPath(ctx: CanvasRenderingContext2D, clubPathHistory: { x: number; y: number; timestamp: number }[], canvas: HTMLCanvasElement) {
  if (clubPathHistory.length < 2) return;
  
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  
  ctx.beginPath();
  ctx.moveTo(clubPathHistory[0].x, clubPathHistory[0].y);
  
  for (let i = 1; i < clubPathHistory.length; i++) {
    ctx.lineTo(clubPathHistory[i].x, clubPathHistory[i].y);
  }
  
  ctx.stroke();
  
  // Draw path points
  ctx.fillStyle = '#00ffff';
  clubPathHistory.forEach((point, index) => {
    const alpha = index / clubPathHistory.length;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  ctx.globalAlpha = 1;
}

function drawImpactZone(ctx: CanvasRenderingContext2D, pose: PoseResult, canvas: HTMLCanvasElement) {
  const keypoints = pose.pose?.keypoints || [];
  const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
  
  if (!leftWrist || !rightWrist) return;
  
  const impactX = (leftWrist.x + rightWrist.x) / 2;
  const impactY = Math.min(leftWrist.y, rightWrist.y) - 20;
  
  // Draw impact zone
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  
  ctx.beginPath();
  ctx.arc(impactX, impactY, 30, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Draw impact point
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(impactX, impactY, 5, 0, 2 * Math.PI);
  ctx.fill();
  
  ctx.setLineDash([]);
}

function drawWeightTransfer(ctx: CanvasRenderingContext2D, weightTransferHistory: { timestamp: number; weight: number }[], currentTime: number, canvas: HTMLCanvasElement) {
  if (weightTransferHistory.length < 2) return;
  
  // Draw weight transfer bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = canvas.width - barWidth - 10;
  const barY = 10;
  
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

function drawSpineAngle(ctx: CanvasRenderingContext2D, pose: PoseResult, canvas: HTMLCanvasElement) {
  const keypoints = pose.pose?.keypoints || [];
  const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
  const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
  const leftHip = keypoints.find(kp => kp.name === 'left_hip');
  const rightHip = keypoints.find(kp => kp.name === 'right_hip');
  
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;
  
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  // Draw spine line
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 3;
  
  ctx.beginPath();
  ctx.moveTo(shoulderCenter.x, shoulderCenter.y);
  ctx.lineTo(hipCenter.x, hipCenter.y);
  ctx.stroke();
  
  // Draw angle indicator
  const angle = Math.atan2(hipCenter.y - shoulderCenter.y, hipCenter.x - shoulderCenter.x) * (180 / Math.PI);
  
  ctx.fillStyle = '#ffff00';
  ctx.font = '14px Arial';
  ctx.fillText(`Spine: ${angle.toFixed(0)}°`, shoulderCenter.x + 10, shoulderCenter.y - 10);
}

function drawTempoGuide(ctx: CanvasRenderingContext2D, tempoData: { beats: number[]; currentBeat: number }, currentTime: number, canvas: HTMLCanvasElement) {
  const beatRadius = 20;
  const centerX = canvas.width - 50;
  const centerY = canvas.height - 50;
  
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

function drawGroundForce(ctx: CanvasRenderingContext2D, pose: PoseResult, canvas: HTMLCanvasElement) {
  const keypoints = pose.pose?.keypoints || [];
  const leftAnkle = keypoints.find(kp => kp.name === 'left_ankle');
  const rightAnkle = keypoints.find(kp => kp.name === 'right_ankle');
  
  if (!leftAnkle || !rightAnkle) return;
  
  // Draw ground force indicators
  const forceRadius = 15;
  
  // Left foot
  ctx.fillStyle = '#00ff00';
  ctx.beginPath();
  ctx.arc(leftAnkle.x, leftAnkle.y + 20, forceRadius, 0, 2 * Math.PI);
  ctx.fill();
  
  // Right foot
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(rightAnkle.x, rightAnkle.y + 20, forceRadius, 0, 2 * Math.PI);
  ctx.fill();
  
  // Labels
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('L', leftAnkle.x - 5, leftAnkle.y + 25);
  ctx.fillText('R', rightAnkle.x - 5, rightAnkle.y + 25);
}

function drawReleasePoint(ctx: CanvasRenderingContext2D, pose: PoseResult, canvas: HTMLCanvasElement) {
  const keypoints = pose.pose?.keypoints || [];
  const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
  const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
  
  if (!leftWrist || !rightWrist) return;
  
  const releaseX = (leftWrist.x + rightWrist.x) / 2;
  const releaseY = Math.min(leftWrist.y, rightWrist.y) - 20;
  
  // Draw release point
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.arc(releaseX, releaseY, 25, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Draw release arrow
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  
  ctx.beginPath();
  ctx.moveTo(releaseX - 20, releaseY);
  ctx.lineTo(releaseX + 20, releaseY);
  ctx.moveTo(releaseX + 15, releaseY - 5);
  ctx.lineTo(releaseX + 20, releaseY);
  ctx.lineTo(releaseX + 15, releaseY + 5);
  ctx.stroke();
  
  ctx.setLineDash([]);
}




