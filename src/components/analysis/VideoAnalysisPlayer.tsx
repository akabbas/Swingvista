'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { SwingMetrics } from '@/lib/golf-metrics';
import { SwingPhase } from '@/lib/swing-phases';

interface VideoAnalysisPlayerProps {
  videoUrl: string;
  poses: PoseResult[];
  metrics: SwingMetrics;
  phases: SwingPhase[];
  className?: string;
}

export default function VideoAnalysisPlayer({ 
  videoUrl, 
  poses, 
  metrics, 
  phases: _phases, 
  className = '' 
}: VideoAnalysisPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);

  // Find the closest pose to current video time
  const findClosestPose = useCallback((time: number): PoseResult | null => {
    if (!poses.length) return null;
    
    const videoTimeMs = time * 1000;
    let closest = poses[0];
    let minDiff = Math.abs((poses[0].timestamp || 0) - videoTimeMs);
    
    for (const pose of poses) {
      const diff = Math.abs((pose.timestamp || 0) - videoTimeMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pose;
      }
    }
    
    return closest;
  }, [poses]);

  // Draw pose overlay on canvas
  const drawPoseOverlay = useCallback((ctx: CanvasRenderingContext2D, pose: PoseResult) => {
    if (!pose.landmarks) return;

    const { width, height } = ctx.canvas;
    
    // Draw pose landmarks
    pose.landmarks.forEach((landmark, index) => {
      if (landmark.visibility && landmark.visibility > 0.5) {
        const x = landmark.x * width;
        const y = landmark.y * height;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
        
        // Draw landmark number
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(index.toString(), x + 6, y - 6);
      }
    });

    // Draw pose connections
    const connections = [
      [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
      [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], [20, 22],
      [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
      [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startLandmark = pose.landmarks[start];
      const endLandmark = pose.landmarks[end];
      
      if (startLandmark?.visibility && startLandmark.visibility > 0.5 &&
          endLandmark?.visibility && endLandmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startLandmark.x * width, startLandmark.y * height);
        ctx.lineTo(endLandmark.x * width, endLandmark.y * height);
        ctx.stroke();
      }
    });
  }, []);

  // Draw swing plane line
  const drawSwingPlane = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Draw swing plane based on metrics
    const planeAngle = metrics.swingPlane?.shaftAngle || 60;
    const centerX = width / 2;
    const centerY = height * 0.7;
    
    const radians = (planeAngle * Math.PI) / 180;
    const lineLength = width * 0.3;
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(centerX - lineLength * Math.cos(radians), centerY - lineLength * Math.sin(radians));
    ctx.lineTo(centerX + lineLength * Math.cos(radians), centerY + lineLength * Math.sin(radians));
    ctx.stroke();
    
    ctx.setLineDash([]);
  }, [metrics]);

  // Draw metrics overlay
  const drawMetricsOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Draw metrics text overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 300, 200);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('Swing Analysis', 20, 35);
    
    ctx.font = '14px Arial';
    ctx.fillText(`Tempo: ${metrics.tempo?.tempoRatio?.toFixed(1) || 'N/A'}:1`, 20, 60);
    ctx.fillText(`Shoulder Turn: ${metrics.rotation?.shoulderTurn?.toFixed(0) || 'N/A'}°`, 20, 80);
    ctx.fillText(`Hip Turn: ${metrics.rotation?.hipTurn?.toFixed(0) || 'N/A'}°`, 20, 100);
    ctx.fillText(`X-Factor: ${metrics.rotation?.xFactor?.toFixed(0) || 'N/A'}°`, 20, 120);
    ctx.fillText(`Overall Score: ${metrics.overallScore || 'N/A'}/100`, 20, 140);
    ctx.fillText(`Grade: ${metrics.letterGrade || 'N/A'}`, 20, 160);
    ctx.fillText(`Plane Angle: ${metrics.swingPlane?.shaftAngle?.toFixed(0) || 'N/A'}°`, 20, 180);
  }, [metrics]);

  // Update canvas when video time changes
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (showOverlays) {
      // Draw pose overlay
      const closestPose = findClosestPose(currentTime);
      if (closestPose) {
        drawPoseOverlay(ctx, closestPose);
      }
      
      // Draw swing plane
      drawSwingPlane(ctx);
      
      // Draw metrics overlay
      drawMetricsOverlay(ctx);
    }
  }, [currentTime, showOverlays, findClosestPose, drawPoseOverlay, drawSwingPlane, drawMetricsOverlay]);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
    }
  }, []);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  // Resize canvas when video loads
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto rounded-lg"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showOverlays 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {showOverlays ? '👁️ Hide Overlays' : '👁️ Show Overlays'}
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Time: {currentTime.toFixed(1)}s
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2">
        <input
          type="range"
          min="0"
          max={videoRef.current?.duration || 0}
          value={currentTime}
          onChange={(e) => {
            const video = videoRef.current;
            if (video) {
              video.currentTime = parseFloat(e.target.value);
            }
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}
