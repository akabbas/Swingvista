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
  const animationFrameRef = useRef<number | undefined>(undefined);

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

  // Draw swing plane line with comprehensive visualization
  const drawSwingPlane = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) {
      console.warn('🔧 PLANE FIX: No landmarks for swing plane');
      return;
    }

    const leftShoulder = landmarks[GOLF_KEY_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_KEY_LANDMARKS.rightShoulder];
    const leftHip = landmarks[GOLF_KEY_LANDMARKS.leftHip];
    const rightHip = landmarks[GOLF_KEY_LANDMARKS.rightHip];
    const rightWrist = landmarks[GOLF_KEY_LANDMARKS.rightWrist];
    const leftWrist = landmarks[GOLF_KEY_LANDMARKS.leftWrist];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      console.warn('🔧 PLANE FIX: Missing key landmarks for swing plane');
      return;
    }

    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };

    // Calculate spine angle and direction
    const spineVector = {
      x: shoulderCenter.x - hipCenter.x,
      y: shoulderCenter.y - hipCenter.y
    };
    const spineLength = Math.sqrt(spineVector.x * spineVector.x + spineVector.y * spineVector.y);
    const normalizedSpine = {
      x: spineVector.x / spineLength,
      y: spineVector.y / spineLength
    };

    // Draw spine line (backbone)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hipCenter.x * canvasWidth, hipCenter.y * canvasHeight);
    ctx.lineTo(shoulderCenter.x * canvasWidth, shoulderCenter.y * canvasHeight);
    ctx.stroke();

    // Draw extended spine line (posture reference)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(hipCenter.x * canvasWidth, hipCenter.y * canvasHeight);
    // Extend down
    ctx.lineTo(
      (hipCenter.x - normalizedSpine.x * 0.2) * canvasWidth, 
      (hipCenter.y - normalizedSpine.y * 0.2) * canvasHeight
    );
    // Extend up
    ctx.moveTo(shoulderCenter.x * canvasWidth, shoulderCenter.y * canvasHeight);
    ctx.lineTo(
      (shoulderCenter.x + normalizedSpine.x * 0.3) * canvasWidth, 
      (shoulderCenter.y + normalizedSpine.y * 0.3) * canvasHeight
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Calculate perpendicular swing plane
    const perpVector = {
      x: -normalizedSpine.y,
      y: normalizedSpine.x
    };

    // Draw swing plane
    const planeStartX = (hipCenter.x - perpVector.x * 0.5) * canvasWidth;
    const planeStartY = (hipCenter.y - perpVector.y * 0.5) * canvasHeight;
    const planeEndX = (shoulderCenter.x - perpVector.x * 0.5) * canvasWidth;
    const planeEndY = (shoulderCenter.y - perpVector.y * 0.5) * canvasHeight;

    // Draw swing plane surface (semi-transparent)
    ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
    ctx.beginPath();
    ctx.moveTo(planeStartX, planeStartY);
    ctx.lineTo(planeEndX, planeEndY);
    ctx.lineTo(
      (shoulderCenter.x + perpVector.x * 0.5) * canvasWidth, 
      (shoulderCenter.y + perpVector.y * 0.5) * canvasHeight
    );
    ctx.lineTo(
      (hipCenter.x + perpVector.x * 0.5) * canvasWidth, 
      (hipCenter.y + perpVector.y * 0.5) * canvasHeight
    );
    ctx.closePath();
    ctx.fill();

    // Draw main swing plane line
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(shoulderCenter.x * canvasWidth, shoulderCenter.y * canvasHeight);
    ctx.lineTo(hipCenter.x * canvasWidth, hipCenter.y * canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw plane edges
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Top edge
    ctx.moveTo(
      (shoulderCenter.x - perpVector.x * 0.5) * canvasWidth, 
      (shoulderCenter.y - perpVector.y * 0.5) * canvasHeight
    );
    ctx.lineTo(
      (shoulderCenter.x + perpVector.x * 0.5) * canvasWidth, 
      (shoulderCenter.y + perpVector.y * 0.5) * canvasHeight
    );
    // Bottom edge
    ctx.moveTo(
      (hipCenter.x - perpVector.x * 0.5) * canvasWidth, 
      (hipCenter.y - perpVector.y * 0.5) * canvasHeight
    );
    ctx.lineTo(
      (hipCenter.x + perpVector.x * 0.5) * canvasWidth, 
      (hipCenter.y + perpVector.y * 0.5) * canvasHeight
    );
    ctx.stroke();

    // Calculate swing plane angle
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
    
    // Draw swing plane indicator with glow effect
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Swing Plane: ${Math.abs(angle).toFixed(1)}°`, 10, 30);
    ctx.shadowBlur = 0;

    // If wrists are available, draw club shaft
    if (rightWrist && leftWrist) {
      // Draw club shaft (from right wrist to estimated club head position)
      const shaftLength = 0.2; // As a fraction of canvas height
      const clubHeadX = rightWrist.x * canvasWidth;
      const clubHeadY = (rightWrist.y + shaftLength) * canvasHeight;
      
      // Draw club shaft with glow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 5;
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rightWrist.x * canvasWidth, rightWrist.y * canvasHeight);
      ctx.lineTo(clubHeadX, clubHeadY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Draw club head
      ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
      ctx.beginPath();
      ctx.arc(clubHeadX, clubHeadY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Calculate and draw shaft angle
      const shaftAngle = Math.atan2(
        clubHeadY - (rightWrist.y * canvasHeight),
        clubHeadX - (rightWrist.x * canvasWidth)
      ) * (180 / Math.PI);
      
      ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Shaft Angle: ${Math.abs(shaftAngle).toFixed(1)}°`, 10, 50);
    }

    console.log('🔧 PLANE FIX: Swing plane visualized with angle', Math.abs(angle).toFixed(1));
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
      }));

    // Get a more complete club path from ALL poses, not just the last 30
    // This ensures we capture the full swing path
    if (wristPositions.length < 2) {
      console.warn('🔧 CLUB PATH FIX: Not enough wrist positions for club path');
      return;
    }

    console.log('🔧 CLUB PATH FIX: Drawing club path with', wristPositions.length, 'points');

    // Draw full club path with gradient effect
    const gradient = ctx.createLinearGradient(
      wristPositions[0].x, wristPositions[0].y, 
      wristPositions[wristPositions.length - 1].x, wristPositions[wristPositions.length - 1].y
    );
    gradient.addColorStop(0, 'rgba(0, 0, 255, 0.8)');   // Blue at address
    gradient.addColorStop(0.3, 'rgba(0, 255, 255, 0.8)'); // Cyan at backswing
    gradient.addColorStop(0.6, 'rgba(255, 0, 0, 0.8)');   // Red at impact
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0.8)');   // Yellow at finish

    // Draw thick background trail for better visibility
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(wristPositions[0].x, wristPositions[0].y);
    
    for (let i = 1; i < wristPositions.length; i++) {
      ctx.lineTo(wristPositions[i].x, wristPositions[i].y);
    }
    ctx.stroke();

    // Draw colored club path trail
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wristPositions[0].x, wristPositions[0].y);
    
    for (let i = 1; i < wristPositions.length; i++) {
      ctx.lineTo(wristPositions[i].x, wristPositions[i].y);
    }
    ctx.stroke();

    // Draw direction arrows along path
    for (let i = 0; i < wristPositions.length; i += Math.max(1, Math.floor(wristPositions.length / 10))) {
      if (i > 0 && i < wristPositions.length - 1) {
        const prevPos = wristPositions[i - 1];
        const pos = wristPositions[i];
        const angle = Math.atan2(pos.y - prevPos.y, pos.x - prevPos.x);
        
        // Draw arrow
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
    }

    // Draw key positions
    const addressPos = wristPositions[0];
    const topPos = wristPositions[Math.floor(wristPositions.length * 0.3)];
    const impactPos = wristPositions[Math.floor(wristPositions.length * 0.7)];
    const finishPos = wristPositions[wristPositions.length - 1];

    // Draw address point
    ctx.fillStyle = 'rgba(0, 0, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(addressPos.x, addressPos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Address', addressPos.x + 10, addressPos.y);

    // Draw top of swing point
    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(topPos.x, topPos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText('Top', topPos.x + 10, topPos.y);

    // Draw impact point
    ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(impactPos.x, impactPos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText('Impact', impactPos.x + 10, impactPos.y);

    // Draw finish point
    ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(finishPos.x, finishPos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText('Finish', finishPos.x + 10, finishPos.y);

    console.log('🔧 CLUB PATH FIX: Club path drawn successfully');
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
    
    // Add a large visible test rectangle for debugging
    ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
    ctx.fillRect(canvas.width - 200, canvas.height - 100, 150, 80);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('SWING PLANE', canvas.width - 195, canvas.height - 50);

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
      className={`absolute inset-0 w-full h-full pointer-events-none z-21 ${className}`}
      style={{
        imageRendering: 'pixelated',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        ...style
      }}
    />
  );
});

export default SwingPlaneVisualization;

