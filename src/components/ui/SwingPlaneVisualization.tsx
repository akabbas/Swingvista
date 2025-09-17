'use client';

import React, { useRef, useEffect, useCallback, memo } from 'react';
import type { PoseResult, PoseLandmark } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface SwingPlaneVisualizationProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  poses: PoseResult[];
  currentTime?: number;
  phases?: EnhancedSwingPhase[];
  showSwingPlane?: boolean;
  showClubPath?: boolean;
  showImpactZone?: boolean;
  showWeightTransfer?: boolean;
  showSpineAngle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Key landmarks for golf-specific visualizations
const GOLF_KEY_LANDMARKS = {
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

const SwingPlaneVisualization = memo(function SwingPlaneVisualization({
  videoRef,
  poses,
  currentTime = 0,
  phases = [],
  showSwingPlane = true,
  showClubPath = true,
  showImpactZone = true,
  showWeightTransfer = true,
  showSpineAngle = true,
  className = '',
  style = {}
}: SwingPlaneVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Find the closest pose to current time
  const findClosestPose = useCallback((time: number): PoseResult | null => {
    if (!poses || poses.length === 0) return null;
    
    let closest = poses[0];
    let minDiff = Math.abs((poses[0].timestamp || 0) - time);
    
    for (const pose of poses) {
      const poseTime = pose.timestamp || 0;
      const diff = Math.abs(poseTime - time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pose;
      }
    }
    
    return closest;
  }, [poses]);

  // Get current phase based on time
  const getCurrentPhase = useCallback((time: number): EnhancedSwingPhase | null => {
    return phases.find(phase => 
      time >= phase.startTime && time <= phase.endTime
    ) || null;
  }, [phases]);

  // Draw swing plane line
  const drawSwingPlane = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) return;

    const leftShoulder = landmarks[GOLF_KEY_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_KEY_LANDMARKS.rightShoulder];
    const leftHip = landmarks[GOLF_KEY_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_KEY_LANDMARKS.rightHip];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };

    // Draw main swing plane line
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(shoulderCenter.x * canvasWidth, shoulderCenter.y * canvasHeight);
    ctx.lineTo(hipCenter.x * canvasWidth, hipCenter.y * canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw swing plane angle indicator
    const angle = Math.atan2(
      hipCenter.x - shoulderCenter.x,
      hipCenter.y - shoulderCenter.y
    ) * (180 / Math.PI);
    
    // Draw angle arc
    const centerX = shoulderCenter.x * canvasWidth;
    const centerY = shoulderCenter.y * canvasHeight;
    const radius = 50;
    
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI);
    ctx.stroke();
    
    // Draw angle text
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Swing Plane: ${Math.abs(angle).toFixed(1)}°`, 10, 30);
  }, []);

  // Draw club path visualization
  const drawClubPath = useCallback((ctx: CanvasRenderingContext2D, poses: PoseResult[], canvasWidth: number, canvasHeight: number) => {
    if (!poses || poses.length === 0) return;

    // Get right wrist positions (club grip)
    const wristPositions = poses
      .filter(pose => pose.landmarks && pose.landmarks[GOLF_KEY_LANDMARKS.rightWrist])
      .map(pose => ({
        x: pose.landmarks[GOLF_KEY_LANDMARKS.rightWrist].x * canvasWidth,
        y: pose.landmarks[GOLF_KEY_LANDMARKS.rightWrist].y * canvasHeight,
        timestamp: pose.timestamp || 0
      }))
      .slice(-30); // Last 30 positions for performance

    if (wristPositions.length < 2) return;

    // Draw club path trail
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wristPositions[0].x, wristPositions[0].y);
    
    for (let i = 1; i < wristPositions.length; i++) {
      ctx.lineTo(wristPositions[i].x, wristPositions[i].y);
    }
    ctx.stroke();

    // Draw current position marker
    const currentPos = wristPositions[wristPositions.length - 1];
    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(currentPos.x, currentPos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Draw impact zone visualization
  const drawImpactZone = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) return;

    const rightWrist = landmarks[GOLF_KEY_LANDMARKS.rightWrist];
    if (!rightWrist) return;

    const x = rightWrist.x * canvasWidth;
    const y = rightWrist.y * canvasHeight;

    // Draw impact zone circle
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw impact zone label
    ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('IMPACT ZONE', x - 30, y - 35);
  }, []);

  // Draw weight transfer visualization
  const drawWeightTransfer = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) return;

    const leftAnkle = landmarks[GOLF_KEY_LANDMARKS.leftAnkle];
    const rightAnkle = landmarks[GOLF_KEY_LANDMARKS.rightAnkle];

    if (!leftAnkle || !rightAnkle) return;

    const leftX = leftAnkle.x * canvasWidth;
    const leftY = leftAnkle.y * canvasHeight;
    const rightX = rightAnkle.x * canvasWidth;
    const rightY = rightAnkle.y * canvasHeight;

    // Draw weight distribution line
    ctx.strokeStyle = 'rgba(255, 150, 0, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.stroke();

    // Draw weight distribution percentage
    const totalDistance = Math.sqrt(Math.pow(rightX - leftX, 2) + Math.pow(rightY - leftY, 2));
    const leftWeight = totalDistance > 0 ? (Math.abs(leftX - (leftX + rightX) / 2) / totalDistance) * 100 : 50;
    const rightWeight = 100 - leftWeight;

    ctx.fillStyle = 'rgba(255, 150, 0, 0.9)';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Weight: L${leftWeight.toFixed(0)}% R${rightWeight.toFixed(0)}%`, 10, canvasHeight - 20);
  }, []);

  // Draw spine angle visualization
  const drawSpineAngle = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) return;

    const head = landmarks[GOLF_KEY_LANDMARKS.head];
    const leftHip = landmarks[GOLF_KEY_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_KEY_LANDMARKS.rightHip];

    if (!head || !leftHip || !rightHip) return;

    const headX = head.x * canvasWidth;
    const headY = head.y * canvasHeight;
    const hipCenterX = (leftHip.x + rightHip.x) / 2 * canvasWidth;
    const hipCenterY = (leftHip.y + rightHip.y) / 2 * canvasHeight;

    // Draw spine line
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(hipCenterX, hipCenterY);
    ctx.stroke();

    // Calculate and display spine angle
    const angle = Math.atan2(
      hipCenterX - headX,
      hipCenterY - headY
    ) * (180 / Math.PI);

    ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Spine Angle: ${Math.abs(angle).toFixed(1)}°`, 10, canvasHeight - 40);
  }, []);

  // Draw phase-specific visualizations
  const drawPhaseVisualizations = useCallback((ctx: CanvasRenderingContext2D, currentPhase: EnhancedSwingPhase | null, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!currentPhase || !landmarks || landmarks.length === 0) return;

    const rightWrist = landmarks[GOLF_KEY_LANDMARKS.rightWrist];
    if (!rightWrist) return;

    const x = rightWrist.x * canvasWidth;
    const y = rightWrist.y * canvasHeight;

    // Phase-specific visualizations
    switch (currentPhase.name) {
      case 'address':
        // Draw setup position indicators
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        break;

      case 'backswing':
        // Draw backswing path
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        break;

      case 'top':
        // Draw top position marker
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'downswing':
        // Draw downswing path
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        break;

      case 'impact':
        // Draw impact zone
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'follow-through':
        // Draw follow-through path
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
    }
  }, []);

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

    // Find current pose and phase
    const currentPose = findClosestPose(currentTime);
    const currentPhase = getCurrentPhase(currentTime);

    if (!currentPose || !currentPose.landmarks) return;

    const landmarks = currentPose.landmarks;

    // Draw golf-specific visualizations
    if (showSwingPlane) {
      drawSwingPlane(ctx, landmarks, canvas.width, canvas.height);
    }

    if (showClubPath) {
      drawClubPath(ctx, poses, canvas.width, canvas.height);
    }

    if (showImpactZone) {
      drawImpactZone(ctx, landmarks, canvas.width, canvas.height);
    }

    if (showWeightTransfer) {
      drawWeightTransfer(ctx, landmarks, canvas.width, canvas.height);
    }

    if (showSpineAngle) {
      drawSpineAngle(ctx, landmarks, canvas.width, canvas.height);
    }

    // Draw phase-specific visualizations
    if (currentPhase) {
      drawPhaseVisualizations(ctx, currentPhase, landmarks, canvas.width, canvas.height);
    }

  }, [
    currentTime, 
    findClosestPose, 
    getCurrentPhase, 
    showSwingPlane, 
    showClubPath, 
    showImpactZone, 
    showWeightTransfer, 
    showSpineAngle,
    drawSwingPlane,
    drawClubPath,
    drawImpactZone,
    drawWeightTransfer,
    drawSpineAngle,
    drawPhaseVisualizations,
    poses
  ]);

  // Handle canvas resizing
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const resizeCanvas = () => {
      const videoWidth = video.videoWidth || video.clientWidth;
      const videoHeight = video.videoHeight || video.clientHeight;
      
      if (videoWidth && videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        render();
      }
    };

    video.addEventListener('loadedmetadata', resizeCanvas);
    video.addEventListener('resize', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      video.removeEventListener('loadedmetadata', resizeCanvas);
      video.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [render]);

  // Render loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...style
      }}
    />
  );
});

export default SwingPlaneVisualization;

