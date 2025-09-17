'use client';

import React, { useRef, useEffect, useCallback, memo } from 'react';
import type { PoseResult, PoseLandmark } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface StickFigureOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  poses: PoseResult[];
  currentTime?: number;
  phases?: EnhancedSwingPhase[];
  showSkeleton?: boolean;
  showLandmarks?: boolean;
  showSwingPlane?: boolean;
  showPhaseMarkers?: boolean;
  showMetrics?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// MediaPipe Pose landmark connections for stick figure
const POSE_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7], // Left eye
  [0, 4], [4, 5], [5, 6], [6, 8], // Right eye
  [9, 10], // Mouth
  
  // Torso
  [11, 12], // Shoulders
  [11, 23], [12, 24], // Shoulder to hip
  [23, 24], // Hips
  
  // Arms
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  
  // Legs
  [23, 25], [25, 27], // Left leg
  [24, 26], [26, 28], // Right leg
  
  // Feet
  [27, 29], [29, 31], [31, 27], // Left foot
  [28, 30], [30, 32], [32, 28], // Right foot
];

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

const StickFigureOverlay = memo(function StickFigureOverlay({
  videoRef,
  poses,
  currentTime = 0,
  phases = [],
  showSkeleton = true,
  showLandmarks = true,
  showSwingPlane = true,
  showPhaseMarkers = true,
  showMetrics = true,
  className = '',
  style = {}
}: StickFigureOverlayProps) {
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

  // Draw stick figure skeleton
  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) return;

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end && 
          start.visibility && start.visibility > 0.5 && 
          end.visibility && end.visibility > 0.5) {
        
        ctx.beginPath();
        ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight);
        ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight);
        ctx.stroke();
      }
    });
  }, []);

  // Draw individual landmarks
  const drawLandmarks = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) return;

    landmarks.forEach((landmark, index) => {
      if (landmark.visibility && landmark.visibility > 0.5) {
        const x = landmark.x * canvasWidth;
        const y = landmark.y * canvasHeight;
        
        // Different colors for different landmark types
        let color = 'rgba(0, 255, 0, 0.9)';
        let size = 4;
        
        if (index === GOLF_KEY_LANDMARKS.head) {
          color = 'rgba(255, 100, 100, 0.9)';
          size = 6;
        } else if (index === GOLF_KEY_LANDMARKS.leftWrist || index === GOLF_KEY_LANDMARKS.rightWrist) {
          color = 'rgba(255, 255, 0, 0.9)';
          size = 5;
        } else if (index === GOLF_KEY_LANDMARKS.leftShoulder || index === GOLF_KEY_LANDMARKS.rightShoulder) {
          color = 'rgba(0, 200, 255, 0.9)';
          size = 5;
        } else if (index === GOLF_KEY_LANDMARKS.leftHip || index === GOLF_KEY_LANDMARKS.rightHip) {
          color = 'rgba(255, 150, 0, 0.9)';
          size = 5;
        }
        
        // Draw landmark with glow effect
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
  }, []);

  // Draw swing plane visualization
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

    // Draw swing plane line
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
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
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Plane: ${Math.abs(angle).toFixed(1)}°`, 10, 30);
  }, []);

  // Draw phase markers
  const drawPhaseMarkers = useCallback((ctx: CanvasRenderingContext2D, currentPhase: EnhancedSwingPhase | null, canvasWidth: number, canvasHeight: number) => {
    if (!currentPhase) return;

    // Phase indicator bar at top
    ctx.fillStyle = `${currentPhase.color}80`;
    ctx.fillRect(0, 0, canvasWidth, 8);
    ctx.fillRect(0, canvasHeight - 8, canvasWidth, 8);

    // Phase name and grade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 200, 50);
    ctx.fillStyle = currentPhase.color;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(currentPhase.name.toUpperCase(), 20, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`Grade: ${currentPhase.grade}`, 20, 45);
    ctx.fillText(`Confidence: ${(currentPhase.confidence * 100).toFixed(0)}%`, 20, 60);
  }, []);

  // Draw golf-specific metrics
  const drawMetrics = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) return;

    const rightWrist = landmarks[GOLF_KEY_LANDMARKS.rightWrist];
    const leftWrist = landmarks[GOLF_KEY_LANDMARKS.leftWrist];
    const leftShoulder = landmarks[GOLF_KEY_LANDMARKS.leftShoulder];
    const rightShoulder = landmarks[GOLF_KEY_LANDMARKS.rightShoulder];

    if (!rightWrist || !leftWrist || !leftShoulder || !rightShoulder) return;

    // Calculate basic metrics
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * (180 / Math.PI);

    const wristDistance = Math.sqrt(
      Math.pow(rightWrist.x - leftWrist.x, 2) + 
      Math.pow(rightWrist.y - leftWrist.y, 2)
    );

    // Draw metrics in bottom right
    const metricsX = canvasWidth - 200;
    const metricsY = canvasHeight - 100;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(metricsX, metricsY, 190, 90);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Live Metrics', metricsX + 10, metricsY + 20);
    
    ctx.font = '12px Arial';
    ctx.fillText(`Shoulder Angle: ${Math.abs(shoulderAngle).toFixed(1)}°`, metricsX + 10, metricsY + 40);
    ctx.fillText(`Wrist Distance: ${(wristDistance * 100).toFixed(1)}`, metricsX + 10, metricsY + 55);
    ctx.fillText(`Poses: ${poses.length}`, metricsX + 10, metricsY + 70);
  }, [poses.length]);

  // Draw apex point (top of backswing)
  const drawApexPoint = useCallback((ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], canvasWidth: number, canvasHeight: number) => {
    if (!landmarks || landmarks.length === 0) return;

    const rightWrist = landmarks[GOLF_KEY_LANDMARKS.rightWrist];
    if (!rightWrist) return;

    // Draw apex point marker
    const x = rightWrist.x * canvasWidth;
    const y = rightWrist.y * canvasHeight;
    
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Main render function
  const render = useCallback(() => {
    console.log('🔧 OVERLAY FIX: Render function called with poses:', poses.length, 'currentTime:', currentTime);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) {
      console.error('🔧 OVERLAY FIX: Canvas or video reference is null');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('🔧 OVERLAY FIX: Unable to get canvas context');
      return;
    }

    // Set canvas dimensions to match video
    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    
    if (videoWidth && videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      console.log('🔧 OVERLAY FIX: Canvas dimensions set to', videoWidth, 'x', videoHeight);
    } else {
      console.warn('🔧 OVERLAY FIX: Unable to determine video dimensions');
      // Force dimensions if video dimensions are not available
      canvas.width = video.clientWidth || 640;
      canvas.height = video.clientHeight || 360;
      console.log('🔧 OVERLAY FIX: Forced canvas dimensions to', canvas.width, 'x', canvas.height);
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find current pose and phase
    const currentPose = findClosestPose(currentTime);
    const currentPhase = getCurrentPhase(currentTime);

    console.log('🔧 OVERLAY FIX: Current pose found:', !!currentPose, 'landmarks:', currentPose?.landmarks?.length);

    if (!currentPose || !currentPose.landmarks) {
      console.warn('🔧 OVERLAY FIX: No valid pose found at time', currentTime, 'poses available:', poses.length);
      // Draw a test rectangle even without pose data to confirm canvas is working
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.fillRect(10, 10, 50, 50);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('NO POSE', 15, 35);
      return;
    }

    const landmarks = currentPose.landmarks;
    console.log('🔧 OVERLAY FIX: Drawing overlays with', landmarks.length, 'landmarks at time', currentTime);

    // Draw overlays based on props
    if (showSkeleton) {
      drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
      console.log('🔧 OVERLAY FIX: Skeleton drawn');
    }

    if (showLandmarks) {
      drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
      console.log('🔧 OVERLAY FIX: Landmarks drawn');
    }

    if (showSwingPlane) {
      drawSwingPlane(ctx, landmarks, canvas.width, canvas.height);
      console.log('🔧 OVERLAY FIX: Swing plane drawn');
    }

    if (showPhaseMarkers && currentPhase) {
      drawPhaseMarkers(ctx, currentPhase, canvas.width, canvas.height);
      console.log('🔧 OVERLAY FIX: Phase markers drawn for phase', currentPhase.name);
    }

    if (showMetrics) {
      drawMetrics(ctx, landmarks, canvas.width, canvas.height);
      console.log('🔧 OVERLAY FIX: Metrics drawn');
    }

    // Draw apex point if we're in the top phase
    if (currentPhase?.name === 'top') {
      drawApexPoint(ctx, landmarks, canvas.width, canvas.height);
      console.log('🔧 OVERLAY FIX: Apex point drawn for top phase');
    }
    
    // Add visual debug indicator to confirm overlay is rendering
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.fillRect(0, 0, 20, 20);
    
    // Add a large visible test rectangle
    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.fillRect(canvas.width - 100, canvas.height - 100, 80, 80);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('STICK FIGURE', canvas.width - 95, canvas.height - 50);

  }, [
    currentTime, 
    findClosestPose, 
    getCurrentPhase, 
    showSkeleton, 
    showLandmarks, 
    showSwingPlane, 
    showPhaseMarkers, 
    showMetrics,
    drawSkeleton,
    drawLandmarks,
    drawSwingPlane,
    drawPhaseMarkers,
    drawMetrics,
    drawApexPoint
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
      className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${className}`}
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

export default StickFigureOverlay;

