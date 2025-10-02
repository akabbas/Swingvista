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
  phases, 
  className = '' 
}: VideoAnalysisPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Video debugging and error handling
  useEffect(() => {
    console.log('VideoAnalysisPlayer mounted with:', {
      videoUrl: videoUrl?.substring(0, 50) + '...',
      posesCount: poses?.length || 0,
      metricsKeys: Object.keys(metrics || {}),
      phasesCount: phases?.length || 0
    });
  }, [videoUrl, poses, metrics, phases]);

  // Video event handlers
  const handleVideoLoad = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      console.log('Video loaded successfully:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState
      });
      setVideoLoaded(true);
      setVideoError(null);
    }
  }, []);

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    console.error('Video error:', {
      error: error?.code,
      message: error?.message,
      networkState: video.networkState,
      readyState: video.readyState,
      src: video.src
    });
    
    let errorMessage = 'Unknown video error';
    if (error) {
      switch (error.code) {
        case 1: errorMessage = 'Video loading aborted'; break;
        case 2: errorMessage = 'Network error while loading video'; break;
        case 3: errorMessage = 'Video decoding error'; break;
        case 4: errorMessage = 'Video format not supported'; break;
      }
    }
    setVideoError(errorMessage);
    setVideoLoaded(false);
  }, []);

  // Find the closest pose to current video time
  const findClosestPose = useCallback((time: number): PoseResult | null => {
    if (!poses.length) {
      console.log('No poses available for video analysis');
      return null;
    }
    
    const videoTimeMs = time * 1000;
    let closest = poses[0];
    let minDiff = Math.abs((poses[0].timestamp || 0) - videoTimeMs);
    
    console.log('Finding closest pose for time:', time, 'ms:', videoTimeMs, 'poses available:', poses.length);
    
    for (const pose of poses) {
      const diff = Math.abs((pose.timestamp || 0) - videoTimeMs);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pose;
      }
    }
    
    console.log('Closest pose found at timestamp:', closest.timestamp, 'diff:', minDiff, 'ms');
    return closest;
  }, [poses]);

  // Draw pose overlay on canvas - enhanced stick figure
  const drawPoseOverlay = useCallback((ctx: CanvasRenderingContext2D, pose: PoseResult) => {
    if (!pose.landmarks) return;

    const { width, height } = ctx.canvas;
    const points = pose.landmarks;
    
    // Helper function to draw connections
    const connect = (a: number, b: number, color = 'rgba(0, 255, 0, 0.8)', width = 3) => {
      const pa = points[a];
      const pb = points[b];
      if (!pa || !pb || (pa.visibility && pa.visibility < 0.1) || (pb.visibility && pb.visibility < 0.1)) return;
      
      ctx.beginPath();
      ctx.moveTo(pa.x * width, pa.y * height);
      ctx.lineTo(pb.x * width, pb.y * height);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    // Helper function to draw joints
    const drawJoint = (index: number, color = 'rgba(0, 255, 0, 0.9)', size = 4) => {
      const p = points[index];
      if (!p || (p.visibility && p.visibility < 0.1)) return;
      
      const x = p.x * width;
      const y = p.y * height;
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, size + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
      
      // Main joint
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    // Draw body skeleton
    // Head and neck
    drawJoint(0, 'rgba(255, 100, 100, 0.9)', 5); // Nose
    connect(0, 1, 'rgba(255, 100, 100, 0.8)', 2); // Nose to left eye
    connect(0, 2, 'rgba(255, 100, 100, 0.8)', 2); // Nose to right eye
    connect(1, 2, 'rgba(255, 100, 100, 0.8)', 2); // Eyes
    connect(1, 3, 'rgba(255, 100, 100, 0.8)', 2); // Left eye to ear
    connect(2, 4, 'rgba(255, 100, 100, 0.8)', 2); // Right eye to ear

    // Shoulders and arms
    drawJoint(11, 'rgba(0, 200, 255, 0.9)', 6); // Left shoulder
    drawJoint(12, 'rgba(0, 200, 255, 0.9)', 6); // Right shoulder
    connect(11, 12, 'rgba(0, 200, 255, 0.8)', 4); // Shoulders
    
    // Arms
    connect(11, 13, 'rgba(0, 200, 255, 0.8)', 3); // Left shoulder to elbow
    connect(13, 15, 'rgba(0, 200, 255, 0.8)', 3); // Left elbow to wrist
    connect(12, 14, 'rgba(0, 200, 255, 0.8)', 3); // Right shoulder to elbow
    connect(14, 16, 'rgba(0, 200, 255, 0.8)', 3); // Right elbow to wrist
    
    // Hands
    drawJoint(15, 'rgba(255, 255, 0, 0.9)', 4); // Left wrist
    drawJoint(16, 'rgba(255, 255, 0, 0.9)', 4); // Right wrist

    // Torso
    drawJoint(23, 'rgba(255, 150, 0, 0.9)', 6); // Left hip
    drawJoint(24, 'rgba(255, 150, 0, 0.9)', 6); // Right hip
    
    // Torso connections
    connect(11, 23, 'rgba(0, 200, 255, 0.8)', 4); // Left shoulder to hip
    connect(12, 24, 'rgba(0, 200, 255, 0.8)', 4); // Right shoulder to hip
    connect(23, 24, 'rgba(255, 150, 0, 0.8)', 4); // Hips

    // Legs
    drawJoint(25, 'rgba(255, 150, 0, 0.9)', 5); // Left knee
    drawJoint(26, 'rgba(255, 150, 0, 0.9)', 5); // Right knee
    drawJoint(27, 'rgba(255, 150, 0, 0.9)', 4); // Left ankle
    drawJoint(28, 'rgba(255, 150, 0, 0.9)', 4); // Right ankle
    
    connect(23, 25, 'rgba(255, 150, 0, 0.8)', 3); // Left hip to knee
    connect(25, 27, 'rgba(255, 150, 0, 0.8)', 3); // Left knee to ankle
    connect(24, 26, 'rgba(255, 150, 0, 0.8)', 3); // Right hip to knee
    connect(26, 28, 'rgba(255, 150, 0, 0.8)', 3); // Right knee to ankle

    // Draw swing plane line
    if (points[11] && points[12] && points[23] && points[24]) {
      const leftShoulder = points[11];
      const rightShoulder = points[12];
      const leftHip = points[23];
      const rightHip = points[24];
      
      const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      const hipCenterX = (leftHip.x + rightHip.x) / 2;
      const hipCenterY = (leftHip.y + rightHip.y) / 2;
      
      // Draw swing plane line
      ctx.beginPath();
      ctx.moveTo(shoulderCenterX * width, shoulderCenterY * height);
      ctx.lineTo(hipCenterX * width, hipCenterY * height);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
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

  // Draw current swing phase overlay
  const drawPhaseOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    if (!phases || phases.length === 0) return;
    
    // Find current phase based on video time
    const currentPhase = phases.find(phase => 
      currentTime >= phase.startTime && currentTime <= phase.endTime
    );
    
    if (!currentPhase) return;
    
    // Draw phase indicator
    const phaseColors = {
      address: '#3B82F6',
      backswing: '#10B981', 
      top: '#F59E0B',
      downswing: '#EF4444',
      impact: '#DC2626',
      'follow-through': '#8B5CF6'
    };
    
    const phaseColor = phaseColors[currentPhase.name] || '#6B7280';
    const phaseProgress = (currentTime - currentPhase.startTime) / (currentPhase.endTime - currentPhase.startTime);
    
    // Draw phase background
    ctx.fillStyle = `${phaseColor}20`;
    ctx.fillRect(0, 0, width, height);
    
    // Draw phase name and progress
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(20, 20, 400, 120);
    
    ctx.fillStyle = phaseColor;
    ctx.font = 'bold 24px Arial';
    ctx.fillText(currentPhase.name.toUpperCase(), 30, 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(currentPhase.description, 30, 75);
    
    // Draw progress bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(30, 90, 360, 8);
    
    ctx.fillStyle = phaseColor;
    ctx.fillRect(30, 90, 360 * phaseProgress, 8);
    
    // Draw phase timing
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    const timeText = `${(currentPhase.startTime / 1000).toFixed(1)}s - ${(currentPhase.endTime / 1000).toFixed(1)}s`;
    ctx.fillText(timeText, 30, 110);
    
    // Draw confidence score
    ctx.fillText(`Confidence: ${(currentPhase.confidence * 100).toFixed(0)}%`, 200, 110);
  }, [phases, currentTime]);

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
      // Draw current swing phase overlay first (background)
      drawPhaseOverlay(ctx);
      
      // Draw pose overlay
      const closestPose = findClosestPose(currentTime);
      console.log('VideoAnalysisPlayer - Current time:', currentTime, 'Closest pose:', closestPose ? 'found' : 'none');
      if (closestPose) {
        console.log('Drawing pose overlay with', closestPose.landmarks?.length || 0, 'landmarks');
        drawPoseOverlay(ctx, closestPose);
      } else {
        console.log('No pose found for current time');
      }
      
      // Draw swing plane
      drawSwingPlane(ctx);
      
      // Draw metrics overlay
      drawMetricsOverlay(ctx);
    }
  }, [currentTime, showOverlays, findClosestPose, drawPhaseOverlay, drawPoseOverlay, drawSwingPlane, drawMetricsOverlay]);

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
      {videoError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-medium mb-2">Video Error</h3>
          <p className="text-red-700 text-sm">{videoError}</p>
          <p className="text-red-600 text-xs mt-2">Video URL: {videoUrl?.substring(0, 100)}...</p>
        </div>
      )}
      
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto rounded-lg"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
          preload="metadata"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading video...</p>
            </div>
          </div>
        )}
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
      
      {/* Phase Timeline */}
      {phases && phases.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Swing Phase Timeline</h3>
          <div className="flex flex-wrap gap-2">
            {phases.map((phase, index) => {
              const isActive = currentTime >= phase.startTime && currentTime <= phase.endTime;
              const phaseColors = {
                address: 'bg-blue-500',
                backswing: 'bg-green-500', 
                top: 'bg-yellow-500',
                downswing: 'bg-red-500',
                impact: 'bg-red-700',
                'follow-through': 'bg-purple-500'
              };
              
              return (
                <div
                  key={phase.name}
                  className={`px-3 py-2 rounded-lg text-white text-sm font-medium transition-all ${
                    phaseColors[phase.name] || 'bg-gray-500'
                  } ${isActive ? 'ring-2 ring-white ring-opacity-50' : 'opacity-70'}`}
                >
                  <div className="font-bold">{phase.name.toUpperCase()}</div>
                  <div className="text-xs opacity-90">
                    {(phase.startTime / 1000).toFixed(1)}s - {(phase.endTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs opacity-75">
                    {(phase.duration / 1000).toFixed(1)}s • {(phase.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
