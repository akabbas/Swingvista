'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import StickFigureOverlay from './StickFigureOverlay';
import SwingPlaneVisualization from './SwingPlaneVisualization';
import PhaseMarkers from './PhaseMarkers';
import type { PoseResult } from '@/lib/mediapipe';
import type { EnhancedSwingPhase } from '@/lib/enhanced-swing-phases';

export interface CameraOverlayContainerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  poses: PoseResult[];
  phases?: EnhancedSwingPhase[];
  currentTime?: number;
  isSwinging?: boolean;
  swingPhase?: string;
  liveFeedback?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface OverlaySettings {
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
}

const CameraOverlayContainer = React.forwardRef<HTMLDivElement, CameraOverlayContainerProps>(
  function CameraOverlayContainer({
    videoRef,
    poses,
    phases = [],
    currentTime = 0,
    isSwinging = false,
    swingPhase = 'Ready',
    liveFeedback = '',
    className = '',
    style = {}
  }, ref) {
    const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
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
      showRecommendations: true
    });

    const [isOverlayVisible, setIsOverlayVisible] = useState(true);

    // Toggle overlay visibility
    const toggleOverlay = useCallback(() => {
      setIsOverlayVisible(prev => !prev);
    }, []);

    // Toggle specific overlay settings
    const toggleOverlaySetting = useCallback((setting: keyof OverlaySettings) => {
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
        showRecommendations: true
      });
    }, []);

    // Get current phase based on time
    const getCurrentPhase = useCallback((time: number): EnhancedSwingPhase | null => {
      return phases.find(phase => 
        time >= phase.startTime && time <= phase.endTime
      ) || null;
    }, [phases]);

    const currentPhase = getCurrentPhase(currentTime);

    return (
      <div ref={ref} className={`relative ${className}`} style={style}>
        {/* Video element should be passed as ref */}
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
                
                <button
                  onClick={resetOverlays}
                  className="w-full mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Reset All
                </button>
              </div>
            )}
          </div>

          {/* Live Feedback Display */}
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-black bg-opacity-75 text-white p-3 rounded-lg max-w-xs">
              <div className="text-sm font-semibold mb-1">
                Swing Phase: {swingPhase}
              </div>
              <div className="text-xs text-gray-300">
                {liveFeedback}
              </div>
              {isSwinging && (
                <div className="text-xs text-red-400 mt-1 animate-pulse">
                  ● SWINGING
                </div>
              )}
            </div>
          </div>

          {/* Pose Count Display */}
          <div className="absolute bottom-4 left-4 z-20">
            <div className="bg-black bg-opacity-75 text-white p-2 rounded-lg text-xs">
              Poses: {poses.length}
              {phases.length > 0 && (
                <div>Phases: {phases.length}</div>
              )}
              <div className="text-green-400">Overlay: {isOverlayVisible ? 'ON' : 'OFF'}</div>
            </div>
          </div>

          {/* Current Phase Display */}
          {currentPhase && (
            <div className="absolute bottom-4 right-4 z-20">
              <div className="bg-black bg-opacity-75 text-white p-2 rounded-lg text-xs">
                <div className="font-semibold" style={{ color: currentPhase.color }}>
                  {currentPhase.name.toUpperCase()}
                </div>
                <div>Grade: {currentPhase.grade}</div>
                <div>Confidence: {(currentPhase.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          )}

          {/* Test Rectangle to confirm overlay container is working */}
          <div className="absolute top-20 left-4 z-30 bg-red-500 w-20 h-20 flex items-center justify-center text-white font-bold text-xs">
            TEST
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

export default CameraOverlayContainer;

