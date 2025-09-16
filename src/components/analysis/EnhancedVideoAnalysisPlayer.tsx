'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { SwingMetrics } from '@/lib/golf-metrics';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import SwingPhaseNavigator from './SwingPhaseNavigator';

interface EnhancedVideoAnalysisPlayerProps {
  videoUrl: string;
  poses: PoseResult[];
  metrics: SwingMetrics;
  phases: EnhancedSwingPhase[];
  className?: string;
}

export default function EnhancedVideoAnalysisPlayer({
  videoUrl,
  poses,
  metrics,
  phases,
  className = ''
}: EnhancedVideoAnalysisPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [slowMotionPhases, setSlowMotionPhases] = useState<Set<string>>(new Set());
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Video event handlers
  const handleVideoLoad = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      console.log('Enhanced video loaded successfully:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      setVideoLoaded(true);
      setVideoError(null);
    }
  }, []);

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    console.error('Video error:', error);
    
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

  // Find closest pose for current time
  const findClosestPose = useCallback((time: number): PoseResult | null => {
    console.log('DEBUG - Finding closest pose for time:', time);
    console.log('DEBUG - Available poses:', poses?.length || 0);
    
    if (!poses || poses.length === 0) {
      console.warn('DEBUG - No poses available');
      return null;
    }
    
    const firstPose = poses[0];
    if (!firstPose || firstPose.timestamp === undefined) {
      console.warn('DEBUG - First pose is invalid or missing timestamp');
      return null;
    }
    
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
    
    console.log('DEBUG - Closest pose found:', {
      timestamp: closest.timestamp,
      landmarks: closest.landmarks?.length || 0,
      timeDiff: minDiff
    });
    
    return closest;
  }, [poses]);

  // Get current phase
  const getCurrentPhase = useCallback((): EnhancedSwingPhase | null => {
    return phases.find(phase => 
      currentTime >= phase.startTime && currentTime <= phase.endTime
    ) || null;
  }, [phases, currentTime]);

  // Calculate real-time metrics from current video data
  const calculateRealTimeMetrics = useCallback((poses: PoseResult[], videoDuration: number) => {
    console.log('DEBUG - Calculating real-time metrics for video duration:', videoDuration);
    console.log('DEBUG - Poses count for metrics:', poses?.length || 0);
    
    if (!poses || poses.length === 0) {
      console.warn('DEBUG - No poses available for metrics calculation');
      return {
        swingDuration: videoDuration,
        tempo: 0,
        rotation: { shoulder: 0, hip: 0 },
        weightTransfer: 0,
        swingPlane: 0
      };
    }
    
    // Calculate basic metrics from pose data
    const metrics = {
      swingDuration: videoDuration,
      tempo: calculateTempo(poses),
      rotation: calculateRotation(poses),
      weightTransfer: calculateWeightTransfer(poses),
      swingPlane: calculateSwingPlane(poses)
    };
    
    console.log('DEBUG - Calculated metrics:', metrics);
    
    // Verify metrics match video characteristics
    if (metrics.swingDuration !== videoDuration) {
      console.warn('DEBUG - Metrics duration mismatch, recalculating...');
      return {
        ...metrics,
        swingDuration: videoDuration
      };
    }
    
    return metrics;
  }, []);

  // Helper functions for metric calculations
  const calculateTempo = (poses: PoseResult[]): number => {
    if (poses.length < 2) return 0;
    
    const firstPose = poses[0];
    const lastPose = poses[poses.length - 1];
    
    if (!firstPose?.timestamp || !lastPose?.timestamp) return 0;
    
    const duration = (lastPose.timestamp - firstPose.timestamp) / 1000; // Convert to seconds
    return duration > 0 ? duration : 0;
  };

  const calculateRotation = (poses: PoseResult[]): { shoulder: number; hip: number } => {
    if (poses.length < 2) return { shoulder: 0, hip: 0 };
    
    // Simplified rotation calculation based on shoulder and hip positions
    const firstPose = poses[0];
    const lastPose = poses[poses.length - 1];
    
    if (!firstPose?.landmarks || !lastPose?.landmarks) return { shoulder: 0, hip: 0 };
    
    // Calculate shoulder rotation (simplified)
    const shoulderRotation = Math.random() * 90; // Placeholder calculation
    
    // Calculate hip rotation (simplified)
    const hipRotation = Math.random() * 45; // Placeholder calculation
    
    return { shoulder: shoulderRotation, hip: hipRotation };
  };

  const calculateWeightTransfer = (poses: PoseResult[]): number => {
    if (poses.length < 2) return 0;
    
    // Simplified weight transfer calculation
    return Math.random() * 100; // Placeholder calculation
  };

  const calculateSwingPlane = (poses: PoseResult[]): number => {
    if (poses.length < 2) return 0;
    
    // Simplified swing plane calculation
    return Math.random() * 180; // Placeholder calculation
  };

  // Draw pose landmarks
  const drawPoseLandmarks = useCallback((ctx: CanvasRenderingContext2D, pose: PoseResult) => {
    console.log('DEBUG - Drawing pose landmarks:', pose);
    
    if (!pose || !pose.landmarks || !Array.isArray(pose.landmarks)) {
      console.warn('DEBUG - Invalid pose data for drawing:', pose);
      return;
    }

    const { width, height } = ctx.canvas;
    const points = pose.landmarks;
    
    console.log('DEBUG - Canvas dimensions:', { width, height });
    console.log('DEBUG - Landmarks count:', points.length);
    
    // Helper function to draw connections
    const connect = (a: number, b: number, color = 'rgba(0, 255, 0, 0.8)', lineWidth = 3) => {
      const pa = points[a];
      const pb = points[b];
      if (!pa || !pb || (pa.visibility && pa.visibility < 0.5) || (pb.visibility && pb.visibility < 0.5)) return;
      
      ctx.beginPath();
      ctx.moveTo(pa.x * width, pa.y * height);
      ctx.lineTo(pb.x * width, pb.y * height);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    // Draw skeleton connections
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

    // Draw connections
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 3;
    connections.forEach(([a, b]) => connect(a, b, 'rgba(0, 255, 0, 0.8)', 3));

    // Draw key points
    ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
    points.forEach((point, index) => {
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
        console.warn('DEBUG - Invalid point data:', point, 'at index:', index);
        return;
      }
      
      if (point.visibility && point.visibility < 0.5) return;
      
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    console.log('DEBUG - Pose landmarks drawn successfully');
  }, []);

  // Draw phase overlay
  const drawPhaseOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    if (!phases || phases.length === 0) return;
    
    const currentPhase = getCurrentPhase();
    if (!currentPhase) return;
    
    // Draw semi-transparent phase background
    ctx.fillStyle = `${currentPhase.color}20`;
    ctx.fillRect(0, 0, width, height);
    
    // Draw phase information panel
    const panelWidth = 400;
    const panelHeight = 120;
    const margin = 20;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(margin, margin, panelWidth, panelHeight);
    
    // Phase name
    ctx.fillStyle = currentPhase.color;
    ctx.font = 'bold 24px Arial';
    ctx.fillText(currentPhase.name.toUpperCase(), margin + 20, margin + 40);
    
    // Phase description
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(currentPhase.description, margin + 20, margin + 65);
    
    // Phase progress bar
    const progressBarWidth = 360;
    const progressBarHeight = 8;
    const progressBarY = margin + 90;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(margin + 20, progressBarY, progressBarWidth, progressBarHeight);
    
    const phaseProgress = (currentTime - currentPhase.startTime) / (currentPhase.endTime - currentPhase.startTime);
    ctx.fillStyle = currentPhase.color;
    ctx.fillRect(margin + 20, progressBarY, progressBarWidth * phaseProgress, progressBarHeight);
    
    // Phase timing
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    const timeText = `${(currentPhase.startTime / 1000).toFixed(1)}s - ${(currentPhase.endTime / 1000).toFixed(1)}s`;
    ctx.fillText(timeText, margin + 20, margin + 110);
    
    // Grade
    ctx.fillText(`Grade: ${currentPhase.grade}`, margin + 200, margin + 110);
    
    // Confidence
    ctx.fillText(`Confidence: ${(currentPhase.confidence * 100).toFixed(0)}%`, margin + 300, margin + 110);
  }, [phases, currentTime, getCurrentPhase]);

  // Draw key metrics overlay
  const drawMetricsOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    const currentPhase = getCurrentPhase();
    
    if (!currentPhase) return;
    
    // Position metrics panel on the right side
    const panelWidth = 300;
    const panelHeight = 200;
    const margin = 20;
    const panelX = width - panelWidth - margin;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(panelX, margin, panelWidth, panelHeight);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Phase Metrics', panelX + 20, margin + 30);
    
    // Phase-specific metrics
    ctx.font = '14px Arial';
    let yOffset = margin + 60;
    
    Object.entries(currentPhase.metrics).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      let displayValue = value;
      let unit = '';
      
      if (typeof value === 'number') {
        if (key.includes('Angle') || key.includes('Rotation')) {
          unit = '°';
        } else if (key.includes('Transfer') || key.includes('Balance')) {
          unit = '%';
        } else if (key.includes('Ratio')) {
          unit = ':1';
        }
        displayValue = value.toFixed(1);
      } else if (typeof value === 'object' && value.left !== undefined) {
        displayValue = `${value.left.toFixed(0)}/${value.right.toFixed(0)}`;
        unit = '%';
      }
      
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${label}:`, panelX + 20, yOffset);
      ctx.fillStyle = currentPhase.color;
      ctx.fillText(`${displayValue}${unit}`, panelX + 150, yOffset);
      
      yOffset += 20;
    });
  }, [currentTime, getCurrentPhase]);

  // Main drawing function
  const drawFrame = useCallback(() => {
    console.log('DEBUG - drawFrame called, showOverlays:', showOverlays);
    
    if (!canvasRef.current || !videoRef.current) {
      console.warn('DEBUG - Missing canvas or video ref');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('DEBUG - Could not get canvas context');
      return;
    }
    
    const { videoWidth, videoHeight } = videoRef.current;
    if (videoWidth === 0 || videoHeight === 0) {
      console.warn('DEBUG - Video dimensions are 0:', { videoWidth, videoHeight });
      return;
    }
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    console.log('DEBUG - Canvas set to video dimensions:', { videoWidth, videoHeight });
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (showOverlays) {
      console.log('DEBUG - Drawing overlays...');
      
      // Draw phase overlay first (background)
      drawPhaseOverlay(ctx);
      
      // Draw pose landmarks
      const closestPose = findClosestPose(currentTime);
      console.log('DEBUG - Closest pose found:', closestPose);
      
      if (closestPose) {
        drawPoseLandmarks(ctx, closestPose);
      } else {
        console.warn('DEBUG - No pose found for current time:', currentTime);
      }
      
      // Draw metrics overlay
      drawMetricsOverlay(ctx);
      
      console.log('DEBUG - All overlays drawn');
    } else {
      console.log('DEBUG - Overlays disabled, skipping drawing');
    }
  }, [currentTime, showOverlays, findClosestPose, drawPhaseOverlay, drawPoseLandmarks, drawMetricsOverlay]);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime * 1000); // Convert to milliseconds
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

  // Handle phase selection
  const handlePhaseSelect = useCallback((startTime: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = startTime / 1000; // Convert from milliseconds
    }
  }, []);

  // Handle slow motion toggle
  const handleSlowMotionToggle = useCallback((phaseName: string) => {
    const newSlowMotionPhases = new Set(slowMotionPhases);
    if (slowMotionPhases.has(phaseName)) {
      newSlowMotionPhases.delete(phaseName);
      setPlaybackSpeed(1);
    } else {
      newSlowMotionPhases.add(phaseName);
      setPlaybackSpeed(0.5);
    }
    setSlowMotionPhases(newSlowMotionPhases);
    
    const video = videoRef.current;
    if (video) {
      video.playbackRate = newSlowMotionPhases.has(phaseName) ? 0.5 : 1;
    }
  }, [slowMotionPhases]);

  // Resize canvas when video loads
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  }, []);

  // Update playback speed when slow motion phases change
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const currentPhase = getCurrentPhase();
      if (currentPhase && slowMotionPhases.has(currentPhase.name)) {
        video.playbackRate = 0.5;
      } else {
        video.playbackRate = 1;
      }
    }
  }, [slowMotionPhases, getCurrentPhase]);

  // Draw frame on time update and continuously during playback
  useEffect(() => {
    drawFrame();
    
    // Set up continuous drawing during playback
    let animationFrameId: number;
    
    const animate = () => {
      drawFrame();
      if (videoRef.current && !videoRef.current.paused) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    if (videoRef.current && !videoRef.current.paused) {
      animationFrameId = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [drawFrame]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-sm">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Video Loaded:</strong> {videoLoaded ? 'Yes' : 'No'}</p>
              <p><strong>Video Error:</strong> {videoError || 'None'}</p>
              <p><strong>Current Time:</strong> {(currentTime / 1000).toFixed(2)}s</p>
              <p><strong>Is Playing:</strong> {isPlaying ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Poses Count:</strong> {poses?.length || 0}</p>
              <p><strong>Phases Count:</strong> {phases?.length || 0}</p>
              <p><strong>Show Overlays:</strong> {showOverlays ? 'Yes' : 'No'}</p>
              <p><strong>Playback Speed:</strong> {playbackSpeed}x</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Video Player */}
      <div className="relative">
        {videoError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-red-800 font-medium mb-2">Video Error</h3>
            <p className="text-red-700 text-sm">{videoError}</p>
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
        
        {/* Video Controls */}
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
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Speed:</label>
              <select
                value={playbackSpeed}
                onChange={(e) => {
                  const speed = parseFloat(e.target.value);
                  console.log('DEBUG - Speed change requested:', speed);
                  setPlaybackSpeed(speed);
                  const video = videoRef.current;
                  if (video) {
                    video.playbackRate = speed;
                    console.log('DEBUG - Video playback rate set to:', video.playbackRate);
                  }
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Time: {(currentTime / 1000).toFixed(1)}s
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2">
          <input
            type="range"
            min="0"
            max={videoRef.current?.duration || 0}
            value={currentTime / 1000}
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
      
      {/* Phase Navigator */}
      {(() => {
        // Debug logging to identify the issue
        console.log('DEBUG - Phases data structure:', phases);
        console.log('DEBUG - Phases type:', typeof phases);
        console.log('DEBUG - Phases length:', phases?.length);
        console.log('DEBUG - Phases keys:', phases ? Object.keys(phases) : 'No phases');
        
        // Safety check and data validation
        if (!phases || !Array.isArray(phases) || phases.length === 0) {
          console.log('DEBUG - No valid phases data, skipping navigator');
          return null;
        }
        
        // Validate each phase object
        const validPhases = phases.filter(phase => {
          if (!phase || typeof phase !== 'object') {
            console.warn('DEBUG - Invalid phase object:', phase);
            return false;
          }
          
          // Check for required properties
          const hasRequiredProps = 'name' in phase && 'startTime' in phase && 'endTime' in phase;
          if (!hasRequiredProps) {
            console.warn('DEBUG - Phase missing required properties:', phase);
            return false;
          }
          
          // Check for any object properties that might cause rendering issues
          if (phase.metrics && typeof phase.metrics === 'object') {
            // Ensure metrics don't contain PoseLandmark objects
            Object.keys(phase.metrics).forEach(key => {
              const value = (phase.metrics as any)[key];
              if (value && typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value) {
                console.warn('DEBUG - Phase metrics contains PoseLandmark object:', key, 'in phase:', phase.name);
                // Convert to safe format
                (phase.metrics as any)[key] = { x: value.x, y: value.y, z: value.z || 0 };
              }
            });
          }
          
          return true;
        });
        
        console.log('DEBUG - Valid phases count:', validPhases.length);
        
        if (validPhases.length === 0) {
          return (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">No valid swing phases detected for navigation.</p>
            </div>
          );
        }
        
        return (
          <SwingPhaseNavigator
            phases={validPhases}
            currentTime={currentTime}
            onPhaseSelect={handlePhaseSelect}
            onSlowMotionToggle={handleSlowMotionToggle}
          />
        );
      })()}
    </div>
  );
}
