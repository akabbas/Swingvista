"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PoseResult } from '@/lib/mediapipe';
import { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';
import StickFigureOverlay from './StickFigureOverlay';
import SwingPlaneVisualization from './SwingPlaneVisualization';
import PhaseMarkers from './PhaseMarkers';
import AudioToggle from './AudioToggle';
import VideoControlButtons from './VideoControlButtons';
import EnhancedOverlayRenderer from './EnhancedOverlayRenderer';

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
  onReloadVideo?: () => void;
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
  onVideoError,
  onReloadVideo
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

  // Set up event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('resize', handleResize);
    video.addEventListener('error', handleVideoError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('resize', handleResize);
      video.removeEventListener('error', handleVideoError);
    };
  }, [handleTimeUpdate, handlePlay, handlePause, handleLoadedMetadata, handleResize, handleVideoError]);

  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Apply playback speed when it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      console.log('🎬 PLAYBACK DEBUG: Set playback speed to:', playbackSpeed);
    }
  }, [playbackSpeed]);

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
      {/* Video Control Buttons */}
      <VideoControlButtons
        videoRef={videoRef}
        phases={phases}
        onReloadVideo={onReloadVideo}
        className="mb-2"
      />
      
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
      
      {/* Enhanced Overlay Renderer */}
      {poses && poses.length > 0 && (
        <EnhancedOverlayRenderer
          videoRef={videoRef}
          canvasRef={canvasRef}
          poses={poses}
          phases={phases}
          overlaySettings={overlaySettings}
          currentTime={currentTime}
        />
      )}
      
      {/* Overlay Components */}
      {poses && poses.length > 0 ? (
        <>
          {console.log('🎬 OVERLAY DEBUG: Rendering overlays with:', {
            videoDimensions: !!videoDimensions,
            videoSize: videoDimensions ? `${videoDimensions.width}x${videoDimensions.height}` : 'unknown',
            posesCount: poses.length,
            phasesCount: phases?.length || 0,
            currentTime,
            overlaySettings
          })}
          
          {/* Debug Status Indicators */}
          <div className="absolute top-4 left-4 z-50 pointer-events-none">
            {overlaySettings.stickFigure && (
              <div className="text-white bg-green-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Stick Figure: ON
              </div>
            )}
            {overlaySettings.swingPlane && (
              <div className="text-white bg-blue-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Swing Plane: ON
              </div>
            )}
            {overlaySettings.phaseMarkers && (
              <div className="text-white bg-purple-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Phase Markers: ON
              </div>
            )}
            {overlaySettings.clubPath && (
              <div className="text-white bg-gray-800 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Club Path: ON
              </div>
            )}
            {overlaySettings.impactZone && (
              <div className="text-white bg-red-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Impact Zone: ON
              </div>
            )}
            {overlaySettings.weightTransfer && (
              <div className="text-white bg-blue-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Weight Transfer: ON
              </div>
            )}
            {overlaySettings.spineAngle && (
              <div className="text-white bg-green-500 bg-opacity-70 px-2 py-1 rounded text-sm shadow-lg mb-1">
                Spine Angle: ON
              </div>
            )}
          </div>
          
          {/* Stick Figure Overlay - Direct canvas positioning */}
          {overlaySettings.stickFigure && (
            <StickFigureOverlay
              key="stick-figure-overlay"
              videoRef={videoRef as React.RefObject<HTMLVideoElement>}
              poses={poses}
              currentTime={currentTime}
              phases={phases}
              showSkeleton={true}
              showLandmarks={true}
              showSwingPlane={overlaySettings.swingPlane}
              showPhaseMarkers={overlaySettings.phaseMarkers}
              showMetrics={true}
            />
          )}
          
          {/* Swing Plane Visualization - Direct canvas positioning */}
          {overlaySettings.swingPlane && (
            <SwingPlaneVisualization
              key="swing-plane-visualization"
              videoRef={videoRef as React.RefObject<HTMLVideoElement>}
              poses={poses}
              phases={phases}
              currentTime={currentTime}
              showClubPath={overlaySettings.clubPath}
              showImpactZone={overlaySettings.impactZone}
              showWeightTransfer={overlaySettings.weightTransfer}
              showSpineAngle={overlaySettings.spineAngle}
            />
          )}
          
          {/* Phase Markers - Direct canvas positioning */}
          {overlaySettings.phaseMarkers && phases && phases.length > 0 && (
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
