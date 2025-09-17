'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import StickFigureOverlay from './StickFigureOverlay';
import SwingPlaneVisualization from './SwingPlaneVisualization';
import PhaseMarkers from './PhaseMarkers';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface VideoOverlayContainerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  poses: PoseResult[];
  phases?: EnhancedSwingPhase[];
  currentTime?: number;
  isPlaying?: boolean;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface VideoOverlaySettings {
  showStickFigure: boolean;
  showSwingPlane: boolean;
  showPhaseMarkers: boolean;
  showLandmarks: boolean;
  showSkeleton: boolean;
  showClubPath: boolean;
  showImpactZone: boolean;
  showWeightTransfer: boolean;
  showSpineAngle: boolean;
  showMetrics: boolean;
  showRecommendations: boolean;
  showTimeline: boolean;
  showPhaseProgress: boolean;
}

const VideoOverlayContainer = React.forwardRef<HTMLDivElement, VideoOverlayContainerProps>(
  function VideoOverlayContainer({
    videoRef,
    poses,
    phases = [],
    currentTime = 0,
    isPlaying = false,
    duration = 0,
    className = '',
    style = {}
  }, ref) {
    const [overlaySettings, setOverlaySettings] = useState<VideoOverlaySettings>({
      showStickFigure: true,
      showSwingPlane: true,
      showPhaseMarkers: true,
      showLandmarks: true,
      showSkeleton: true,
      showClubPath: true,
      showImpactZone: true,
      showWeightTransfer: true,
      showSpineAngle: true,
      showMetrics: true,
      showRecommendations: true,
      showTimeline: true,
      showPhaseProgress: true
    });

    const [isOverlayVisible, setIsOverlayVisible] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Toggle overlay visibility
    const toggleOverlay = useCallback(() => {
      setIsOverlayVisible(prev => !prev);
    }, []);

    // Toggle specific overlay settings
    const toggleOverlaySetting = useCallback((setting: keyof VideoOverlaySettings) => {
      setOverlaySettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
    }, []);

    // Reset all overlays to default
    const resetOverlays = useCallback(() => {
      setOverlaySettings({
        showStickFigure: true,
        showSwingPlane: true,
        showPhaseMarkers: true,
        showLandmarks: true,
        showSkeleton: true,
        showClubPath: true,
        showImpactZone: true,
        showWeightTransfer: true,
        showSpineAngle: true,
        showMetrics: true,
        showRecommendations: true,
        showTimeline: true,
        showPhaseProgress: true
      });
    }, []);

    // Change playback speed
    const changePlaybackSpeed = useCallback((speed: number) => {
      setPlaybackSpeed(speed);
      if (videoRef.current) {
        videoRef.current.playbackRate = speed;
      }
    }, [videoRef]);

    // Get current phase based on time
    const getCurrentPhase = useCallback((time: number): EnhancedSwingPhase | null => {
      return phases.find(phase => 
        time >= phase.startTime && time <= phase.endTime
      ) || null;
    }, [phases]);

    const currentPhase = getCurrentPhase(currentTime);

    // Format time for display
    const formatTime = useCallback((time: number): string => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const milliseconds = Math.floor((time % 1) * 100);
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }, []);

    // Draw timeline visualization
    const drawTimeline = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
      if (!overlaySettings.showTimeline || !phases || phases.length === 0) return;

      const timelineHeight = 20;
      const timelineY = canvasHeight - timelineHeight;
      const timelineWidth = canvasWidth - 20;
      const timelineX = 10;

      // Draw timeline background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(timelineX, timelineY, timelineWidth, timelineHeight);

      // Draw phase segments
      phases.forEach(phase => {
        const startX = timelineX + (phase.startTime / phases[phases.length - 1].endTime) * timelineWidth;
        const endX = timelineX + (phase.endTime / phases[phases.length - 1].endTime) * timelineWidth;
        const width = endX - startX;
        
        // Highlight current phase
        const isCurrentPhase = currentPhase?.name === phase.name;
        const alpha = isCurrentPhase ? 0.8 : 0.4;
        
        ctx.fillStyle = `${phase.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(startX, timelineY, width, timelineHeight);
        
        // Draw phase name
        if (width > 30) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.fillText(phase.name, startX + 2, timelineY + 14);
        }
      });

      // Draw current time indicator
      const progress = duration > 0 ? currentTime / duration : 0;
      const indicatorX = timelineX + progress * timelineWidth;
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(indicatorX, timelineY);
      ctx.lineTo(indicatorX, timelineY + timelineHeight);
      ctx.stroke();
    }, [overlaySettings.showTimeline, phases, currentPhase, currentTime, duration]);

    // Draw phase progress bar
    const drawPhaseProgress = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
      if (!overlaySettings.showPhaseProgress || !currentPhase) return;

      const progressBarWidth = 200;
      const progressBarHeight = 6;
      const progressBarX = canvasWidth - progressBarWidth - 10;
      const progressBarY = 10;

      // Calculate progress within current phase
      const phaseProgress = (currentTime - currentPhase.startTime) / (currentPhase.endTime - currentPhase.startTime);
      const clampedProgress = Math.max(0, Math.min(1, phaseProgress));

      // Draw progress bar background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

      // Draw progress
      ctx.fillStyle = currentPhase.color;
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * clampedProgress, progressBarHeight);

      // Draw progress text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(`${(clampedProgress * 100).toFixed(0)}%`, progressBarX + progressBarWidth + 10, progressBarY + 4);
    }, [overlaySettings.showPhaseProgress, currentPhase, currentTime]);

    // Main render function for custom overlays
    const renderCustomOverlays = useCallback(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const video = videoRef.current;
      if (!video) return;

      const videoWidth = video.videoWidth || video.clientWidth;
      const videoHeight = video.videoHeight || video.clientHeight;
      
      if (videoWidth && videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw custom overlays
      drawTimeline(ctx, canvas.width, canvas.height);
      drawPhaseProgress(ctx, canvas.width, canvas.height);
    }, [drawTimeline, drawPhaseProgress]);

    // Render custom overlays
    useEffect(() => {
      renderCustomOverlays();
    }, [renderCustomOverlays, currentTime, currentPhase]);

    return (
      <div ref={ref} className={`relative ${className}`} style={style}>
        <div className="relative w-full h-full">
          {/* Overlay Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={toggleOverlay}
              className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all"
            >
              {isOverlayVisible ? 'Hide Overlays' : 'Show Overlays'}
            </button>
            
            {isOverlayVisible && (
              <div className="bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs space-y-2 min-w-[200px]">
                <div className="font-semibold mb-2">Overlay Settings:</div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showStickFigure}
                    onChange={() => toggleOverlaySetting('showStickFigure')}
                    className="rounded"
                  />
                  Stick Figure
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showSwingPlane}
                    onChange={() => toggleOverlaySetting('showSwingPlane')}
                    className="rounded"
                  />
                  Swing Plane
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showPhaseMarkers}
                    onChange={() => toggleOverlaySetting('showPhaseMarkers')}
                    className="rounded"
                  />
                  Phase Markers
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showLandmarks}
                    onChange={() => toggleOverlaySetting('showLandmarks')}
                    className="rounded"
                  />
                  Landmarks
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showSkeleton}
                    onChange={() => toggleOverlaySetting('showSkeleton')}
                    className="rounded"
                  />
                  Skeleton
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showClubPath}
                    onChange={() => toggleOverlaySetting('showClubPath')}
                    className="rounded"
                  />
                  Club Path
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showImpactZone}
                    onChange={() => toggleOverlaySetting('showImpactZone')}
                    className="rounded"
                  />
                  Impact Zone
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showWeightTransfer}
                    onChange={() => toggleOverlaySetting('showWeightTransfer')}
                    className="rounded"
                  />
                  Weight Transfer
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showSpineAngle}
                    onChange={() => toggleOverlaySetting('showSpineAngle')}
                    className="rounded"
                  />
                  Spine Angle
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showMetrics}
                    onChange={() => toggleOverlaySetting('showMetrics')}
                    className="rounded"
                  />
                  Live Metrics
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showRecommendations}
                    onChange={() => toggleOverlaySetting('showRecommendations')}
                    className="rounded"
                  />
                  Recommendations
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showTimeline}
                    onChange={() => toggleOverlaySetting('showTimeline')}
                    className="rounded"
                  />
                  Timeline
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlaySettings.showPhaseProgress}
                    onChange={() => toggleOverlaySetting('showPhaseProgress')}
                    className="rounded"
                  />
                  Phase Progress
                </label>
                
                <button
                  onClick={resetOverlays}
                  className="w-full mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Reset All
                </button>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <div className="bg-black bg-opacity-75 text-white p-2 rounded-lg text-xs">
              <div>Time: {formatTime(currentTime)}</div>
              <div>Duration: {formatTime(duration)}</div>
              <div>Speed: {playbackSpeed}x</div>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={() => changePlaybackSpeed(0.5)}
                className={`px-2 py-1 rounded text-xs ${playbackSpeed === 0.5 ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
              >
                0.5x
              </button>
              <button
                onClick={() => changePlaybackSpeed(1)}
                className={`px-2 py-1 rounded text-xs ${playbackSpeed === 1 ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
              >
                1x
              </button>
              <button
                onClick={() => changePlaybackSpeed(1.5)}
                className={`px-2 py-1 rounded text-xs ${playbackSpeed === 1.5 ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
              >
                1.5x
              </button>
              <button
                onClick={() => changePlaybackSpeed(2)}
                className={`px-2 py-1 rounded text-xs ${playbackSpeed === 2 ? 'bg-blue-600' : 'bg-gray-600'} text-white`}
              >
                2x
              </button>
            </div>
          </div>

          {/* Current Phase Display */}
          {currentPhase && (
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-black bg-opacity-75 text-white p-3 rounded-lg max-w-xs">
                <div className="text-sm font-semibold mb-1" style={{ color: currentPhase.color }}>
                  {currentPhase.name.toUpperCase()}
                </div>
                <div className="text-xs text-gray-300">
                  {currentPhase.description}
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Grade: {currentPhase.grade} | Confidence: {(currentPhase.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          {/* Pose Count Display */}
          <div className="absolute bottom-4 right-4 z-20">
            <div className="bg-black bg-opacity-75 text-white p-2 rounded-lg text-xs">
              <div>Poses: {poses.length}</div>
              {phases.length > 0 && (
                <div>Phases: {phases.length}</div>
              )}
              <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Overlay Components */}
          {isOverlayVisible && (
            <>
              {/* Stick Figure Overlay */}
              {overlaySettings.showStickFigure && (
                <StickFigureOverlay
                  videoRef={videoRef}
                  poses={poses}
                  currentTime={currentTime}
                  phases={phases}
                  showSkeleton={overlaySettings.showSkeleton}
                  showLandmarks={overlaySettings.showLandmarks}
                  showSwingPlane={overlaySettings.showSwingPlane}
                  showPhaseMarkers={overlaySettings.showPhaseMarkers}
                  showMetrics={overlaySettings.showMetrics}
                />
              )}

              {/* Swing Plane Visualization */}
              {overlaySettings.showSwingPlane && (
                <SwingPlaneVisualization
                  videoRef={videoRef}
                  poses={poses}
                  currentTime={currentTime}
                  phases={phases}
                  showSwingPlane={overlaySettings.showSwingPlane}
                  showClubPath={overlaySettings.showClubPath}
                  showImpactZone={overlaySettings.showImpactZone}
                  showWeightTransfer={overlaySettings.showWeightTransfer}
                  showSpineAngle={overlaySettings.showSpineAngle}
                />
              )}

              {/* Phase Markers */}
              {overlaySettings.showPhaseMarkers && phases.length > 0 && (
                <PhaseMarkers
                  videoRef={videoRef}
                  phases={phases}
                  currentTime={currentTime}
                  showPhaseBars={true}
                  showPhaseNames={true}
                  showPhaseGrades={true}
                  showPhaseRecommendations={overlaySettings.showRecommendations}
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

export default VideoOverlayContainer;

