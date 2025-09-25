"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import StickFigureOverlay from './StickFigureOverlay';
import SwingPlaneVisualization from './SwingPlaneVisualization';
import PhaseMarkers from './PhaseMarkers';
import AudioToggle from './AudioToggle';

interface OverlaySettings {
  stickFigure: boolean;
  swingPlane: boolean;
  phaseMarkers: boolean;
  clubPath: boolean;
  impactZone: boolean;
  weightTransfer: boolean;
  spineAngle: boolean;
}

interface VideoPlayerWithOverlayProps {
  videoUrl: string;
  poses: PoseResult[];
  phases: EnhancedSwingPhase[];
  overlaySettings?: OverlaySettings;
  playbackSpeed?: number;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLoadedMetadata?: (duration: number) => void;
  isMuted?: boolean;
  onMuteChange?: (muted: boolean) => void;
  onVideoError?: () => void;
}

interface VideoDimensions {
  width: number;
  height: number;
}

const VideoPlayerWithOverlay: React.FC<VideoPlayerWithOverlayProps> = ({
  videoUrl,
  poses,
  phases,
  overlaySettings = {
    stickFigure: true,
    swingPlane: true,
    phaseMarkers: true,
    clubPath: true,
    impactZone: true,
    weightTransfer: true,
    spineAngle: true
  },
  playbackSpeed = 1.0,
  className = "",
  onTimeUpdate,
  onPlay,
  onPause,
  onLoadedMetadata,
  isMuted = false,
  onMuteChange,
  onVideoError
}) => {
  // Debug logging for overlay data
  console.log('🎬 VIDEO PLAYER DEBUG: VideoPlayerWithOverlay props:', {
    videoUrl: videoUrl ? 'Present' : 'Missing',
    posesCount: poses?.length || 0,
    phasesCount: phases?.length || 0,
    hasVideoUrl: !!videoUrl,
    hasPoses: !!poses,
    hasPhases: !!phases,
    overlaySettings,
    playbackSpeed
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoDimensions, setVideoDimensions] = useState<VideoDimensions | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(playbackSpeed);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [showLayerControls, setShowLayerControls] = useState(false);
  const [localOverlaySettings, setLocalOverlaySettings] = useState(overlaySettings);

  // Update video dimensions when video loads
  const updateVideoDimensions = useCallback(() => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth > 0 && videoHeight > 0) {
        setVideoDimensions({ width: videoWidth, height: videoHeight });
        
        // Update canvas size to match video
        if (canvasRef.current) {
          const container = canvasRef.current.parentElement;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            canvasRef.current.width = containerRect.width;
            canvasRef.current.height = containerRect.height;
          }
        }
      }
    }
  }, []);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime * 1000; // Convert to milliseconds
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  // Handle video play
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlay?.();
  }, [onPlay]);

  // Handle video pause
  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  // Handle video loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration * 1000; // Convert to milliseconds
      setDuration(videoDuration);
      onLoadedMetadata?.(videoDuration);
      updateVideoDimensions();
    }
  }, [onLoadedMetadata, updateVideoDimensions]);

  // Handle video error
  const handleVideoError = useCallback(() => {
    console.error('🎥 VIDEO ERROR: Video failed to load');
    onVideoError?.();
  }, [onVideoError]);

  // Handle video resize
  const handleResize = useCallback(() => {
    updateVideoDimensions();
  }, [updateVideoDimensions]);

  // Set up event listeners - FIXED: Remove callback dependencies to prevent infinite loops
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdateLocal = () => {
      if (videoRef.current) {
        const time = videoRef.current.currentTime * 1000; // Convert to milliseconds
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    };

    const handlePlayLocal = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePauseLocal = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleLoadedMetadataLocal = () => {
      if (videoRef.current) {
        const duration = videoRef.current.duration;
        setDuration(duration);
        onLoadedMetadata?.(duration);
        updateVideoDimensions();
      }
    };

    const handleResizeLocal = () => {
      updateVideoDimensions();
    };

    const handleVideoErrorLocal = () => {
      console.error('Video error occurred');
      onVideoError?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdateLocal);
    video.addEventListener('play', handlePlayLocal);
    video.addEventListener('pause', handlePauseLocal);
    video.addEventListener('loadedmetadata', handleLoadedMetadataLocal);
    video.addEventListener('resize', handleResizeLocal);
    video.addEventListener('error', handleVideoErrorLocal);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdateLocal);
      video.removeEventListener('play', handlePlayLocal);
      video.removeEventListener('pause', handlePauseLocal);
      video.removeEventListener('loadedmetadata', handleLoadedMetadataLocal);
      video.removeEventListener('resize', handleResizeLocal);
      video.removeEventListener('error', handleVideoErrorLocal);
    };
  }, [videoUrl]); // Only depend on videoUrl to prevent infinite loops

  // Handle window resize - FIXED: Remove callback dependency to prevent infinite loops
  useEffect(() => {
    const handleResizeLocal = () => {
      updateVideoDimensions();
    };

    window.addEventListener('resize', handleResizeLocal);
    return () => window.removeEventListener('resize', handleResizeLocal);
  }, []); // Empty dependency array to prevent infinite loops

  // Apply playback speed when it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      setCurrentPlaybackRate(playbackSpeed);
      console.log('🎬 PLAYBACK DEBUG: Set playback speed to:', playbackSpeed);
    }
  }, [playbackSpeed]);

  // Speed control options
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  // Handle speed change
  const handleSpeedChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setCurrentPlaybackRate(rate);
      console.log('🎬 SPEED CONTROL: Changed playback rate to:', rate);
    }
  }, []);

  // Handle layer toggle
  const toggleLayer = useCallback((layerName: keyof OverlaySettings) => {
    setLocalOverlaySettings(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
    console.log('🎬 LAYER CONTROL: Toggled layer:', layerName);
  }, []);

  // Format layer names for display
  const formatLayerName = useCallback((layerName: string) => {
    return layerName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }, []);

  // Close controls when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (showSpeedControls && !target.closest('.speed-controls')) {
        setShowSpeedControls(false);
      }
      
      if (showLayerControls && !target.closest('.layer-controls')) {
        setShowLayerControls(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedControls, showLayerControls]);

  // Keyboard shortcuts for speed control
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            handleSpeedChange(0.25);
            break;
          case '2':
            event.preventDefault();
            handleSpeedChange(0.5);
            break;
          case '3':
            event.preventDefault();
            handleSpeedChange(0.75);
            break;
          case '4':
            event.preventDefault();
            handleSpeedChange(1);
            break;
          case '5':
            event.preventDefault();
            handleSpeedChange(1.25);
            break;
          case '6':
            event.preventDefault();
            handleSpeedChange(1.5);
            break;
          case '7':
            event.preventDefault();
            handleSpeedChange(2);
            break;
          case 's':
            event.preventDefault();
            setShowSpeedControls(!showSpeedControls);
            break;
          case 'l':
            event.preventDefault();
            setShowLayerControls(!showLayerControls);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSpeedChange, showSpeedControls]);

  // Find closest pose for current time
  const findClosestPose = useCallback((time: number) => {
    if (!poses || poses.length === 0) return null;
    
    return poses.reduce((closest, pose) => {
      const poseTime = (pose as any).timestamp || 0;
      const closestTime = (closest as any).timestamp || 0;
      return Math.abs(poseTime - time) < Math.abs(closestTime - time) ? pose : closest;
    });
  }, [poses]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full rounded-lg bg-black"
        playsInline
        preload="metadata"
        muted={isMuted}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
      />
      
      {/* Audio Toggle */}
      {onMuteChange && (
        <div className="absolute top-4 right-4 z-20">
          <AudioToggle
            isMuted={isMuted}
            onToggle={onMuteChange}
          />
        </div>
      )}
      
      {/* Speed Control Toggle Button */}
      <div className="absolute top-4 right-20 z-20 speed-controls">
        <button
          onClick={() => setShowSpeedControls(!showSpeedControls)}
          className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg hover:bg-opacity-80 transition-colors flex items-center space-x-2"
          title="Toggle speed controls (Ctrl+S)"
        >
          <span className="text-sm">⚡</span>
          <span className="text-xs">{currentPlaybackRate}x</span>
        </button>
      </div>
      
      {/* Layer Control Toggle Button */}
      <div className="absolute top-4 right-36 z-20 layer-controls">
        <button
          onClick={() => setShowLayerControls(!showLayerControls)}
          className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg hover:bg-opacity-80 transition-colors flex items-center space-x-2"
          title="Toggle layer controls (Ctrl+L)"
        >
          <span className="text-sm">🎛️</span>
          <span className="text-xs">Layers</span>
        </button>
      </div>
      
      {/* Expanded Speed Control Panel */}
      {showSpeedControls && (
        <div className="absolute top-16 right-4 z-20 speed-controls">
          <div className="bg-black bg-opacity-90 rounded-lg p-4 min-w-[200px]">
            <div className="text-white text-sm font-medium mb-3 text-center">Playback Speed</div>
            <div className="grid grid-cols-2 gap-2">
              {speedOptions.map(rate => (
                <button
                  key={rate}
                  onClick={() => {
                    handleSpeedChange(rate);
                    setShowSpeedControls(false);
                  }}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    currentPlaybackRate === rate
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                  }`}
                  title={`Play at ${rate}x speed`}
                >
                  {rate}x
                </button>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-600">
              <div className="text-xs text-gray-300 text-center mb-2">
                Current: {currentPlaybackRate}x
              </div>
              <div className="text-xs text-gray-400 text-center">
                Keyboard: Ctrl+1-7 or Ctrl+S
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Expanded Layer Control Panel */}
      {showLayerControls && (
        <div className="absolute top-16 right-4 z-20 layer-controls">
          <div className="bg-black bg-opacity-90 rounded-lg p-4 min-w-[250px]">
            <div className="text-white text-sm font-medium mb-3 text-center">Analysis Layers</div>
            <div className="space-y-2">
              {Object.entries(localOverlaySettings).map(([layer, isVisible]) => (
                <label key={layer} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700 rounded p-2 transition-colors">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleLayer(layer as keyof OverlaySettings)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-200 flex-1">
                    {formatLayerName(layer)}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    isVisible ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                </label>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-600">
              <div className="flex space-x-2">
                <button
                  onClick={() => setLocalOverlaySettings({
                    stickFigure: true,
                    swingPlane: true,
                    phaseMarkers: true,
                    clubPath: true,
                    impactZone: true,
                    weightTransfer: true,
                    spineAngle: true
                  })}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={() => setLocalOverlaySettings({
                    stickFigure: false,
                    swingPlane: false,
                    phaseMarkers: false,
                    clubPath: false,
                    impactZone: false,
                    weightTransfer: false,
                    spineAngle: false
                  })}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Hide All
                </button>
              </div>
              <div className="text-xs text-gray-400 text-center mt-2">
                Keyboard: Ctrl+L
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Info Overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-green-400 font-mono text-xs p-2 rounded z-50 pointer-events-none">
        <div>Video: {videoDimensions ? `${videoDimensions.width}x${videoDimensions.height}` : 'Loading...'}</div>
        <div>Poses: {poses?.length || 0}</div>
        <div>Phases: {phases?.length || 0}</div>
        <div>Time: {(currentTime / 1000).toFixed(1)}s</div>
      </div>
      
      {/* Overlay Canvas - Main canvas for debugging */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          border: '1px solid rgba(0,255,0,0.5)' // Debug border to confirm canvas position
        }}
      />
      
      {/* Overlay Components */}
      {poses && poses.length > 0 ? (
        <>
          {console.log('🎬 OVERLAY DEBUG: Rendering overlays with:', {
            videoDimensions: !!videoDimensions,
            videoSize: videoDimensions ? `${videoDimensions.width}x${videoDimensions.height}` : 'unknown',
            posesCount: poses.length,
            phasesCount: phases?.length || 0,
            currentTime,
            localOverlaySettings
          })}
          
          {/* Debug Status Indicators */}
          <div className="absolute top-4 left-4 z-50 pointer-events-none">
            {localOverlaySettings.stickFigure && (
              <div className="text-white bg-green-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Stick Figure: ON
              </div>
            )}
            {localOverlaySettings.swingPlane && (
              <div className="text-white bg-blue-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Swing Plane: ON
              </div>
            )}
            {localOverlaySettings.phaseMarkers && (
              <div className="text-white bg-purple-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Phase Markers: ON
              </div>
            )}
            {localOverlaySettings.clubPath && (
              <div className="text-white bg-gray-800 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Club Path: ON
              </div>
            )}
            {localOverlaySettings.impactZone && (
              <div className="text-white bg-red-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Impact Zone: ON
              </div>
            )}
            {localOverlaySettings.weightTransfer && (
              <div className="text-white bg-blue-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Weight Transfer: ON
              </div>
            )}
            {localOverlaySettings.spineAngle && (
              <div className="text-white bg-green-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Spine Angle: ON
              </div>
            )}
          </div>
          
          {/* Stick Figure Overlay - Direct canvas positioning */}
          {localOverlaySettings.stickFigure && (
            <StickFigureOverlay
              key="stick-figure-overlay"
              videoRef={videoRef as React.RefObject<HTMLVideoElement>}
              poses={poses}
              currentTime={currentTime}
              phases={phases}
              showSkeleton={true}
              showLandmarks={true}
              showSwingPlane={localOverlaySettings.swingPlane}
              showPhaseMarkers={localOverlaySettings.phaseMarkers}
              showMetrics={true}
            />
          )}
          
          {/* Swing Plane Visualization - Direct canvas positioning */}
          {localOverlaySettings.swingPlane && (
            <SwingPlaneVisualization
              key="swing-plane-visualization"
              videoRef={videoRef as React.RefObject<HTMLVideoElement>}
              poses={poses}
              phases={phases}
              currentTime={currentTime}
              showClubPath={localOverlaySettings.clubPath}
              showImpactZone={localOverlaySettings.impactZone}
              showWeightTransfer={localOverlaySettings.weightTransfer}
              showSpineAngle={localOverlaySettings.spineAngle}
            />
          )}
          
          {/* Phase Markers - Direct canvas positioning */}
          {localOverlaySettings.phaseMarkers && phases && phases.length > 0 && (
            <PhaseMarkers
              key="phase-markers"
              videoRef={videoRef as React.RefObject<HTMLVideoElement>}
              phases={phases}
              currentTime={currentTime}
              showPhaseBars={true}
              showPhaseNames={true}
              showPhaseGrades={true}
              showPhaseRecommendations={true}
            />
          )}
          
          {/* Force Indicator for Debug Purposes */}
          <div className="absolute bottom-4 right-4 bg-green-500 h-4 w-4 rounded-full z-50 animate-pulse"></div>
        </>
      ) : (
        <div className="absolute top-4 left-4 bg-red-100 border-2 border-red-500 rounded p-3 text-sm text-red-700 z-30 shadow-lg font-bold">
          ⚠️ No pose data available for overlays
        </div>
      )}
    </div>
  );
};

export default VideoPlayerWithOverlay;
