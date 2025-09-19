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
  const [videoKey, setVideoKey] = useState(0); // For forcing video reload

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
      const time = videoRef.current.currentTime; // Keep in seconds
      setCurrentTime(time * 1000); // Convert to milliseconds for state
      onTimeUpdate?.(time); // Pass seconds to parent
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
      const videoDuration = videoRef.current.duration; // Keep in seconds
      setDuration(videoDuration * 1000); // Convert to milliseconds for state
      onLoadedMetadata?.(videoDuration); // Pass seconds to parent
      updateVideoDimensions();
      
      // Ensure video is ready for playback
      console.log('🎥 Video metadata loaded:', {
        duration: videoDuration,
        readyState: videoRef.current.readyState,
        paused: videoRef.current.paused
      });
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

  // Ensure consistent overlay rendering
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !poses || poses.length === 0) return;
    
    let animationId: number;
    
    const drawConsistentOverlays = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Update canvas size if needed
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || video.clientWidth;
        canvas.height = video.videoHeight || video.clientHeight;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Find current pose
      const currentPose = findClosestPose(currentTime);
      
      if (currentPose && currentPose.landmarks) {
        // Draw stick figure if enabled
        if (overlaySettings.stickFigure) {
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
          
          // Simple stick figure drawing
          const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24],
            [23, 25], [25, 27], [24, 26], [26, 28]
          ];
          
          connections.forEach(([start, end]) => {
            const startLandmark = currentPose.landmarks[start];
            const endLandmark = currentPose.landmarks[end];
            
            if (startLandmark && endLandmark) {
              ctx.beginPath();
              ctx.moveTo(startLandmark.x * canvas.width, startLandmark.y * canvas.height);
              ctx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height);
              ctx.stroke();
            }
          });
          
          // Draw joints
          currentPose.landmarks.forEach((landmark, index) => {
            if (landmark && (!landmark.visibility || landmark.visibility > 0.5)) {
              ctx.beginPath();
              ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }
      }
      
      // Continue animation
      animationId = requestAnimationFrame(drawConsistentOverlays);
    };
    
    drawConsistentOverlays();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [currentTime, poses, overlaySettings, findClosestPose]);

  // Find closest pose for current time
  const findClosestPose = useCallback((time: number) => {
    if (!poses || poses.length === 0) return null;
    
    return poses.reduce((closest, pose) => {
      const poseTime = (pose as any).timestamp || 0;
      const closestTime = (closest as any).timestamp || 0;
      return Math.abs(poseTime - time) < Math.abs(closestTime - time) ? pose : closest;
    });
  }, [poses]);

  // Find impact frame
  const findImpactFrame = useCallback(() => {
    if (!phases || phases.length === 0) return null;
    
    // Look for impact phase
    const impactPhase = phases.find(phase => 
      phase.name.toLowerCase() === 'impact' || 
      phase.name.toLowerCase().includes('impact')
    );
    
    if (impactPhase) {
      // Return the middle of the impact phase
      return (impactPhase.startTime + impactPhase.endTime) / 2;
    }
    
    // Fallback: estimate impact at 70% through the swing
    const totalDuration = phases[phases.length - 1].endTime;
    return totalDuration * 0.7;
  }, [phases]);

  // Handle impact button click
  const handleImpactSeek = useCallback(() => {
    if (!videoRef.current) return;
    
    const impactTime = findImpactFrame();
    if (impactTime === null) {
      console.error('Could not find impact frame');
      return;
    }
    
    console.log('🎯 Seeking to impact at:', impactTime, 'ms');
    
    // Convert milliseconds to seconds
    const impactTimeSeconds = impactTime / 1000;
    
    // Seek to impact frame
    videoRef.current.currentTime = impactTimeSeconds;
    
    // Play video from impact point
    videoRef.current.play().catch(error => {
      console.error('Failed to play video after impact seek:', error);
    });
  }, [findImpactFrame]);

  // Handle reload video
  const handleReloadVideo = useCallback(() => {
    if (!videoRef.current || !videoUrl) return;
    
    console.log('🔄 Reloading video from URL:', videoUrl.substring(0, 50) + '...');
    
    // Pause current playback
    videoRef.current.pause();
    
    // Reset video to beginning
    videoRef.current.currentTime = 0;
    
    // Force video reload by incrementing key
    setVideoKey(prev => prev + 1);
    
    // Reset states
    setCurrentTime(0);
    setIsPlaying(false);
    
    // Wait for next render cycle to ensure new video element is created
    requestAnimationFrame(() => {
      setTimeout(() => {
        const newVideo = videoRef.current;
        if (newVideo) {
          console.log('🔄 Loading new video element...');
          newVideo.load();
          
          // Wait for video to be ready
          const playWhenReady = () => {
            if (newVideo.readyState >= 3) {
              newVideo.play().then(() => {
                console.log('🔄 Video reloaded and playing');
              }).catch(error => {
                console.error('Failed to play video after reload:', error);
              });
            } else {
              // Try again after a short delay
              setTimeout(playWhenReady, 100);
            }
          };
          
          playWhenReady();
        }
      }, 50);
    });
  }, [videoUrl]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Video Element */}
      <video
        key={videoKey} // Force remount on reload
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
      
      {/* Video Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {/* Impact Button */}
        <button
          onClick={handleImpactSeek}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2"
          title="Jump to impact frame"
        >
          <span>🎯</span>
          <span>Impact</span>
        </button>
        
        {/* Reload Video Button */}
        <button
          onClick={handleReloadVideo}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-2"
          title="Reload video from beginning"
        >
          <span>🔄</span>
          <span>Reload Video</span>
        </button>
        
        {/* Audio Toggle */}
        {onMuteChange && (
          <AudioToggle
            isMuted={isMuted}
            onToggle={onMuteChange}
          />
        )}
      </div>
      
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
