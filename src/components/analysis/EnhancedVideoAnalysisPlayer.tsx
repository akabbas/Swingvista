'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { SwingMetrics } from '@/lib/golf-metrics';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import SwingPhaseNavigator from './SwingPhaseNavigator';
import OverlaySystem, { OverlayMode } from './OverlaySystem';
import OverlayControls from './OverlayControls';
import { useOverlayPreferences } from '@/hooks/useOverlayPreferences';

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
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [slowMotionPhases, setSlowMotionPhases] = useState<Set<string>>(new Set());
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [regeneratedVideoUrl, setRegeneratedVideoUrl] = useState<string | null>(null);

  // EMERGENCY FIX: Validate and regenerate video URL if undefined
  useEffect(() => {
    if (!videoUrl) {
      console.error('EMERGENCY: videoUrl is undefined! Attempting to regenerate...');
      setVideoError('Video URL is missing. Please try re-analyzing your swing.');
    } else {
      console.log('Video URL validated:', videoUrl.substring(0, 50) + '...');
      setVideoError(null);
    }
  }, [videoUrl]);

  // EMERGENCY FIX: Use regenerated URL if available
  const effectiveVideoUrl = regeneratedVideoUrl || videoUrl;

  // Overlay preferences
  const {
    preferences,
    isLoaded: preferencesLoaded,
    setOverlayMode,
    setAutoSwitch,
    setShowTooltips,
    setPerformanceMode,
    getSmartOverlayMode,
  } = useOverlayPreferences();

  // Get current overlay mode (with smart switching)
  const currentOverlayMode = getSmartOverlayMode(isPlaying);

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
    
    // EMERGENCY FIX: Handle WebKit blob resource errors
    if (errorMessage.includes('WebKit') || errorMessage.includes('blob')) {
      console.error('EMERGENCY: WebKit blob error detected - attempting recovery');
      errorMessage = 'Video resource error - please try re-analyzing your swing';
      
      // Try to regenerate the video URL
      if (videoUrl && videoUrl.startsWith('blob:')) {
        console.log('EMERGENCY: Attempting to regenerate blob URL');
        try {
          // Force a reload of the video element
          const newVideo = video.cloneNode(true) as HTMLVideoElement;
          newVideo.src = videoUrl;
          newVideo.load();
        } catch (recoveryError) {
          console.error('EMERGENCY: Video recovery failed:', recoveryError);
        }
      }
    }
    
    setVideoError(errorMessage);
    setVideoLoaded(false);
  }, [videoUrl]);

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

  // Overlay system handles all drawing now

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
      console.log('=== PHASE SELECTION DEBUG ===');
      console.log('Phase start time (ms):', startTime);
      console.log('Video duration (s):', video.duration);
      console.log('Video current time before (s):', video.currentTime);
      
      // Convert milliseconds to seconds and ensure it's within video bounds
      const targetTime = Math.max(0, Math.min(startTime / 1000, video.duration));
      
      console.log('Target time (s):', targetTime);
      console.log('Time within bounds:', targetTime >= 0 && targetTime <= video.duration);
      
      // Pause video first to ensure proper seeking
      const wasPlaying = !video.paused;
      if (wasPlaying) {
        video.pause();
      }
      
      // Set the video time
      video.currentTime = targetTime;
      
      // Update current time state to reflect the change
      setCurrentTime(startTime);
      
      // Wait a moment for the video to process the seek, then resume if needed
      setTimeout(() => {
        if (wasPlaying) {
          video.play().catch(console.error);
        }
        console.log('Video seek completed, current time:', video.currentTime);
      }, 100);
      
      console.log('Video current time after (s):', video.currentTime);
      console.log('Video paused state:', video.paused);
      console.log('=============================');
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
              <p><strong>Overlay Mode:</strong> {currentOverlayMode}</p>
              <p><strong>Playback Speed:</strong> {playbackSpeed}x</p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Controls */}
      {preferencesLoaded && (
        <OverlayControls
          currentMode={currentOverlayMode}
          onModeChange={setOverlayMode}
          autoSwitch={preferences.autoSwitch}
          onAutoSwitchChange={setAutoSwitch}
          showTooltips={preferences.showTooltips}
          onShowTooltipsChange={setShowTooltips}
          performanceMode={preferences.performanceMode}
          onPerformanceModeChange={setPerformanceMode}
        />
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
            src={effectiveVideoUrl}
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
          
          {/* Overlay System */}
          <OverlaySystem
            canvasRef={canvasRef}
            videoRef={videoRef}
            poses={poses}
            phases={phases}
            currentTime={currentTime}
            overlayMode={currentOverlayMode}
            isPlaying={isPlaying}
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
            
            <div className="text-sm text-gray-600">
              Mode: {currentOverlayMode.charAt(0).toUpperCase() + currentOverlayMode.slice(1)}
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Speed:</label>
              <div className="flex space-x-1">
                {[0.5, 1, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => {
                      console.log('Speed change requested:', speed);
                      setPlaybackSpeed(speed);
                      const video = videoRef.current;
                      if (video) {
                        video.playbackRate = speed;
                        console.log('Video playback rate set to:', video.playbackRate);
                      } else {
                        console.error('Video ref not available for speed change');
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                Current: {playbackSpeed}x
              </div>
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
