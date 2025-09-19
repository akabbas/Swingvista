'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

interface EnhancedOverlayRendererProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  poses: PoseResult[];
  phases: EnhancedSwingPhase[];
  overlaySettings: {
    stickFigure: boolean;
    swingPlane: boolean;
    phaseMarkers: boolean;
    clubPath: boolean;
    impactZone: boolean;
    weightTransfer: boolean;
    spineAngle: boolean;
  };
  currentTime: number;
}

export default function EnhancedOverlayRenderer({
  videoRef,
  canvasRef,
  poses,
  phases,
  overlaySettings,
  currentTime
}: EnhancedOverlayRendererProps) {
  const animationFrameRef = useRef<number>();
  const lastRenderTimeRef = useRef<number>(0);

  // Find closest pose for current time
  const findClosestPose = useCallback((time: number): PoseResult | null => {
    if (!poses || poses.length === 0) return null;
    
    return poses.reduce((closest, pose) => {
      const poseTime = (pose as any).timestamp || 0;
      const closestTime = (closest as any).timestamp || 0;
      return Math.abs(poseTime - time) < Math.abs(closestTime - time) ? pose : closest;
    });
  }, [poses]);

  // Main render function with all overlays
  const renderOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !video || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current pose
    const currentPose = findClosestPose(currentTime);
    if (!currentPose || !currentPose.landmarks) return;

    // Save context state
    ctx.save();

    // Render stick figure
    if (overlaySettings.stickFigure) {
      renderStickFigure(ctx, currentPose.landmarks, canvas.width, canvas.height);
    }

    // Render swing plane
    if (overlaySettings.swingPlane) {
      renderSwingPlane(ctx, poses, currentTime, canvas.width, canvas.height);
    }

    // Render phase markers
    if (overlaySettings.phaseMarkers) {
      renderPhaseMarkers(ctx, phases, currentTime, canvas.width, canvas.height);
    }

    // Render club path
    if (overlaySettings.clubPath) {
      renderClubPath(ctx, poses, currentTime, canvas.width, canvas.height);
    }

    // Render impact zone
    if (overlaySettings.impactZone) {
      renderImpactZone(ctx, phases, currentTime, canvas.width, canvas.height);
    }

    // Restore context state
    ctx.restore();
  }, [canvasRef, videoRef, poses, phases, overlaySettings, currentTime, findClosestPose]);

  // Stick figure rendering
  const renderStickFigure = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#00ff00';

    // Draw connections
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
      [25, 27], [26, 28]
    ];

    connections.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
        ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
        ctx.stroke();
      }
    });

    // Draw joints
    landmarks.forEach((landmark) => {
      if (landmark) {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  // Swing plane rendering
  const renderSwingPlane = (ctx: CanvasRenderingContext2D, poses: PoseResult[], currentTime: number, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw plane line
    ctx.beginPath();
    ctx.moveTo(width * 0.3, height * 0.7);
    ctx.lineTo(width * 0.7, height * 0.3);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  // Phase markers rendering
  const renderPhaseMarkers = (ctx: CanvasRenderingContext2D, phases: EnhancedSwingPhase[], currentTime: number, width: number, height: number) => {
    const currentPhase = phases.find(phase => 
      currentTime >= phase.startTime && currentTime <= phase.endTime
    );

    if (currentPhase) {
      // Draw phase name
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(10, 10, 200, 40);
      
      ctx.fillStyle = currentPhase.color || '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(currentPhase.name.toUpperCase(), 20, 35);
    }
  };

  // Club path rendering
  const renderClubPath = (ctx: CanvasRenderingContext2D, poses: PoseResult[], currentTime: number, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.lineWidth = 3;

    // Draw trail
    ctx.beginPath();
    let started = false;
    
    poses.forEach((pose, index) => {
      if ((pose as any).timestamp <= currentTime && pose.landmarks?.[16]) {
        const wrist = pose.landmarks[16];
        const x = wrist.x * width;
        const y = wrist.y * height;
        
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    
    ctx.stroke();
  };

  // Impact zone rendering
  const renderImpactZone = (ctx: CanvasRenderingContext2D, phases: EnhancedSwingPhase[], currentTime: number, width: number, height: number) => {
    const impactPhase = phases.find(phase => 
      phase.name.toLowerCase() === 'impact' || phase.name.toLowerCase() === 'ballcontact'
    );

    if (impactPhase && currentTime >= impactPhase.startTime && currentTime <= impactPhase.endTime) {
      // Draw impact highlight
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.7, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('IMPACT!', width * 0.5 - 40, height * 0.7 + 70);
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      
      // Throttle to 60fps
      if (now - lastRenderTimeRef.current > 16) {
        renderOverlays();
        lastRenderTimeRef.current = now;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderOverlays]);

  // Handle canvas resize
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const resizeCanvas = () => {
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
    };

    video.addEventListener('loadedmetadata', resizeCanvas);
    video.addEventListener('resize', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);

    // Initial resize
    if (video.videoWidth && video.videoHeight) {
      resizeCanvas();
    }

    return () => {
      video.removeEventListener('loadedmetadata', resizeCanvas);
      video.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [videoRef, canvasRef]);

  return null; // This component only handles rendering logic
}