'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export type OverlayMode = 'clean' | 'analysis' | 'technical';

export interface OverlaySystemProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poses: PoseResult[];
  phases: EnhancedSwingPhase[];
  currentTime: number;
  overlayMode: OverlayMode;
  isPlaying: boolean;
  className?: string;
}

export interface OverlayConfig {
  landmarks: boolean;
  skeleton: boolean;
  phaseIndicators: boolean;
  metrics: boolean;
  swingPath: boolean;
  forceVectors: boolean;
  rotationArcs: boolean;
  keyPoints: boolean;
}

const OVERLAY_PRESETS: Record<OverlayMode, OverlayConfig> = {
  clean: {
    landmarks: false,
    skeleton: false,
    phaseIndicators: false,
    metrics: false,
    swingPath: false,
    forceVectors: false,
    rotationArcs: false,
    keyPoints: false,
  },
  analysis: {
    landmarks: false,
    skeleton: false,
    phaseIndicators: true,
    metrics: true,
    swingPath: true,
    forceVectors: false,
    rotationArcs: false,
    keyPoints: true,
  },
  technical: {
    landmarks: true,
    skeleton: true,
    phaseIndicators: true,
    metrics: true,
    swingPath: true,
    forceVectors: true,
    rotationArcs: true,
    keyPoints: true,
  },
};

export default function OverlaySystem({
  canvasRef,
  videoRef,
  poses,
  phases,
  currentTime,
  overlayMode,
  isPlaying,
  className = ''
}: OverlaySystemProps) {
  const config = OVERLAY_PRESETS[overlayMode];
  const lastRenderTime = useRef<number>(0);
  const renderThrottle = 16; // ~60fps

  // Throttle overlay updates during playback for performance
  const shouldRender = useCallback(() => {
    const now = Date.now();
    if (isPlaying && now - lastRenderTime.current < renderThrottle) {
      return false;
    }
    lastRenderTime.current = now;
    return true;
  }, [isPlaying]);

  // Draw minimal overlays for Analysis View
  const drawMinimalOverlays = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Phase indicators (top and bottom bars)
    if (config.phaseIndicators) {
      const currentPhase = phases.find(phase => 
        currentTime >= phase.startTime && currentTime <= phase.endTime
      );
      
      if (currentPhase) {
        // Top phase bar
        ctx.fillStyle = `${currentPhase.color}80`;
        ctx.fillRect(0, 0, width, 8);
        
        // Bottom phase bar
        ctx.fillRect(0, height - 8, width, 8);
        
        // Phase name in corner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 200, 40);
        ctx.fillStyle = currentPhase.color;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(currentPhase.name.toUpperCase(), 20, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`Grade: ${currentPhase.grade}`, 20, 45);
      }
    }

    // Key position markers
    if (config.keyPoints) {
      const closestPose = findClosestPose(currentTime);
      if (closestPose?.landmarks) {
        const keyLandmarks = [0, 11, 12, 23, 24]; // Head, shoulders, hips
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        keyLandmarks.forEach(index => {
          const landmark = closestPose.landmarks[index];
          if (landmark && landmark.visibility && landmark.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(landmark.x * width, landmark.y * height, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }
    }

    // Swing path tracer
    if (config.swingPath) {
      drawSwingPath(ctx);
    }

    // Basic metrics display
    if (config.metrics) {
      drawBasicMetrics(ctx);
    }
  }, [config, phases, currentTime, poses]);

  // Draw technical overlays for Technical View
  const drawTechnicalOverlays = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Draw all landmarks
    if (config.landmarks) {
      const closestPose = findClosestPose(currentTime);
      if (closestPose?.landmarks) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        closestPose.landmarks.forEach((landmark, index) => {
          if (landmark.visibility && landmark.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Landmark numbers for debugging
            if (overlayMode === 'technical') {
              ctx.fillStyle = '#ffffff';
              ctx.font = '10px Arial';
              ctx.fillText(index.toString(), landmark.x * width + 5, landmark.y * height - 5);
              ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
            }
          }
        });
      }
    }

    // Draw skeleton
    if (config.skeleton) {
      const closestPose = findClosestPose(currentTime);
      if (closestPose?.landmarks) {
        drawSkeleton(ctx, closestPose.landmarks);
      }
    }

    // Draw force vectors
    if (config.forceVectors) {
      drawForceVectors(ctx);
    }

    // Draw rotation arcs
    if (config.rotationArcs) {
      drawRotationArcs(ctx);
    }

    // Include minimal overlays too
    drawMinimalOverlays(ctx);
  }, [config, currentTime, poses, phases, overlayMode, drawMinimalOverlays]);

  // Helper function to find closest pose
  const findClosestPose = useCallback((time: number): PoseResult | null => {
    if (!poses || poses.length === 0) return null;
    
    const firstPose = poses[0];
    if (!firstPose || firstPose.timestamp === undefined) return null;
    
    let closest = firstPose;
    let minDiff = Math.abs(firstPose.timestamp - time);
    
    for (const pose of poses) {
      if (pose.timestamp === undefined) continue;
      const diff = Math.abs(pose.timestamp - time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pose;
      }
    }
    
    return closest;
  }, [poses]);

  // Draw skeleton connections
  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    const { width, height } = ctx.canvas;
    
    const connections = [
      // Head
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      // Torso
      [11, 12], [11, 23], [12, 24], [23, 24],
      // Arms
      [11, 13], [13, 15], [12, 14], [14, 16],
      // Legs
      [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 3;
    
    connections.forEach(([a, b]) => {
      const pa = landmarks[a];
      const pb = landmarks[b];
      if (pa && pb && pa.visibility > 0.5 && pb.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(pa.x * width, pa.y * height);
        ctx.lineTo(pb.x * width, pb.y * height);
        ctx.stroke();
      }
    });
  }, []);

  // Draw swing path
  const drawSwingPath = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Draw a simple swing path based on hand positions
    const handPositions = poses
      .filter(pose => pose.landmarks && pose.landmarks[15]) // Right wrist
      .map(pose => ({
        x: pose.landmarks[15].x * width,
        y: pose.landmarks[15].y * height,
        timestamp: pose.timestamp
      }))
      .slice(-20); // Last 20 positions for performance

    if (handPositions.length > 1) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(handPositions[0].x, handPositions[0].y);
      
      for (let i = 1; i < handPositions.length; i++) {
        ctx.lineTo(handPositions[i].x, handPositions[i].y);
      }
      ctx.stroke();
    }
  }, [poses]);

  // Draw force vectors
  const drawForceVectors = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const closestPose = findClosestPose(currentTime);
    
    if (closestPose?.landmarks) {
      // Draw simplified force vectors from key points
      const keyPoints = [11, 12, 23, 24]; // Shoulders and hips
      
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      
      keyPoints.forEach(index => {
        const landmark = closestPose.landmarks[index];
        if (landmark && landmark.visibility && landmark.visibility > 0.5) {
          // Draw a small arrow indicating movement direction
          const x = landmark.x * width;
          const y = landmark.y * height;
          const length = 20;
          
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + length, y - length);
          ctx.moveTo(x, y);
          ctx.lineTo(x - length, y - length);
          ctx.stroke();
        }
      });
    }
  }, [currentTime, poses]);

  // Draw rotation arcs
  const drawRotationArcs = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const closestPose = findClosestPose(currentTime);
    
    if (closestPose?.landmarks) {
      // Draw rotation arcs for shoulders and hips
      const shoulderCenter = {
        x: (closestPose.landmarks[11].x + closestPose.landmarks[12].x) / 2 * width,
        y: (closestPose.landmarks[11].y + closestPose.landmarks[12].y) / 2 * height
      };
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shoulderCenter.x, shoulderCenter.y, 30, 0, Math.PI);
      ctx.stroke();
    }
  }, [currentTime, poses]);

  // Draw basic metrics
  const drawBasicMetrics = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Position metrics in bottom right
    const metricsX = width - 200;
    const metricsY = height - 100;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(metricsX, metricsY, 190, 90);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Swing Metrics', metricsX + 10, metricsY + 20);
    
    ctx.font = '12px Arial';
    ctx.fillText(`Poses: ${poses.length}`, metricsX + 10, metricsY + 40);
    ctx.fillText(`Phases: ${phases.length}`, metricsX + 10, metricsY + 55);
    ctx.fillText(`Time: ${(currentTime / 1000).toFixed(1)}s`, metricsX + 10, metricsY + 70);
  }, [poses.length, phases.length, currentTime]);

  // Main render function
  const renderOverlays = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { videoWidth, videoHeight } = videoRef.current;
    if (videoWidth === 0 || videoHeight === 0) return;

    // Only render if we should (throttling)
    if (!shouldRender()) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render based on overlay mode
    if (overlayMode === 'clean') {
      return; // No overlays
    } else if (overlayMode === 'analysis') {
      drawMinimalOverlays(ctx);
    } else if (overlayMode === 'technical') {
      drawTechnicalOverlays(ctx);
    }
  }, [canvasRef, videoRef, overlayMode, shouldRender, drawMinimalOverlays, drawTechnicalOverlays]);

  // Render overlays when dependencies change
  useEffect(() => {
    renderOverlays();
  }, [renderOverlays]);

  return null; // This component only handles rendering, no UI
}

export { OVERLAY_PRESETS };
